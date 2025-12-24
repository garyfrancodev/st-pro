// notice-inline-suggestions.plugin.ts
import { Plugin, PluginKey, EditorState, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

type Variant = "notice1" | "notice2" | "notice3";

type SuggestState =
  | { active: false }
  | { active: true; from: number; to: number; anchor: number };

export const noticeInlineSuggestionsKey = new PluginKey<SuggestState>("noticeInlineSuggestions");

const TRIGGER = /notice!$/i;

function calcSuggest(state: EditorState): SuggestState {
  const sel = state.selection;
  if (!sel.empty) return { active: false };

  const $from = sel.$from;

  // texto del block actual hasta el cursor
  const parentText = $from.parent.textBetween(0, $from.parentOffset, "\n", "\n");
  const m = parentText.match(TRIGGER);
  if (!m) return { active: false };

  const to = sel.from;
  const from = to - m[0].length;

  return { active: true, from, to, anchor: to };
}

function buildInlineMenu(view: EditorView, pick: (v: Variant) => void) {
  const root = document.createElement("div");
  root.style.cssText = `
    margin-top:6px;
    padding:8px 10px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
    width: 280px;
  `;

  const title = document.createElement("div");
  title.style.cssText = `font-weight:800; margin-bottom:6px;`;
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

    // ✅ CLAVE: evita que ProseMirror pierda el cursor al clickear
    row.addEventListener("mousedown", (e) => e.preventDefault());
    row.addEventListener("click", () => pick(it.v));

    root.appendChild(row);
  }

  return root;
}

export function noticeInlineSuggestionsPlugin() {
  return new Plugin<SuggestState>({
    key: noticeInlineSuggestionsKey,

    state: {
      init: (_cfg, state) => calcSuggest(state),
      apply: (tr, _prev, _old, state) => {
        if (!tr.docChanged && !tr.selectionSet) {
          return noticeInlineSuggestionsKey.getState(state) ?? calcSuggest(state);
        }
        return calcSuggest(state);
      },
    },

    props: {
      decorations(state) {
        const s = noticeInlineSuggestionsKey.getState(state);
        if (!s || !s.active) return null;

        const deco = Decoration.widget(
          s.anchor,
          (view) => {
            const dom = buildInlineMenu(view, (variant) => {
              const ss = noticeInlineSuggestionsKey.getState(view.state);
              if (!ss || !ss.active) return;

              const { schema } = view.state;
              const noticeType = schema.nodes["notice"];
              const paragraphType = schema.nodes["paragraph"];
              if (!noticeType || !paragraphType) return;

              const p = paragraphType.createAndFill();
              const noticeNode = noticeType.create({ variant }, p ? [p] : []);

              // ✅ aquí recién reemplazamos el texto "notice!"
              let tr = view.state.tr
                .deleteRange(ss.from, ss.to)
                .insert(ss.from, noticeNode);

              // opcional: poner cursor dentro del notice (primer lugar posible)
              tr = tr.setSelection(TextSelection.near(tr.doc.resolve(ss.from + 1), 1));

              view.dispatch(tr);
              view.focus();
            });

            return dom;
          },
          { side: 1 }
        );

        return DecorationSet.create(state.doc, [deco]);
      },
    },
  });
}
