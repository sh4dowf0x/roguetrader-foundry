import { promptAttackTest, promptCharacteristicTest, promptSkillTest } from "./rolls.js";

const CHARACTERISTIC_DEFINITIONS = [
  { key: "weaponSkill", label: "WS", fullLabel: "Weapon Skill", hasBonus: false },
  { key: "ballisticSkill", label: "BS", fullLabel: "Ballistic Skill", hasBonus: false },
  { key: "strength", label: "S", fullLabel: "Strength", hasBonus: true },
  { key: "toughness", label: "T", fullLabel: "Toughness", hasBonus: true },
  { key: "agility", label: "Ag", fullLabel: "Agility", hasBonus: true },
  { key: "intelligence", label: "Int", fullLabel: "Intelligence", hasBonus: true },
  { key: "perception", label: "Per", fullLabel: "Perception", hasBonus: true },
  { key: "willpower", label: "WP", fullLabel: "Willpower", hasBonus: true },
  { key: "fellowship", label: "Fel", fullLabel: "Fellowship", hasBonus: true }
];

const ARMOR_LOCATION_DEFINITIONS = [
  { key: "head", label: "Head", sourceKey: "head" },
  { key: "rightArm", label: "R Arm", sourceKey: "arms" },
  { key: "leftArm", label: "L Arm", sourceKey: "arms" },
  { key: "body", label: "Body", sourceKey: "body" },
  { key: "rightLeg", label: "R Leg", sourceKey: "legs" },
  { key: "leftLeg", label: "L Leg", sourceKey: "legs" }
];

const ITEM_TYPE_LABELS = {
  weapon: "Weapon",
  armor: "Armor",
  gear: "Gear",
  consumable: "Consumable",
  tool: "Tool",
  cybernetic: "Cybernetic",
  skill: "Skill",
  talent: "Talent",
  psychicTechnique: "Psychic Technique",
  navigatorPower: "Navigator Power",
  psychicPower: "Psychic Power",
  mutation: "Mutation",
  malignancy: "Malignancy",
  mentalDisorder: "Mental Disorder",
  criticalInjury: "Critical Injury"
};

const WEAPON_CLASS_LABELS = {
  basic: "Basic",
  melee: "Melee",
  pistol: "Pistol",
  thrown: "Thrown",
  heavy: "Heavy"
};

const CHARACTERISTIC_SHORT = {
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

const INVENTORY_TYPES = new Set(["weapon", "armor", "gear", "consumable", "tool", "cybernetic"]);

export class RogueTraderNPCSheet extends ActorSheet {
  static register() {
    Actors.registerSheet("roguetrader", RogueTraderNPCSheet, {
      types: ["npc"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "actor", "npc"],
      width: 920,
      height: 760,
      template: "systems/roguetrader/templates/actors/npc-sheet.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    const inventoryItems = this.actor.items
      .filter((item) => INVENTORY_TYPES.has(item.type))
      .sort((a, b) => a.name.localeCompare(b.name));
    const equippedArmor = inventoryItems.filter((item) => item.type === "armor" && item.system?.equipped);
    const equippedWeapons = inventoryItems.filter((item) => item.type === "weapon" && item.system?.equipped);
    const skills = this.actor.items
      .filter((item) => item.type === "skill")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => this._buildSkillEntry(item));
    const talents = this.actor.items
      .filter((item) => item.type === "talent" && String(item.system?.category ?? "").trim().toLowerCase() !== "trait")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => this._buildSimpleItemEntry(item));
    const traits = this.actor.items
      .filter((item) => item.type === "talent" && String(item.system?.category ?? "").trim().toLowerCase() === "trait")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => this._buildSimpleItemEntry(item));

    const agilityBonus = this.actor.getMovementAgilityBonus?.()
      ?? this.actor.getCharacteristicBonus?.("agility")
      ?? 0;

    context.actor = this.actor;
    context.system = this.actor.system;
    context.npc = {
      characteristics: CHARACTERISTIC_DEFINITIONS.map((definition) => ({
        ...definition,
        value: Number(this.actor.system.characteristics?.[definition.key]?.value ?? 0),
        bonus: this.actor.getDisplayedCharacteristicBonus?.(definition.key) ?? this.actor.getCharacteristicBonus?.(definition.key) ?? 0,
        bonusMultiplier: this.actor.getCharacteristicBonusMultiplier?.(definition.key) ?? 1,
        showDerivedBonus: Boolean(definition.hasBonus) && (
          Number(this.actor.getCharacteristicBonusMultiplier?.(definition.key) ?? 1) > 1
          || (definition.key === "toughness" && this.actor.hasTrait?.("daemonic"))
        ),
        tempModifier: this.actor.getCharacteristicTotalModifier?.(definition.key) ?? 0,
        tempStateClass: this._getTempStateClass(this.actor.getCharacteristicTotalModifier?.(definition.key) ?? 0)
      })),
      movement: {
        half: agilityBonus,
        full: agilityBonus * 2,
        charge: agilityBonus * 3,
        run: agilityBonus * 6
      },
      wounds: {
        current: Number(this.actor.system.resources?.wounds?.value ?? 0),
        max: this.actor.getEffectiveWoundsMax?.() ?? Number(this.actor.system.resources?.wounds?.max ?? 0),
        critical: Number(this.actor.system.resources?.criticalDamage ?? 0),
        fatigue: Number(this.actor.system.resources?.fatigue ?? 0)
      },
      armorLocations: this._buildArmorLocationSummary(equippedArmor),
      equippedWeapons: equippedWeapons.map((item) => this._buildWeaponEntry(item)),
      inventory: inventoryItems.map((item) => this._buildInventoryEntry(item)),
      skills,
      talents,
      traits,
      hasSkills: skills.length > 0,
      hasTalents: talents.length > 0,
      hasTraits: traits.length > 0,
      hasWeapons: equippedWeapons.length > 0,
      hasInventory: inventoryItems.length > 0
    };

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".npc-skill-name-button, .npc-reference-item-button, .npc-item-open").attr("draggable", true);
    html.find(".npc-characteristic-roll-button").on("click", this._onCharacteristicRoll.bind(this));
    html.find(".npc-skill-name-button").on("click", this._onSkillRoll.bind(this));
    html.find(".npc-skill-name-button").on("contextmenu", this._onSkillRemove.bind(this));
    html.find(".npc-reference-item-button").on("click", this._onItemOpen.bind(this));
    html.find(".npc-reference-item-button").on("contextmenu", this._onReferenceItemRemove.bind(this));
    html.find(".npc-skill-name-button, .npc-reference-item-button, .npc-item-open").on("dragstart", this._onItemDragStart.bind(this));
    html.find(".npc-weapon-attack-button").on("click", this._onWeaponAttack.bind(this));
    html.find(".weapon-brace-button").on("click", this._onToggleBraced.bind(this));
    html.find(".weapon-clear-jam-button").on("click", this._onClearJammedWeapon.bind(this));
    html.find(".npc-item-open").on("click", this._onItemOpen.bind(this));
    html.find(".item-toggle-equipped").on("click", this._onToggleEquipped.bind(this));
    html.find(".item-delete-button").on("click", this._onDeleteItem.bind(this));
  }

  async _onCharacteristicRoll(event) {
    event.preventDefault();
    const characteristicKey = String(event.currentTarget.dataset.characteristicKey ?? "");
    if (!characteristicKey) return;
    await promptCharacteristicTest(this.actor, characteristicKey);
  }

  async _onSkillRoll(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await promptSkillTest(this.actor, item);
  }

  async _onSkillRemove(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
      title: "Remove Skill",
      content: `<p>Remove <strong>${item.name}</strong> from this NPC?</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;
    await item.delete();
  }

  async _onReferenceItemRemove(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
      title: `Remove ${item.type === "talent" && String(item.system?.category ?? "").trim().toLowerCase() === "trait" ? "Trait" : "Talent"}`,
      content: `<p>Remove <strong>${item.name}</strong> from this NPC?</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;
    await item.delete();
  }

  async _onWeaponAttack(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await promptAttackTest(this.actor, item);
  }

  async _onToggleBraced(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    if (String(item.system?.class ?? "").trim().toLowerCase() !== "heavy") return;
    await this.actor.toggleBraced?.({ sourceName: item.name });
  }

  async _onClearJammedWeapon(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await this.actor.clearJammedWeapon?.(item);
    this.render(false);
  }

  async _onItemOpen(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    item.sheet?.render(true);
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

  async _onToggleEquipped(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;

    if (item.type === "weapon" && !item.system?.equipped) {
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
      "system.equipped": !item.system?.equipped,
      ...(item.type === "weapon" && item.system?.equipped ? { "flags.roguetrader.equippedOrder": null } : {})
    });
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget.dataset.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.delete();
  }

  _buildSkillEntry(item) {
    const characteristicKey = item.system?.characteristic ?? "intelligence";
    const advanceBonus = item.system?.advance20
      ? 20
      : (item.system?.advance10 ? 10 : 0);
    const itemBonus = Number(item.system?.bonus ?? 0);
    const itemDrivenModifier = this.actor.getSkillItemModifier?.(item.name) ?? 0;
    const totalModifier = advanceBonus + itemBonus + itemDrivenModifier;
    const modifierLabel = totalModifier === 0 ? "" : ` ${totalModifier > 0 ? "+" : ""}${totalModifier}`;
    const trainingFlags = [
      item.system?.trained ? "Trained" : (item.system?.basic ? "Basic" : ""),
      item.system?.advance10 ? "+10" : "",
      item.system?.advance20 ? "+20" : ""
    ].filter(Boolean).join(", ");

    return {
      id: item.id,
      name: item.name,
      characteristicShort: CHARACTERISTIC_SHORT[characteristicKey] ?? characteristicKey,
      modifierLabel,
      trainingFlags,
      shortSummary: `${item.name} (${CHARACTERISTIC_SHORT[characteristicKey] ?? characteristicKey})${modifierLabel}`
    };
  }

  _buildSimpleItemEntry(item) {
    const rating = String(item.system?.rating ?? "").trim();
    return {
      id: item.id,
      name: rating ? `${item.name} (${rating})` : item.name,
      benefit: String(item.system?.benefit ?? "").trim()
    };
  }

  _buildWeaponEntry(item) {
    const weaponClass = String(item.system?.class ?? "basic").trim().toLowerCase();
    return {
      id: item.id,
      name: item.name,
      isJammed: Boolean(item.flags?.roguetrader?.jammed),
      isHeavy: weaponClass === "heavy",
      isBraced: this.actor.isHeavyWeaponBraced?.(item) ?? false,
      alwaysBraced: this.actor.isAlwaysBracedForHeavyWeapons?.() ?? false,
      classLabel: WEAPON_CLASS_LABELS[weaponClass] ?? weaponClass,
      damage: item.system?.damage || "-",
      penetration: Number(item.system?.penetration ?? 0),
      range: weaponClass === "melee" ? "Melee" : `${Number(item.system?.range ?? 0)}m`,
      rof: weaponClass === "melee" ? "-" : (item.system?.rof || "-"),
      clip: weaponClass === "melee" || weaponClass === "thrown"
        ? "-"
        : `${Number(item.system?.currentClip ?? item.system?.clip ?? 0)}/${Number(item.system?.clip ?? 0)}`,
      reload: item.system?.reload || "-"
    };
  }

  _buildInventoryEntry(item) {
    return {
      id: item.id,
      name: item.name,
      img: item.img,
      typeLabel: ITEM_TYPE_LABELS[item.type] ?? item.type,
      equipped: Boolean(item.system?.equipped),
      shortDescription: this._getItemShortDescription(item)
    };
  }

  _buildArmorLocationSummary(equippedArmor) {
    const machineArmourBonus = Number(this.actor.getMachineArmourBonus?.() ?? 0);
    const naturalArmourBonus = Number(this.actor.getNaturalArmourBonus?.() ?? 0);

    return ARMOR_LOCATION_DEFINITIONS.map((location) => {
      const worn = equippedArmor.reduce((total, item) => {
        if (!item.system?.locations?.[location.sourceKey]) return total;
        return total + Number(item.system?.ap?.[location.sourceKey] ?? 0);
      }, 0);
      return {
        key: location.key,
        label: location.label,
        ap: worn + machineArmourBonus + naturalArmourBonus
      };
    });
  }

  _getItemShortDescription(item) {
    return String(
      item.system?.benefit
      ?? item.system?.shortDescription
      ?? item.system?.description
      ?? ""
    ).replace(/<[^>]+>/g, "").trim();
  }

  _getTempStateClass(modifier) {
    const value = Number(modifier ?? 0);
    if (value > 0) return "is-buffed";
    if (value < 0) return "is-debuffed";
    return "";
  }
}
