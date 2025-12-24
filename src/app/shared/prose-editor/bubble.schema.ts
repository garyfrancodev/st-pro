// bubble.schema.ts
import { NodeSpec } from 'prosemirror-model';

export const bubbleListSpec: NodeSpec = {
  group: 'block',
  content: 'bubble_item+',
  defining: true,
  parseDOM: [{ tag: 'div[data-bubble-list="true"]' }],
  toDOM() {
    return ['div', { 'data-bubble-list': 'true', class: 'pm-bubble-list' }, 0];
  },
};

export const bubbleItemSpec: NodeSpec = {
  content: 'paragraph+',
  defining: true,
  isolating: true,
  attrs: {
    index: { default: 1 },
    variant: { default: 0 },
  },
  parseDOM: [
    {
      tag: 'div[data-bubble-item="true"]',
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        const variant = Number(el.getAttribute('data-variant') ?? 0);
        const index = Number(el.getAttribute('data-index') ?? 1);
        return { variant, index };
      },
    },
  ],
  toDOM(node) {
    const attrs = node.attrs as Record<string, unknown>;
    const variant = Number(attrs['variant'] ?? 0);
    const index = Number(attrs['index'] ?? 1);

    return [
      'div',
      {
        'data-bubble-item': 'true',
        'data-variant': String(variant),
        'data-index': String(index),
      },
      0,
    ];
  },
};
