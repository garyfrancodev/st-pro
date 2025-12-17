import { Plugin } from "prosemirror-state";

const re = /\b(task|meeting)\b(?=(\s|[.!?,;:]))/gi;

export function keywordMarkingPlugin() {
  return new Plugin({
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some((t) => t.docChanged)) return null;

      const { schema } = newState;
      const keywordMark = schema.marks["keyword"];
      if (!keywordMark) return null;

      let tr = newState.tr;
      let modified = false;

      newState.doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return;

        re.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = re.exec(node.text)) !== null) {
          const word = match[1].toLowerCase();
          const from = pos + match.index;
          const to = from + match[1].length;

          const has = node.marks?.some(
            (m) => m.type === keywordMark && (m.attrs["keyword"] as string) === word
          );
          if (has) continue;

          tr = tr.addMark(from, to, keywordMark.create({ keyword: word }));
          modified = true;
        }
      });

      return modified ? tr : null;
    },
  });
}
