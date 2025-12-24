// bubble.keymap.ts
import { keymap } from 'prosemirror-keymap';
import { TextSelection } from 'prosemirror-state';

export function bubbleKeymap(schema: any) {
  const listType = schema.nodes['bubble_list'];
  const itemType = schema.nodes['bubble_item'];

  return keymap({
    Enter: (state, dispatch) => {
      const { $from } = state.selection;

      // Solo si estamos dentro de bubble_item
      if ($from.parent.type !== itemType) return false;

      const text = $from.parent.textContent.trim();

      // Si está vacío → borrar este bubble_item y salir (insertar párrafo)
      if (!text) {
        if (dispatch) {
          const from = $from.before();
          const to = $from.after();

          let tr = state.tr.delete(from, to);

          // Inserta un párrafo después del bubble_list si aplica
          // Intento: si está dentro de bubble_list, pongo el cursor después
          const after = tr.mapping.map(to);
          tr = tr.insert(after, schema.nodes.paragraph.create());

          tr = tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1), 1));
          dispatch(tr.scrollIntoView());
        }
        return true;
      }

      // ✅ Crear nuevo bubble_item debajo del actual
      if (dispatch) {
        const itemPos = $from.before();          // posición del nodo actual
        const insertPos = itemPos + $from.parent.nodeSize; // justo después del item actual

        const newItem = itemType.create(
          { index: 0, variant: 0 },              // index placeholder (reindex lo arregla)
          state.schema.text(' ')
        );

        let tr = state.tr.insert(insertPos, newItem);

        // Cursor dentro del nuevo item (en su primer carácter)
        const selPos = tr.mapping.map(insertPos) + 1;
        tr = tr.setSelection(TextSelection.near(tr.doc.resolve(selPos), 1));

        dispatch(tr.scrollIntoView());
      }

      return true;
    },
  });
}
