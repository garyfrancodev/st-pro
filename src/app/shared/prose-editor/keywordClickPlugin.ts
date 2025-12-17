// keywordClickPlugin.ts
import { Plugin } from "prosemirror-state";

export function keywordClickPlugin(onKeywordClick: (kw: "task" | "meeting") => void) {
  return new Plugin({
    props: {
      handleClick(view, pos, event) {
        const { state } = view;
        const $pos = state.doc.resolve(pos);
        const marks = $pos.marks();

        const keyword = marks.find(m => m.type.name === "keyword")?.attrs?.["keyword"];

        if (keyword === "task" || keyword === "meeting") {
          onKeywordClick(keyword);
          return true; // consumimos click
        }
        return false;
      },
    },
  });
}
