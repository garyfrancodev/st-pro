import { NodeSpec } from "prosemirror-model";

export const linkCardNodeSpec: NodeSpec = {
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  attrs: {
    url: { default: "" },
    title: { default: "" },
    description: { default: "" },
    image: { default: "" },
    site: { default: "" },
    loading: { default: true },
    error: { default: false },
  },

  parseDOM: [
    {
      tag: "div[data-link-card]",
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        return {
          url: el.getAttribute("data-url") ?? "",
          title: el.getAttribute("data-title") ?? "",
          description: el.getAttribute("data-description") ?? "",
          image: el.getAttribute("data-image") ?? "",
          site: el.getAttribute("data-site") ?? "",
          loading: el.getAttribute("data-loading") === "true",
          error: el.getAttribute("data-error") === "true",
        };
      },
    },
  ],

  toDOM(node) {
    const a = node.attrs as Record<string, any>;

    const url = (a["url"] ?? "") as string;
    const title = (a["title"] ?? "") as string;
    const description = (a["description"] ?? "") as string;
    const image = (a["image"] ?? "") as string;
    const site = (a["site"] ?? "") as string;
    const loading = !!a["loading"];
    const error = !!a["error"];

    return [
      "div",
      {
        class: `pm-link-card ${loading ? "is-loading" : ""} ${error ? "is-error" : ""}`,
        "data-url": url,
        "data-title": title,
        "data-description": description,
        "data-image": image,
        "data-site": site,
        "data-loading": String(loading),
        "data-error": String(error),
      },
      0,
    ];
  },
};
