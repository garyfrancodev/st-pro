// important-trigger.plugin.ts
import { Plugin, PluginKey, Selection } from 'prosemirror-state';
import { ImportantRegistry } from './important.registry';

export const importantTriggerKey = new PluginKey('importantTrigger');

export function importantTriggerPlugin(registry: ImportantRegistry) {
  return new Plugin({
    key: importantTriggerKey,

    appendTransaction(trs, _old, state) {
      if (!trs.some(t => t.docChanged)) return null;

      const { selection, schema } = state;
      if (!selection.empty) return null;

      const importantType = schema.nodes['important_box'];
      if (!importantType) return null;

      const $from = selection.$from;
      const parent = $from.parent;
      if (!parent.isTextblock) return null;

      const textBefore = parent.textBetween(0, $from.parentOffset, '\n', '\n');
      const match = registry.matchTrigger(textBefore);
      if (!match) return null;

      const { templateId, trigger } = match;

      const from = $from.start() + ($from.parentOffset - trigger.length);
      const to = $from.start() + $from.parentOffset;

      const node = importantType.create({ templateId, variant: 0 }, schema.text(''));

      let tr = state.tr.replaceRangeWith(from, to, node);

      // cursor adentro
      const posInside = Math.min(from + 1, tr.doc.content.size);
      tr = tr.setSelection(Selection.near(tr.doc.resolve(posInside), 1));

      return tr;
    },
  });
}
