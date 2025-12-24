// debug-important.inputrules.ts
import { InputRule, inputRules } from 'prosemirror-inputrules';

export function debugImportantInputRules(schema: any) {
  const type = schema.nodes['text'];
  if (!type) return inputRules({ rules: [] });

  return inputRules({
    rules: [
      new InputRule(/important!$/, (state, _match, start, end) => {
        console.log('🔥 INPUT RULE DISPARADO');

        return state.tr.insertText('🔥IMPORTANT🔥', start, end);
      }),
    ],
  });
}
