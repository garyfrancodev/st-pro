import { keymap } from 'prosemirror-keymap';
import { Selection } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';

function findBubbleItem(state: EditorState) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'bubble_item') {
      return {
        depth: d,
        pos: $from.before(d),       // inicio del bubble_item
        after: $from.after(d),      // justo después del bubble_item
        node: $from.node(d),
      };
    }
  }
  return null;
}

function findBubbleListDepth(state: EditorState): number | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'bubble_list') return d;
  }
  return null;
}

function isBubbleItemEmpty(itemNode: any): boolean {
  // bubble_item content: paragraph+
  // Consideramos vacío si todo el textContent es whitespace
  const text = (itemNode.textContent ?? '').trim();
  return text.length === 0;
}

export function bubbleKeymap(schema: any) {
  const itemType = schema.nodes['bubble_item'];
  const listType = schema.nodes['bubble_list'];
  const paragraphType = schema.nodes['paragraph'];

  return keymap({
    Enter: (state, dispatch) => {
      const found = findBubbleItem(state);
      if (!found) return false;

      const listDepth = findBubbleListDepth(state);
      if (listDepth == null) return false;

      if (!dispatch) return true;

      const itemEmpty = isBubbleItemEmpty(found.node);

      // ✅ Caso 1: Enter en bubble vacío => salir del modo bubbles
      if (itemEmpty) {
        let tr = state.tr;

        // borrar el bubble_item vacío
        tr = tr.delete(found.pos, found.after);

        // si la bubble_list quedó vacía, elimínala también
        const $afterDelete = tr.doc.resolve(Math.min(found.pos, tr.doc.content.size));
        // Buscar la bubble_list “más cercana” desde esa posición
        let listPos: number | null = null;
        for (let d = $afterDelete.depth; d > 0; d--) {
          const n = $afterDelete.node(d);
          if (n.type === listType) {
            listPos = $afterDelete.before(d);
            // si no tiene hijos (o quedó sin bubble_item)
            if (n.childCount === 0) {
              tr = tr.delete(listPos, $afterDelete.after(d));
            }
            break;
          }
        }

        // insertar un párrafo normal después para “salir”
        const insertPos = Math.min(found.pos, tr.doc.content.size);
        const p = paragraphType.createAndFill();
        if (p) {
          tr = tr.insert(insertPos, p);
          // mover cursor dentro del párrafo
          const cursorPos = Math.min(insertPos + 1, tr.doc.content.size);
          tr = tr.setSelection(Selection.near(tr.doc.resolve(cursorPos), 1));
        } else {
          // fallback: solo mover selección cerca
          tr = tr.setSelection(Selection.near(tr.doc.resolve(insertPos), 1));
        }

        dispatch(tr.scrollIntoView());
        return true;
      }

      // ✅ Caso 2: Enter en bubble con contenido => crear siguiente bubble
      const attrs = found.node.attrs as Record<string, any>;
      const variant = Number(attrs['variant'] ?? 0);

      const para = paragraphType.createAndFill();
      if (!para) return true;

      const newItem = itemType.create({ index: 1, variant }, para);

      let tr = state.tr.insert(found.after, newItem);

      const cursorPos = Math.min(found.after + 2, tr.doc.content.size);
      tr = tr.setSelection(Selection.near(tr.doc.resolve(cursorPos), 1));

      dispatch(tr.scrollIntoView());
      return true;
    },
  });
}
