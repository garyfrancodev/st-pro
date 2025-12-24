// bubble.nodeviews.ts
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view';
import { BubbleItemNodeView } from './bubble-item.nodeview';

type GetPos = () => number | undefined;

export function bubbleNodeViews(variantCount: number): { [node: string]: NodeViewConstructor } {
  return {
    bubble_item(node: PMNode, view: EditorView, getPos: GetPos): NodeView {
      return new BubbleItemNodeView(node, view, getPos, variantCount);
    },
  };
}
