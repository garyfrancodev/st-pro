import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

type Variant = "notice1" | "notice2" | "notice3";

type Suggest = {
  active: boolean;
  from: number;
  to: number;
  anchor: number; // pos del cursor
};

export const noticeSuggestionsKey = new PluginKey<Suggest>("noticeSuggestions");

const TRIGGER = /notice!$/i;

function calcSuggest(state: EditorState): Suggest {
  const sel = state.selection;
  if (!sel.empty) return { active: false, from: 0, to: 0, anchor: 0 };

  const $from = sel.$from;
  const parentText = $from.parent.textBetween(0, $from.parentOffset, "\n", "\n");
  const m = parentText.match(TRIGGER);
  if (!m) return { active: false, from: 0, to: 0, anchor: 0 };

  const to = sel.from;
  const from = to - m[0].length;
  return { active: true, from, to, anchor: sel.from };
}

function buildMenu(onPick: (v: Variant) => void) {
  const root = document.createElement("div");
  root.style.cssText = `
    position:absolute;
    z-index:9999;
    background:#fff;
    border:1px solid rgba(0,0,0,.12);
    border-radius:10px;
    box-shadow:0 8px 24px rgba(0,0,0,.12);
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
    width: 280px;
    padding: 8px 10px;
    display:none;
  `;

  const title = document.createElement("div");
  title.textContent = "notice!";
  title.style.cssText = "font-weight:800;margin-bottom:6px;";
  root.appendChild(title);

  const items: Array<{ label: string; v: Variant }> = [
    { label: "✏️ Click to insert: Notice 1", v: "notice1" },
    { label: "✏️ Click to insert: Notice 2", v: "notice2" },
    { label: "✏️ Click to insert: Notice 3", v: "notice3" },
  ];

  for (const it of items) {
    const row = document.createElement("div");
    row.textContent = it.label;
    row.style.cssText = `
      cursor:pointer;
      padding:6px 8px;
      border-radius:8px;
      color:#6B7280;
      user-select:none;
    `;

    row.addEventListener("mouseenter", () => (row.style.background = "#F3F4F6"));
    row.addEventListener("mouseleave", () => (row.style.background = "transparent"));

    // ✅ IMPORTANT: no dejes que ProseMirror pierda selección
    row.addEventListener("mousedown", (e) => e.preventDefault());

    row.addEventListener("click", () => onPick(it.v));
    root.appendChild(row);
  }

  return root;
}

export function noticeSuggestionsPlugin() {
  return new Plugin<Suggest>({
    key: noticeSuggestionsKey,

    state: {
      init: (_config, state) => calcSuggest(state),
      apply: (tr, _prev, _oldState, newState) => {
        // ✅ Solo recalcula; NO transforma documento aquí
        if (!tr.docChanged && !tr.selectionSet) return noticeSuggestionsKey.getState(newState) ?? calcSuggest(newState);
        return calcSuggest(newState);
      },
    },

    view(editorView) {
      const menu = buildMenu((variant) => {
        const s = noticeSuggestionsKey.getState(editorView.state);
        if (!s?.active) return;

        const { schema } = editorView.state;
        const noticeType = schema.nodes["notice"];
        const paragraphType = schema.nodes["paragraph"];
        if (!noticeType || !paragraphType) return;

        const p = paragraphType.createAndFill();
        const noticeNode = noticeType.create({ variant }, p ? [p] : []);

        const tr = editorView.state.tr
          .deleteRange(s.from, s.to)     // ✅ aquí recién borra "notice!"
          .insert(s.from, noticeNode);   // ✅ e inserta el bloque

        editorView.dispatch(tr);
        editorView.focus();
      });

      // lo montamos sobre el DOM del editor (puede ser document.body también)
      editorView.dom.parentElement?.appendChild(menu);

      const updateMenu = (view: EditorView) => {
        const s = noticeSuggestionsKey.getState(view.state);
        if (!s?.active) {
          menu.style.display = "none";
          return;
        }

        // pos debajo del cursor
        const coords = view.coordsAtPos(s.anchor);
        const hostRect = (view.dom.parentElement ?? view.dom).getBoundingClientRect();

        menu.style.left = `${coords.left - hostRect.left}px`;
        menu.style.top = `${coords.bottom - hostRect.top + 6}px`;
        menu.style.display = "block";
      };

      updateMenu(editorView);

      return {
        update: (view) => updateMenu(view),
        destroy: () => menu.remove(),
      };
    },
  });
}
