// important-box.nodeview.ts
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';

type GetPos = () => number | undefined;

export class ImportantBoxNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private leftBtn: HTMLButtonElement;
  private rightBtn: HTMLButtonElement;

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: GetPos,
    private variantCount: number,
    private variantClass?: (v: number) => string
  ) {
    this.dom = document.createElement('div');
    this.dom.className = this.computeClass(node);
    this.dom.setAttribute('data-pm-important', 'true');

    // Controles hover
    const controls = document.createElement('div');
    controls.className = 'pm-important-controls';

    this.leftBtn = document.createElement('button');
    this.leftBtn.type = 'button';
    this.leftBtn.className = 'pm-important-btn pm-important-btn-left';
    this.leftBtn.textContent = '◀';

    this.rightBtn = document.createElement('button');
    this.rightBtn.type = 'button';
    this.rightBtn.className = 'pm-important-btn pm-important-btn-right';
    this.rightBtn.textContent = '▶';

    controls.append(this.leftBtn, this.rightBtn);

    // Slot editable
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'pm-important-content';

    this.dom.append(controls, this.contentDOM);

    // Evitar que los botones roben selección
    this.leftBtn.addEventListener('mousedown', (e) => e.preventDefault());
    this.rightBtn.addEventListener('mousedown', (e) => e.preventDefault());

    this.leftBtn.addEventListener('click', () => this.shiftVariant(-1));
    this.rightBtn.addEventListener('click', () => this.shiftVariant(+1));
  }

  private getVariant(n: PMNode): number {
    const a = n.attrs as Record<string, unknown>;
    return Number(a['variant'] ?? 0);
  }

  private computeClass(n: PMNode): string {
    const a = n.attrs as Record<string, unknown>;
    const templateId = String(a['templateId'] ?? 'important');
    const v = this.getVariant(n);
    const extra = this.variantClass ? this.variantClass(v) : `important-v${v}`;
    return `pm-important-box pm-important-${templateId} ${extra}`;
  }

  private shiftVariant(delta: number) {
    const pos = this.getPos();
    if (pos == null) return;

    const current = this.getVariant(this.node);
    const next = (current + delta + this.variantCount) % this.variantCount;

    const tr = this.view.state.tr;
    const attrs = this.node.attrs as Record<string, unknown>;
    tr.setNodeMarkup(pos, undefined, { ...attrs, variant: next });

    this.view.dispatch(tr);
    this.view.focus();
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.dom.className = this.computeClass(node);
    return true;
  }
}
