// bubble.reindex.plugin.ts
import { Plugin } from 'prosemirror-state';

export function bubbleReindexPlugin(schema: any) {
  const listType = schema.nodes['bubble_list'];
  const itemType = schema.nodes['bubble_item'];

  return new Plugin({
    appendTransaction(_trs, _oldState, state) {
      let tr = state.tr;
      let changed = false;

      state.doc.descendants((node, pos) => {
        if (node.type !== listType) return true;

        // node = bubble_list
        let offset = 0;
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          const childPos = pos + 1 + offset; // ✅ posición real del hijo en el doc

          if (child.type === itemType) {
            const attrs = child.attrs as Record<string, unknown>;
            const current = Number(attrs['index'] ?? 0);
            const expected = i + 1;

            if (current !== expected) {
              tr = tr.setNodeMarkup(childPos, undefined, {
                ...attrs,
                index: expected,
              });
              changed = true;
            }
          }

          offset += child.nodeSize;
        }

        return false; // ya procesamos hijos manualmente
      });

      return changed ? tr : null;
    },
  });
}
