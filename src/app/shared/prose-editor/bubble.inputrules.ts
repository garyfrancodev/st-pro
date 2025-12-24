// bubble.inputrules.ts
import { InputRule, inputRules } from 'prosemirror-inputrules';

export function bubbleInputRules(schema: any) {
  const listType = schema.nodes['bubble_list'];
  const itemType = schema.nodes['bubble_item'];
  const paragraphType = schema.nodes['paragraph'];

  if (!listType || !itemType || !paragraphType) return inputRules({ rules: [] });

  const rule = new InputRule(/^1\.\s$/, (state, match, start, end) => {
    const { tr } = state;

    // borrar el "1. "
    tr.delete(start, end);

    // crear: bubble_list -> bubble_item(index=1, variant=0) -> paragraph vacío
    const para = paragraphType.createAndFill();
    if (!para) return null;

    const item = itemType.create({ index: 1, variant: 0 }, para);
    const list = listType.create(null, item);

    tr.replaceRangeWith(start, start, list);

    return tr;
  });

  return inputRules({ rules: [rule] });
}
