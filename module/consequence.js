const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const CONSEQUENCE_TYPE_LABELS = {
  mutation: "Mutation",
  malignancy: "Malignancy",
  mentalDisorder: "Mental Disorder",
  criticalInjury: "Critical Injury"
};

const CONSEQUENCE_TYPES = new Set(["mutation", "malignancy", "mentalDisorder", "criticalInjury"]);

export function isConsequenceType(itemType) {
  return CONSEQUENCE_TYPES.has(String(itemType ?? "").trim());
}

export async function resolveTraitModifierFormula(formula) {
  const source = String(formula ?? "").trim();
  if (!source) {
    return { resolvedText: "", rolls: [] };
  }

  const entries = source
    .split(/[\r\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const resolvedEntries = [];
  const rolls = [];

  for (const entry of entries) {
    const match = entry.match(/^(.+?)\s*([+-])\s*(.+)$/);
    if (!match) {
      resolvedEntries.push(entry);
      continue;
    }

    const label = String(match[1] ?? "").trim();
    const operator = String(match[2] ?? "+").trim();
    const valueExpression = String(match[3] ?? "").trim();
    if (!label || !valueExpression) {
      resolvedEntries.push(entry);
      continue;
    }

    const hasDice = /d\d+/i.test(valueExpression);
    if (!hasDice) {
      const numericValue = Number(valueExpression);
      if (!Number.isFinite(numericValue)) {
        resolvedEntries.push(entry);
        continue;
      }

      resolvedEntries.push(`${label} ${operator}${Math.abs(numericValue)}`);
      continue;
    }

    const roll = await (new Roll(valueExpression)).evaluate({ async: true });
    const total = Math.max(0, Number(roll.total ?? 0) || 0);
    resolvedEntries.push(`${label} ${operator}${total}`);
    rolls.push({
      label,
      operator,
      expression: valueExpression,
      total,
      roll
    });
  }

  return {
    resolvedText: resolvedEntries.join(", "),
    rolls
  };
}

export class RogueTraderConsequenceSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderConsequenceSheet, {
      types: ["mutation", "malignancy", "mentalDisorder", "criticalInjury"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "consequence"],
    position: {
      width: 700,
      height: 640
    },
    window: {
      resizable: true
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    sheet: {
      template: "systems/roguetrader/templates/items/consequence.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.typeLabel = CONSEQUENCE_TYPE_LABELS[this.item.type] ?? "Condition";
    context.showSeverity = this.item.type === "mentalDisorder" || this.item.type === "criticalInjury";
    context.hasTraitModifiers = isConsequenceType(this.item.type);
    return context;
  }
}
