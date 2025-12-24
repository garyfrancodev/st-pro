// important.keymap.ts
import { keymap } from 'prosemirror-keymap';
import { Selection } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';

function findParentNodePos(state: EditorState, nodeName: string): { pos: number; depth: number; node: any } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === nodeName) {
      return { pos: $from.before(d), depth: d, node };
    }
  }
  return null;
}

function isEmptyNode(node: any): boolean {
  const txt = (node.textContent ?? '').trim();
  return txt.length === 0;
}

export function importantKeymap(schema: any) {
  const importantType = schema.nodes['important_box'];
  const paragraphType = schema.nodes['paragraph'];

  return keymap({
    Backspace: (state, dispatch) => {
      // solo cuando selección es caret (no rango)
      if (!state.selection.empty) return false;

      const found = findParentNodePos(state, 'important_box');
      if (!found) return false;

      // si NO está vacío, deja que Backspace normal funcione
      if (!isEmptyNode(found.node)) return false;

      if (!dispatch) return true;

      const from = found.pos;
      const to = from + found.node.nodeSize;

      let tr = state.tr.delete(from, to);

      // Inserta un párrafo normal para que el cursor tenga dónde caer
      const p = paragraphType?.createAndFill();
      if (p) {
        tr = tr.insert(from, p);
        const cursorPos = Math.min(from + 1, tr.doc.content.size);
        tr = tr.setSelection(Selection.near(tr.doc.resolve(cursorPos), 1));
      } else {
        tr = tr.setSelection(Selection.near(tr.doc.resolve(Math.min(from, tr.doc.content.size)), 1));
      }

      dispatch(tr.scrollIntoView());
      return true;
    },
  });
}
