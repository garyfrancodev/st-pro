import { Node as PMNode } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";

export class LinkCardView implements NodeView {
  dom: HTMLElement;

  constructor(private node: PMNode, private view: EditorView) {
    this.dom = document.createElement("div");
    this.dom.className = "pm-link-card-wrap";
    this.render();
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  private render() {
    const { url, title, description, image, site, loading, error } = this.node.attrs;

    this.dom.innerHTML = "";

    const card = document.createElement("a");
    card.className = `pm-link-card-ui ${loading ? "is-loading" : ""} ${error ? "is-error" : ""}`;
    card.href = url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    if (loading) {
      card.textContent = "Cargando previsualización…";
      this.dom.appendChild(card);
      return;
    }

    if (error) {
      card.textContent = `Preview no disponible — abrir: ${url}`;
      this.dom.appendChild(card);
      return;
    }

    const left = document.createElement("div");
    left.className = "pm-link-card-left";

    const s = document.createElement("div");
    s.className = "pm-link-card-site";
    s.textContent = site || new URL(url).hostname;

    const t = document.createElement("div");
    t.className = "pm-link-card-title";
    t.textContent = title || url;

    const d = document.createElement("div");
    d.className = "pm-link-card-desc";
    d.textContent = description || "";

    left.append(s, t, d);
    card.appendChild(left);

    if (image) {
      const img = document.createElement("img");
      img.className = "pm-link-card-img";
      img.src = image;
      img.alt = "";
      card.appendChild(img);
    }

    this.dom.appendChild(card);
  }

  stopEvent() { return true; }
}
