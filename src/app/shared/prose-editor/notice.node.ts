import { NodeSpec } from "prosemirror-model";

export const noticeNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  selectable: false, // 👈 importante para que el click meta caret adentro
  attrs: {
    variant: { default: "notice1" },
  },
  parseDOM: [
    {
      tag: 'div[data-notice="true"]',
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        return { variant: el.getAttribute("data-variant") || "notice1" };
      },
    },
  ],
  toDOM: (node) => {
    const variant = (node.attrs["variant"] as string) || "notice1";

    const colors: Record<string, { bg: string; border: string }> = {
      notice1: { bg: "#E8F3FF", border: "#3B82F6" },
      notice2: { bg: "#FFF7E6", border: "#F59E0B" },
      notice3: { bg: "#ECFDF5", border: "#10B981" },
    };
    const c = colors[variant] ?? colors["notice1"];

    return [
      "div",
      {
        "data-notice": "true",
        "data-variant": variant,
        style: `
          padding:12px 14px;
          border-left:6px solid ${c.border};
          background:${c.bg};
          border-radius:10px;
          margin:8px 0;
        `,
      },
      // header NO editable (pero SOLO este)
      ["div", { contenteditable: "false", style: "font-weight:700; margin-bottom:6px;" }, "Notice"],
      // body editable
      ["div", { style: "min-height: 18px; cursor:text;" }, 0],
    ];
  },
};
