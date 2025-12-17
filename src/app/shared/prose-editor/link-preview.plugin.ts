import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

const URL_RE = /(https?:\/\/[^\s]+)/i;

export function linkPreviewPastePlugin(opts: {
  fetchPreview: (url: string) => Promise<{ title?: string; description?: string; image?: string; site?: string }>;
}) {
  return new Plugin({
    props: {
      handlePaste(view: EditorView, event: ClipboardEvent) {
        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (!text) return false;

        const m = text.match(URL_RE);
        if (!m) return false;

        // Si quieres: sólo si el clipboard es “sólo url” (como WhatsApp)
        if (text !== m[0]) return false;

        const url = m[0];

        const { state } = view;
        const linkCardType = state.schema.nodes["link_card"];
        if (!linkCardType) return false;

        // 1) Inserta placeholder (loading)
        const node = linkCardType.create({
          url,
          loading: true,
          error: false,
          title: "",
          description: "",
          image: "",
          site: "",
        });

        const tr = state.tr.replaceSelectionWith(node).scrollIntoView();
        const insertPos = tr.selection.from; // pos aproximada después del replace
        view.dispatch(tr);

        // 2) Fetch async a tu backend (no al sitio directo)
        opts.fetchPreview(url)
          .then((data) => {
            // Encontrar el node recién insertado (simple: buscar cercano)
            const doc = view.state.doc;
            let foundPos: number | null = null;
            doc.descendants((n, pos) => {
              if (foundPos !== null) return false;
              if (n.type === linkCardType && n.attrs["url"] === url && n.attrs["loading"] === true) {
                foundPos = pos;
                return false;
              }
              return true;
            });

            if (foundPos == null) return;

            const tr2 = view.state.tr.setNodeMarkup(foundPos, undefined, {
              ...view.state.doc.nodeAt(foundPos)!.attrs,
              loading: false,
              error: false,
              title: data.title ?? "",
              description: data.description ?? "",
              image: data.image ?? "",
              site: data.site ?? "",
            });
            view.dispatch(tr2);
          })
          .catch(() => {
            // Fallback error
            const doc = view.state.doc;
            let foundPos: number | null = null;
            doc.descendants((n, pos) => {
              if (foundPos !== null) return false;
              if (n.type.name === "link_card" && n.attrs["url"] === url && n.attrs["loading"] === true) {
                foundPos = pos;
                return false;
              }
              return true;
            });
            if (foundPos == null) return;

            const trErr = view.state.tr.setNodeMarkup(foundPos, undefined, {
              ...view.state.doc.nodeAt(foundPos)!.attrs,
              loading: false,
              error: true,
            });
            view.dispatch(trErr);
          });

        return true;
      },
    },
  });
}
