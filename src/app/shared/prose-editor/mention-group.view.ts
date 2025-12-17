// src/app/shared/prose-editor/mention-group.view.ts
import { Node as PMNode } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import {MentionUser} from './mention_group.node';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class MentionGroupView implements NodeView {
  dom: HTMLElement;

  private anchor!: HTMLElement;
  private popup?: HTMLElement;
  private pressTimer?: number;

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getUsersDetails?: (ids: string[]) => MentionUser[] // opcional si luego quieres resolver remoto
  ) {
    this.dom = document.createElement("span");
    this.dom.className = "pm-mention-group";
    this.dom.setAttribute("data-mention-group", "true");

    this.anchor = document.createElement("span");
    this.anchor.className = "pm-mention-group__avatars";
    this.dom.appendChild(this.anchor);

    this.render();

    // Hover (desktop)
    this.dom.addEventListener("mouseenter", this.onEnter);
    this.dom.addEventListener("mouseleave", this.onLeave);

    // Click / tap
    this.dom.addEventListener("click", this.onClick);

    // Long-press (mobile)
    this.dom.addEventListener("touchstart", this.onTouchStart, { passive: true });
    this.dom.addEventListener("touchend", this.onTouchEnd);
    this.dom.addEventListener("touchcancel", this.onTouchEnd);
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  destroy() {
    this.hidePopup();
    this.dom.removeEventListener("mouseenter", this.onEnter);
    this.dom.removeEventListener("mouseleave", this.onLeave);
    this.dom.removeEventListener("click", this.onClick);
    this.dom.removeEventListener("touchstart", this.onTouchStart);
    this.dom.removeEventListener("touchend", this.onTouchEnd);
    this.dom.removeEventListener("touchcancel", this.onTouchEnd);
  }

  private get users(): MentionUser[] {
    // TS4111: usar bracket
    return (this.node.attrs["users"] ?? []) as MentionUser[];
  }

  private render() {
    const users = this.users;
    this.dom.setAttribute("data-users", JSON.stringify(users));

    this.anchor.innerHTML = "";

    const max = 3;
    const shown = users.slice(0, max);
    const extra = users.length - shown.length;

    shown.forEach((u, i) => {
      const img = document.createElement("img");
      img.className = "pm-mention-group__avatar";
      img.src = u.avatarUrl;
      img.alt = u.name;
      img.title = u.name;
      img.style.zIndex = String(10 + i);
      this.anchor.appendChild(img);
    });

    if (extra > 0) {
      const more = document.createElement("span");
      more.className = "pm-mention-group__more";
      more.textContent = `+${extra}`;
      this.anchor.appendChild(more);
    }
  }

  private onEnter = () => this.showPopup();
  private onLeave = () => this.hidePopup();
  private onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // click: toggle
    if (this.popup) this.hidePopup();
    else this.showPopup();
  };

  private onTouchStart = () => {
    // long-press abre popup
    this.pressTimer = window.setTimeout(() => this.showPopup(), 420);
  };
  private onTouchEnd = () => {
    if (this.pressTimer) window.clearTimeout(this.pressTimer);
    this.pressTimer = undefined;
  };

  private showPopup() {
    if (this.popup) return;

    const users = this.users;
    const container = document.createElement("div");
    container.className = "pm-mention-popup";

    const header = document.createElement("div");
    header.className = "pm-mention-popup__header";
    header.textContent = `Menciones (${users.length})`;
    container.appendChild(header);

    const list = document.createElement("div");
    list.className = "pm-mention-popup__list";
    container.appendChild(list);

    users.forEach((u) => {
      const row = document.createElement("div");
      row.className = "pm-mention-popup__row";

      const img = document.createElement("img");
      img.className = "pm-mention-popup__avatar";
      img.src = u.avatarUrl;
      img.alt = u.name;

      const meta = document.createElement("div");
      meta.className = "pm-mention-popup__meta";

      const name = document.createElement("div");
      name.className = "pm-mention-popup__name";
      name.textContent = u.name;

      const title = document.createElement("div");
      title.className = "pm-mention-popup__title";
      title.textContent = u.title ?? "";

      meta.appendChild(name);
      meta.appendChild(title);

      row.appendChild(img);
      row.appendChild(meta);
      list.appendChild(row);
    });

    document.body.appendChild(container);
    this.popup = container;

    // posicionar
    const rect = this.dom.getBoundingClientRect();
    const popupRect = container.getBoundingClientRect();

    const top = clamp(rect.bottom + 8, 8, window.innerHeight - popupRect.height - 8);
    const left = clamp(rect.left, 8, window.innerWidth - popupRect.width - 8);

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
  }

  private hidePopup() {
    if (!this.popup) return;
    this.popup.remove();
    this.popup = undefined;
  }
}
