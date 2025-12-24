// important-template.nodeview.ts
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';

type GetPos = () => number | undefined;

export class ImportantTemplateNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: GetPos,
    templateHtml: string
  ) {
    // ✅ root inline
    this.dom = document.createElement('span');
    this.dom.className = 'pm-important-host';
    this.dom.style.display = 'inline-block';
    this.dom.style.maxWidth = '100%';
    this.dom.style.verticalAlign = 'top';

    const tpl = document.createElement('template');
    tpl.innerHTML = templateHtml.trim();

    const article = tpl.content.firstElementChild as HTMLElement | null;
    if (!article) throw new Error('Important template must have a root element');

    const slot = article.querySelector('[data-slot="content"]') as HTMLElement | null;
    if (!slot) throw new Error('Template missing [data-slot="content"]');

    // ✅ donde ProseMirror mete el texto
    this.contentDOM = document.createElement('span');
    this.contentDOM.className = 'pm-important-contentdom';
    slot.replaceWith(this.contentDOM);

    this.dom.appendChild(article);
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    return true;
  }
}
