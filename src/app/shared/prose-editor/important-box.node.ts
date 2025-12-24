// important-box.node.ts
import { NodeSpec } from 'prosemirror-model';

export const importantBoxNodeSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  content: 'text*',
  defining: true,
  isolating: true,
  attrs: {
    templateId: { default: 'important' },
    variant: { default: 0 },
  },
  parseDOM: [
    {
      tag: 'span[data-pm-important="true"]',
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        return {
          templateId: el.getAttribute('data-template-id') ?? 'important',
          variant: Number(el.getAttribute('data-variant') ?? 0),
        };
      },
    },
  ],
  toDOM(node) {
    const a = node.attrs as Record<string, unknown>;
    return [
      'span',
      {
        'data-pm-important': 'true',
        'data-template-id': String(a['templateId'] ?? 'important'),
        'data-variant': String(a['variant'] ?? 0),
        class: 'pm-important-host',
      },
      // 👇 placeholder visible si está vacío
      ['span', { class: 'pm-important-ghost', 'data-ghost': 'true' }, 'IMPORTANT'],
      0,
    ];
  },
};
