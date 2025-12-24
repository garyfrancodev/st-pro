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

    // parse template
    const tpl = document.createElement('template');
    tpl.innerHTML = templateHtml.trim();

    const root = tpl.content.firstElementChild as HTMLElement | null;
    if (!root) throw new Error('Important template must have a root element');

    // busca el slot
    const slot = root.querySelector('[data-slot="content"]') as HTMLElement | null;
    if (!slot) throw new Error('Template missing [data-slot="content"]');

    // ✅ contentDOM: el “punto de escritura”
    // usa span inline-block para que el cursor tenga hitbox
    this.contentDOM = document.createElement('span');
    this.contentDOM.className = 'pm-important-contentdom';
    this.contentDOM.setAttribute('data-pm-contentdom', 'true');

    // reemplaza el slot por contentDOM
    slot.replaceWith(this.contentDOM);

    // ⚠️ MUY importante: mete todo dentro de un contenedor inline
    // (evita que <article> block afecte la selección)
    const inlineWrap = document.createElement('span');
    inlineWrap.className = 'pm-important-inlinewrap';
    inlineWrap.appendChild(root);

    this.dom.appendChild(inlineWrap);

    // ✅ “hacer clic en cualquier parte” debe llevar el cursor adentro
    this.dom.addEventListener('mousedown', (e) => {
      // si el click NO fue sobre el área editable, mueve el cursor al final del contenido
      if (!this.contentDOM.contains(e.target as Node)) {
        e.preventDefault();
        this.focusInside();
      }
    });
  }

  private focusInside() {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;

    const nodeSize = this.node.nodeSize;
    const insideEnd = pos + nodeSize - 1; // final dentro del nodo

    const { TextSelection } = require('prosemirror-state');
    const tr = this.view.state.tr.setSelection(
      TextSelection.near(this.view.state.doc.resolve(insideEnd), -1)
    );
    this.view.dispatch(tr);
    this.view.focus();
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    return true;
  }
}
