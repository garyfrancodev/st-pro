// src/app/shared/prose-editor/mention-group.plugin.ts
import { Plugin, PluginKey } from "prosemirror-state";
import { MentionGroupView } from "./mention-group.view";
import {mentionGroupNodeName} from './mention_group.node';


export const mentionGroupPluginKey = new PluginKey("mention-group");

export function mentionGroupPlugin() {
  return new Plugin({
    key: mentionGroupPluginKey,
    props: {
      nodeViews: {
        [mentionGroupNodeName]: (node, view) => new MentionGroupView(node, view),
      },
    },
  });
}
