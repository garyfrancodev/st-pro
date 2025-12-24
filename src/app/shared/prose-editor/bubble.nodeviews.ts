// bubble.nodeviews.ts
import { EditorView, NodeViewConstructor } from 'prosemirror-view';
import { BubbleItemNodeView } from './bubble-item.nodeview';

export function bubbleNodeViews(variantCount: number): {
  [key: string]: NodeViewConstructor;
} {
  return {
    bubble_item(node, view, getPos) {
      return new BubbleItemNodeView(node, view, getPos as any, variantCount);
    },
  };
}
