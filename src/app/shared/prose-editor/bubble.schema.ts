// bubble.schema.ts
import { NodeSpec } from 'prosemirror-model';

export const bubbleListSpec: NodeSpec = {
  group: 'block',
  content: 'bubble_item+',
  isolating: true,
  parseDOM: [{ tag: 'div[data-bubble-list]' }],
  toDOM() {
    return ['div', { 'data-bubble-list': 'true', class: 'pm-bubble-list' }, 0];
  },
};

export const bubbleItemSpec: NodeSpec = {
  content: 'text*',
  isolating: true,
  attrs: {
    index: { default: 1 },
    variant: { default: 0 },
  },
  parseDOM: [
    {
      tag: 'div[data-bubble-item]',
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        return {
          index: Number(el.getAttribute('data-index') ?? 1),
          variant: Number(el.getAttribute('data-variant') ?? 0),
        };
      },
    },
  ],
  toDOM(node) {
    const a = node.attrs as Record<string, unknown>;
    return [
      'div',
      {
        'data-bubble-item': 'true',
        'data-index': String(a['index'] ?? 1),
        'data-variant': String(a['variant'] ?? 0),
        class: 'pm-bubble',
      },
      0,
    ];
  },
};
