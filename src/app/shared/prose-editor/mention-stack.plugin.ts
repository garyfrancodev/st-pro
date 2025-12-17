// src/app/shared/prose-editor/mention-stack.plugin.ts
import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Node as PMNode } from "prosemirror-model";

export const mentionStackKey = new PluginKey<DecorationSet>("mention-stack");

type ChildEntry = { child: PMNode; offset: number };

export function mentionStackPlugin(mentionNodeName: string = "mention_group"): Plugin {
  return new Plugin<DecorationSet>({
    key: mentionStackKey,

    state: {
      init: (_config: unknown, state: EditorState): DecorationSet =>
        buildMentionStackDecorations(state, mentionNodeName),

      apply: (tr, prev: DecorationSet, _oldState: EditorState, newState: EditorState): DecorationSet => {
        if (tr.docChanged) return buildMentionStackDecorations(newState, mentionNodeName);
        return prev;
      },
    },

    props: {
      decorations(state: EditorState): DecorationSet {
        return mentionStackKey.getState(state) ?? DecorationSet.empty;
      },
    },
  });
}

function buildMentionStackDecorations(state: EditorState, mentionNodeName: string): DecorationSet {
  const decos: Decoration[] = [];
  const { doc } = state;

  doc.descendants((node: PMNode, pos: number) => {
    if (!node.isTextblock) return true;

    const children: ChildEntry[] = [];
    node.forEach((child: PMNode, offset: number) => {
      children.push({ child, offset });
    });

    let run: Array<{ from: number; to: number }> = [];

    const flush = (): void => {
      if (run.length >= 2) {
        for (const r of run) {
          decos.push(Decoration.node(r.from, r.to, { class: "pm-mention--stacked" }));
        }
      }
      run = [];
    };

    for (const it of children) {
      const from = pos + 1 + it.offset;
      const to = from + it.child.nodeSize;

      if (it.child.type.name === mentionNodeName) {
        run.push({ from, to });
      } else {
        flush();
      }
    }

    flush();
    return true;
  });

  return DecorationSet.create(doc, decos);
}
