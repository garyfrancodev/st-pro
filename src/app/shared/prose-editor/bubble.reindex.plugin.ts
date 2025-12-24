// bubble.reindex.plugin.ts
import { Plugin, PluginKey } from 'prosemirror-state';

export const bubbleReindexKey = new PluginKey('bubbleReindex');

export function bubbleReindexPlugin(schema: any) {
  const listType = schema.nodes['bubble_list'];
  const itemType = schema.nodes['bubble_item'];
  if (!listType || !itemType) {
    return new Plugin({ key: bubbleReindexKey });
  }

  return new Plugin({
    key: bubbleReindexKey,

    appendTransaction(transactions, oldState, newState) {
      // solo si cambió el doc
      if (!transactions.some(t => t.docChanged)) return null;

      // evita loops
      if (transactions.some(t => t.getMeta(bubbleReindexKey))) return null;

      let tr = newState.tr;
      let changed = false;

      // Reindex por cada bubble_list
      newState.doc.descendants((node: any, pos: number) => {
        if (node.type !== listType) return true;

        let idx = 1;

        node.forEach((child: any, offset: number) => {
          if (child.type !== itemType) return;

          const childPos = pos + 1 + offset; // posición absoluta del bubble_item
          const attrs = child.attrs as Record<string, any>;
          const current = Number(attrs['index'] ?? 1);

          if (current !== idx) {
            const variant = Number(attrs['variant'] ?? 0);
            tr = tr.setNodeMarkup(childPos, undefined, { ...attrs, index: idx, variant });
            changed = true;
          }

          idx++;
        });

        return false;
      });

      if (!changed) return null;

      tr.setMeta(bubbleReindexKey, true);
      return tr;
    },
  });
}
