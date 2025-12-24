// bubble.inputrules.ts
import { InputRule, inputRules } from 'prosemirror-inputrules';

export function bubbleInputRules(schema: any) {
  const listType = schema.nodes['bubble_list'];
  const itemType = schema.nodes['bubble_item'];

  if (!listType || !itemType) return inputRules({ rules: [] });

  return inputRules({
    rules: [
      new InputRule(/^1\.\s$/, (state, _match, start, end) => {
        const item = itemType.create(
          { index: 0, variant: 0 },
          state.schema.text(' ')
        );
        const list = listType.create(null, item);

        return state.tr.replaceRangeWith(start, end, list);
      }),
    ],
  });
}
