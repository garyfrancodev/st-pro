// bubble-item.nodeview.ts
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import { setBubbleVariant } from './bubble.commands';

type GetPos = () => number | undefined;

export class BubbleItemNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private leftBtn: HTMLButtonElement;
  private rightBtn: HTMLButtonElement;

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: GetPos,
    private variantCount: number
  ) {
    this.dom = document.createElement('div');
    this.dom.className = this.getClass(node);
    this.dom.setAttribute('data-bubble-item', 'true');

    const marker = document.createElement('div');
    marker.className = 'pm-bubble-marker';
    marker.textContent = String((node.attrs as any)['index'] ?? 1);

    const controls = document.createElement('div');
    controls.className = 'pm-bubble-controls';

    this.leftBtn = document.createElement('button');
    this.leftBtn.type = 'button';
    this.leftBtn.className = 'pm-bubble-btn pm-bubble-btn-left';
    this.leftBtn.textContent = '◀';

    this.rightBtn = document.createElement('button');
    this.rightBtn.type = 'button';
    this.rightBtn.className = 'pm-bubble-btn pm-bubble-btn-right';
    this.rightBtn.textContent = '▶';

    controls.append(this.leftBtn, this.rightBtn);

    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'pm-bubble-content';

    this.dom.append(marker, controls, this.contentDOM);

    this.leftBtn.addEventListener('mousedown', (e) => e.preventDefault());
    this.rightBtn.addEventListener('mousedown', (e) => e.preventDefault());

    this.leftBtn.addEventListener('click', () => this.shiftVariant(-1));
    this.rightBtn.addEventListener('click', () => this.shiftVariant(+1));
  }

  private getVariant(node: PMNode): number {
    return Number((node.attrs as any)['variant'] ?? 0);
  }

  private getIndex(node: PMNode): number {
    return Number((node.attrs as any)['index'] ?? 1);
  }

  private getClass(node: PMNode) {
    const v = this.getVariant(node);
    return `pm-bubble-item pm-bubble-variant-${v}`;
  }

  private shiftVariant(delta: number) {
    const pos = this.getPos();
    if (pos == null) return; // <-- importante

    const current = this.getVariant(this.node);
    const next = (current + delta + this.variantCount) % this.variantCount;

    const tr = this.view.state.tr;
    setBubbleVariant(tr, pos, next);
    this.view.dispatch(tr);
    this.view.focus();
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;

    this.dom.className = this.getClass(node);

    const marker = this.dom.querySelector('.pm-bubble-marker') as HTMLElement | null;
    if (marker) marker.textContent = String(this.getIndex(node));

    return true;
  }
}
