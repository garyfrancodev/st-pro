// important.nodeviews.ts
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeViewConstructor } from 'prosemirror-view';
import { ImportantRegistry } from './important.registry';
import { ImportantTemplateNodeView } from './important-template.nodeview';

type GetPos = () => number | undefined;

export function importantNodeViews(registry: ImportantRegistry): {
  [name: string]: NodeViewConstructor;
} {
  return {
    important_box(node: PMNode, view: EditorView, getPos: GetPos) {
      const a = node.attrs as Record<string, unknown>;
      const templateId = String(a['templateId'] ?? 'important');
      const tpl = registry.getById(templateId);

      return new ImportantTemplateNodeView(
        node,
        view,
        getPos,
        tpl?.html ?? '<span><span data-slot="content"></span></span>'
      );
    },
  };
}
