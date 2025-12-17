// src/app/shared/prose-editor/mention-group.node.ts
import { NodeSpec } from "prosemirror-model";

export type MentionUser = {
  id: string;
  name: string;
  title?: string;
  avatarUrl: string;
};

export const mentionGroupNodeName = "mention_group";

export const mentionGroupNodeSpec: NodeSpec = {
  group: "inline",
  inline: true,
  atom: true,        // ✅ se comporta como 1 token
  selectable: true,

  attrs: {
    users: { default: [] as MentionUser[] },
  },

  parseDOM: [
    {
      tag: `span[data-mention-group="true"]`,
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        const raw = el.getAttribute("data-users") || "[]";
        try {
          return { users: JSON.parse(raw) };
        } catch {
          return { users: [] };
        }
      },
    },
  ],

  toDOM(node) {
    const users = (node.attrs["users"] ?? []) as MentionUser[];

    // 1 usuario: avatar + label
    if (users.length === 1) {
      const u = users[0];
      return [
        "span",
        {
          "data-mention-group": "true",
          "data-users": JSON.stringify(users),
          class: "pm-mention pm-mention--single",
          role: "button",
          tabindex: "0",
        },
        ["img", { class: "pm-mention__avatar", src: u.avatarUrl, alt: "" }],
        ["span", { class: "pm-mention__label" }, u.name],
      ];
    }

    // 2+ usuarios: stack
    return [
      "span",
      {
        "data-mention-group": "true",
        "data-users": JSON.stringify(users),
        class: "pm-mention pm-mention--stack",
        role: "button",
        tabindex: "0",
      },
      ...users.slice(0, 3).map((u) => [
        "img",
        { class: "pm-mention__avatar", src: u.avatarUrl, alt: "" },
      ]),
      // opcional: contador si hay más de 3
      ...(users.length > 3 ? [["span", { class: "pm-mention__more" }, `+${users.length - 3}`]] : []),
    ];
  }
};
