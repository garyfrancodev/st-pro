// keywordMark.ts
import { MarkSpec } from "prosemirror-model";

export const keywordMark: MarkSpec = {
  attrs: { keyword: {} },
  inclusive: false,
  parseDOM: [
    {
      tag: "span[data-keyword]",
      getAttrs: (dom: any) => ({ keyword: dom.getAttribute("data-keyword") }),
    },
  ],
  toDOM(mark) {
    const { keyword } = mark.attrs;
    return [
      "span",
      {
        "data-keyword": keyword,
        class: "pm-keyword",   // css tuyo
      },
      0,
    ];
  },
};
