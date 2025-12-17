import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

type User = { id: string; name: string; title: string; avatarUrl: string };

export const mentionTypeaheadKey = new PluginKey("mention-typeahead");

function findMentionQuery(view: EditorView) {
  const { state } = view;
  const { $from } = state.selection;
  if (!$from.parent.isTextblock) return null;

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, "\uFFFC", "\uFFFC");
  const m = textBefore.match(/(^|\s)@([a-z0-9_]*)$/i);
  if (!m) return null;

  const query = (m[2] ?? "").toLowerCase();
  const from = $from.pos - (m[2]?.length ?? 0) - 1; // inicio del "@"
  const to = $from.pos;                              // cursor
  return { query, from, to };
}

export function mentionTypeaheadPlugin(opts: {
  users: User[];
  onPick: (view: EditorView, picked: User[], range: { from: number; to: number }) => void;
}) {
  let popup: HTMLDivElement | null = null;
  let lastRange: { from: number; to: number } | null = null;

  function ensurePopup() {
    if (popup) return popup;
    popup = document.createElement("div");
    popup.className = "pm-mention-popup";
    popup.style.position = "fixed";
    popup.style.zIndex = "9999";
    popup.style.display = "none";
    document.body.appendChild(popup);
    return popup;
  }

  function hidePopup() {
    if (popup) popup.style.display = "none";
    lastRange = null;
  }

  function showPopup(view: EditorView, items: User[], atPos: number) {
    const el = ensurePopup();

    el.innerHTML = items
      .map(
        (u, i) => `
        <div class="pm-mention-item" data-idx="${i}">
          <img class="pm-mention-avatar" src="${u.avatarUrl}" />
          <div class="pm-mention-meta">
            <div class="pm-mention-name">${u.name}</div>
            <div class="pm-mention-title">${u.title}</div>
          </div>
        </div>`
      )
      .join("");

    const c = view.coordsAtPos(atPos);
    el.style.left = `${c.left}px`;
    el.style.top = `${c.bottom + 6}px`;
    el.style.display = "block";

    // ✅ IMPORTANTÍSIMO: evita que el editor pierda selección ANTES de insertar
    el.onmousedown = (e) => e.preventDefault();

    el.onclick = (e) => {
      if (!lastRange) return;
      const target = e.target as HTMLElement;
      const row = target.closest(".pm-mention-item") as HTMLElement | null;
      if (!row) return;

      const idx = Number(row.dataset["idx"]);
      const picked = items[idx];
      if (!picked) return;

      // ✅ inserta usando el rango guardado
      opts.onPick(view, [picked], lastRange);

      hidePopup();
      view.focus();
    };
  }

  return new Plugin({
    key: mentionTypeaheadKey,
    props: {
      handleKeyDown(_view, event) {
        if (event.key === "Escape") {
          hidePopup();
          return false;
        }
        return false;
      },
    },
    view(editorView) {
      return {
        update(view) {
          const hit = findMentionQuery(view);
          if (!hit) {
            hidePopup();
            return;
          }

          const items = opts.users
            .filter(u => u.name.toLowerCase().includes(hit.query))
            .slice(0, 6);

          if (items.length === 0) {
            hidePopup();
            return;
          }

          lastRange = { from: hit.from, to: hit.to };
          showPopup(view, items, hit.to);
        },
        destroy() {
          if (popup) popup.remove();
          popup = null;
        },
      };
    },
  });
}
