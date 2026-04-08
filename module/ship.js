import { RogueTraderShipConstructionApplication } from "./ship-construction.js";
import { rollStarshipWeaponAttack } from "./starship-combat.js";
import { rollD100Test } from "./rolls.js";

const SHIP_WEAPON_LOCATION_LABELS = {
  dorsal: "Dorsal",
  prow: "Prow",
  keel: "Keel",
  port: "Port",
  starboard: "Starboard"
};

const SHIP_WEAPON_CLASS_LABELS = {
  macrobattery: "Macrobattery",
  lance: "Lance",
  torpedo: "Torpedo Tube",
  bay: "Landing Bay",
  nova: "Nova Cannon",
  other: "Other"
};

const SHIP_CONTROL_MODE_OPTIONS = [
  { value: "player", label: "Player Ship" },
  { value: "npc", label: "NPC Ship" }
];

const NPC_CREW_RATING_OPTIONS = [
  { value: 20, label: "Incompetent (20)" },
  { value: 30, label: "Competent (30)" },
  { value: 40, label: "Crack (40)" },
  { value: 50, label: "Veteran (50)" },
  { value: 60, label: "Elite (60)" }
];
const ACTIVE_AUGURY_SEQUENCE_FILE = "jb2a.template_circle.radar.loop.800px.001.sweep.greenpurple";
const ACTIVE_AUGURY_RADIUS_METERS = 20;
const ACTIVE_AUGURY_PING_FILE = "jb2a.template_circle.radar.loop.ping.001.300px.triangle.greenpurple";
const ACTIVE_AUGURY_PING_DURATION_MS = 30000;

const CARGO_ITEM_TYPES = new Set(["gear", "consumable", "tool", "cybernetic", "armor", "weapon"]);
const SHIP_ROSTER_ROLES = [
  { key: "captain", label: "Captain", primaryLabel: "Command", characteristicKey: "fellowship", skillName: "Command" },
  { key: "helmsman", label: "Helmsman", primaryLabel: "Pilot (Spacecraft)", characteristicKey: "agility", skillName: "Pilot (Spacecraft)" },
  { key: "masterOfAetherics", label: "Master of Aetherics", primaryLabel: "Scrutiny", characteristicKey: "perception", skillName: "Scrutiny" },
  { key: "masterGunner", label: "Master Gunner", primaryLabel: "Ballistic Skill", characteristicKey: "ballisticSkill", skillName: "" },
  { key: "chiefEnginseer", label: "Chief Enginseer", primaryLabel: "Tech-Use", characteristicKey: "intelligence", skillName: "Tech-Use" },
  { key: "navigator", label: "Navigator", primaryLabel: "Navigation (Stellar)", characteristicKey: "intelligence", skillName: "Navigation (Stellar)" }
];

function normalizeSkillName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getShipTokenCenter(tokenLike) {
  const token = tokenLike?.object ?? tokenLike ?? null;
  if (token?.center) return token.center;

  const document = tokenLike?.document ?? tokenLike ?? null;
  if (!document || !canvas?.grid) return { x: 0, y: 0 };

  const gridSize = Number(canvas.grid.size ?? 100) || 100;
  const width = Number(document.width ?? 1) || 1;
  const height = Number(document.height ?? 1) || 1;
  return {
    x: Number(document.x ?? 0) + (width * gridSize) / 2,
    y: Number(document.y ?? 0) + (height * gridSize) / 2
  };
}

function getDistanceMetersBetweenTokens(leftToken, rightToken) {
  const left = getShipTokenCenter(leftToken);
  const right = getShipTokenCenter(rightToken);
  const dx = Number(right.x ?? 0) - Number(left.x ?? 0);
  const dy = Number(right.y ?? 0) - Number(left.y ?? 0);
  const pixelDistance = Math.hypot(dx, dy);
  const gridSize = Number(canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100) || 100;
  const gridDistance = Number(canvas?.grid?.distance ?? canvas?.dimensions?.distance ?? 1) || 1;
  return (pixelDistance / gridSize) * gridDistance;
}

function getDistanceVuBetweenTokens(leftToken, rightToken) {
  return getDistanceMetersBetweenTokens(leftToken, rightToken);
}

export class RogueTraderShipSheet extends ActorSheet {
  static register() {
    Actors.registerSheet("roguetrader", RogueTraderShipSheet, {
      types: ["ship"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "actor", "ship"],
      width: 1280,
      height: 940,
      template: "systems/roguetrader/templates/actors/ship-sheet.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    const items = Array.from(this.actor.items ?? []);
    const effectiveSpeed = this.actor.getEffectiveShipSpeed?.() ?? (Number(this.actor.system?.speed ?? 0) || 0);
    const effectiveManeuverability = this.actor.getEffectiveShipManeuverability?.() ?? (Number(this.actor.system?.maneuverability ?? 0) || 0);
    const effectiveDetection = this.actor.getEffectiveShipDetection?.() ?? (Number(this.actor.system?.detection ?? 0) || 0);
    const starshipHulls = items
      .filter((item) => item.type === "starshipHull")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildStarshipHullEntry(item));
    const essentialComponents = items
      .filter((item) => item.type === "essentialComponent" || item.type === "shipComponent")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildComponentEntry(item));
    const supplementalComponents = items
      .filter((item) => item.type === "supplementalComponent")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildComponentEntry(item));
    const shipWeapons = items
      .filter((item) => item.type === "shipWeapon")
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildShipWeaponEntry(item));
    const cargo = items
      .filter((item) => CARGO_ITEM_TYPES.has(item.type))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => this._buildCargoEntry(item));

    const essentialPowerUsed = essentialComponents.reduce((total, component) => total + component.power, 0);
    const supplementalPowerUsed = supplementalComponents.reduce((total, component) => total + component.power, 0);
    const essentialSpaceUsed = essentialComponents.reduce((total, component) => total + component.space, 0);
    const supplementalSpaceUsed = supplementalComponents.reduce((total, component) => total + component.space, 0);
    const powerUsed = essentialPowerUsed + supplementalPowerUsed;
    const spaceUsed = essentialSpaceUsed + supplementalSpaceUsed;
    const weaponLocationUsage = this._buildWeaponLocationUsage(shipWeapons);
    const activeHull = this._getActiveHullEntry(starshipHulls);
    const roster = this._buildShipRoster();

    context.actor = this.actor;
    context.system = this.actor.system;
    context.ship = {
      starshipHulls,
      activeHull,
      hasStarshipHulls: starshipHulls.length > 0,
      essentialComponents,
      supplementalComponents,
      shipWeapons,
      cargo,
      roster,
      hasEssentialComponents: essentialComponents.length > 0,
      hasSupplementalComponents: supplementalComponents.length > 0,
      hasShipWeapons: shipWeapons.length > 0,
      hasCargo: cargo.length > 0,
      art: this.actor.img || "icons/svg/ship.svg",
      controlMode: String(this.actor.system?.controlMode ?? "player").trim().toLowerCase() === "npc" ? "npc" : "player",
      controlModeOptions: SHIP_CONTROL_MODE_OPTIONS.map((option) => ({
        ...option,
        selected: option.value === (String(this.actor.system?.controlMode ?? "player").trim().toLowerCase() === "npc" ? "npc" : "player")
      })),
      npcCrewRating: Number(this.actor.system?.npcCrewRating ?? 30) || 30,
      npcCrewRatingOptions: NPC_CREW_RATING_OPTIONS.map((option) => ({
        ...option,
        selected: option.value === (Number(this.actor.system?.npcCrewRating ?? 30) || 30)
      })),
      isNpcControlled: String(this.actor.system?.controlMode ?? "player").trim().toLowerCase() === "npc",
      isCrippled: Boolean(this.actor.isCrippled?.()),
      effectiveSpeed,
      effectiveManeuverability,
      effectiveDetection,
      powerUsed,
      spaceUsed,
      weaponLocationUsage,
      weaponCapacitySummary: Object.entries(SHIP_WEAPON_LOCATION_LABELS)
        .map(([key, label]) => ({
          key,
          label,
          max: Math.max(0, Number(this.actor.system?.weaponCapacity?.[key] ?? 0) || 0)
        }))
        .filter((slot) => slot.max > 0),
      weaponCapacityDisplay: Object.entries(SHIP_WEAPON_LOCATION_LABELS)
        .map(([key, label]) => ({
          key,
          label,
          max: Math.max(0, Number(this.actor.system?.weaponCapacity?.[key] ?? 0) || 0)
        }))
        .filter((slot) => slot.max > 0)
        .map((slot) => `${slot.label} ${slot.max}`)
        .join(", ")
    };

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ship-item-open").attr("draggable", true);
    html.find(".ship-item-open").on("click", this._onItemOpen.bind(this));
    html.find(".ship-item-open").on("dragstart", this._onItemDragStart.bind(this));
    html.find(".ship-item-delete").on("click", this._onDeleteItem.bind(this));
    html.find(".ship-weapon-fire").on("click", this._onShipWeaponFire.bind(this));
    html.find(".ship-item-create").on("click", this._onCreateItem.bind(this));
    html.find(".ship-construct-button").on("click", this._onConstructVoidship.bind(this));
    html.find(".ship-roster-clear").on("click", this._onClearRosterAssignment.bind(this));
    html.find(".ship-profile-roll").on("click", this._onShipProfileRoll.bind(this));
  }

  _buildStarshipHullEntry(item) {
    return {
      id: item.id,
      name: item.name,
      class: String(item.system?.class ?? "").trim(),
      dimensions: String(item.system?.dimensions ?? "").trim(),
      mass: String(item.system?.mass ?? "").trim(),
      crewComplement: String(item.system?.crewComplement ?? "").trim(),
      acceleration: String(item.system?.acceleration ?? "").trim(),
      speed: Number(item.system?.speed ?? 0) || 0,
      maneuverability: Number(item.system?.maneuverability ?? 0) || 0,
      detection: Number(item.system?.detection ?? 0) || 0,
      hullIntegrity: Number(item.system?.hullIntegrity ?? 0) || 0,
      armor: Number(item.system?.armor ?? 0) || 0,
      turretRating: Number(item.system?.turretRating ?? 0) || 0,
      shields: Number(item.system?.shields ?? 0) || 0,
      space: Number(item.system?.space ?? 0) || 0,
      shipPoints: Number(item.system?.shipPoints ?? 0) || 0,
      shortDescription: String(item.system?.shortDescription ?? "").trim(),
      specialRules: String(item.system?.specialRules ?? "").trim(),
      active: String(this.actor.system?.activeHullItemId ?? "") === String(item.id)
    };
  }

  _getActiveHullEntry(hulls) {
    return hulls.find((hull) => hull.active) ?? hulls[0] ?? null;
  }

  _buildComponentEntry(item) {
    return {
      id: item.id,
      name: item.name,
      power: Number(item.system?.power ?? 0) || 0,
      space: Number(item.system?.space ?? 0) || 0,
      shortDescription: String(item.system?.shortDescription ?? "").trim()
    };
  }

  _buildShipWeaponEntry(item) {
    const locationKey = String(item.system?.location ?? "dorsal").trim().toLowerCase();
    const strengthData = this.actor.getEffectiveShipWeaponStrength?.(item) ?? {
      effectiveValue: 0,
      label: String(item.system?.strength ?? "").trim()
    };
    return {
      id: item.id,
      name: item.name,
      weaponClass: String(item.system?.weaponClass ?? "macrobattery").trim().toLowerCase(),
      weaponClassLabel: SHIP_WEAPON_CLASS_LABELS[String(item.system?.weaponClass ?? "macrobattery").trim().toLowerCase()] ?? "Weapon",
      power: Number(item.system?.power ?? 0) || 0,
      space: Number(item.system?.space ?? 0) || 0,
      strength: strengthData.label,
      rawStrength: String(item.system?.strength ?? "").trim(),
      effectiveStrength: Number(strengthData.effectiveValue ?? 0) || 0,
      critRating: String(item.system?.critRating ?? "").trim(),
      damage: String(item.system?.damage ?? "").trim(),
      range: String(item.system?.range ?? "").trim(),
      location: locationKey,
      locationLabel: SHIP_WEAPON_LOCATION_LABELS[locationKey] ?? "Unknown",
      shortDescription: String(item.system?.shortDescription ?? "").trim()
    };
  }

  _buildCargoEntry(item) {
    return {
      id: item.id,
      name: item.name,
      typeLabel: this._getCargoTypeLabel(item.type),
      shortDescription: String(item.system?.shortDescription ?? item.system?.description ?? "").trim()
    };
  }

  _buildShipRoster() {
    const rosterState = this.actor.system?.roster ?? {};

    return SHIP_ROSTER_ROLES.map((role) => {
      const actorUuid = String(rosterState?.[role.key]?.actorUuid ?? "").trim();
      const assignedActor = actorUuid ? fromUuidSync(actorUuid) : null;
      const primaryValue = this._getRosterRolePrimaryValue(assignedActor, role);

      return {
        ...role,
        actorUuid,
        assignedActor,
        assignedName: assignedActor?.name ?? "Unassigned",
        portrait: assignedActor?.img || "icons/svg/mystery-man.svg",
        primaryValueLabel: primaryValue.label,
        isAssigned: Boolean(assignedActor)
      };
    });
  }

  _getShipRosterRole(roleKey) {
    return SHIP_ROSTER_ROLES.find((entry) => entry.key === roleKey) ?? null;
  }

  _getRosterRolePrimaryValue(actor, role) {
    if (!actor) return { value: null, label: "-" };

    if (!role.skillName) {
      const value = Number(
        actor.getCharacteristicValue?.(role.characteristicKey)
        ?? actor.system?.characteristics?.[role.characteristicKey]?.value
        ?? 0
      ) || 0;
      return { value, label: `${value}` };
    }

    const characteristicValue = Number(
      actor.getCharacteristicValue?.(role.characteristicKey)
      ?? actor.system?.characteristics?.[role.characteristicKey]?.value
      ?? 0
    ) || 0;

    const skill = Array.from(actor.items ?? []).find((item) =>
      item.type === "skill" && normalizeSkillName(item.name) === normalizeSkillName(role.skillName)
    );

    if (!skill) {
      return { value: null, label: "Untrained" };
    }

    const trained = Boolean(skill.system?.trained);
    const basic = Boolean(skill.system?.basic);
    if (!trained && !basic) {
      return { value: null, label: "Untrained" };
    }

    const characteristicTarget = !trained && basic
      ? Math.floor(characteristicValue / 2)
      : characteristicValue;
    const advanceBonus = (skill.system?.advance10 ? 10 : 0) + (skill.system?.advance20 ? 20 : 0);
    const itemBonus = Number(skill.system?.bonus ?? 0) || 0;
    const itemDrivenModifier = Number(actor.getSkillItemModifier?.(skill.name) ?? 0) || 0;
    const total = characteristicTarget + advanceBonus + itemBonus + itemDrivenModifier;

    return {
      value: total,
      label: `${total}${!trained && basic ? " (Basic)" : ""}`
    };
  }

  _buildWeaponLocationUsage(shipWeapons) {
    const usage = {
      dorsal: 0,
      prow: 0,
      keel: 0,
      port: 0,
      starboard: 0
    };

    for (const weapon of shipWeapons) {
      if (!usage.hasOwnProperty(weapon.location)) continue;
      usage[weapon.location] += 1;
    }

    return usage;
  }

  _getCargoTypeLabel(itemType) {
    switch (String(itemType ?? "")) {
      case "weapon": return "Weapon";
      case "armor": return "Armor";
      case "gear": return "Gear";
      case "consumable": return "Consumable";
      case "tool": return "Tool";
      case "cybernetic": return "Cybernetic";
      default: return "Item";
    }
  }

  async _ensureOwnedHullItem(sourceItem) {
    if (!sourceItem) return null;
    if (sourceItem.parent?.uuid === this.actor.uuid) return sourceItem;

    const [created] = await this.actor.createEmbeddedDocuments("Item", [{
      name: sourceItem.name,
      type: "starshipHull",
      img: sourceItem.img,
      system: foundry.utils.deepClone(sourceItem.system ?? {})
    }]);

    return created ?? null;
  }

  async applyStarshipHullToShip(sourceItem) {
    const ownedHull = await this._ensureOwnedHullItem(sourceItem);
    if (!ownedHull) return null;

    const system = ownedHull.system ?? {};
    await this.actor.update({
      "system.activeHullItemId": ownedHull.id,
      "system.class": String(system.class ?? ""),
      "system.hull": ownedHull.name,
      "system.dimensions": String(system.dimensions ?? ""),
      "system.mass": String(system.mass ?? ""),
      "system.crewComplement": String(system.crewComplement ?? ""),
      "system.acceleration": String(system.acceleration ?? ""),
      "system.description": String(system.description ?? ""),
      "system.speed": Number(system.speed ?? 0) || 0,
      "system.maneuverability": Number(system.maneuverability ?? 0) || 0,
      "system.detection": Number(system.detection ?? 0) || 0,
      "system.turretRating": Number(system.turretRating ?? 0) || 0,
      "system.shields": Number(system.shields ?? 0) || 0,
      "system.armor": Number(system.armor ?? 0) || 0,
      "system.space.value": Number(system.space ?? 0) || 0,
      "system.shipPoints.value": Number(system.shipPoints ?? 0) || 0,
      "system.resources.hullIntegrity.max": Number(system.hullIntegrity ?? 0) || 0,
      "system.resources.hullIntegrity.value": Number(system.hullIntegrity ?? 0) || 0,
      "system.weaponCapacity.dorsal": Number(system.weaponCapacity?.dorsal ?? 0) || 0,
      "system.weaponCapacity.prow": Number(system.weaponCapacity?.prow ?? 0) || 0,
      "system.weaponCapacity.keel": Number(system.weaponCapacity?.keel ?? 0) || 0,
      "system.weaponCapacity.port": Number(system.weaponCapacity?.port ?? 0) || 0,
      "system.weaponCapacity.starboard": Number(system.weaponCapacity?.starboard ?? 0) || 0
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Voidship Hull Applied</h3>
          <p><strong>Hull:</strong> ${ownedHull.name}</p>
          <p><strong>Class:</strong> ${String(system.class ?? "-") || "-"}</p>
          <p><strong>Hull Integrity:</strong> ${Number(system.hullIntegrity ?? 0) || 0}</p>
          <p><strong>Space:</strong> ${Number(system.space ?? 0) || 0}</p>
          <p><strong>Ship Points:</strong> ${Number(system.shipPoints ?? 0) || 0}</p>
        </div>
      `
    });

    return ownedHull;
  }

  async _onItemOpen(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.sheet?.render(true);
  }

  _onItemDragStart(event) {
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;

    event.originalEvent?.dataTransfer?.setData("text/plain", JSON.stringify({
      type: "Item",
      uuid: item.uuid
    }));
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
      title: "Delete Item",
      content: `<p>Delete <strong>${item.name}</strong> from this voidship?</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (!confirmed) return;
    await item.delete();
  }

  async _onCreateItem(event) {
    event.preventDefault();
    const itemType = String(event.currentTarget?.dataset?.itemType ?? "").trim();
    if (!itemType) return;

    const defaultNames = {
      essentialComponent: "New Essential Component",
      supplementalComponent: "New Supplemental Component",
      shipWeapon: "New Ship Weapon",
      shipComponent: "New Ship Component",
      starshipHull: "New Starship Hull"
    };

    const itemData = {
      name: defaultNames[itemType] ?? "New Item",
      type: itemType
    };

    if (itemType === "shipWeapon") {
      itemData.system = {
        power: 0,
        space: 0,
        weaponClass: "macrobattery",
        allowedHulls: {
          transport: false,
          raider: false,
          frigate: false,
          lightCruiser: false,
          cruiser: false,
          grandCruiser: false,
          battleship: false,
          allShips: false
        },
        allowedLocations: {
          any: false,
          dorsal: false,
          prow: false,
          keel: false,
          port: false,
          starboard: false
        },
        strength: "",
        critRating: "",
        damage: "",
        range: "",
        location: "dorsal",
        shortDescription: ""
      };
    } else if (["essentialComponent", "supplementalComponent", "shipComponent"].includes(itemType)) {
      itemData.system = {
        power: 0,
        space: 0,
        origin: "",
        shortDescription: ""
      };
    } else if (itemType === "starshipHull") {
      itemData.system = {
        class: "",
        dimensions: "",
        mass: "",
        crewComplement: "",
        acceleration: "",
        speed: 0,
        maneuverability: 0,
        detection: 0,
        hullIntegrity: 0,
        armor: 0,
        turretRating: 0,
        shields: 0,
        space: 0,
        shipPoints: 0,
        weaponCapacity: {
          dorsal: 0,
          prow: 0,
          keel: 0,
          port: 0,
          starboard: 0
        },
        shortDescription: "",
        specialRules: ""
      };
    }

    const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
    if (created) {
      await created.sheet?.render(true);
    }
  }

  async _onConstructVoidship(event) {
    event.preventDefault();
    await new RogueTraderShipConstructionApplication(this.actor).render(true);
  }

  async _onClearRosterAssignment(event) {
    event.preventDefault();
    const role = String(event.currentTarget?.dataset?.shipRosterRole ?? "").trim();
    if (!role || !SHIP_ROSTER_ROLES.some((entry) => entry.key === role)) return;
    await this.actor.update({
      [`system.roster.${role}.actorUuid`]: ""
    });
  }

  async _onShipWeaponFire(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "shipWeapon") {
      ui.notifications?.warn("Rogue Trader | Could not find that ship weapon.");
      return;
    }

    await rollStarshipWeaponAttack(this.actor, item);
  }

  async _onShipProfileRoll(event) {
    event.preventDefault();
    const action = String(event.currentTarget?.dataset?.shipTest ?? "").trim();
    if (action === "activeAugury") {
      return this._rollActiveAugury();
    }
  }

  async _rollActiveAugury() {
    await this._playActiveAugurySequence();

    if (this.actor.isSensorsDamaged?.()) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader ship-critical-hit-card">
            <div class="ship-critical-hit-banner">Active Augury Failed</div>
            <h3>${this.actor.name}</h3>
            <p><strong>Reason:</strong> Sensors Damaged</p>
            <p>All sensor sweep attempts automatically fail until the damage is repaired.</p>
          </div>
        `
      });
      return {
        success: false,
        failedAutomatically: true,
        reason: "Sensors Damaged"
      };
    }

    const detectionModifier = Number(this.actor.getEffectiveShipDetection?.() ?? this.actor.system?.detection ?? 0) || 0;
    const isNpcControlled = String(this.actor.system?.controlMode ?? "player").trim().toLowerCase() === "npc";

    if (isNpcControlled) {
      const npcCrewRating = Number(this.actor.system?.npcCrewRating ?? 0) || 0;
      const result = await rollD100Test({
        actor: null,
        title: `${this.actor.name}: Active Augury`,
        target: npcCrewRating,
        modifier: detectionModifier,
        breakdown: [
          `NPC Crew Rating: ${npcCrewRating}`,
          `Ship Detection: ${detectionModifier >= 0 ? `+${detectionModifier}` : detectionModifier}`
        ],
        extra: ["Sensor sweep"]
      });
      if (result?.success) {
        await this._postActiveAuguryContacts();
      }
      return result;
    }

    const role = this._getShipRosterRole("masterOfAetherics");
    const actorUuid = String(this.actor.system?.roster?.masterOfAetherics?.actorUuid ?? "").trim();
    const assignedActor = actorUuid ? fromUuidSync(actorUuid) : null;
    if (!assignedActor) {
      ui.notifications?.warn("Rogue Trader | Assign a Master of Aetherics to make an Active Augury test.");
      return null;
    }

    const primaryValue = this._getRosterRolePrimaryValue(assignedActor, role);
    const baseTarget = Number(primaryValue.value ?? 0) || 0;
    const result = await rollD100Test({
      actor: assignedActor,
      title: `${this.actor.name}: Active Augury`,
      target: baseTarget,
      modifier: detectionModifier,
      breakdown: [
        `Master of Aetherics (${role.primaryLabel}): ${baseTarget}`,
        `Ship Detection: ${detectionModifier >= 0 ? `+${detectionModifier}` : detectionModifier}`
      ],
      extra: ["Sensor sweep"]
    });
    if (result?.success) {
      await this._postActiveAuguryContacts();
    }
    return result;
  }

  async _playActiveAugurySequence() {
    const sourceToken = this.actor.getActiveTokens?.()?.[0] ?? null;
    if (!sourceToken || !globalThis.Sequence) return;

    try {
      await new globalThis.Sequence()
        .effect()
        .file(ACTIVE_AUGURY_SEQUENCE_FILE)
        .atLocation(sourceToken)
        .size(ACTIVE_AUGURY_RADIUS_METERS * 2, { gridUnits: true })
        .opacity(0.9)
        .belowTokens()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play Active Augury Sequencer effect.", error);
    }
  }

  async _postActiveAuguryContacts() {
    const sourceToken = this.actor.getActiveTokens?.()?.[0] ?? null;
    if (!sourceToken || !canvas?.tokens) return;

    const detectedTokens = canvas.tokens.placeables
      .filter((token) =>
        token
        && token.id !== sourceToken.id
        && token.actor
        && !token.document?.hidden
        && getDistanceMetersBetweenTokens(sourceToken, token) <= ACTIVE_AUGURY_RADIUS_METERS
      );

    await this._playActiveAuguryContactPings(detectedTokens);

    const contacts = detectedTokens
      .sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? "")))
      .map((token) => {
        const distanceVu = getDistanceVuBetweenTokens(sourceToken, token);
        const actorType = String(token.actor?.type ?? "actor").trim();
        const disposition = Number(token.document?.disposition ?? 0);
        const isHostile = disposition < 0;
        const isFriendly = disposition > 0;
        const typeLabel = actorType === "ship"
          ? `<span class="ship-augury-contact-type${isHostile ? " is-hostile" : isFriendly ? " is-friendly" : ""}">Ship</span>`
          : `<span class="ship-augury-contact-type${isHostile ? " is-hostile" : isFriendly ? " is-friendly" : ""}">Contact</span>`;
        const shipClass = actorType === "ship"
          ? String(token.actor?.system?.class ?? "").trim()
          : "";
        const classMarkup = shipClass
          ? `, <span class="ship-augury-contact-class">${shipClass}</span>`
          : "";
        return `<li><strong>${token.name}</strong> <span class="ship-augury-contact-meta">(${typeLabel}${classMarkup}, ${distanceVu.toFixed(1)} VU)</span></li>`;
      });

    const content = contacts.length
      ? `
        <div class="roguetrader ship-augury-results">
          <h3>${this.actor.name}: Active Augury Contacts</h3>
          <ul>${contacts.join("")}</ul>
        </div>
      `
      : `
        <div class="roguetrader ship-augury-results">
          <h3>${this.actor.name}: Active Augury Contacts</h3>
          <p>No contacts detected within ${ACTIVE_AUGURY_RADIUS_METERS} VU.</p>
        </div>
      `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content
    });
  }

  async _playActiveAuguryContactPings(tokens = []) {
    if (!globalThis.Sequence || !Array.isArray(tokens) || tokens.length === 0) return;

    for (const token of tokens) {
      try {
        await new globalThis.Sequence()
          .effect()
          .file(ACTIVE_AUGURY_PING_FILE)
          .atLocation(token)
          .duration(ACTIVE_AUGURY_PING_DURATION_MS)
          .opacity(0.95)
          .play();
      } catch (error) {
        console.warn("Rogue Trader | Failed to play Active Augury contact ping.", error);
      }
    }
  }

  async _onDrop(event) {
    const rosterSlot = event.target?.closest?.("[data-ship-roster-role]");
    if (!rosterSlot) return super._onDrop(event);

    let data = null;
    try {
      data = TextEditor.getDragEventData(event);
    } catch (_error) {
      data = null;
    }

    const role = String(rosterSlot.dataset?.shipRosterRole ?? "").trim();
    if (!role || !SHIP_ROSTER_ROLES.some((entry) => entry.key === role)) {
      return super._onDrop(event);
    }

    const droppedActor = await this._resolveDroppedRosterActor(data);
    if (!droppedActor || droppedActor.type === "ship") {
      return super._onDrop(event);
    }

    event.preventDefault();
    event.stopPropagation();
    await this.actor.update({
      [`system.roster.${role}.actorUuid`]: droppedActor.uuid
    });
    return this.render(false);
  }

  async _resolveDroppedRosterActor(data) {
    if (!data || typeof data !== "object") return null;

    if (String(data.type ?? "") === "Actor") {
      if (data.uuid) {
        const actor = await fromUuid(data.uuid);
        if (actor?.documentName === "Actor") return actor;
      }
      if (data.id) return game.actors?.get(data.id) ?? null;
    }

    if (String(data.type ?? "") === "Token") {
      const scene = data.sceneId ? game.scenes?.get(data.sceneId) : canvas.scene;
      const tokenDoc = scene?.tokens?.get(data.tokenId ?? data.id ?? "");
      return tokenDoc?.actor ?? null;
    }

    return null;
  }
}
