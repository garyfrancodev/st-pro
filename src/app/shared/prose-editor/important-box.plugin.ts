// important-box.plugin.ts
import { Plugin, PluginKey, Selection } from 'prosemirror-state';

export const importantBoxPluginKey = new PluginKey('importantBoxPlugin');

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function importantBoxPlugin(opts?: {
  trigger?: string;          // default "important!"
  nodeTypeName?: string;     // default "important_box"
}) {
  const trigger = opts?.trigger ?? 'important!';
  const nodeTypeName = opts?.nodeTypeName ?? 'important_box';
  const re = new RegExp(`${escapeRegExp(trigger)}$`);

  return new Plugin({
    key: importantBoxPluginKey,

    appendTransaction(transactions, oldState, newState) {
      const docChanged = transactions.some((t) => t.docChanged);
      if (!docChanged) return null;

      const { selection, schema } = newState;
      if (!selection.empty) return null;

      const importantType = schema.nodes[nodeTypeName];
      if (!importantType) return null;

      const paragraphType = schema.nodes['paragraph'];
      if (!paragraphType) return null;

      const $from = selection.$from;
      const parent = $from.parent;
      if (!parent.isTextblock) return null;

      // texto del bloque actual
      const parentText = parent.textBetween(0, parent.content.size, '\n', '\n');
      const beforeCursor = parentText.slice(0, $from.parentOffset);

      if (!re.test(beforeCursor)) return null;

      const from = $from.start() + ($from.parentOffset - trigger.length);
      const to = $from.start() + $from.parentOffset;

      const innerPara = paragraphType.createAndFill();
      if (!innerPara) return null;

      const boxNode = importantType.createAndFill(null, [innerPara]);
      if (!boxNode) return null;

      let tr = newState.tr;
      tr = tr.delete(from, to);
      tr = tr.insert(from, boxNode);

      // intenta poner el cursor dentro del primer párrafo del box
      const posInside = Math.min(from + 2, tr.doc.content.size);
      const resolved = tr.doc.resolve(posInside);
      tr = tr.setSelection(Selection.near(resolved, 1));

      return tr;
    },
  });
}
