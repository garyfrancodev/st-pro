// bubble.commands.ts
import { EditorState, Transaction } from 'prosemirror-state';

export function setBubbleVariant(tr: Transaction, pos: number, variant: number) {
  const node = tr.doc.nodeAt(pos);
  if (!node) return tr;
  tr.setNodeMarkup(pos, undefined, { ...node.attrs, variant });
  return tr;
}

// util: encuentra la posición del bubble_item que contiene la selección
export function findParentBubbleItemPos(state: EditorState): number | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'bubble_item') return $from.before(d);
  }
  return null;
}
