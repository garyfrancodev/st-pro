import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import {MarkSpec, Schema} from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import {keywordClickPlugin} from './keywordClickPlugin';
import {keywordMark} from './keywordMark';
import {keywordMarkingPlugin} from './keywordPlugin';
import {mentionGroupNodeName, mentionGroupNodeSpec} from './mention_group.node';

@Component({
  selector: 'app-prose-editor',
  standalone: true,
  template: `<div #host class="pm-host"></div>`,
  styleUrl: './prose-editor.component.scss',
})
export class ProseEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private view?: EditorView;

  ngAfterViewInit(): void {
    // Extiende el schema básico para listas (opcional)
    const mySchema: Schema = new Schema({
      nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block')
        .addToEnd(mentionGroupNodeName, mentionGroupNodeSpec),
      marks: basicSchema.spec.marks.addToEnd("keyword", keywordMarkSpec),
    });

    const state = EditorState.create({
      schema: mySchema,
      plugins: [
        history(),
        keymap(baseKeymap),
        keywordIconsPlugin(),
        keywordMarkingPlugin(),
        keywordClickPlugin((kw) => {
          // aquí disparas lo tuyo:
          // - abrir microapp abajo
          // - alert
          // - EventEmitter
          alert(`Click en keyword: ${kw}`);
        }),
      ],
    });

    this.view = new EditorView(this.host.nativeElement, {
      state,
      attributes: {
        class: 'ProseMirror',
        spellcheck: 'true',
        autocapitalize: 'sentences',
        autocomplete: 'on',
      },
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }
}

const keywordIconsKey = new PluginKey('keyword-icons');

function keywordIconsPlugin() {
  return new Plugin({
    key: keywordIconsKey,
    state: {
      init: (_, state) => buildKeywordDecorations(state),
      apply: (tr, prev, _oldState, newState) => {
        // Recalcular solo si cambió el doc o la selección (por si quieres)
        if (tr.docChanged || tr.selectionSet) return buildKeywordDecorations(newState);
        return prev;
      },
    },
    props: {
      decorations(state) {
        return keywordIconsKey.getState(state) as DecorationSet;
      },
    },
  });
}

function buildKeywordDecorations(state: EditorState): DecorationSet {
  const { doc } = state;
  const decos: Decoration[] = [];

  // ✅ Solo matchea si después viene: espacio, salto (fin de bloque), o puntuación.
  //   - espacio: "mobile "
  //   - enter: "mobile" + fin del textblock
  //   - puntuación: "mobile," "bug." etc
  const re = /\b(mobile|bug)\b(?=(\s|[.!?,;:]))/gi;

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;

    const text = node.textContent;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      const word = match[1].toLowerCase();
      const from = pos + 1 + match.index;
      const to = from + match[0].length;

      // Icono al final de la palabra confirmada
      decos.push(
        Decoration.widget(
          to,
          () => {
            const span = document.createElement('span');
            span.className = `kw-icon kw-${word}`;
            span.setAttribute('aria-hidden', 'true');
            span.textContent = word === 'mobile' ? '📱' : '🐞';
            return span;
          },
          { side: 1 }
        )
      );

      // (Opcional) estilo sobre la palabra
      decos.push(Decoration.inline(from, to, { class: `kw-word kw-${word}` }));
    }

    return true;
  });

  return DecorationSet.create(doc, decos);
}

export const keywordMarkSpec: MarkSpec = {
  attrs: { keyword: { default: null } },
  inclusive: false,
  parseDOM: [
    {
      tag: "span[data-keyword]",
      getAttrs: (dom) => ({
        keyword: (dom as HTMLElement).getAttribute("data-keyword"),
      }),
    },
  ],
  toDOM(mark) {
    const kw = (mark.attrs["keyword"] ?? "").toString();
    return [
      "span",
      {
        class: `pm-keyword pm-keyword--${kw}`,  // pm-keyword--task / pm-keyword--meeting
        "data-keyword": kw,
        role: "button",
        tabindex: "0",
      },
      0,
    ];
  },
};


