// src/app/shared/prose-editor/mention-group.nodeview.plugin.ts
import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node as PMNode } from "prosemirror-model";

type MentionUser = { id: string; name: string; title?: string; avatarUrl: string };

type GetPos = () => number | undefined;

export function mentionGroupNodeViewPlugin(nodeName = "mention_group") {
  return new Plugin({
    props: {
      nodeViews: {
        [nodeName]: (node: PMNode, view: EditorView, getPos: GetPos) =>
          new MentionGroupView(node, view, getPos),
      },
    },
  });
}

class MentionGroupView implements NodeView {
  dom: HTMLElement;

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: GetPos
  ) {
    this.dom = document.createElement("span");
    this.dom.className = "pm-mention";
    this.dom.setAttribute("data-mention-group", "true");
    this.dom.setAttribute("contenteditable", "false");
    this.render();
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  private isConsecutiveMention(): boolean {
    const pos = this.getPos?.();
    if (pos === undefined) return false;

    const { doc } = this.view.state;
    const $pos = doc.resolve(pos);

    const parent = $pos.parent;
    const index = $pos.index(); // índice del nodo dentro del parent

    const isMention = (n: any) => n && n.type === this.node.type;
    const isWsText = (n: any) => n?.isText && /^\s+$/.test(n.text || "");

    // vecino izquierdo ignorando textos whitespace
    let left: any = null;
    for (let i = index - 1; i >= 0; i--) {
      const n = parent.child(i);
      if (isWsText(n)) continue;
      left = n;
      break;
    }

    // vecino derecho ignorando textos whitespace
    let right: any = null;
    for (let i = index + 1; i < parent.childCount; i++) {
      const n = parent.child(i);
      if (isWsText(n)) continue;
      right = n;
      break;
    }

    return isMention(left) || isMention(right);
  }


  private render() {
    const users = (this.node.attrs["users"] ?? []) as MentionUser[];
    const first = users[0];

    const compact = this.isConsecutiveMention();

    this.dom.innerHTML = "";
    this.dom.classList.toggle("pm-mention--compact", compact);

    const avatar = document.createElement("img");
    avatar.className = "pm-mention__avatar";
    avatar.src = first?.avatarUrl || "https://i.pravatar.cc/100?img=1";
    avatar.alt = first?.name || "user";
    this.dom.appendChild(avatar);

    const label = document.createElement("span");
    label.className = "pm-mention__label";
    label.textContent = first?.name ?? "Usuario";
    this.dom.appendChild(label);

    this.dom.title = users
      .map((u) => `${u.name}${u.title ? " — " + u.title : ""}`)
      .join("\n");
  }

  stopEvent() {
    return true;
  }

  ignoreMutation() {
    return true;
  }
}
