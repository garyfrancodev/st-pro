import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { Schema, MarkSpec } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';

// ✅ Tus plugins (ajusta rutas según tu proyecto)
import { keywordMarkingPlugin } from './keywordPlugin';
import { keywordClickPlugin } from './keywordClickPlugin';
import {linkCardNodeSpec} from './link-card.node';
import {LinkCardView} from './link-card.view';
import {linkPreviewPastePlugin} from './link-preview.plugin';
import {insertMentionGroup, insertMentionGroupAtRange} from './mention-group.commands';
import {mentionGroupNodeViewPlugin} from './mention-group.nodeview.plugin';
import {mentionGroupPlugin} from './mention-group.plugin';
import {mentionStackPlugin} from './mention-stack.plugin';
import {mentionTypeaheadPlugin} from './mention-typeahead.plugin';
import {mentionGroupNodeName, mentionGroupNodeSpec} from './mention_group.node';

/** ✅ MarkSpec para “task/meeting” (o cualquier keyword clickeable) */
export const keywordMarkSpec: MarkSpec = {
  attrs: { keyword: { default: null } },
  inclusive: false,
  parseDOM: [
    {
      tag: 'span[data-keyword]',
      getAttrs: (dom) => ({
        keyword: (dom as HTMLElement).getAttribute('data-keyword'),
      }),
    },
  ],
  toDOM(mark) {
    const kw = (mark.attrs['keyword'] ?? '').toString().toLowerCase();
    return [
      'span',
      {
        class: `pm-keyword pm-keyword--${kw}`, // estilo tipo “botón”
        'data-keyword': kw,
        role: 'button',
        tabindex: '0',
      },
      0,
    ];
  },
};

type IconKeyword = { word: string; icon: string };

@Directive({
  selector: '[pmEditable]',
  standalone: true,
})
export class ProseMirrorEditableDirective implements OnInit, OnDestroy {
  /** Lista de keywords que se marcan como “botón” (mark clickeable) */
  @Input() pmMarkKeywords: string[] = ['task', 'meeting'];

  /** Lista de keywords con icono (decorations widget) */
  @Input() pmIconKeywords: IconKeyword[] = [
    { word: 'mobile', icon: '📱' },
    { word: 'bug', icon: '🐞' },
  ];

  /** Emitimos keyword cuando el usuario hace click en un “botón” */
  @Output() pmKeywordClick = new EventEmitter<string>();

  /** Emitimos la instancia del view por si el host quiere acceder */
  @Output() pmReady = new EventEmitter<EditorView>();

  private view?: EditorView;
  private originalContentEditable: string | null = null;

  constructor(
    private host: ElementRef<HTMLDivElement>,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    // ✅ Evita doble contenteditable (el DOM host puede venir editable)
    const el = this.host.nativeElement;
    this.originalContentEditable = el.getAttribute('contenteditable');
    el.setAttribute('contenteditable', 'false');

    // ✅ Importante: crear ProseMirror fuera de Angular para rendimiento
    this.zone.runOutsideAngular(() => {
      const fakeUsers = [
        { id: "u1", name: "Ana Suárez", title: "QA Engineer", avatarUrl: "https://i.pravatar.cc/100?img=12" },
        { id: "u2", name: "Bruno Rojas", title: "Frontend", avatarUrl: "https://i.pravatar.cc/100?img=25" },
        { id: "u3", name: "Carla Pinto", title: "Product", avatarUrl: "https://i.pravatar.cc/100?img=32" },
      ];

      const schema = this.buildSchema();
      const state = EditorState.create({
        schema,
        plugins: [
          history(),
          keymap(baseKeymap),

          mentionGroupNodeViewPlugin("mention_group"),

          mentionGroupPlugin(),

          mentionStackPlugin("mention_group"),

          mentionTypeaheadPlugin({
            users: fakeUsers,
            onPick: (view, pickedUsers, range) => {
              insertMentionGroupAtRange(pickedUsers, range.from, range.to)(
                view.state,
                view.dispatch
              );
            }
          }),

          keymap({
            "Mod-m": (state, dispatch) => insertMentionGroup(fakeUsers)(state, dispatch),
          }),

          // Icons (mobile/bug) confirmados por espacio/enter/puntuación
          this.keywordIconsPlugin(),

          // Marking (task/meeting) confirmado por espacio/enter/puntuación
          keywordMarkingPlugin(),
          linkPreviewPastePlugin({
            fetchPreview: (url) => fetch("/api/link-preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            }).then(r => r.json())
          }),

          // Click en mark (task/meeting)
          keywordClickPlugin((kw) => {
            // Volver a Angular para emitir evento seguro
            this.zone.run(() => this.pmKeywordClick.emit(kw));
          }),
        ],
      });

      this.view = new EditorView(el, {
        state,
        attributes: {
          class: 'ProseMirror',
          spellcheck: 'true',
          autocapitalize: 'sentences',
          autocomplete: 'on',
        },
        nodeViews: {
          link_card: (node, view) => new LinkCardView(node, view),
        },
      });

      // Avisar que está listo
      this.zone.run(() => this.pmReady.emit(this.view!));
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();

    // Restaurar atributo original por si el div se reutiliza
    if (this.originalContentEditable === null) {
      this.host.nativeElement.removeAttribute('contenteditable');
    } else {
      this.host.nativeElement.setAttribute('contenteditable', this.originalContentEditable);
    }
  }

  // -------------------------
  // Schema
  // -------------------------
  private buildSchema(): Schema {
    const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block")
      .addToEnd(mentionGroupNodeName, mentionGroupNodeSpec)  // ✅ AQUÍ
      .addToEnd("link_card", linkCardNodeSpec);

    const marks = basicSchema.spec.marks
      .addToEnd("keyword", keywordMarkSpec);

    return new Schema({ nodes, marks });
  }

  // -------------------------
  // Icons plugin (decorations)
  // -------------------------
  private keywordIconsKey = new PluginKey('pm-keyword-icons');

  private keywordIconsPlugin(): Plugin {
    return new Plugin({
      key: this.keywordIconsKey,
      state: {
        init: (_, state) => this.buildKeywordDecorations(state),
        apply: (tr, prev, _oldState, newState) => {
          if (tr.docChanged || tr.selectionSet) return this.buildKeywordDecorations(newState);
          return prev;
        },
      },
      props: {
        decorations: (state) => this.keywordIconsKey.getState(state) as DecorationSet,
      },
    });
  }

  private buildKeywordDecorations(state: EditorState): DecorationSet {
    const { doc } = state;
    const decos: Decoration[] = [];

    const words = this.pmIconKeywords.map(k => k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!words) return DecorationSet.empty;

    // ✅ SOLO si después viene: espacio / enter / puntuación explícita
    const re = new RegExp(`\\b(${words})\\b(?=(\\s|[.!?,;:]))`, 'gi');

    doc.descendants((node, pos) => {
      if (!node.isTextblock) return true;

      const text = node.textContent;
      let match: RegExpExecArray | null;

      while ((match = re.exec(text)) !== null) {
        const found = match[1].toLowerCase();
        const icon = this.pmIconKeywords.find(k => k.word.toLowerCase() === found)?.icon;
        if (!icon) continue;

        // ⚠️ Este mapeo es “simple” (bien para MVP). Si luego metes inline nodes raros,
        // te lo mejoro a mapeo exacto por posiciones.
        const from = pos + 1 + match.index;
        const to = from + match[0].length;

        decos.push(
          Decoration.inline(from, to, { class: `kw-word kw-${found}` })
        );

        decos.push(
          Decoration.widget(
            to,
            () => {
              const span = document.createElement('span');
              span.className = `kw-icon kw-${found}`;
              span.setAttribute('aria-hidden', 'true');
              span.textContent = icon;
              return span;
            },
            { side: 1 }
          )
        );
      }

      return true;
    });

    return DecorationSet.create(doc, decos);
  }
}
