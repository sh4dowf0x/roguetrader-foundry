import { promptAttackTest, promptCharacteristicTest, promptFocusPowerTest, promptSkillTest } from "./rolls.js";
import { RogueTraderAdvancementWindow } from "./advancement-window.js";
import {
  getCareerAdvancementDefinition,
  getAlternateRankDefinition,
  ROGUE_TRADER_BASE_XP,
  getRogueTraderEarnedXp,
  getRogueTraderRankForXp,
  getRogueTraderSpentXp,
  getRogueTraderTotalXp,
  getRogueTraderUnspentXp,
  listAlternateRankDefinitions
} from "./advancements.js";
import { buildSkillItemData, getRogueTraderSkillDefinition, listRogueTraderSkills } from "./skill.js";
import { buildTalentItemData, getRogueTraderTalentDefinition, listRogueTraderTalents } from "./talent.js";
import { getReferenceTableDefinition, listXenosRaces } from "./reference-tables.js";

const DEFAULT_SKILLS = [
  { name: "Acrobatics", characteristic: "agility", short: "Ag", basic: true },
  { name: "Awareness", characteristic: "perception", short: "Per", basic: true },
  { name: "Barter", characteristic: "fellowship", short: "Fel", basic: true },
  { name: "Blather", characteristic: "fellowship", short: "Fel", basic: true },
  { name: "Carouse", characteristic: "toughness", short: "T", basic: true },
  { name: "Charm", characteristic: "fellowship", short: "Fel", basic: true },
  { name: "Chem-Use", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Ciphers", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Climb", characteristic: "strength", short: "S", basic: true },
  { name: "Command", characteristic: "fellowship", short: "Fel", basic: false },
  { name: "Commerce", characteristic: "fellowship", short: "Fel", basic: true },
  { name: "Concealment", characteristic: "agility", short: "Ag", basic: true },
  { name: "Contortionist", characteristic: "agility", short: "Ag", basic: false },
  { name: "Deceive", characteristic: "fellowship", short: "Fel", basic: true },
  { name: "Demolition", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Disguise", characteristic: "fellowship", short: "Fel", basic: false },
  { name: "Dodge", characteristic: "agility", short: "Ag", basic: true },
  { name: "Evaluate", characteristic: "intelligence", short: "Int", basic: true },
  { name: "Gamble", characteristic: "intelligence", short: "Int", basic: true },
  { name: "Inquiry", characteristic: "fellowship", short: "Fel", basic: true },
  { name: "Interrogation", characteristic: "willpower", short: "WP", basic: false },
  { name: "Intimidate", characteristic: "strength", short: "S", basic: true },
  { name: "Invocation", characteristic: "willpower", short: "WP", basic: false },
  { name: "Lip Reading", characteristic: "perception", short: "Per", basic: false },
  { name: "Literacy", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Logic", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Medicae", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Psyniscience", characteristic: "perception", short: "Per", basic: false },
  { name: "Scrutiny", characteristic: "perception", short: "Per", basic: true },
  { name: "Search", characteristic: "perception", short: "Per", basic: true },
  { name: "Security", characteristic: "agility", short: "Ag", basic: false },
  { name: "Shadowing", characteristic: "agility", short: "Ag", basic: true },
  { name: "Silent Move", characteristic: "agility", short: "Ag", basic: true },
  { name: "Sleight of Hand", characteristic: "agility", short: "Ag", basic: false },
  { name: "Survival", characteristic: "intelligence", short: "Int", basic: true },
  { name: "Swim", characteristic: "strength", short: "S", basic: true },
  { name: "Tech-Use", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Tracking", characteristic: "intelligence", short: "Int", basic: false },
  { name: "Wrangling", characteristic: "intelligence", short: "Int", basic: false }
];

const CHARACTERISTIC_DEFINITIONS = [
  { key: "weaponSkill", label: "Weapon Skill", short: "WS", hasBonusCell: false },
  { key: "ballisticSkill", label: "Ballistic Skill", short: "BS", hasBonusCell: false },
  { key: "strength", label: "Strength", short: "S", hasBonusCell: true },
  { key: "toughness", label: "Toughness", short: "T", hasBonusCell: true },
  { key: "agility", label: "Agility", short: "Ag", hasBonusCell: true },
  { key: "intelligence", label: "Intelligence", short: "Int", hasBonusCell: true },
  { key: "perception", label: "Perception", short: "Per", hasBonusCell: true },
  { key: "willpower", label: "Will Power", short: "WP", hasBonusCell: true },
  { key: "fellowship", label: "Fellowship", short: "Fel", hasBonusCell: true }
];

const CARRYING_CAPACITY_TABLE = {
  0: { carry: "0.9 kg", lift: "2.25 kg", push: "4.5 kg" },
  1: { carry: "2.25 kg", lift: "4.5 kg", push: "9 kg" },
  2: { carry: "4.5 kg", lift: "9 kg", push: "18 kg" },
  3: { carry: "9 kg", lift: "18 kg", push: "36 kg" },
  4: { carry: "18 kg", lift: "36 kg", push: "72 kg" },
  5: { carry: "27 kg", lift: "54 kg", push: "108 kg" },
  6: { carry: "36 kg", lift: "72 kg", push: "144 kg" },
  7: { carry: "45 kg", lift: "90 kg", push: "180 kg" },
  8: { carry: "56 kg", lift: "112 kg", push: "225 kg" },
  9: { carry: "67 kg", lift: "135 kg", push: "270 kg" },
  10: { carry: "78 kg", lift: "157 kg", push: "315 kg" },
  11: { carry: "90 kg", lift: "180 kg", push: "360 kg" },
  12: { carry: "112 kg", lift: "225 kg", push: "450 kg" },
  13: { carry: "225 kg", lift: "450 kg", push: "900 kg" },
  14: { carry: "337 kg", lift: "675 kg", push: "1,350 kg" },
  15: { carry: "450 kg", lift: "900 kg", push: "1,800 kg" },
  16: { carry: "675 kg", lift: "1,350 kg", push: "2,700 kg" },
  17: { carry: "900 kg", lift: "1,800 kg", push: "3,600 kg" },
  18: { carry: "1,350 kg", lift: "2,700 kg", push: "5,400 kg" },
  19: { carry: "1,800 kg", lift: "3,600 kg", push: "7,200 kg" },
  20: { carry: "2,250 kg", lift: "4,500 kg", push: "9,000 kg" }
};

const INVENTORY_ITEM_TYPES = new Set(["weapon", "armor", "gear", "consumable", "tool", "cybernetic"]);

const ARMOR_LOCATION_DEFINITIONS = [
  { key: "head", label: "Head", roll: "01-10", sourceKey: "head" },
  { key: "rightArm", label: "Right Arm", roll: "11-20", sourceKey: "arms" },
  { key: "leftArm", label: "Left Arm", roll: "21-30", sourceKey: "arms" },
  { key: "body", label: "Body", roll: "31-70", sourceKey: "body" },
  { key: "rightLeg", label: "Right Leg", roll: "71-85", sourceKey: "legs" },
  { key: "leftLeg", label: "Left Leg", roll: "86-100", sourceKey: "legs" }
];

const WEAPON_CLASS_LABELS = {
  basic: "Basic",
  melee: "Melee",
  pistol: "Pistol",
  thrown: "Thrown",
  heavy: "Heavy"
};

const WEAPON_SPECIAL_RULE_LABELS = {
  accurate: "Accurate",
  balanced: "Balanced",
  blast: "Blast",
  customized: "Customized",
  defensive: "Defensive",
  felling: "Felling",
  flame: "Flame",
  flexible: "Flexible",
  force: "Force",
  haywire: "Haywire",
  inaccurate: "Inaccurate",
  overheats: "Overheats",
  powerField: "Power Field",
  primitive: "Primitive",
  recharge: "Recharge",
  reliable: "Reliable",
  sanctified: "Sanctified",
  scatter: "Scatter",
  shocking: "Shocking",
  smoke: "Smoke",
  snare: "Snare",
  storm: "Storm",
  tearing: "Tearing",
  toxic: "Toxic",
  twinLinked: "Twin-linked",
  unbalanced: "Unbalanced",
  unreliable: "Unreliable",
  unstable: "Unstable",
  unwieldy: "Unwieldy"
};

const MUTATION_NAMES = new Set(
  (getReferenceTableDefinition("mutations")?.entries ?? []).map((entry) => entry.name)
);

const NAVIGATOR_POWER_MASTERY_VALUES = {
  "n/a": 1,
  novice: 1,
  adept10: 2,
  master20: 3
};

const CAREER_NAME_TO_KEY = {
  "rogue trader": "rogueTrader",
  "arch-militant": "archMilitant",
  "arch militant": "archMilitant",
  "astropath transcendent": "astropathTranscendent",
  explorator: "explorator",
  missionary: "missionary",
  navigator: "navigator",
  seneschal: "seneschal",
  "void-master": "voidMaster",
  "void master": "voidMaster"
};

const CHARACTERISTIC_ADVANCE_STAGES = ["simple", "intermediate", "trained", "expert"];

export class RogueTraderCharacterSheet extends ActorSheet {
  static register() {
    Actors.registerSheet("roguetrader", RogueTraderCharacterSheet, {
      types: ["character"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "actor", "character"],
      width: 1120,
      height: 900,
      template: "systems/roguetrader/templates/actors/character-sheet.hbs",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "page-one" }],
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  async _render(force, options) {
    await this._ensureDefaultSkills();
    return super._render(force, options);
  }

  getData(options = {}) {
    const context = super.getData(options);
    const totalXp = getRogueTraderTotalXp(this.actor.system);
    const earnedXp = getRogueTraderEarnedXp(this.actor.system);
    const spentXp = getRogueTraderSpentXp(this.actor.system);
    const unspentXp = getRogueTraderUnspentXp(this.actor.system);
    const currentRank = getRogueTraderRankForXp(spentXp);
    const careerKey = this._getSelectedCareerKey();
    const skills = this.actor.items
      .filter((item) => item.type === "skill")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => {
        const definition = DEFAULT_SKILLS.find((skill) => skill.name === item.name);

        return {
          id: item.id,
          name: item.name,
          displayName: `${item.name} (${definition?.short ?? this._getCharacteristicShort(item.system.characteristic)})`,
          basic: Boolean(item.system.basic),
          trained: Boolean(item.system.trained),
          advance10: Boolean(item.system.advance10),
          advance20: Boolean(item.system.advance20),
          bonus: Number(item.system.bonus ?? 0)
        };
      });
    const talents = this.actor.items
      .filter((item) => item.type === "talent")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        displayName: item.system.rating ? `${item.name} (${item.system.rating})` : item.name,
        category: item.system.category || "talent",
        benefit: item.system.benefit || ""
      }));
    const mutations = this.actor.items
      .filter((item) => item.type === "mutation" || (item.type === "talent" && MUTATION_NAMES.has(item.name)))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildConsequenceEntry(item));
    const malignancies = this.actor.items
      .filter((item) => item.type === "malignancy")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildConsequenceEntry(item));
    const mentalDisorders = this.actor.items
      .filter((item) => item.type === "mentalDisorder")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildConsequenceEntry(item));
    const criticalInjuries = this.actor.items
      .filter((item) => item.type === "criticalInjury")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildConsequenceEntry(item));
    const psychicTechniques = this.actor.items
      .filter((item) => item.type === "psychicTechnique")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        focusTime: item.system.focusTime || "",
        sustain: item.system.sustain || "",
        range: item.system.range || "",
        focusPowerTest: item.system.focusPowerTest || ""
      }));
    const navigatorPowers = this.actor.items
      .filter((item) => item.type === "navigatorPower")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => ({
        id: item.id,
        img: item.img || "icons/svg/eye.svg",
        name: item.name,
        mastery: item.system.mastery || "n/a",
        benefit: item.system.benefit || ""
      }));
    const navigatorTalent = this.actor.items.find((item) => item.type === "talent" && item.name === "Navigator");
    const psychicTechniqueLimit = this._getPsychicTechniqueLimit(careerKey, psychicTechniques);
    const navigatorPowerLimit = this._getNavigatorPowerLimit(navigatorTalent, navigatorPowers);
    const inventoryItems = this.actor.items
      .filter((item) => INVENTORY_ITEM_TYPES.has(item.type))
      .sort((left, right) => left.name.localeCompare(right.name));
    const gearInventoryItems = inventoryItems.filter((item) => item.type !== "cybernetic");
    const cyberneticItems = inventoryItems.filter((item) => item.type === "cybernetic");
    const equippedArmor = inventoryItems.filter((item) => item.type === "armor" && item.system.equipped);
    const equippedWeapons = this.actor.getEquippedWeaponsInHandOrder?.()
      ?? inventoryItems.filter((item) => item.type === "weapon" && item.system.equipped);
    const characteristicModifierTotals = this.actor.getCharacteristicItemModifierTotals?.() ?? {};
    const woundsItemModifier = this.actor.getWoundsItemModifier?.() ?? 0;
    const baseWoundsMax = Number(this.actor.system.resources?.wounds?.max ?? 0);
    const effectiveWoundsMax = this.actor.getEffectiveWoundsMax?.() ?? baseWoundsMax;
    const agilityBonus = this.actor.getMovementAgilityBonus?.()
      ?? this._calculateCharacteristicBonus("agility");
    const strengthBonus = this._calculateCharacteristicBonus("strength");
    const toughnessBonus = this._calculateCharacteristicBonus("toughness");
    const carryingIndex = Math.min(20, Math.max(0, strengthBonus + toughnessBonus));
    const carryingCapacity = CARRYING_CAPACITY_TABLE[carryingIndex] ?? CARRYING_CAPACITY_TABLE[0];
    const carriedWeight = inventoryItems.reduce((total, item) => total + this._getEffectiveCarriedWeight(item), 0);
    const carryCapacityKg = this._parseWeightKilograms(carryingCapacity.carry);
    const encumbrancePercent = carryCapacityKg > 0
      ? Math.min(100, Math.max(0, (carriedWeight / carryCapacityKg) * 100))
      : 0;

    context.actor = this.actor;
    context.system = this.actor.system;
    context.derived = {
      rank: currentRank,
      totalXp,
      spentXp,
      unspentXp
    };
    context.characteristics = CHARACTERISTIC_DEFINITIONS.map((definition) => ({
      key: definition.key,
      label: definition.label,
      short: definition.short,
      hasBonusCell: definition.hasBonusCell,
      baseValue: Number(this.actor.system.characteristics?.[definition.key]?.value ?? 0),
      manualTempModifier: Number(this.actor.system.characteristics?.[definition.key]?.tempModifier ?? 0),
      itemTempModifier: Number(characteristicModifierTotals?.[definition.key] ?? 0),
      tempModifier: this.actor.getCharacteristicTotalModifier?.(definition.key) ?? 0,
      value: this.actor.getCharacteristicValue?.(definition.key) ?? Number(this.actor.system.characteristics?.[definition.key]?.value ?? 0),
      bonus: this._calculateDisplayedCharacteristicBonus(definition.key),
      tempStateClass: this._getCharacteristicTempStateClass(definition.key),
      tempTitle: this._getCharacteristicTempTitle(definition.key, characteristicModifierTotals)
    }));
    context.skillColumns = this._buildSkillColumns(skills);
    context.talents = talents;
    context.psychicTechniques = psychicTechniques;
    context.psychicTechniqueLimit = psychicTechniqueLimit;
    context.navigatorPowers = navigatorPowers;
    context.navigatorPowerLimit = navigatorPowerLimit;
    context.hasNavigatorPowers = navigatorPowers.length > 0 || navigatorPowerLimit.max > 0;
    context.advancementPage = {
      locked: this._areStartingCharacteristicsLocked(),
      ...this._buildAdvancementPageData(careerKey, currentRank, totalXp, earnedXp, spentXp, unspentXp)
    };
    context.pageTwo = {
      corruption: this._buildCorruptionTrackData(),
      insanity: this._buildInsanityTrackData(),
      wounds: {
        baseMax: baseWoundsMax,
        itemModifier: woundsItemModifier,
        effectiveMax: effectiveWoundsMax,
        tempStateClass: this._getWoundsTempStateClass(woundsItemModifier),
        tempTitle: this._getWoundsTempTitle(baseWoundsMax, woundsItemModifier, effectiveWoundsMax)
      },
      movement: {
        agilityBonus,
        strengthBonus,
        halfMove: agilityBonus,
        fullMove: agilityBonus * 2,
        charge: agilityBonus * 3,
        run: agilityBonus * 6,
        baseLeap: `${strengthBonus} m`,
        baseJump: `${strengthBonus * 20} cm`
      },
      carrying: {
        index: carryingIndex,
        carry: carryingCapacity.carry,
        lift: carryingCapacity.lift,
        push: carryingCapacity.push
      },
      armor: {
        locations: this._buildArmorLocationSummary(equippedArmor),
        equipped: equippedArmor.map((item) => ({
          id: item.id,
          name: item.name,
          coverage: this._describeArmorCoverage(item)
        })),
        hasEquippedArmor: equippedArmor.length > 0
      },
      weapons: {
        equipped: equippedWeapons.map((item, index) => this._buildEquippedWeaponSummary(item, index)),
        hasEquippedWeapons: equippedWeapons.length > 0
      },
      inventory: {
        encumbrance: {
          current: carriedWeight,
          currentLabel: this._formatWeight(carriedWeight),
          max: carryCapacityKg,
          maxLabel: carryingCapacity.carry,
          summaryLabel: `${this._formatWeight(carriedWeight)}/${carryingCapacity.carry}`,
          percent: Math.round(encumbrancePercent)
        },
        items: gearInventoryItems.map((item) => ({
          id: item.id,
          name: item.name,
          img: item.img,
          type: item.type,
          typeLabel: this._getItemTypeLabel(item.type),
          weight: this._formatWeight(this._getEffectiveCarriedWeight(item)),
          shortDescription: this._getItemShortDescription(item),
          equipped: Boolean(item.system.equipped)
        })),
        hasItems: gearInventoryItems.length > 0
      },
      cybernetics: {
        items: cyberneticItems.map((item) => ({
          id: item.id,
          name: item.name,
          img: item.img,
          type: item.type,
          typeLabel: this._getItemTypeLabel(item.type),
          weight: this._formatWeight(this._getEffectiveCarriedWeight(item)),
          shortDescription: this._getItemShortDescription(item)
        })),
        hasItems: cyberneticItems.length > 0
      },
      malignancies: {
        entries: malignancies,
        hasEntries: malignancies.length > 0
      },
      mentalDisorders: {
        entries: mentalDisorders,
        hasEntries: mentalDisorders.length > 0
      },
      criticalInjuries: {
        entries: criticalInjuries,
        hasEntries: criticalInjuries.length > 0
      },
      mutations: {
        entries: mutations,
        hasEntries: mutations.length > 0
      }
    };

    return context;
  }

  _buildInsanityTrackData() {
    const points = Math.max(0, Number(this.actor.system.insanity?.points ?? 0) || 0);

    if (points >= 100) {
      return {
        points,
        degree: "Terminally Insane",
        traumaModifier: "retires from play",
        summaryLabel: "Terminally Insane, trauma retires from play"
      };
    }

    if (points >= 80) {
      return {
        points,
        degree: "Deranged",
        traumaModifier: "-20",
        summaryLabel: "Deranged, trauma -20"
      };
    }

    if (points >= 60) {
      return {
        points,
        degree: "Unhinged",
        traumaModifier: "-10",
        summaryLabel: "Unhinged, trauma -10"
      };
    }

    if (points >= 40) {
      return {
        points,
        degree: "Disturbed",
        traumaModifier: "+0",
        summaryLabel: "Disturbed, trauma +0"
      };
    }

    if (points >= 10) {
      return {
        points,
        degree: "Unsettled",
        traumaModifier: "+10",
        summaryLabel: "Unsettled, trauma +10"
      };
    }

    return {
      points,
      degree: "Stable",
      traumaModifier: "n/a",
      summaryLabel: "Stable, trauma n/a"
    };
  }

  _buildCorruptionTrackData() {
    const points = Math.max(0, Number(this.actor.system.corruption?.points ?? 0) || 0);

    if (points >= 100) {
      return {
        points,
        degree: "Damned",
        malignancyModifier: "removed from play",
        mutationStage: "n/a",
        summaryLabel: "Damned, removed from play"
      };
    }

    if (points >= 91) {
      return {
        points,
        degree: "Profane",
        malignancyModifier: "-30",
        mutationStage: "Third Test",
        summaryLabel: "Profane, malignancy -30, mutation Third Test"
      };
    }

    if (points >= 61) {
      return {
        points,
        degree: "Debased",
        malignancyModifier: "-20",
        mutationStage: "Second Test",
        summaryLabel: "Debased, malignancy -20, mutation Second Test"
      };
    }

    if (points >= 31) {
      return {
        points,
        degree: "Soiled",
        malignancyModifier: "-10",
        mutationStage: "First Test",
        summaryLabel: "Soiled, malignancy -10, mutation First Test"
      };
    }

    return {
      points,
      degree: "Tainted",
      malignancyModifier: "+0",
      mutationStage: "None",
      summaryLabel: "Tainted, malignancy +0, mutation None"
    };
  }

  _getPsychicTechniqueLimit(careerKey, psychicTechniques) {
    const current = psychicTechniques.length;
    let max = current;

    if (careerKey === "astropathTranscendent") {
      max = Math.max(3, current);
    }

    return { current, max };
  }

  _getNavigatorTalentRating(navigatorTalent) {
    if (!navigatorTalent) return 0;

    const rawRating = String(navigatorTalent.system?.rating ?? "").trim();
    const parsedRating = Number.parseInt(rawRating, 10);
    if (Number.isFinite(parsedRating) && parsedRating > 0) return parsedRating;

    return 1;
  }

  _getNavigatorPowerLimit(navigatorTalent, navigatorPowers) {
    const current = navigatorPowers.reduce((total, power) => {
      const mastery = String(power.mastery ?? "n/a");
      return total + Number(NAVIGATOR_POWER_MASTERY_VALUES[mastery] ?? 1);
    }, 0);

    const navigatorRating = this._getNavigatorTalentRating(navigatorTalent);
    const max = Math.max(current, navigatorRating > 0 ? navigatorRating + 1 : 0);

    return { current, max };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".skill-name-button, .talent-name-button, .psychic-technique-name-button, .navigator-power-name-button, .inventory-item-name-button, .consequence-name-button").attr("draggable", true);
    html.find(".skill-name-button").on("click", this._onItemOpen.bind(this));
    html.find(".talent-name-button").on("click", this._onItemOpen.bind(this));
    html.find(".talent-name-button").on("contextmenu", this._onTalentContextRemove.bind(this));
    html.find(".psychic-technique-name-button").on("click", this._onItemOpen.bind(this));
    html.find(".navigator-power-name-button").on("click", this._onItemOpen.bind(this));
    html.find(".navigator-power-name-button").on("contextmenu", this._onNavigatorPowerContextRemove.bind(this));
    html.find(".inventory-item-name-button").on("click", this._onItemOpen.bind(this));
    html.find(".skill-name-button, .talent-name-button, .psychic-technique-name-button, .navigator-power-name-button, .inventory-item-name-button, .consequence-name-button").on("dragstart", this._onItemDragStart.bind(this));
    html.find(".characteristic-roll-button").on("click", this._onCharacteristicRoll.bind(this));
    html.find(".skill-roll-button").on("click", this._onSkillRoll.bind(this));
    html.find(".psychic-technique-roll-button").on("click", this._onPsychicTechniqueRoll.bind(this));
    html.find(".weapon-attack-button").on("click", this._onWeaponAttack.bind(this));
    html.find(".navigator-power-attack-button").on("click", this._onNavigatorPowerAttack.bind(this));
    html.find(".weapon-brace-button").on("click", this._onToggleBraced.bind(this));
    html.find(".weapon-clear-jam-button").on("click", this._onClearJammedWeapon.bind(this));
    html.find(".spend-fate-heal-button").on("click", this._onSpendFateToHeal.bind(this));
    html.find(".skill-field").on("change", this._onSkillFieldChange.bind(this));
    html.find(".item-toggle-equipped").on("click", this._onToggleEquipped.bind(this));
    html.find(".item-delete-button").on("click", this._onDeleteItem.bind(this));
    html.find(".open-advancement-window-button").on("click", this._onOpenAdvancementWindow.bind(this));
    html.find(".add-xp-log-button").on("click", this._onAddXpLogEntry.bind(this));
    html.find(".add-custom-purchase-button").on("click", this._onAddCustomPurchase.bind(this));
    html.find(".alternate-rank-setting").on("change", this._onAlternateRankSettingChange.bind(this));
    html.find(".advancement-purchase-button").on("click", this._onPurchaseAdvance.bind(this));
    html.find(".characteristic-advance-purchase-button").on("click", this._onPurchaseCharacteristicAdvance.bind(this));
    html.find(".advancement-entry-info-button").on("click", this._onShowAdvanceDetails.bind(this));
    html.find(".add-corruption-button").on("click", this._onAddTrackPoints.bind(this));
    html.find(".add-insanity-button").on("click", this._onAddTrackPoints.bind(this));
    html.find(".consequence-drop-zone").on("dragenter dragover", this._onConsequenceDragOver.bind(this));
    html.find(".consequence-drop-zone").on("dragleave", this._onConsequenceDragLeave.bind(this));
    html.find(".consequence-drop-zone").on("drop", this._onConsequenceDrop.bind(this));
  }

  async _onDrop(event) {
    const handled = await this._maybeHandleConsequenceDrop(event);
    if (handled) return;
    return super._onDrop(event);
  }

  _areStartingCharacteristicsLocked() {
    return Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
  }

  _getSelectedCareerKey() {
    const selectedCareer = String(this.actor.system.advancement?.career?.selected ?? "").trim();
    if (selectedCareer) return selectedCareer;

    const identityCareer = String(this.actor.system.identity?.careerPath ?? "").trim().toLowerCase();
    return CAREER_NAME_TO_KEY[identityCareer] ?? "";
  }

  async _onAlternateRankSettingChange(event) {
    const target = event.currentTarget;
    const field = String(target.dataset.field ?? "").trim();
    if (!field) return;

    let value;
    if (target.type === "checkbox") {
      value = Boolean(target.checked);
    } else if (field === "replacesRank") {
      value = Math.max(1, Math.min(8, Number(target.value ?? 1) || 1));
    } else {
      value = String(target.value ?? "").trim();
    }

    await this.actor.update({
      [`system.advancement.alternateRank.${field}`]: value
    });
  }

  _buildAdvancementPageData(careerKey, currentRank, totalXp, earnedXp, spentXp, unspentXp) {
    const careerDefinition = getCareerAdvancementDefinition(careerKey);
    const rankSections = [];
    const xpLog = Array.isArray(this.actor.system.advancement?.xpLog) ? this.actor.system.advancement.xpLog : [];
    const customPurchases = Array.isArray(this.actor.system.advancement?.customPurchases)
      ? this.actor.system.advancement.customPurchases
      : [];
    const alternateRankConfig = this._getAlternateRankConfig();
    const selectedAlternateRank = alternateRankConfig.enabled
      ? getAlternateRankDefinition(alternateRankConfig.selected)
      : null;

    if (careerDefinition) {
      for (let rank = 1; rank <= currentRank; rank += 1) {
        const isAlternateRank = Boolean(selectedAlternateRank && alternateRankConfig.replacesRank === rank);
        const entries = isAlternateRank
          ? (selectedAlternateRank?.entries ?? [])
          : (careerDefinition.rankAdvances?.[rank] ?? []);
        if (!entries.length) continue;

        rankSections.push({
          rank,
          title: isAlternateRank ? `Rank ${rank} ${selectedAlternateRank.name} Advances` : `Rank ${rank} ${careerDefinition.name} Advances`,
          isAlternateRank,
          alternateRankName: isAlternateRank ? selectedAlternateRank.name : "",
          entries: entries.map((entry, index) => this._buildRankAdvanceEntry(careerKey, rank, index, {
            ...entry,
            source: isAlternateRank
              ? {
                type: "alternateRank",
                alternateRankKey: selectedAlternateRank.key,
                replacesRank: rank
              }
              : {
                type: "careerRank"
              }
          }, unspentXp))
        });
      }
    }

    return {
      careerKey,
      careerName: careerDefinition?.name ?? this.actor.system.identity?.careerPath ?? "No Career Selected",
      rank: currentRank,
      totalXp,
      earnedXp,
      spentXp,
      unspentXp,
      xpLogEntries: xpLog.map((entry, index) => ({
        id: entry.id ?? `xp-log-${index}`,
        amount: Number(entry.amount ?? 0),
        amountLabel: `${Number(entry.amount ?? 0) >= 0 ? "+" : ""}${Number(entry.amount ?? 0)} xp`,
        note: entry.note ?? "",
        awardedOn: entry.awardedOn ?? "",
        type: String(entry.type ?? "award").trim().toLowerCase() === "spend" ? "spend" : "award",
        typeLabel: String(entry.type ?? "award").trim().toLowerCase() === "spend" ? "Spent" : "Awarded"
      })).reverse(),
      hasXpLogEntries: xpLog.length > 0,
      customPurchases: customPurchases.map((entry, index) => ({
        id: entry.id ?? `custom-purchase-${index}`,
        name: entry.name ?? "",
        cost: Number(entry.cost ?? 0),
        type: String(entry.type ?? "miscellaneous").trim().toLowerCase(),
        typeLabel: this._formatCustomPurchaseType(entry.type),
        purchasedOn: entry.purchasedOn ?? "",
        note: entry.note ?? ""
      })).reverse(),
      hasCustomPurchases: customPurchases.length > 0,
      characteristicAdvances: (careerDefinition?.characteristicAdvances ?? []).map((entry) =>
        this._buildCharacteristicAdvanceEntry(careerKey, entry, unspentXp)
      ),
      alternateRank: {
        enabled: alternateRankConfig.enabled,
        selected: alternateRankConfig.selected,
        replacesRank: alternateRankConfig.replacesRank,
        options: listAlternateRankDefinitions().map((definition) => ({
          key: definition.key,
          label: definition.name,
          selected: alternateRankConfig.selected === definition.key
        })),
        rankOptions: Array.from({ length: 8 }, (_, index) => {
          const rank = index + 1;
          return {
            value: rank,
            label: `Rank ${rank}`,
            selected: alternateRankConfig.replacesRank === rank
          };
        }),
        hasOptions: listAlternateRankDefinitions().length > 0
      },
      rankSections,
      hasAdvancementData: Boolean(careerDefinition)
    };
  }

  _buildCharacteristicAdvanceEntry(careerKey, entry, unspentXp) {
    const characteristicKey = this._getCharacteristicKeyFromLabel(entry.characteristic);
    const purchasedCount = characteristicKey ? this._getCharacteristicAdvanceCount(careerKey, characteristicKey) : 0;
    const costs = CHARACTERISTIC_ADVANCE_STAGES.map((stageKey) => ({
      label: this._formatCharacteristicAdvanceStage(stageKey),
      stageKey,
      value: entry.costs[stageKey],
      purchased: CHARACTERISTIC_ADVANCE_STAGES.indexOf(stageKey) < purchasedCount
    }));
    const nextStageKey = CHARACTERISTIC_ADVANCE_STAGES[purchasedCount] ?? null;
    const nextCost = nextStageKey ? entry.costs[nextStageKey] : null;
    const canPurchase = Boolean(characteristicKey && nextStageKey && unspentXp >= Number(nextCost ?? 0));

    return {
      ...entry,
      characteristicKey,
      costs,
      nextStageKey,
      nextStageLabel: nextStageKey ? this._formatCharacteristicAdvanceStage(nextStageKey) : "Complete",
      nextCost,
      canPurchase,
      isComplete: !nextStageKey,
      isPurchased: purchasedCount > 0
    };
  }

  _buildRankAdvanceEntry(careerKey, rank, index, entry, unspentXp) {
    const purchaseKey = this._buildRankAdvancePurchaseKey(careerKey, rank, index, entry);
    const purchasedCount = this._getPurchasedAdvanceCount(purchaseKey);
    const maxPurchases = this._getAdvanceMaxPurchases(entry);
    const purchaseMode = this._getAdvancePurchaseMode(entry);
    const isSupported = Boolean(purchaseMode);
    const isAlreadyApplied = this._isAdvanceAlreadyApplied(entry);
    const remainingPurchases = Math.max(0, maxPurchases - purchasedCount);
    const canPurchase = isSupported
      && remainingPurchases > 0
      && !(!entry.repeatable && isAlreadyApplied)
      && unspentXp >= Number(entry.cost ?? 0);

    return {
      ...entry,
      purchaseKey,
      purchasedCount,
      maxPurchases,
      isSupported,
      isAlreadyApplied,
      canPurchase,
      isSoldOut: remainingPurchases <= 0 || (!entry.repeatable && isAlreadyApplied),
      isPurchased: purchasedCount > 0 || isAlreadyApplied,
      purchaseMode,
      isChoicePurchase: purchaseMode === "choice",
      purchaseLabel: purchaseMode === "choice" ? "Choose" : "Buy",
      typeLabel: this._formatAdvanceType(entry.type),
      repeatableLabel: entry.repeatable ? `Repeatable (${remainingPurchases} left)` : ""
    };
  }

  _formatCharacteristicAdvanceStage(stageKey) {
    switch (stageKey) {
      case "simple":
        return "Simple";
      case "intermediate":
        return "Intermediate";
      case "trained":
        return "Trained";
      case "expert":
        return "Expert";
      default:
        return stageKey;
    }
  }

  _getCharacteristicKeyFromLabel(label) {
    const normalizedLabel = String(label ?? "").trim().toLowerCase().replace(/\s+/g, "");
    const definition = CHARACTERISTIC_DEFINITIONS.find((entry) =>
      String(entry.label ?? "").trim().toLowerCase().replace(/\s+/g, "") === normalizedLabel
    );
    return definition?.key ?? null;
  }

  _getCharacteristicAdvanceCount(careerKey, characteristicKey) {
    return Number(this.actor.system.advancement?.purchasedCharacteristicAdvances?.[careerKey]?.[characteristicKey] ?? 0);
  }

  _buildRankAdvancePurchaseKey(careerKey, rank, index, entry) {
    const source = entry?.source ?? {};
    if (source.type === "alternateRank" && source.alternateRankKey) {
      return `${careerKey}-alt-${source.alternateRankKey}-r${Number(source.replacesRank ?? rank)}-${index}-${this._slugifyAdvanceValue(entry.name)}`;
    }
    return `${careerKey}-r${rank}-${index}-${this._slugifyAdvanceValue(entry.name)}`;
  }

  _getAlternateRankConfig() {
    const advancement = this.actor.system.advancement ?? {};
    const alternateRank = advancement.alternateRank ?? {};
    const selected = String(alternateRank.selected ?? "").trim();
    const replacesRank = Math.max(1, Math.min(8, Number(alternateRank.replacesRank ?? 1) || 1));

    return {
      enabled: Boolean(alternateRank.enabled && selected),
      selected,
      replacesRank
    };
  }

  _slugifyAdvanceValue(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  _getPurchasedAdvanceCount(purchaseKey) {
    return Number(this.actor.system.advancement?.purchasedAdvances?.[purchaseKey] ?? 0);
  }

  _getAdvanceMaxPurchases(entry) {
    const match = String(entry.name ?? "").match(/\(x(\d+)\)/i);
    if (match) return Number(match[1] ?? 1);
    return entry.repeatable ? 1 : 1;
  }

  _isAdvancePurchaseSupported(entry) {
    return Boolean(this._getAdvancePurchaseMode(entry));
  }

  _getAdvancePurchaseMode(entry) {
    const name = String(entry?.name ?? "").trim();
    if (!name) return null;
    if (this._getAdvanceChoiceConfig(entry)) return "choice";
    if (/choose one/i.test(name)) return this._getAdvanceChoiceConfig(entry) ? "choice" : null;
    if (entry?.type === "skill" || entry?.type === "talent" || entry?.type === "trait") return "direct";
    return null;
  }

  _getAdvanceChoiceConfig(entry) {
    const name = String(entry?.name ?? "").trim();
    if (/^performer\s*\(choose one\)$/i.test(name)) {
      return { kind: "skill", source: "canonicalSkillGroup", baseId: "performer", title: "Choose Performer Advance" };
    }
    if (/^talented\s*\(choose one\)$/i.test(name)) {
      return { kind: "talent", source: "canonicalTalentGroup", baseId: "talented", title: "Choose Talented Advance" };
    }
    if (/^peer\s*\(choose one\)$/i.test(name)) {
      return { kind: "talent", source: "canonicalTalentGroup", baseId: "peer", title: "Choose Peer Advance" };
    }
    if (/^heavy weapon training\s*\(choose one\)(?:\s*\(x\d+\))?$/i.test(name)) {
      return { kind: "talent", source: "canonicalTalentGroup", baseId: "heavy-weapon-training", title: "Choose Heavy Weapon Training" };
    }
    if (/^heightened senses\s*\(choose one\)$/i.test(name)) {
      return { kind: "talent", source: "canonicalTalentGroup", baseId: "heightened-senses", title: "Choose Heightened Senses" };
    }
    if (/^hatred\s*\(xenos race[—-]?\s*choose one\)$/i.test(name)) {
      return { kind: "talent", source: "xenosRaceHatred", baseId: "hatred", title: "Choose Hatred" };
    }
    if (/^psychic discipline$/i.test(name)) {
      return { kind: "talentItem", source: "psychicDisciplineCompendium", title: "Choose Psychic Discipline" };
    }
    if (/^navigator power$/i.test(name)) {
      return { kind: "navigatorPower", source: "navigatorPowerCompendium", title: "Choose Navigator Power" };
    }
    if (/^psychic technique(?:\s*\(x\d+\))?$/i.test(name)) {
      return { kind: "psychicTechnique", source: "psychicTechniqueCompendium", title: "Choose Psychic Technique" };
    }
    if (/^exotic weapon training\s*\(choose one\)$/i.test(name)) {
      return { kind: "talent", source: "exoticWeapon", baseId: "exotic-weapon-training", title: "Choose Exotic Weapon Training" };
    }
    return null;
  }

  _normalizeAdvanceLookupName(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\(\s*x\d+\s*\)/g, "")
      .replace(/[+'"]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  _resolveCanonicalSkillByName(name) {
    const normalizedName = this._normalizeAdvanceLookupName(name);
    return listRogueTraderSkills().find((skill) => {
      const fullName = this._normalizeAdvanceLookupName(skill.fullName ?? skill.name);
      const baseName = this._normalizeAdvanceLookupName(skill.name);
      return normalizedName === fullName || normalizedName === baseName;
    }) ?? null;
  }

  _resolveCanonicalTalentByName(name) {
    const normalizedName = this._normalizeAdvanceLookupName(name);
    return listRogueTraderTalents().find((talent) => {
      const fullName = this._normalizeAdvanceLookupName(talent.fullName ?? talent.name);
      const baseName = this._normalizeAdvanceLookupName(talent.name);
      return normalizedName === fullName || normalizedName === baseName;
    }) ?? null;
  }

  _parseAdvanceSkillStage(name) {
    const skillName = String(name ?? "").trim();
    if (/\+20\s*$/i.test(skillName)) {
      return {
        baseName: skillName.replace(/\s*\+20\s*$/i, "").trim(),
        stage: "advance20"
      };
    }

    if (/\+10\s*$/i.test(skillName)) {
      return {
        baseName: skillName.replace(/\s*\+10\s*$/i, "").trim(),
        stage: "advance10"
      };
    }

    return {
      baseName: skillName.replace(/\s*\((x\d+|choose one)\)\s*$/i, "").trim(),
      stage: "trained"
    };
  }

  _isAdvanceAlreadyApplied(entry) {
    if (entry.type === "skill") {
      return this._isSkillAdvanceAlreadyApplied(entry.name);
    }

    if (entry.type === "talent" || entry.type === "trait") {
      return this._isTalentAdvanceAlreadyApplied(entry.name, entry.repeatable);
    }

    return false;
  }

  _isSkillAdvanceAlreadyApplied(advanceName) {
    const parsed = this._parseAdvanceSkillStage(advanceName);
    const actorSkill = this.actor.items.find((item) => item.type === "skill" && this._normalizeAdvanceLookupName(item.name) === this._normalizeAdvanceLookupName(parsed.baseName));
    if (!actorSkill) return false;

    if (parsed.stage === "advance20") return Boolean(actorSkill.system.advance20);
    if (parsed.stage === "advance10") return Boolean(actorSkill.system.advance10);
    return Boolean(actorSkill.system.trained);
  }

  _isTalentAdvanceAlreadyApplied(advanceName, repeatable) {
    if (repeatable) return false;
    if (this._isTrackedTalentAdvance(advanceName)) return false;
    const normalizedName = this._normalizeAdvanceLookupName(advanceName);
    return this.actor.items.some((item) => item.type === "talent" && this._normalizeAdvanceLookupName(item.name) === normalizedName);
  }

  _isTrackedTalentAdvance(advanceName) {
    const normalizedBaseName = this._normalizeAdvanceLookupName(this._getNormalizedTalentAdvanceBaseName(advanceName));
    return normalizedBaseName === this._normalizeAdvanceLookupName("Psy Rating")
      || normalizedBaseName === this._normalizeAdvanceLookupName("Sound Constitution")
      || normalizedBaseName === this._normalizeAdvanceLookupName("The Flesh is Weak");
  }

  _getNormalizedTalentAdvanceBaseName(advanceName) {
    const cleanedName = String(advanceName ?? "").replace(/\s*\((x\d+|choose one)\)\s*$/i, "").trim();
    if (/^psy rating\s+\d+$/i.test(cleanedName)) return "Psy Rating";
    if (/^the flesh is weak\s+\d+$/i.test(cleanedName)) return "The Flesh is Weak";
    if (/^mechadendrite use\s*\(.+\)$/i.test(cleanedName)) return "Mechadendrite Use";
    return cleanedName;
  }

  _parsePsyRatingAdvanceTarget(advanceName, existingTalent = null) {
    const explicitMatch = String(advanceName ?? "").match(/^psy rating\s+(\d+)$/i);
    if (explicitMatch) return Number(explicitMatch[1] ?? 0);
    return this._getTalentItemRating(existingTalent) + 1;
  }

  _parseTheFleshIsWeakAdvanceTarget(advanceName, existingTalent = null) {
    const explicitMatch = String(advanceName ?? "").match(/^the flesh is weak\s+(\d+)$/i);
    if (explicitMatch) return Number(explicitMatch[1] ?? 0);
    return this._getTalentItemRating(existingTalent) + 1;
  }

  _getTalentItemRating(item) {
    if (!item) return 0;

    const fromSystem = Number.parseInt(String(item.system?.rating ?? "").trim(), 10);
    if (Number.isFinite(fromSystem) && fromSystem > 0) return fromSystem;

    const fromName = String(item.name ?? "").match(/\b(\d+)\b/);
    if (fromName) {
      const parsed = Number.parseInt(fromName[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    return 0;
  }

  _findTrackedTalentItem(baseName) {
    const normalizedBaseName = this._normalizeAdvanceLookupName(baseName);
    return this.actor.items.find((item) => {
      if (item.type !== "talent") return false;
      const normalizedItemName = this._normalizeAdvanceLookupName(item.name);
      if (normalizedItemName === normalizedBaseName) return true;

      if (normalizedBaseName === this._normalizeAdvanceLookupName("Psy Rating")) {
        return /^psyrating\d*$/.test(normalizedItemName);
      }

      if (normalizedBaseName === this._normalizeAdvanceLookupName("The Flesh is Weak")) {
        return /^thefleshisweak\d*$/.test(normalizedItemName);
      }

      return false;
    }) ?? null;
  }

  _formatAdvanceType(type) {
    switch (type) {
      case "skill":
        return "Skill";
      case "talent":
        return "Talent";
      case "trait":
        return "Trait";
      case "characteristic":
        return "Characteristic";
      case "power":
        return "Power";
      default:
        return type ? String(type) : "";
    }
  }

  _formatCustomPurchaseType(type) {
    switch (String(type ?? "").trim().toLowerCase()) {
      case "skill":
        return "Skill";
      case "talent":
        return "Talent";
      case "trait":
        return "Trait";
      case "power":
        return "Power";
      case "origin":
        return "Origin";
      case "buy-off":
        return "Buy-Off";
      case "miscellaneous":
      case "misc":
      default:
        return "Miscellaneous";
    }
  }

  async _onShowAdvanceDetails(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const advanceName = button.dataset.advanceName ?? "";
    const advanceType = button.dataset.advanceType ?? "";
    const prerequisites = button.dataset.prerequisites ?? "";
    const cost = Number(button.dataset.cost ?? 0);

    const detail = this._buildAdvanceDetailData({
      advanceName,
      advanceType,
      prerequisites,
      cost
    });

    if (!detail) {
      ui.notifications?.warn(`Rogue Trader | No detail entry found for '${advanceName}'.`);
      return;
    }

    const sections = [];
    if (detail.meta.length) {
      sections.push(`<div class="roguetrader-advance-detail-meta">${detail.meta.map((entry) => `<span>${foundry.utils.escapeHTML(entry)}</span>`).join("")}</div>`);
    }
    if (detail.benefit) {
      sections.push(`
        <div class="roguetrader-advance-detail-block">
          <h4>Summary</h4>
          <p>${foundry.utils.escapeHTML(detail.benefit)}</p>
        </div>
      `);
    }
    if (detail.description) {
      sections.push(`
        <div class="roguetrader-advance-detail-block">
          <h4>Description</h4>
          <p>${foundry.utils.escapeHTML(detail.description)}</p>
        </div>
      `);
    }

    new Dialog({
      title: detail.title,
      content: `
        <div class="roguetrader-advance-detail-dialog">
          <div class="roguetrader-advance-detail-type">${foundry.utils.escapeHTML(detail.typeLabel)}</div>
          ${sections.join("")}
        </div>
      `,
      buttons: {
        close: {
          label: "Close"
        }
      },
      default: "close"
    }).render(true);
  }

  async _onPurchaseCharacteristicAdvance(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const careerKey = button.dataset.careerKey;
    const characteristicKey = button.dataset.characteristicKey;
    const stageKey = button.dataset.stageKey;
    const cost = Number(button.dataset.cost ?? 0);

    if (!careerKey || !characteristicKey || !stageKey || !cost) return;

    const unspentXp = getRogueTraderUnspentXp(this.actor.system);
    if (unspentXp < cost) {
      ui.notifications?.warn("Rogue Trader | Not enough unspent XP for that characteristic advance.");
      return;
    }

    const currentCount = this._getCharacteristicAdvanceCount(careerKey, characteristicKey);
    const expectedStageKey = CHARACTERISTIC_ADVANCE_STAGES[currentCount] ?? null;
    if (expectedStageKey !== stageKey) {
      ui.notifications?.warn("Rogue Trader | That characteristic advance is no longer the next available tier.");
      return;
    }

    const characteristicLabel = this._getCharacteristicLabelFromKey(characteristicKey);
    const stageLabel = this._formatCharacteristicAdvanceStage(stageKey);
    const confirmed = await this._confirmXpSpend({
      name: `${characteristicLabel} (${stageLabel})`,
      cost,
      unspentXp
    });
    if (!confirmed) return;

    const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
    const spentXp = getRogueTraderSpentXp(this.actor.system) + cost;
    const xpLog = this._buildUpdatedXpLog({
      amount: -cost,
      note: `Purchased ${stageLabel} ${characteristicLabel}`,
      type: "spend"
    });
    await this.actor.update({
      [`system.characteristics.${characteristicKey}.value`]: currentValue + 5,
      "system.advancement.spentXp": spentXp,
      "system.advancement.xpLog": xpLog,
      "system.advancement.totalXp": getRogueTraderTotalXp({
        ...this.actor.system,
        advancement: {
          ...(this.actor.system.advancement ?? {}),
          xpLog
        }
      }),
      [`system.advancement.purchasedCharacteristicAdvances.${careerKey}.${characteristicKey}`]: currentCount + 1
    });

    ui.notifications?.info(`Rogue Trader | Purchased ${stageLabel} ${characteristicLabel} for ${cost} xp.`);
  }

  async _onAddXpLogEntry(event) {
    event.preventDefault();

    const submitted = await this._promptForXpLogEntry();
    if (!submitted) return;

    const xpLog = Array.isArray(this.actor.system.advancement?.xpLog)
      ? [...this.actor.system.advancement.xpLog]
      : [];

    xpLog.push({
      id: foundry.utils.randomID(),
      amount: submitted.amount,
      note: submitted.note,
      awardedOn: new Date().toISOString().slice(0, 10),
      type: "award"
    });

      await this.actor.update({
        "system.advancement.xpLog": xpLog,
        "system.advancement.totalXp": getRogueTraderTotalXp({
          ...this.actor.system,
          advancement: {
            ...(this.actor.system.advancement ?? {}),
            xpLog
          }
        })
      });
  }

  async _onAddCustomPurchase(event) {
    event.preventDefault();

    const panel = event.currentTarget.closest(".advancement-custom-purchase-panel");
    if (!panel) return;

    const nameInput = panel.querySelector('[data-custom-field="name"]');
    const typeSelect = panel.querySelector('[data-custom-field="type"]');
    const costInput = panel.querySelector('[data-custom-field="cost"]');

    const name = String(nameInput?.value ?? "").trim();
    const type = String(typeSelect?.value ?? "miscellaneous").trim().toLowerCase();
    const cost = Math.max(0, Number(costInput?.value ?? 0) || 0);

    if (!name) {
      ui.notifications?.warn("Rogue Trader | Enter a name for the custom purchase.");
      nameInput?.focus();
      return;
    }

    if (!cost) {
      ui.notifications?.warn("Rogue Trader | Enter an XP cost for the custom purchase.");
      costInput?.focus();
      return;
    }

    const unspentXp = getRogueTraderUnspentXp(this.actor.system);
    if (unspentXp < cost) {
      ui.notifications?.warn("Rogue Trader | Not enough unspent XP for that custom purchase.");
      return;
    }

    const confirmed = await this._confirmXpSpend({
      name,
      cost,
      unspentXp
    });
    if (!confirmed) return;

    await this._applyCustomPurchase({ name, type });

    const customPurchases = Array.isArray(this.actor.system.advancement?.customPurchases)
      ? [...this.actor.system.advancement.customPurchases]
      : [];
    customPurchases.push({
      id: foundry.utils.randomID(),
      name,
      type,
      cost,
      purchasedOn: new Date().toISOString().slice(0, 10)
    });

    const spentXp = getRogueTraderSpentXp(this.actor.system) + cost;
    const xpLog = this._buildUpdatedXpLog({
      amount: -cost,
      note: `Custom purchase: ${name}`,
      type: "spend"
    });

    await this.actor.update({
      "system.advancement.customPurchases": customPurchases,
      "system.advancement.spentXp": spentXp,
      "system.advancement.xpLog": xpLog,
      "system.advancement.totalXp": getRogueTraderTotalXp({
        ...this.actor.system,
        advancement: {
          ...(this.actor.system.advancement ?? {}),
          xpLog
        }
      })
    });

    if (nameInput) nameInput.value = "";
    if (costInput) costInput.value = "100";
    if (typeSelect) typeSelect.value = "miscellaneous";

    ui.notifications?.info(`Rogue Trader | Recorded custom purchase '${name}' for ${cost} xp.`);
  }

  async _onAddTrackPoints(event) {
    event.preventDefault();

    const track = String(event.currentTarget.dataset.track ?? "").trim().toLowerCase();
    if (track !== "corruption" && track !== "insanity") return;

    const submitted = await this._promptForTrackPoints(track);
    if (!submitted) return;

    let amountToAdd = 0;
    let noteLabel = "";
    const entry = String(submitted.entry ?? "").trim();

    if (!entry) {
      ui.notifications?.warn(`Rogue Trader | Enter a number or roll formula for ${track}.`);
      return;
    }

    if (/[dD]/.test(entry)) {
      const roll = await new Roll(entry).evaluate({ async: true });
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Rogue Trader | ${this._formatTrackLabel(track)} Gain`
      });
      amountToAdd = Number(roll.total ?? 0);
      noteLabel = `${this._formatTrackLabel(track)} +${amountToAdd} (${entry})`;
    } else {
      amountToAdd = Number(entry);
      noteLabel = `${this._formatTrackLabel(track)} +${amountToAdd}`;
    }

    if (!Number.isFinite(amountToAdd) || amountToAdd <= 0) {
      ui.notifications?.warn(`Rogue Trader | No ${track} points were added.`);
      return;
    }

    const currentPoints = Math.max(0, Number(this.actor.system?.[track]?.points ?? 0) || 0);
    await this.actor.update({
      [`system.${track}.points`]: currentPoints + amountToAdd
    });

    ui.notifications?.info(`Rogue Trader | ${noteLabel}.`);
  }

  async _onPurchaseAdvance(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const purchaseKey = button.dataset.purchaseKey;
    const cost = Number(button.dataset.cost ?? 0);
    const name = button.dataset.advanceName ?? "";
    const type = button.dataset.advanceType ?? "";
    const repeatable = button.dataset.repeatable === "true";

    if (!purchaseKey || !name || !type || !cost) return;

    const entry = {
      name,
      cost,
      type,
      repeatable
    };

    const purchaseMode = this._getAdvancePurchaseMode(entry);
    if (!purchaseMode) {
      ui.notifications?.warn("Rogue Trader | That advance needs a manual choice flow and is not automated yet.");
      return;
    }

    const unspentXp = getRogueTraderUnspentXp(this.actor.system);
    if (unspentXp < cost) {
      ui.notifications?.warn("Rogue Trader | Not enough unspent XP for that advance.");
      return;
    }

    if (!repeatable && this._isAdvanceAlreadyApplied(entry)) {
      ui.notifications?.warn("Rogue Trader | That advance is already applied.");
      return;
    }

    let purchasedLabel = name;
    if (purchaseMode === "choice") {
      const selectedChoice = await this._promptForAdvanceChoice(entry);
      if (!selectedChoice) return;
      purchasedLabel = selectedChoice.label;

      const confirmed = await this._confirmXpSpend({
        name: purchasedLabel,
        cost,
        unspentXp
      });
      if (!confirmed) return;

      await this._applyPurchasedAdvanceChoice(entry, selectedChoice);
    } else {
      const confirmed = await this._confirmXpSpend({
        name,
        cost,
        unspentXp
      });
      if (!confirmed) return;

      await this._applyPurchasedAdvance(entry);
    }

    const currentPurchased = this._getPurchasedAdvanceCount(purchaseKey);
    const spentXp = getRogueTraderSpentXp(this.actor.system) + cost;
    const xpLog = this._buildUpdatedXpLog({
      amount: -cost,
      note: `Purchased ${purchasedLabel}`,
      type: "spend"
    });
    await this.actor.update({
      "system.advancement.spentXp": spentXp,
      "system.advancement.xpLog": xpLog,
      "system.advancement.totalXp": getRogueTraderTotalXp({
        ...this.actor.system,
        advancement: {
          ...(this.actor.system.advancement ?? {}),
          xpLog
        }
      }),
      [`system.advancement.purchasedAdvances.${purchaseKey}`]: currentPurchased + 1
    });

    ui.notifications?.info(`Rogue Trader | Purchased ${purchasedLabel} for ${cost} xp.`);
  }

  async _applyPurchasedAdvance(entry) {
    if (entry.type === "skill") {
      await this._applySkillAdvancePurchase(entry.name);
      return;
    }

    if (entry.type === "talent" || entry.type === "trait") {
      await this._applyTalentAdvancePurchase(entry.name, null, entry.type);
    }
  }

  async _applyCustomPurchase(entry) {
    const normalizedType = String(entry?.type ?? "").trim().toLowerCase();
    const name = String(entry?.name ?? "").trim();
    if (!name) return;

    if (normalizedType === "skill") {
      await this._applySkillAdvancePurchase(name);
      return;
    }

    if (normalizedType === "talent" || normalizedType === "trait") {
      await this._applyTalentAdvancePurchase(name, null, normalizedType);
      return;
    }

    if (normalizedType === "power") {
      await this._applyPowerAdvancePurchase(name);
    }
  }

  async _applyPurchasedAdvanceChoice(entry, choice) {
    if (choice.kind === "skill") {
      await this._applySkillAdvancePurchase(choice.name);
      return;
    }

    if (choice.kind === "talent") {
      await this._applyTalentAdvancePurchase(choice.name, choice);
      return;
    }

    if (choice.kind === "talentItem") {
      await this._applyTalentItemAdvancePurchase(choice);
      return;
    }

    if (choice.kind === "navigatorPower") {
      await this._applyNavigatorPowerAdvancePurchase(choice);
      return;
    }

    if (choice.kind === "psychicTechnique") {
      await this._applyPsychicTechniqueAdvancePurchase(choice);
    }
  }

  async _applySkillAdvancePurchase(advanceName) {
    const parsed = this._parseAdvanceSkillStage(advanceName);
    const canonicalSkill = this._resolveCanonicalSkillByName(parsed.baseName);
    const skillName = canonicalSkill?.fullName ?? parsed.baseName;
    const existingSkill = this.actor.items.find((item) =>
      item.type === "skill" && this._normalizeAdvanceLookupName(item.name) === this._normalizeAdvanceLookupName(skillName)
    );

    if (existingSkill) {
      const update = {};
      if (parsed.stage === "advance20") {
        update["system.trained"] = true;
        update["system.advance10"] = true;
        update["system.advance20"] = true;
      } else if (parsed.stage === "advance10") {
        update["system.trained"] = true;
        update["system.advance10"] = true;
      } else {
        update["system.trained"] = true;
      }
      await existingSkill.update(update);
      return;
    }

    if (!canonicalSkill) {
      ui.notifications?.warn(`Rogue Trader | No canonical skill definition found for '${advanceName}'.`);
      return;
    }

    const skillData = buildSkillItemData(canonicalSkill.id, {
      trained: true,
      advance10: parsed.stage === "advance10" || parsed.stage === "advance20",
      advance20: parsed.stage === "advance20"
    });

    if (skillData) {
      await this.actor.createEmbeddedDocuments("Item", [skillData]);
    }
  }

  async _applyTalentAdvancePurchase(advanceName, choice = null, advanceType = "talent") {
    const baseName = this._getNormalizedTalentAdvanceBaseName(advanceName);
    const canonicalTalent = choice?.talentId
      ? getRogueTraderTalentDefinition(choice.talentId)
      : this._resolveCanonicalTalentByName(baseName);
    if (!canonicalTalent) {
      if (advanceType === "trait") {
        await this._createGenericTraitAdvanceItem(baseName);
        return;
      }
      ui.notifications?.warn(`Rogue Trader | No canonical talent definition found for '${advanceName}'.`);
      return;
    }

    const normalizedBaseName = this._normalizeAdvanceLookupName(baseName);
    const isPsyRating = normalizedBaseName === this._normalizeAdvanceLookupName("Psy Rating");
    const isSoundConstitution = normalizedBaseName === this._normalizeAdvanceLookupName("Sound Constitution");
    const isTheFleshIsWeak = normalizedBaseName === this._normalizeAdvanceLookupName("The Flesh is Weak");

    if (isPsyRating || isSoundConstitution || isTheFleshIsWeak) {
      const existingTalent = this._findTrackedTalentItem(baseName);
      const currentRating = this._getTalentItemRating(existingTalent);
      const nextRating = isPsyRating
        ? this._parsePsyRatingAdvanceTarget(advanceName, existingTalent)
        : isTheFleshIsWeak
          ? this._parseTheFleshIsWeakAdvanceTarget(advanceName, existingTalent)
          : Math.max(1, currentRating + 1);

      if (existingTalent) {
        await existingTalent.update({
          name: baseName,
          "system.rating": String(nextRating)
        });
      } else {
        const talentData = buildTalentItemData(canonicalTalent.id, {
          ...(choice?.overrides ?? {}),
          name: baseName,
          rating: String(nextRating)
        });

        if (!talentData) {
          ui.notifications?.warn(`Rogue Trader | Failed to build item data for '${advanceName}'.`);
          return;
        }

        await this.actor.createEmbeddedDocuments("Item", [talentData]);
      }
    } else {
      const talentOverrides = { ...(choice?.overrides ?? {}) };
      if (!talentOverrides.name && baseName !== advanceName) {
        talentOverrides.name = advanceName;
      }

      const talentData = buildTalentItemData(canonicalTalent.id, talentOverrides);
      if (!talentData) {
        ui.notifications?.warn(`Rogue Trader | Failed to build item data for '${advanceName}'.`);
        return;
      }

      await this.actor.createEmbeddedDocuments("Item", [talentData]);
    }

    if (isSoundConstitution) {
      const currentMaxWounds = Number(this.actor.system.resources?.wounds?.max ?? 0);
      await this.actor.update({ "system.resources.wounds.max": currentMaxWounds + 1 });
    }
  }

  async _createGenericTraitAdvanceItem(name) {
    const existingItem = this.actor.items.find((item) =>
      item.type === "talent" && this._normalizeAdvanceLookupName(item.name) === this._normalizeAdvanceLookupName(name)
    );
    if (existingItem) return;

    await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type: "talent",
      system: {
        category: "trait",
        benefit: "",
        description: `Trait advance gained through an alternate rank: ${name}.`
      }
    }]);
  }

  async _applyPsychicTechniqueAdvancePurchase(choice) {
    if (!choice?.itemData) {
      ui.notifications?.warn("Rogue Trader | No psychic technique data was available for that selection.");
      return;
    }

    await this.actor.createEmbeddedDocuments("Item", [choice.itemData]);
  }

  async _applyPowerAdvancePurchase(powerName) {
    const normalizedName = this._normalizeAdvanceLookupName(powerName);
    const existingPower = this.actor.items.find((item) =>
      (item.type === "psychicTechnique" || item.type === "navigatorPower")
      && this._normalizeAdvanceLookupName(item.name) === normalizedName
    );
    if (existingPower) return;

    for (const item of game.items ?? []) {
      if (item.type !== "psychicTechnique" && item.type !== "navigatorPower") continue;
      if (this._normalizeAdvanceLookupName(item.name) !== normalizedName) continue;
      const itemData = item.toObject();
      delete itemData._id;
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
      return;
    }

    const pack = game.packs.get("roguetrader.character-creation-options");
    if (pack?.documentName === "Item") {
      const documents = await pack.getDocuments();
      const match = documents.find((item) =>
        (item.type === "psychicTechnique" || item.type === "navigatorPower")
        && this._normalizeAdvanceLookupName(item.name) === normalizedName
      );
      if (match) {
        const itemData = match.toObject();
        delete itemData._id;
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
        return;
      }
    }

    ui.notifications?.warn(`Rogue Trader | No power item was found for '${powerName}', but the custom purchase was still recorded.`);
  }

  async _applyNavigatorPowerAdvancePurchase(choice) {
    if (!choice) {
      ui.notifications?.warn("Rogue Trader | No navigator power choice was available for that selection.");
      return;
    }

    if (choice.action === "upgrade") {
      const item = this.actor.items.get(choice.itemId);
      if (!item) {
        ui.notifications?.warn("Rogue Trader | The selected navigator power could not be found on the actor.");
        return;
      }

      await item.update({ "system.mastery": choice.nextMastery });
      return;
    }

    if (!choice?.itemData) {
      ui.notifications?.warn("Rogue Trader | No navigator power data was available for that selection.");
      return;
    }

    await this.actor.createEmbeddedDocuments("Item", [choice.itemData]);
  }

  async _applyTalentItemAdvancePurchase(choice) {
    if (!choice?.itemData) {
      ui.notifications?.warn("Rogue Trader | No talent item data was available for that selection.");
      return;
    }

    await this.actor.createEmbeddedDocuments("Item", [choice.itemData]);
  }

  _getCharacteristicLabelFromKey(characteristicKey) {
    return CHARACTERISTIC_DEFINITIONS.find((entry) => entry.key === characteristicKey)?.label ?? characteristicKey;
  }

  _buildUpdatedXpLog({ amount, note, type = "award" }) {
    const xpLog = Array.isArray(this.actor.system.advancement?.xpLog)
      ? [...this.actor.system.advancement.xpLog]
      : [];

    xpLog.push({
      id: foundry.utils.randomID(),
      amount: Number(amount ?? 0),
      note: String(note ?? "").trim(),
      awardedOn: new Date().toISOString().slice(0, 10),
      type
    });

    return xpLog;
  }

  _formatTrackLabel(track) {
    return track === "corruption" ? "Corruption" : "Insanity";
  }

  async _promptForTrackPoints(track) {
    const trackLabel = this._formatTrackLabel(track);

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      new Dialog({
        title: `Add ${trackLabel} Points`,
        content: `
          <form class="roguetrader-track-points-form">
            <div class="form-group">
              <label>Amount or Roll</label>
              <input type="text" name="entry" value="1" placeholder="2 or 1d10+1" />
            </div>
          </form>
        `,
        buttons: {
          confirm: {
            label: "Add",
            callback: (html) => {
              const root = html[0];
              const entry = String(root.querySelector('[name="entry"]')?.value ?? "").trim();
              finish({ entry });
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "confirm",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _promptForAdvanceChoice(entry) {
    const choiceConfig = this._getAdvanceChoiceConfig(entry);
    if (!choiceConfig) return null;

    const options = await this._getAdvanceChoiceOptions(choiceConfig);
    if (!options.length) {
      ui.notifications?.warn(`Rogue Trader | No options were found for '${entry.name}'.`);
      return null;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      const optionMarkup = options
        .map((option) => `<option value="${foundry.utils.escapeHTML(option.id)}">${foundry.utils.escapeHTML(option.label)}</option>`)
        .join("");

      new Dialog({
        title: choiceConfig.title,
        content: `
          <form class="roguetrader-advance-choice-form">
            <div class="form-group">
              <label>Selection</label>
              <select name="choice">${optionMarkup}</select>
            </div>
          </form>
        `,
        buttons: {
          confirm: {
            label: "Select",
            callback: (html) => {
              const selectedId = html.find('[name="choice"]').val();
              finish(options.find((option) => option.id === selectedId) ?? null);
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "confirm",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _getAdvanceChoiceOptions(choiceConfig) {
    if (choiceConfig.source === "canonicalSkillGroup") {
      const options = listRogueTraderSkills()
        .filter((skill) => skill.baseId === choiceConfig.baseId)
        .sort((a, b) => (a.fullName ?? a.name).localeCompare(b.fullName ?? b.name))
        .map((skill) => ({
          id: skill.id,
          label: skill.fullName ?? skill.name,
          name: skill.fullName ?? skill.name,
          kind: "skill"
        }));

      return this._filterAlreadyOwnedAdvanceChoices(options, "skill");
    }

    if (choiceConfig.source === "canonicalTalentGroup") {
      const options = listRogueTraderTalents()
        .filter((talent) => talent.baseId === choiceConfig.baseId)
        .sort((a, b) => (a.fullName ?? a.name).localeCompare(b.fullName ?? b.name))
        .map((talent) => ({
          id: talent.id,
          label: talent.fullName ?? talent.name,
          name: talent.fullName ?? talent.name,
          kind: "talent",
          talentId: talent.id
        }));

      return this._filterAlreadyOwnedAdvanceChoices(options, "talent");
    }

    if (choiceConfig.source === "xenosRaceHatred") {
      const allowedRaces = listXenosRaces();
      const hatredTalent = this._resolveCanonicalTalentByName("Hatred");
      if (!hatredTalent) return [];

      const options = allowedRaces
        .map((raceName) => ({
          id: `${hatredTalent.id}-${this._slugifyAdvanceValue(raceName)}`,
          label: `Hatred (${raceName})`,
          name: `Hatred (${raceName})`,
          kind: "talent",
          talentId: hatredTalent.id,
          overrides: {
            name: `Hatred (${raceName})`,
            benefit: `Gain +10 Weapon Skill against ${raceName} in close combat.`,
            description: `The Explorer harbours a deep and abiding hatred of ${raceName}. When fighting ${raceName} in close combat, he gains a +10 bonus to all Weapon Skill Tests made against them.`
          }
        }));

      return this._filterAlreadyOwnedAdvanceChoices(options, "talent");
    }

    if (choiceConfig.source === "exoticWeapon") {
      const weaponNames = await this._getExoticWeaponChoiceNames();
      return weaponNames.map((weaponName) => ({
        id: this._slugifyAdvanceValue(weaponName),
        label: weaponName,
        name: `Exotic Weapon Training (${weaponName})`,
        kind: "talent",
        talentId: choiceConfig.baseId,
        overrides: {
          name: `Exotic Weapon Training (${weaponName})`,
          benefit: `Use ${weaponName} without the untrained penalty.`,
          description: `The Explorer has received Exotic Weapon Training in ${weaponName}, and can use it without penalty.`
        }
      }));
    }

    if (choiceConfig.source === "psychicDisciplineCompendium") {
      return this._getPsychicDisciplineChoiceOptions();
    }

    if (choiceConfig.source === "navigatorPowerCompendium") {
      return this._getNavigatorPowerChoiceOptions();
    }

    if (choiceConfig.source === "psychicTechniqueCompendium") {
      return this._getPsychicTechniqueChoiceOptions();
    }

    return [];
  }

  _filterAlreadyOwnedAdvanceChoices(options, itemType) {
    const filtered = options.filter((option) =>
      !this.actor.items.some((item) =>
        item.type === itemType
        && this._normalizeAdvanceLookupName(item.name) === this._normalizeAdvanceLookupName(option.name)
      )
    );

    return filtered.length ? filtered : options;
  }

  async _getPsychicTechniqueChoiceOptions() {
    const pack = game.packs.get("roguetrader.character-creation-options");
    if (!pack?.documentName || pack.documentName !== "Item") return [];

    const documents = await pack.getDocuments();
    const options = documents
      .filter((item) => item.type === "psychicTechnique")
      .map((item) => {
        const folderName = item.folder?.name ? String(item.folder.name).trim() : "";
        return {
          id: item.id,
          label: folderName ? `${folderName}: ${item.name}` : item.name,
          name: item.name,
          kind: "psychicTechnique",
          itemData: item.toObject()
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return this._filterAlreadyOwnedAdvanceChoices(options, "psychicTechnique");
  }

  async _getNavigatorPowerChoiceOptions() {
    const pack = game.packs.get("roguetrader.character-creation-options");
    if (!pack?.documentName || pack.documentName !== "Item") return [];

    const ownedNavigatorPowers = this.actor.items.filter((item) => item.type === "navigatorPower");
    const ownedNames = new Set(ownedNavigatorPowers.map((item) => this._normalizeAdvanceLookupName(item.name)));
    const documents = await pack.getDocuments();
    const newPowerOptions = documents
      .filter((item) => item.type === "navigatorPower")
      .filter((item) => !ownedNames.has(this._normalizeAdvanceLookupName(item.name)))
      .map((item) => {
        const folderName = item.folder?.name ? String(item.folder.name).trim() : "";
        return {
          id: item.id,
          label: folderName ? `${folderName}: ${item.name}` : item.name,
          name: item.name,
          kind: "navigatorPower",
          action: "new",
          itemData: item.toObject()
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const upgradeOptions = ownedNavigatorPowers
      .map((item) => {
        const currentMastery = this._normalizeNavigatorPowerMastery(item.system?.mastery);
        const nextMastery = this._getNextNavigatorPowerMastery(currentMastery);
        if (!nextMastery) return null;

        return {
          id: `upgrade-${item.id}`,
          label: `Upgrade ${item.name} to ${this._formatNavigatorPowerMasteryLabel(nextMastery)}`,
          name: item.name,
          kind: "navigatorPower",
          action: "upgrade",
          itemId: item.id,
          nextMastery
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));

    return [...upgradeOptions, ...newPowerOptions];
  }

  _normalizeNavigatorPowerMastery(value) {
    const normalized = String(value ?? "n/a").trim().toLowerCase();
    if (normalized === "adept" || normalized === "adept +10") return "adept10";
    if (normalized === "master" || normalized === "master +20") return "master20";
    if (normalized === "novice") return "novice";
    return normalized || "n/a";
  }

  _getNextNavigatorPowerMastery(currentMastery) {
    const normalized = this._normalizeNavigatorPowerMastery(currentMastery);
    if (normalized === "n/a" || normalized === "novice") return "adept10";
    if (normalized === "adept10") return "master20";
    return null;
  }

  _formatNavigatorPowerMasteryLabel(mastery) {
    const normalized = this._normalizeNavigatorPowerMastery(mastery);
    if (normalized === "adept10") return "Adept";
    if (normalized === "master20") return "Master";
    if (normalized === "novice" || normalized === "n/a") return "Novice";
    return String(mastery ?? "");
  }

  async _getPsychicDisciplineChoiceOptions() {
    const options = [];
    const seen = new Set();

    for (const item of game.items ?? []) {
      if (item.type !== "talent") continue;
      if (!this._isPsychicDisciplineTalent(item)) continue;
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      options.push({
        id: item.id,
        label: item.name,
        name: item.name,
        kind: "talentItem",
        itemData: item.toObject()
      });
    }

    const pack = game.packs.get("roguetrader.character-creation-options");
    if (pack?.documentName === "Item") {
      const documents = await pack.getDocuments();
      for (const item of documents) {
        if (item.type !== "talent") continue;
        if (!this._isPsychicDisciplineTalent(item)) continue;
        if (seen.has(item.name)) continue;
        seen.add(item.name);
        options.push({
          id: item.id,
          label: item.name,
          name: item.name,
          kind: "talentItem",
          itemData: item.toObject()
        });
      }
    }

    options.sort((a, b) => a.label.localeCompare(b.label));
    return this._filterAlreadyOwnedAdvanceChoices(options, "talent");
  }

  _isPsychicDisciplineTalent(item) {
    const itemName = String(item?.name ?? "").trim();
    return /^psychic discipline\s*[-:]\s*.+$/i.test(itemName);
  }

  async _getExoticWeaponChoiceNames() {
    const names = new Set();

    for (const item of game.items ?? []) {
      if (item.type !== "weapon") continue;
      if (this._isExoticWeaponDocument(item)) names.add(item.name);
    }

    const equipmentPack = game.packs.get("roguetrader.equipment");
    if (equipmentPack?.documentName === "Item") {
      const documents = await equipmentPack.getDocuments();
      for (const item of documents) {
        if (item.type !== "weapon") continue;
        if (this._isExoticWeaponDocument(item)) names.add(item.name);
      }
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  _isExoticWeaponDocument(item) {
    const weaponClass = String(item.system?.class ?? "").trim().toLowerCase();
    const weaponType = String(item.system?.weaponType ?? "").trim().toLowerCase();
    return weaponClass === "exotic" || weaponType === "exotic" || weaponType === "exoticmelee";
  }

  _buildAdvanceDetailData({ advanceName, advanceType, prerequisites, cost }) {
    const normalizedType = String(advanceType ?? "").trim().toLowerCase();

    if (normalizedType === "skill") {
      const parsed = this._parseAdvanceSkillStage(advanceName);
      const canonicalSkill = this._resolveCanonicalSkillByName(parsed.baseName);
      if (!canonicalSkill) return null;

      const stageLabel = parsed.stage === "advance20"
        ? "+20"
        : parsed.stage === "advance10"
          ? "+10"
          : "Trained";

      const meta = [
        `Cost: ${cost} xp`,
        `Characteristic: ${this._getCharacteristicLabelForSkillDetail(canonicalSkill.characteristic)}`,
        `Category: ${canonicalSkill.category ?? "General"}`,
        canonicalSkill.basic ? "Basic Skill" : "Advanced Skill",
        `Advance: ${stageLabel}`
      ];

      if (prerequisites) meta.push(`Prerequisites: ${prerequisites}`);

      return {
        title: advanceName,
        typeLabel: "Skill Advance",
        meta,
        benefit: `This purchase improves ${canonicalSkill.fullName ?? canonicalSkill.name} to ${stageLabel}.`,
        description: canonicalSkill.groupName
          ? `${canonicalSkill.fullName ?? canonicalSkill.name} is a ${canonicalSkill.basic ? "Basic" : "Advanced"} ${canonicalSkill.category ?? "General"} skill tied to ${this._getCharacteristicLabelForSkillDetail(canonicalSkill.characteristic)}.`
          : `${canonicalSkill.name} is a ${canonicalSkill.basic ? "Basic" : "Advanced"} ${canonicalSkill.category ?? "General"} skill tied to ${this._getCharacteristicLabelForSkillDetail(canonicalSkill.characteristic)}.`
      };
    }

    if (normalizedType === "talent" || normalizedType === "trait") {
      const baseName = String(advanceName ?? "").replace(/\s*\(x\d+\)\s*$/i, "").trim();
      const canonicalTalent = this._resolveCanonicalTalentByName(baseName);
      if (!canonicalTalent) {
        return {
          title: baseName,
          typeLabel: this._formatAdvanceType(normalizedType),
          meta: [`Cost: ${cost} xp`, ...(prerequisites ? [`Prerequisites: ${prerequisites}`] : [])],
          benefit: "",
          description: "No additional rules text is available for this advance yet."
        };
      }

      const meta = [`Cost: ${cost} xp`];
      if (canonicalTalent.prerequisites) meta.push(`Prerequisites: ${canonicalTalent.prerequisites}`);
      else if (prerequisites) meta.push(`Prerequisites: ${prerequisites}`);

      return {
        title: canonicalTalent.fullName ?? canonicalTalent.name,
        typeLabel: this._formatAdvanceType(canonicalTalent.category ?? normalizedType),
        meta,
        benefit: canonicalTalent.benefit ?? "",
        description: canonicalTalent.description ?? ""
      };
    }

    return {
      title: advanceName,
      typeLabel: this._formatAdvanceType(normalizedType),
      meta: [`Cost: ${cost} xp`, ...(prerequisites ? [`Prerequisites: ${prerequisites}`] : [])],
      benefit: "",
      description: "No additional rules text is available for this advance yet."
    };
  }

  _getCharacteristicLabelForSkillDetail(characteristicKey) {
    const normalized = String(characteristicKey ?? "").trim().toLowerCase();
    return CHARACTERISTIC_DEFINITIONS.find((entry) => entry.key.toLowerCase() === normalized)?.label ?? characteristicKey;
  }

  async _confirmXpSpend({ name, cost, unspentXp }) {
    const remainingXp = Math.max(0, Number(unspentXp ?? 0) - Number(cost ?? 0));
    return Dialog.confirm({
      title: "Confirm XP Expenditure",
      content: `
        <div class="roguetrader-xp-confirm-dialog">
          <p>Spend <strong>${cost} XP</strong> on <strong>${foundry.utils.escapeHTML(String(name ?? ""))}</strong>?</p>
          <p>Unspent XP: <strong>${unspentXp}</strong> -> <strong>${remainingXp}</strong></p>
        </div>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
  }

  async _promptForXpLogEntry() {
    return new Promise((resolve) => {
      let resolved = false;
      const finish = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      new Dialog({
        title: "Add XP Award",
        content: `
          <form class="roguetrader-xp-log-form">
            <div class="form-group">
              <label>XP Awarded</label>
              <input type="number" name="amount" min="1" step="1" value="100" />
            </div>
            <div class="form-group">
              <label>Note</label>
              <input type="text" name="note" value="" placeholder="Session, milestone, or objective" />
            </div>
          </form>
        `,
        buttons: {
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          },
          confirm: {
            label: "Add XP",
            callback: (html) => {
              const amount = Number(html.find('input[name="amount"]').val() ?? 0);
              const note = String(html.find('input[name="note"]').val() ?? "").trim();
              if (!Number.isFinite(amount) || amount <= 0) {
                ui.notifications?.warn("Rogue Trader | XP award must be greater than 0.");
                finish(null);
                return;
              }

              finish({ amount, note });
            }
          }
        },
        default: "confirm",
        close: () => finish(null)
      }).render(true);
    });
  }

  _getStartingCharacteristicState(characteristicKey) {
    const stored = this.actor.system.advancement?.startingCharacteristics?.values?.[characteristicKey] ?? {};
    const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);

    return {
      value: Number(stored.value ?? currentValue),
      generated: Boolean(stored.generated),
      rerolled: Boolean(stored.rerolled)
    };
  }

  _calculateCharacteristicBonus(characteristicKey) {
    return this.actor.getCharacteristicBonus?.(characteristicKey)
      ?? Math.floor(Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0) / 10);
  }

  _calculateDisplayedCharacteristicBonus(characteristicKey) {
    return this.actor.getDisplayedCharacteristicBonus?.(characteristicKey)
      ?? this._calculateCharacteristicBonus(characteristicKey);
  }

  _getCharacteristicTempStateClass(characteristicKey) {
    const totalModifier = Number(this.actor.getCharacteristicTotalModifier?.(characteristicKey) ?? 0);
    if (totalModifier > 0) return "is-buffed";
    if (totalModifier < 0) return "is-debuffed";
    return "";
  }

  _getCharacteristicTempTitle(characteristicKey, characteristicModifierTotals = null) {
    const baseValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
    const manualModifier = Number(this.actor.system.characteristics?.[characteristicKey]?.tempModifier ?? 0);
    const itemModifierTotals = characteristicModifierTotals ?? this.actor.getCharacteristicItemModifierTotals?.() ?? {};
    const itemModifier = Number(itemModifierTotals?.[characteristicKey] ?? 0);
    const totalModifier = Number(this.actor.getCharacteristicTotalModifier?.(characteristicKey) ?? (manualModifier + itemModifier));
    const displayValue = baseValue + totalModifier;
    const modifierLabel = totalModifier >= 0 ? `+${totalModifier}` : `${totalModifier}`;

    if (!totalModifier) {
      return `Base ${baseValue}`;
    }

    return `Base ${baseValue}, temp ${modifierLabel}, total ${displayValue}`;
  }

  _getWoundsTempStateClass(totalModifier) {
    const modifier = Number(totalModifier ?? 0);
    if (modifier > 0) return "is-buffed";
    if (modifier < 0) return "is-debuffed";
    return "";
  }

  _getWoundsTempTitle(baseValue, itemModifier, displayValue) {
    const modifier = Number(itemModifier ?? 0);
    if (!modifier) {
      return `Base ${baseValue}`;
    }

    const modifierLabel = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    return `Base ${baseValue}, temp ${modifierLabel}, total ${displayValue}`;
  }

  _buildSkillColumns(skills) {
    const midpoint = Math.ceil(skills.length / 2);
    return [skills.slice(0, midpoint), skills.slice(midpoint)];
  }

  _buildArmorLocationSummary(equippedArmor) {
    const machineArmourBonus = Number(this.actor.getMachineArmourBonus?.() ?? 0);
    const installedCybernetics = this.actor.items.filter((item) => item.type === "cybernetic");

    return ARMOR_LOCATION_DEFINITIONS.map((location) => {
      const coveringArmor = equippedArmor.filter((item) => Boolean(item.system.locations?.[location.sourceKey]));
      const coveringCybernetics = installedCybernetics.filter((item) =>
        Boolean(item.system?.addsArmour)
        || ["head", "arms", "body", "legs"].some((key) => Number(item.system?.armourBonus?.[key] ?? 0) > 0)
      );
      const wornAp = coveringArmor.reduce((total, item) => total + Number(item.system.ap?.[location.sourceKey] ?? 0), 0);
      const cyberneticAp = coveringCybernetics.reduce(
        (total, item) => total + Number(item.system?.armourBonus?.[location.sourceKey] ?? 0),
        0
      );
      const ap = wornAp + cyberneticAp + machineArmourBonus;

      return {
        key: location.key,
        label: location.label,
        roll: location.roll,
        ap,
        wornAp,
        cyberneticAp,
        machineArmourBonus,
        names: [
          ...coveringArmor.map((item) => item.name),
          ...coveringCybernetics
            .filter((item) => Number(item.system?.armourBonus?.[location.sourceKey] ?? 0) > 0)
            .map((item) => item.name)
        ]
      };
    });
  }

  _buildEquippedWeaponSummary(item, equippedIndex = 0) {
    const weaponClass = item.system.class ?? "basic";
    const maxClip = Number(item.system.clip ?? 0);
    const storedCurrentClip = Number(item.system.currentClip ?? Number.NaN);
    const ammoInitialized = Boolean(item.flags?.roguetrader?.ammoInitialized);
    let currentClip = Number.isFinite(storedCurrentClip) ? storedCurrentClip : maxClip;
    if (!ammoInitialized && maxClip > 0) {
      currentClip = maxClip;
    }
    currentClip = Math.max(0, Math.min(currentClip, maxClip));
    const showRange = weaponClass !== "melee";
    const showClip = weaponClass !== "melee" && weaponClass !== "thrown";
    const showRof = weaponClass !== "melee";

    return {
      id: item.id,
      name: item.name,
      handLabel: equippedIndex === 0 ? "Primary" : equippedIndex === 1 ? "Off-hand" : "",
      isJammed: Boolean(item.flags?.roguetrader?.jammed),
      isHeavy: String(weaponClass).trim().toLowerCase() === "heavy",
      isBraced: this.actor.isHeavyWeaponBraced?.(item) ?? false,
      alwaysBraced: this.actor.isAlwaysBracedForHeavyWeapons?.() ?? false,
      classLabel: WEAPON_CLASS_LABELS[weaponClass] ?? this._getItemTypeLabel(weaponClass),
      damage: item.system.damage || "-",
      penetration: Number(item.system.penetration ?? 0),
      range: showRange ? `${Number(item.system.range ?? 0)} m` : "-",
      rof: showRof ? item.system.rof || "-" : "Melee",
      clip: showClip ? `${currentClip}/${maxClip}` : "-",
      specialRules: this._getWeaponSpecialRules(item)
    };
  }

  _describeArmorCoverage(item) {
    const coverage = [];
    const locations = item.system.locations ?? {};

    if (locations.head) coverage.push("Head");
    if (locations.arms) coverage.push("Arms");
    if (locations.body) coverage.push("Body");
    if (locations.legs) coverage.push("Legs");

    return coverage.join(", ") || "No locations set";
  }

  _getWeaponSpecialRules(item) {
    const special = item.system.special ?? {};
    const enabledRules = Object.entries(WEAPON_SPECIAL_RULE_LABELS)
      .filter(([key]) => Boolean(special[key]))
      .map(([key, label]) => {
        if (key === "blast") {
          const blastValue = Number(special.blastValue ?? 0);
          return blastValue > 0 ? `${label} (${blastValue})` : label;
        }

        if (key === "felling") {
          const fellingValue = Number(special.fellingValue ?? 0);
          return fellingValue > 0 ? `${label} (${fellingValue})` : label;
        }

        if (key === "haywire") {
          const haywireValue = Number(special.haywireValue ?? 0);
          return haywireValue > 0 ? `${label} (${haywireValue})` : label;
        }

        return label;
      });

    return enabledRules.join(", ") || "-";
  }

  _getItemShortDescription(item) {
    const directDescription = `${item.system.shortDescription ?? ""}`.trim();
    if (directDescription) return directDescription;

    const benefitDescription = `${item.system.benefit ?? ""}`.trim();
    if (benefitDescription) return benefitDescription;

    const longDescription = `${item.system.description ?? ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return longDescription ? longDescription.slice(0, 120) : "";
  }

  _buildConsequenceEntry(item) {
    return {
      id: item.id,
      name: item.name,
      summary: this._getConsequenceSummary(item)
    };
  }

  _getConsequenceSummary(item) {
    const summary = `${item.system.summary ?? item.system.benefit ?? item.system.shortDescription ?? ""}`.trim();
    if (summary) return summary.length > 72 ? `${summary.slice(0, 69)}...` : summary;

    const description = `${item.system.description ?? ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return description.length > 72 ? `${description.slice(0, 69)}...` : description;
  }

  _formatWeight(weight) {
    const numericWeight = this._getNumericWeight(weight);
    return `${numericWeight} kg`;
  }

  _getEffectiveCarriedWeight(item) {
    if (
      item?.type === "armor"
      && Boolean(item.system?.equipped)
      && String(item.system?.armorType ?? "").trim().toLowerCase() === "power"
    ) {
      return 0;
    }

    return this._getNumericWeight(item?.system?.weight);
  }

  _getNumericWeight(weight) {
    const numericWeight = Number(weight ?? 0);
    if (!Number.isFinite(numericWeight)) return 0;

    const rounded = Math.round(numericWeight * 100) / 100;
    return Number.isInteger(rounded) ? rounded : rounded;
  }

  _parseWeightKilograms(weightLabel) {
    const matched = String(weightLabel ?? "").match(/[\d,.]+/);
    if (!matched) return 0;

    const numericWeight = Number(String(matched[0]).replace(/,/g, ""));
    return Number.isFinite(numericWeight) ? numericWeight : 0;
  }

  _getCharacteristicShort(characteristic) {
    const map = {
      weaponSkill: "WS",
      ballisticSkill: "BS",
      strength: "S",
      toughness: "T",
      agility: "Ag",
      intelligence: "Int",
      perception: "Per",
      willpower: "WP",
      fellowship: "Fel"
    };

    return map[characteristic] ?? characteristic;
  }

  _getItemTypeLabel(type) {
    const labels = {
      weapon: "Weapon",
      armor: "Armor",
      gear: "Gear",
      consumable: "Consumable",
      tool: "Tool",
      cybernetic: "Cybernetic",
      basic: "Basic",
      melee: "Melee",
      pistol: "Pistol",
      thrown: "Thrown",
      heavy: "Heavy"
    };

    return labels[type] ?? type;
  }

  async _ensureDefaultSkills() {
    if (this.actor.type !== "character" || this._creatingDefaultSkills) return;

    const existingNames = new Set(
      this.actor.items
        .filter((item) => item.type === "skill")
        .map((item) => item.name)
    );

    const missingSkills = DEFAULT_SKILLS
      .filter((skill) => !existingNames.has(skill.name))
      .map((skill) => ({
        name: skill.name,
        type: "skill",
        system: {
          characteristic: skill.characteristic,
          basic: skill.basic,
          trained: false,
          advance10: false,
          advance20: false,
          bonus: 0,
          specialization: "",
          description: ""
        }
      }));

    if (!missingSkills.length) return;

    this._creatingDefaultSkills = true;

    try {
      await this.actor.createEmbeddedDocuments("Item", missingSkills);
    } finally {
      this._creatingDefaultSkills = false;
    }
  }

  async _onItemOpen(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  _onItemDragStart(event) {
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    const dataTransfer = event.originalEvent?.dataTransfer ?? event.dataTransfer;
    if (!item || !dataTransfer) return;

    const dragData = item.toDragData();
    if (item.type === "weapon") {
      dragData.roguetraderWeaponMacro = true;
    }

    dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  async _onTalentContextRemove(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
      title: "Remove Talent or Trait",
      content: `
        <div class="roguetrader-delete-confirm-dialog">
          <p>Remove <strong>${foundry.utils.escapeHTML(String(item.name ?? ""))}</strong> from this character?</p>
        </div>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;
    await item.delete();
  }

  async _onNavigatorPowerContextRemove(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "navigatorPower") return;

    const confirmed = await Dialog.confirm({
      title: "Remove Navigator Power",
      content: `
        <div class="roguetrader-delete-confirm-dialog">
          <p>Remove <strong>${foundry.utils.escapeHTML(String(item.name ?? ""))}</strong> from this character?</p>
        </div>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;
    await item.delete();
  }

  async _onSkillFieldChange(event) {
    const element = event.currentTarget;
    const itemId = element.dataset.itemId;
    const field = element.dataset.field;
    const item = this.actor.items.get(itemId);

    if (!item || !field) return;

    const value = element.type === "checkbox"
      ? element.checked
      : Number(element.value || 0);

    await item.update({ [`system.${field}`]: value });
  }

  async _onCharacteristicRoll(event) {
    event.preventDefault();

    const characteristicKey = event.currentTarget.dataset.characteristicKey;
    if (!characteristicKey) return;

    await promptCharacteristicTest(this.actor, characteristicKey);
  }

  async _onSkillRoll(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    await promptSkillTest(this.actor, item);
  }

  async _onPsychicTechniqueRoll(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    await promptFocusPowerTest(this.actor, item);
  }

  async _onWeaponAttack(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    await promptAttackTest(this.actor, item);
  }

  async _onNavigatorPowerAttack(event) {
    event.preventDefault();
    event.stopPropagation();

    const itemId = String(event.currentTarget?.dataset?.itemId ?? "").trim();
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "navigatorPower") {
      ui.notifications?.warn("Rogue Trader | Could not find that Navigator Power.");
      return;
    }

    const normalizedName = String(item.name ?? "").trim().toLowerCase();
    if (normalizedName === "the lidless stare") {
      await this._useLidlessStare(item);
      return;
    }

    ui.notifications?.info(`Rogue Trader | ${item.name} is not wired for direct attack automation yet.`);
  }

  _getNavigatorPowerMasteryModifier(item) {
    const mastery = String(item?.system?.mastery ?? "n/a").trim().toLowerCase();
    if (mastery === "master20") return 20;
    if (mastery === "adept10") return 10;
    return 0;
  }

  async _useLidlessStare(item) {
    const sourceToken = this.actor.getActiveTokens?.()[0] ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | An active token is required to use The Lidless Stare.");
      return null;
    }

    const placedTemplate = await this.actor._placeFlameTemplate?.({
      sourceToken,
      distance: 15,
      angle: 90
    });
    if (!placedTemplate) return null;

    const direction = Number(placedTemplate.direction ?? placedTemplate.document?.direction ?? 0);
    const coneTargets = this.actor._getFlameTemplateTargets?.({
      sourceToken,
      direction,
      distance: 15,
      angle: 90
    }) ?? [];

    await this.actor._playAutomatedAttackAnimation?.(item, coneTargets);

    const mastery = this._normalizeNavigatorPowerMastery(item?.system?.mastery ?? "n/a");
    const enhancedMastery = mastery === "adept10" || mastery === "master20";
    const masterMastery = mastery === "master20";
    const masteryModifier = this._getNavigatorPowerMasteryModifier(item);
    const willpowerBonus = Number(this.actor.getCharacteristicBonus?.("willpower") ?? 0) || 0;
    const damageFormula = `${enhancedMastery ? "2d10" : "1d10"} + ${willpowerBonus}`;
    const navigatorResult = await this.actor.rollCharacteristic("willpower", {
      label: `${this.actor.name}: The Lidless Stare`,
      modifier: masteryModifier,
      extra: [
        "Navigator Power: The Lidless Stare",
        "Template: 90-degree cone, 15 m",
        ...(masteryModifier ? [`Mastery Bonus: +${masteryModifier}`] : []),
        `Targets in Cone: ${coneTargets.length}`
      ]
    });
    if (!navigatorResult) return null;

    if (!navigatorResult.success) {
      const currentFatigue = Math.max(0, Number(this.actor.system?.resources?.fatigue ?? 0) || 0);
      const newFatigue = currentFatigue + 2;
      await this.actor.update({
        "system.resources.fatigue": newFatigue
      });
      await this.actor.syncFatigueStates?.({ sourceName: item.name, announced: false });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: The Lidless Stare</h3>
            <p><strong>Outcome:</strong> Failed (${navigatorResult.degrees} DoF)</p>
            <p><strong>Backlash:</strong> The Navigator suffers 2 Fatigue.</p>
            <p><strong>Fatigue:</strong> ${currentFatigue} -> ${newFatigue}</p>
          </div>
        `
      });

      return {
        navigatorResult,
        coneTargets,
        failed: true
      };
    }

    const targetSummaries = [];
    for (const token of coneTargets) {
      const targetActor = token?.actor;
      if (!targetActor?.rollCharacteristic) continue;

      const targetResult = await targetActor.rollCharacteristic("willpower", {
        label: `${targetActor.name}: Resist The Lidless Stare`,
        modifier: 0,
        extra: [
          `Against: ${this.actor.name}`,
          "Navigator Power: The Lidless Stare"
        ]
      });

      const navigatorDos = Math.max(0, Number(navigatorResult.degrees ?? 0));
      const targetDos = targetResult?.success ? Math.max(0, Number(targetResult.degrees ?? 0)) : 0;
      const targetBeaten = Boolean(
        navigatorResult.success
        && (
          !targetResult?.success
          || navigatorDos > targetDos
        )
      );

      let damageRoll = null;
      let applied = null;
      let stunnedApplied = false;
      let stunRounds = 0;
      let stunRoll = null;
      let insanityRoll = null;
      let insanityApplied = 0;
      let toughnessResult = null;
      let slainApplied = false;
      if (targetBeaten) {
        damageRoll = await (new Roll(damageFormula)).evaluate({ async: true });
        applied = await targetActor.applyDirectDamage?.({
          damage: Number(damageRoll.total ?? 0),
          location: "Body",
          damageType: "E",
          sourceName: "The Lidless Stare"
        });
        if (Number(applied?.appliedDamage ?? 0) > 0) {
          if (enhancedMastery) {
            stunRoll = await (new Roll("1d5")).evaluate({ async: true });
            stunRounds = Math.max(1, Number(stunRoll.total ?? 0) || 1);
          } else {
            stunRounds = 1;
          }

          const intelligence = Number(
            targetActor.getCharacteristicValue?.("intelligence")
            ?? targetActor.system?.characteristics?.intelligence?.value
            ?? 0
          ) || 0;

          if (masterMastery && intelligence >= 20) {
            toughnessResult = await targetActor.rollCharacteristic("toughness", {
              label: `${targetActor.name}: Survive The Lidless Stare`,
              modifier: -10,
              extra: [
                `Against: ${this.actor.name}`,
                "Navigator Power: The Lidless Stare",
                "Mastery Effect: Death test at -10"
              ]
            });

            if (!toughnessResult?.success) {
              slainApplied = await targetActor.applyDead?.({ sourceName: "The Lidless Stare" }) ?? false;
            } else {
              insanityRoll = await (new Roll("1d10")).evaluate({ async: true });
            }
          } else if (enhancedMastery) {
            insanityRoll = await (new Roll("1d5")).evaluate({ async: true });
          }

          stunnedApplied = slainApplied
            ? false
            : await targetActor.applyStunned?.(stunRounds, { sourceName: "The Lidless Stare" }) ?? false;

          if (Number(insanityRoll?.total ?? 0) > 0) {
            const currentInsanity = Math.max(0, Number(targetActor.system?.insanity?.points ?? 0) || 0);
            insanityApplied = Number(insanityRoll.total ?? 0) || 0;
            await targetActor.update({
              "system.insanity.points": currentInsanity + insanityApplied
            });
          }
        }
      }

      targetSummaries.push({
        name: targetActor.name,
        targetResult,
        targetBeaten,
        damageTotal: Number(damageRoll?.total ?? 0) || 0,
        appliedDamage: Number(applied?.appliedDamage ?? 0) || 0,
        stunnedApplied,
        stunRounds,
        insanityApplied,
        toughnessResult,
        slainApplied
      });
    }

    const summaryMarkup = targetSummaries.length
      ? targetSummaries.map((summary) => `
          <div class="lidless-stare-target-result">
            <p><strong>${summary.name}</strong></p>
            <p>Target Willpower: ${summary.targetResult?.success ? `Success (${summary.targetResult.degrees} DoS)` : `Failed (${summary.targetResult?.degrees ?? 0} DoF)`}</p>
            <p>Outcome: ${summary.targetBeaten ? "Overwhelmed" : "Resisted"}</p>
            ${summary.targetBeaten ? `<p>Damage: ${summary.damageTotal} E (${summary.appliedDamage} applied, ignores Armour and Toughness)</p>` : ""}
            ${summary.stunnedApplied ? `<p>Stunned: ${summary.stunRounds} ${summary.stunRounds === 1 ? "round" : "rounds"}</p>` : ""}
            ${summary.insanityApplied ? `<p>Insanity: +${summary.insanityApplied}</p>` : ""}
            ${summary.toughnessResult ? `<p>Toughness -10: ${summary.toughnessResult.success ? `Success (${summary.toughnessResult.degrees} DoS)` : `Failed (${summary.toughnessResult.degrees} DoF)`}</p>` : ""}
            ${summary.slainApplied ? "<p>Outcome: Slain</p>" : ""}
          </div>
        `).join("")
      : "<p>No targets were inside the cone.</p>";

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: The Lidless Stare</h3>
          <p><strong>Navigator Test:</strong> Success (${navigatorResult.degrees} DoS)</p>
          <p><strong>Template:</strong> 90-degree cone, 15 m</p>
          <p><strong>Targets in Cone:</strong> ${coneTargets.length}</p>
          <div class="roguetrader-roll-card-details">
            ${summaryMarkup}
          </div>
        </div>
      `
    });

    return {
      navigatorResult,
      coneTargets,
      targetSummaries,
      placedTemplate
    };
  }

  async _onToggleBraced(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    if (String(item.system?.class ?? "").trim().toLowerCase() !== "heavy") return;

    await this.actor.toggleBraced?.({ sourceName: item.name });
  }

  async _onClearJammedWeapon(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    await this.actor.clearJammedWeapon?.(item);
    this.render(false);
  }

  async _onSpendFateToHeal(event) {
    event.preventDefault();
    await this.actor.spendFateToHeal?.();
  }

  async _onOpenAdvancementWindow(event) {
    event.preventDefault();
    if (!this._advancementWindow) {
      this._advancementWindow = new RogueTraderAdvancementWindow(this);
    }

    this._advancementWindow.render(true);
  }

  async _onToggleEquipped(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    if (item.type === "weapon" && !item.system.equipped) {
      const validation = this.actor.getWeaponEquipValidation?.(item) ?? { ok: true, reason: "" };
      if (!validation.ok) {
        ui.notifications?.warn(`Rogue Trader | ${validation.reason}`);
        return;
      }

      const equippedOrder = await this.actor.getNextEquippedWeaponOrder?.();
      await item.update({
        "system.equipped": true,
        ...(Number.isFinite(Number(equippedOrder)) ? { "flags.roguetrader.equippedOrder": Number(equippedOrder) } : {})
      });
      return;
    }

    await item.update({
      "system.equipped": !item.system.equipped,
      ...(item.type === "weapon" && item.system.equipped ? { "flags.roguetrader.equippedOrder": null } : {})
    });
  }

  async _onDeleteItem(event) {
    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    await item.delete();
  }

  _onConsequenceDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("is-drop-target");
  }

  _onConsequenceDragLeave(event) {
    event.currentTarget.classList.remove("is-drop-target");
  }

  async _onConsequenceDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    await this._maybeHandleConsequenceDrop(event);
  }

  async _maybeHandleConsequenceDrop(event) {
    const dropZone = event.target?.closest?.(".consequence-drop-zone");
    if (!dropZone) return false;

    dropZone.classList.remove("is-drop-target");

    let data;
    try {
      data = TextEditor.getDragEventData(event);
    } catch (_error) {
      return false;
    }

    if (!data || data.type !== "Item") return false;

    const acceptedTypes = `${dropZone.dataset.acceptedTypes ?? ""}`
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    if (acceptedTypes.length && !acceptedTypes.includes(item.type)) {
      ui.notifications?.warn(`Rogue Trader | ${dropZone.dataset.dropLabel ?? "This section"} only accepts ${acceptedTypes.join(", ")} items.`);
      return true;
    }

    const itemData = item.toObject();
    delete itemData._id;
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
    return true;
  }
}





