// bubble-item.nodeview.ts
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';

type GetPos = () => number | undefined;

export class BubbleItemNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private marker: HTMLElement;
  private controls: HTMLElement;

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: GetPos,
    private variantCount: number
  ) {
    this.dom = document.createElement('div');
    this.dom.className = 'pm-bubble';

    const wrap = document.createElement('div');
    wrap.className = 'pm-bubble__wrap';

    // 🔢 marker (NO editable)
    this.marker = document.createElement('div');
    this.marker.className = 'pm-bubble__marker';

    // ✏️ texto editable
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'pm-bubble__content';

    // ◀ ▶ controles
    this.controls = document.createElement('div');
    this.controls.className = 'pm-bubble__controls';

    const prev = document.createElement('button');
    prev.textContent = '◀';
    const next = document.createElement('button');
    next.textContent = '▶';

    prev.onmousedown = next.onmousedown = (e) => e.preventDefault();
    prev.onclick = () => this.shiftVariant(-1);
    next.onclick = () => this.shiftVariant(1);

    this.controls.append(prev, next);

    wrap.append(this.marker, this.contentDOM, this.controls);
    this.dom.append(wrap);

    this.sync();
  }

  private sync() {
    const a = this.node.attrs as any;
    this.marker.textContent = `${a.index}.`;

    for (let i = 0; i < this.variantCount; i++) {
      this.dom.classList.remove(`pm-bubble--v${i}`);
    }
    this.dom.classList.add(`pm-bubble--v${a.variant}`);
  }

  private shiftVariant(delta: number) {
    const pos = this.getPos();
    if (typeof pos !== 'number') return;

    const a = this.node.attrs as any;
    const next = (a.variant + delta + this.variantCount) % this.variantCount;

    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...a,
        variant: next,
      })
    );
  }

  update(node: PMNode) {
    this.node = node;
    this.sync();
    return true;
  }
}
