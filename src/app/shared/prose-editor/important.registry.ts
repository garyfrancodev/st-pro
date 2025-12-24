// important.registry.ts
export type ImportantTemplate = {
  id: string;
  triggers: string[];
  html: string;
  variantCount: number;
};

export class ImportantRegistry {
  private templates = new Map<string, ImportantTemplate>();
  private triggerToId = new Map<string, string>();

  register(t: ImportantTemplate) {
    this.templates.set(t.id, t);
    for (const trig of t.triggers) {
      this.triggerToId.set(trig, t.id);
    }
  }

  getById(id: string) {
    return this.templates.get(id);
  }

  getTriggers(): string[] {
    return Array.from(this.triggerToId.keys());
  }

  matchTrigger(text: string) {
    let best: { templateId: string; trigger: string } | null = null;

    for (const [trigger, templateId] of this.triggerToId.entries()) {
      if (text.endsWith(trigger)) {
        if (!best || trigger.length > best.trigger.length) {
          best = { templateId, trigger };
        }
      }
    }
    return best;
  }
}
