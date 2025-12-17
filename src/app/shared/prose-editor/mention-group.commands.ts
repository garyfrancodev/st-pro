import { Command, TextSelection } from "prosemirror-state";
import {MentionUser} from './mention_group.node';

type User = { id: string; name: string; title: string; avatarUrl: string };

export function insertMentionGroupAtRange(users: User[], from: number, to: number): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes["mention_group"];
    if (!type) return false;

    const node = type.create({ users });

    if (dispatch) {
      let tr = state.tr.replaceWith(from, to, node);

      // ✅ mueve el cursor a la derecha del node insertado
      const posAfter = from + node.nodeSize;
      tr = tr.setSelection(TextSelection.near(tr.doc.resolve(posAfter), 1));

      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

export function insertMentionGroup(users: MentionUser[]): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes["mention_group"];
    if (!type) return false;

    const { from, to } = state.selection;

    const node = type.create({ users });

    if (dispatch) {
      let tr = state.tr.replaceWith(from, to, node);

      // 👉 mueve el cursor después del token
      const posAfter = from + node.nodeSize;
      tr = tr.setSelection(TextSelection.near(tr.doc.resolve(posAfter), 1));

      dispatch(tr.scrollIntoView());
    }

    return true;
  };
}
