import { SKILL_REFERENCE_DATA } from "./skill-reference-data.js";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const CHARACTERISTIC_LABELS = {
  weaponSkill: "Weapon Skill",
  ballisticSkill: "Ballistic Skill",
  strength: "Strength",
  toughness: "Toughness",
  agility: "Agility",
  intelligence: "Intelligence",
  perception: "Perception",
  willpower: "Willpower",
  fellowship: "Fellowship"
};

const SKILL_GROUPS = {
  ciphers: ["Rogue Trader", "Mercenary Cant", "Nobilite Family", "Astropath Sign", "Underworld"],
  commonLore: [
    "Adeptus Arbites",
    "Adeptus Astra Telepathica",
    "Adeptus Mechanicus",
    "Administratum",
    "Ecclesiarchy",
    "Imperial Creed",
    "Imperial Guard",
    "Imperial Navy",
    "Imperium",
    "Koronous Expanse",
    "Machine Cult",
    "Navis Nobilite",
    "Rogue Traders",
    "Tech",
    "Underworld",
    "War"
  ],
  drive: ["Ground Vehicle", "Skimmer/Hover", "Walker"],
  forbiddenLore: [
    "Adeptus Mechanicus",
    "Archeotech",
    "Daemonology",
    "Heresy",
    "The Inquisition",
    "Mutants",
    "Navigators",
    "Pirates",
    "Psykers",
    "The Warp",
    "Xenos"
  ],
  navigation: ["Surface", "Stellar", "Warp"],
  performer: ["Dancer", "Musician", "Singer", "Storyteller"],
  pilot: ["Personal", "Flyers", "Space Craft"],
  scholasticLore: [
    "Archaic",
    "Astromancy",
    "Beasts",
    "Bureaucracy",
    "Chymistry",
    "Cryptology",
    "Heraldry",
    "Imperial Warrants",
    "Imperial Creed",
    "Judgement",
    "Legend",
    "Navis Nobilite",
    "Numerology",
    "Occult",
    "Philosophy",
    "Tactica Imperialis"
  ],
  secretTongue: ["Administratum", "Ecclesiarchy", "Military", "Navigator", "Rogue Trader", "Tech", "Underdeck"],
  speakLanguage: ["Eldar", "Explorator Binary", "High Gothic", "Hive Dialect", "Low Gothic", "Ork", "Ship Dialect", "Techna-Lingua", "Trader's Cant"],
  trade: [
    "Archaeologist",
    "Armourer",
    "Astrographer",
    "Chymist",
    "Cryptographer",
    "Explorator",
    "Linguist",
    "Remembrancer",
    "Scrimshawer",
    "Shipwright",
    "Soothsayer",
    "Technomat",
    "Trader",
    "Voidfarer"
  ]
};

const BASE_SKILL_DEFINITIONS = [
  { id: "acrobatics", name: "Acrobatics", characteristic: "agility", basic: false, category: "Movement" },
  { id: "awareness", name: "Awareness", characteristic: "perception", basic: true, category: "Exploration" },
  { id: "barter", name: "Barter", characteristic: "fellowship", basic: true, category: "Interaction" },
  { id: "blather", name: "Blather", characteristic: "fellowship", basic: false, category: "Interaction" },
  { id: "carouse", name: "Carouse", characteristic: "toughness", basic: true, category: "General" },
  { id: "charm", name: "Charm", characteristic: "fellowship", basic: true, category: "Interaction" },
  { id: "chem-use", name: "Chem-Use", characteristic: "intelligence", basic: false, category: "Investigation" },
  { id: "ciphers", name: "Ciphers", characteristic: "intelligence", basic: false, category: "General", groupKey: "ciphers" },
  { id: "climb", name: "Climb", characteristic: "strength", basic: true, category: "Movement" },
  { id: "command", name: "Command", characteristic: "fellowship", basic: true, category: "Interaction" },
  { id: "commerce", name: "Commerce", characteristic: "fellowship", basic: false, category: "Interaction" },
  { id: "common-lore", name: "Common Lore", characteristic: "intelligence", basic: false, category: "Investigation", groupKey: "commonLore" },
  { id: "concealment", name: "Concealment", characteristic: "agility", basic: true, category: "Exploration" },
  { id: "contortionist", name: "Contortionist", characteristic: "agility", basic: true, category: "Combat" },
  { id: "deceive", name: "Deceive", characteristic: "fellowship", basic: true, category: "Interaction" },
  { id: "demolition", name: "Demolition", characteristic: "intelligence", basic: false, category: "Crafting" },
  { id: "disguise", name: "Disguise", characteristic: "fellowship", basic: true, category: "Interaction" },
  { id: "dodge", name: "Dodge", characteristic: "agility", basic: true, category: "Combat" },
  { id: "drive", name: "Drive", characteristic: "agility", basic: false, category: "Operator", groupKey: "drive" },
  { id: "evaluate", name: "Evaluate", characteristic: "intelligence", basic: true, category: "Investigation" },
  { id: "forbidden-lore", name: "Forbidden Lore", characteristic: "intelligence", basic: false, category: "Investigation", groupKey: "forbiddenLore" },
  { id: "gamble", name: "Gamble", characteristic: "intelligence", basic: true, category: "General" },
  { id: "inquiry", name: "Inquiry", characteristic: "fellowship", basic: true, category: "Investigation" },
  { id: "interrogation", name: "Interrogation", characteristic: "willpower", basic: false, category: "Interaction" },
  { id: "intimidate", name: "Intimidate", characteristic: "strength", basic: true, category: "Interaction" },
  { id: "invocation", name: "Invocation", characteristic: "willpower", basic: false, category: "Psychic" },
  { id: "literacy", name: "Literacy", characteristic: "intelligence", basic: false, category: "General" },
  { id: "logic", name: "Logic", characteristic: "intelligence", basic: true, category: "General" },
  { id: "medicae", name: "Medicae", characteristic: "intelligence", basic: false, category: "Investigation" },
  { id: "navigation", name: "Navigation", characteristic: "intelligence", basic: false, category: "Exploration", groupKey: "navigation" },
  { id: "performer", name: "Performer", characteristic: "fellowship", basic: false, category: "Interaction", groupKey: "performer" },
  { id: "pilot", name: "Pilot", characteristic: "agility", basic: false, category: "Operator", groupKey: "pilot" },
  { id: "psyniscience", name: "Psyniscience", characteristic: "perception", basic: false, category: "Psychic" },
  { id: "scholastic-lore", name: "Scholastic Lore", characteristic: "intelligence", basic: false, category: "Investigation", groupKey: "scholasticLore" },
  { id: "scrutiny", name: "Scrutiny", characteristic: "perception", basic: true, category: "Investigation" },
  { id: "search", name: "Search", characteristic: "perception", basic: true, category: "Exploration" },
  { id: "secret-tongue", name: "Secret Tongue", characteristic: "intelligence", basic: false, category: "General", groupKey: "secretTongue" },
  { id: "security", name: "Security", characteristic: "agility", basic: false, category: "Exploration" },
  { id: "shadowing", name: "Shadowing", characteristic: "agility", basic: false, category: "General" },
  { id: "silent-move", name: "Silent Move", characteristic: "agility", basic: true, category: "Movement" },
  { id: "sleight-of-hand", name: "Sleight of Hand", characteristic: "agility", basic: false, category: "General" },
  { id: "speak-language", name: "Speak Language", characteristic: "intelligence", basic: false, category: "General", groupKey: "speakLanguage" },
  { id: "survival", name: "Survival", characteristic: "intelligence", basic: false, category: "Exploration" },
  { id: "swim", name: "Swim", characteristic: "strength", basic: true, category: "Movement" },
  { id: "tech-use", name: "Tech-Use", characteristic: "intelligence", basic: false, category: "Exploration" },
  { id: "tracking", name: "Tracking", characteristic: "intelligence", basic: false, category: "Exploration" },
  { id: "trade", name: "Trade", characteristic: "intelligence", basic: false, category: "Crafting", groupKey: "trade" },
  { id: "wrangling", name: "Wrangling", characteristic: "intelligence", basic: false, category: "General" }
];

function slugifySkillPart(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "space craft") return "spacecraft";

  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function expandGroupedSkill(definition) {
  const groups = SKILL_GROUPS[definition.groupKey] ?? [];
  return groups.map((groupName) => {
    const groupSlug = slugifySkillPart(groupName);
    return {
      ...definition,
      id: `${definition.id}/${groupSlug}`,
      baseId: definition.id,
      groupName,
      fullName: `${definition.name} (${groupName})`,
      specialization: groupName
    };
  });
}

function normalizeReferenceText(value) {
  return String(value ?? "")
    .replace(/ÃƒÂ¢Ã¢€šÂ¬Ã¢€žÂ¢/g, "\u2019")
    .replace(/ÃƒÂ¢Ã¢€šÂ¬Ã¢‚¬œ/g, "\u2013")
    .replace(/ÃƒÂ¢Ã¢€šÂ¬Ã¢‚¬/g, "\u2014")
    .replace(/ÃƒÂ¢Ã¢€šÂ¬Ã‚Â¦/g, "\u2026")
    .replace(/ÃƒÂ¢Ã¢€šÂ¬Ã…“/g, "\u201c")
    .replace(/ÃƒÂ¢Ã¢€šÂ¬Ã‚Â/g, "\u201d")
    .replace(/Ã¢â‚¬â„¢/g, "\u2019")
    .replace(/Ã¢â‚¬â€œ/g, "\u2013")
    .replace(/Ã¢â‚¬â€/g, "\u2014")
    .replace(/Ã¢â‚¬Â¦/g, "\u2026")
    .replace(/Ã¢â‚¬Å“/g, "\u201c")
    .replace(/Ã¢â‚¬Â/g, "\u201d")
    .replace(/Explorer imbibes.78/g, "Explorer imbibes.")
    .replace(/does not79/g, "does not")
    .replace(/litanies80/g, "litanies")
    .replace(/1 minute.87/g, "1 minute.")
    .trim();
}

function buildSkillReferenceDescription(definition) {
  const reference = SKILL_REFERENCE_DATA[definition.baseId ?? definition.id];
  if (!reference) return definition.description ?? "";

  const characteristicLabel = CHARACTERISTIC_LABELS[definition.characteristic] ?? reference.characteristic ?? "";
  const sections = [definition.name, characteristicLabel];

  const baseDescription = normalizeReferenceText(reference.description);
  if (baseDescription) sections.push(baseDescription);

  if (definition.groupName && reference.groupDescriptions) {
    const groupDescription = normalizeReferenceText(reference.groupDescriptions[slugifySkillPart(definition.groupName)]);
    if (groupDescription) sections.push(groupDescription);
  }

  return sections.filter(Boolean).join("\n\n");
}

function buildSkillRegistry() {
  const expanded = [];
  for (const definition of BASE_SKILL_DEFINITIONS) {
    expanded.push(definition);
    if (definition.groupKey) expanded.push(...expandGroupedSkill(definition));
  }

  return expanded.reduce((registry, definition) => {
    registry[definition.id] = Object.freeze({
      ...definition,
      fullName: definition.fullName ?? definition.name,
      description: buildSkillReferenceDescription(definition)
    });
    return registry;
  }, {});
}

export const ROGUE_TRADER_SKILLS = Object.freeze(buildSkillRegistry());

export function getRogueTraderSkillDefinition(skillId) {
  return ROGUE_TRADER_SKILLS[skillId] ?? null;
}

export function listRogueTraderSkills() {
  return Object.values(ROGUE_TRADER_SKILLS);
}

export function buildSkillItemData(skillId, overrides = {}) {
  const definition = getRogueTraderSkillDefinition(skillId);
  if (!definition) return null;

  return {
    name: overrides.name ?? definition.fullName,
    type: "skill",
    system: {
      characteristic: overrides.characteristic ?? definition.characteristic,
      basic: overrides.basic ?? definition.basic,
      trained: overrides.trained ?? false,
      advance10: overrides.advance10 ?? false,
      advance20: overrides.advance20 ?? false,
      bonus: overrides.bonus ?? 0,
      specialization: overrides.specialization ?? definition.specialization ?? "",
      description: overrides.description ?? definition.description ?? ""
    }
  };
}

export class RogueTraderSkillSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderSkillSheet, {
      types: ["skill"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "skill"],
    position: {
      width: 540,
      height: 560
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
      template: "systems/roguetrader/templates/items/skill.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.characteristics = CHARACTERISTIC_LABELS;
    context.skillGroups = SKILL_GROUPS;
    context.skillRegistry = ROGUE_TRADER_SKILLS;

    return context;
  }
}
