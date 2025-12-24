import { InputRule, inputRules } from 'prosemirror-inputrules';
import { ImportantRegistry } from './important.registry';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function importantInputRules(
  schema: any,
  registry: ImportantRegistry
) {
  const type = schema.nodes['important_box'];
  if (!type) return inputRules({ rules: [] });

  const triggers = registry.getTriggers();
  if (!triggers.length) return inputRules({ rules: [] });

  const re = new RegExp(`(${triggers.map(t => esc(t)).join('|')})$`);

  const rule = new InputRule(re, (state, match, start, end) => {
    const trigger = match[1] as string;
    const info = registry.matchTrigger(trigger);

    // 🔥 TEXTO NO VACÍO
    const node = type.create(
      { templateId: info?.templateId ?? 'important', variant: 0 },
      state.schema.text(' ')
    );

    return state.tr.replaceRangeWith(start, end, node);
  });

  return inputRules({ rules: [rule] });
}
