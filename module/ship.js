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
const TORPEDO_LOAD_OPTIONS = [
  { value: "normal", label: "Load Normally" },
  { value: "quickTechUse", label: "Load Quickly (Tech-Use -10)" },
  { value: "quickCommand", label: "Load Quickly (Command -10)" }
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
  { key: "astropath", label: "Astropath", primaryLabel: "Psyniscience", characteristicKey: "perception", skillName: "Psyniscience" },
  { key: "navigator", label: "Navigator", primaryLabel: "Navigation (Stellar)", characteristicKey: "intelligence", skillName: "Navigation (Stellar)" }
];
const STARSHIP_ACTION_DEFINITIONS = [
  { key: "standardMove", label: "Standard Move", mode: "Move", subtype: "Manoeuvre", summary: "Move at half or full Speed; at end of move, turn 90 degrees for Transports, Frigates, and Raiders, or 45 degrees for all other hull types." },
  { key: "adjustBearing", label: "Adjust Bearing", mode: "Move", subtype: "Manoeuvre", summary: "Pilot (Spacecraft) + Manoeuvrability; turn 1+DoS VUs earlier than a Standard Move." },
  { key: "adjustSpeed", label: "Adjust Speed", mode: "Move", subtype: "Manoeuvre", summary: "Pilot (Spacecraft) + Manoeuvrability; increase or decrease Speed by 1+DoS, minimum 0." },
  { key: "adjustSpeedBearing", label: "Adjust Speed & Bearing", mode: "Move", subtype: "Manoeuvre", summary: "-20 Pilot (Spacecraft) + Manoeuvrability; perform both Adjust Bearing and Adjust Speed at the same time." },
  { key: "comeAbout", label: "Come About to New Heading", mode: "Move", subtype: "Manoeuvre", summary: "-10 Pilot (Spacecraft) + Manoeuvrability; turn when moved Half Speed and again at end; -20 Ballistic Skill." },
  { key: "disengage", label: "Disengage", mode: "Move", subtype: "Manoeuvre", summary: "Cannot be performed if craft are within 8 VUs; opposed Pilot (Spacecraft) + Manoeuvrability vs Detection + Scrutiny within 20 VUs." },
  { key: "evasiveManeuvers", label: "Evasive Manoeuvres", mode: "Move", subtype: "Manoeuvre", summary: "-10 Pilot (Spacecraft) + Manoeuvrability; attacks against the craft suffer penalties; the ship also takes a Ballistic Skill penalty." },
  { key: "activeAugury", label: "Active Augury", mode: "Extended", subtype: "Technological", summary: "Scrutiny + Detection; learn information about celestial bodies, phenomena, and ships within 20 VUs; detects Silent Running." },
  { key: "aidMachineSpirit", label: "Aid the Machine Spirit", mode: "Extended", subtype: "Technological", summary: "Grant +5 Manoeuvrability or Detection, plus +5 per 2 DoS." },
  { key: "disinformation", label: "Disinformation", mode: "Extended", subtype: "Social", summary: "-10 Deceive or Blather; inflict 1d5 Morale damage, plus 1d5 per DoS." },
  { key: "emergencyRepairs", label: "Emergency Repairs", mode: "Extended", subtype: "Technological", summary: "-10 Tech-Use; repair an Unpowered, Damaged, or Depressurised Component; time taken 1d5-DoS Turns." },
  { key: "flankSpeed", label: "Flank Speed", mode: "Extended", subtype: "Manoeuvre", summary: "Tech-Use; +1 VU Speed plus +1 VU per DoS; 2 DoF causes Engine Crippled." },
  { key: "focusedAugury", label: "Focused Augury", mode: "Extended", subtype: "Technological", summary: "Scrutiny + Detection; identify enemy components within 20 VUs, with more revealed at higher DoS." },
  { key: "hailEnemy", label: "Hail the Enemy", mode: "Extended", subtype: "Social", summary: "Open communications with ships within range; can be performed by characters who have participated in Manoeuvre or Shooting." },
  { key: "hitAndRun", label: "Hit & Run", mode: "Extended", subtype: "Attack", summary: "Pilot (Spacecraft), -10 per Turret Rating, 5 VU range; if successful, make a Command test to inflict critical effects and Hull Integrity damage." },
  { key: "holdFast", label: "Hold Fast!", mode: "Extended", subtype: "Social", summary: "Air of Authority required; Willpower; on success reduce Morale damage by 1, plus DoS, minimum 1, during the current turn." },
  { key: "jamCommunications", label: "Jam Communications", mode: "Extended", subtype: "Technological", summary: "-10 Tech-Use; if successful, target ship cannot use Social actions; range 10 VU + DoS." },
  { key: "lockOnTarget", label: "Lock on Target", mode: "Extended", subtype: "Technological", summary: "Scrutiny + Detection; +5 Ballistic Skill for one weapon component, plus +5 per 2 DoS." },
  { key: "prepareRepelBoarders", label: "Prepare to Repel Boarders!", mode: "Extended", subtype: "Social", summary: "Command; if successful +10 Command, plus +5 per DoS, against Boarding Actions as long as maintained." },
  { key: "putBacksIntoIt", label: "Put your Backs into it!", mode: "Extended", subtype: "Social", summary: "Intimidate or Charm; boost one weapon, Emergency Repairs, or Firefighting; +1 additional action per 3 DoS." },
  { key: "triage", label: "Triage", mode: "Extended", subtype: "Medical", summary: "-10 Medicae; reduce Crew Population damage by 1, plus DoS, minimum 1, during the current turn." },
  { key: "silentRunning", label: "Silent Running", mode: "Extended", subtype: "Manoeuvre", summary: "Undetectable except with Augury; Manoeuvre Tests -10; +10 Pilot (Spacecraft) + Manoeuvrability to do a Standard Move." },
  { key: "firefighting", label: "Firefighting", mode: "Extended", subtype: "Internal", summary: "-10 Command; if successful, remove Fire; may choose to vent into the void." },
  { key: "fireWeapons", label: "Fire Weapons", mode: "Shooting", subtype: "Attack", summary: "Ballistic Skill; resolve weapon component attacks in the chosen firing order." },
  { key: "ramming", label: "Ramming", mode: "Shooting", subtype: "Attack", summary: "End move within 1 VU; -20 Pilot (Spacecraft) + Manoeuvrability; both ships take damage." },
  { key: "boarding", label: "Boarding", mode: "Shooting", subtype: "Attack", summary: "End move within 1 VU; Pilot (Spacecraft) + Manoeuvrability to entangle and board; opposed Command resolves damage." },
  { key: "controlWeakMind", label: "Control the Weak Mind", mode: "Extended", subtype: "Astropathic", summary: "Compel power; choose one weapon on another vessel within range and force it to fire at a target of the Astropath's choice." },
  { key: "darkLabyrinth", label: "Dark Labyrinth", mode: "Extended", subtype: "Astropathic", summary: "Delude power; ship counts as within a Tenebro-Maze for 1+DoS Turns." },
  { key: "diviningTheWay", label: "Divining the Way", mode: "Extended", subtype: "Astropathic", summary: "Divination discipline; add 1d5 DoS to a Manoeuvre Action; once per combat." },
  { key: "flashFire", label: "Flash Fire", mode: "Extended", subtype: "Astropathic", summary: "Telekinesis discipline; set a random component on Fire on a vessel within 6 VUs." },
  { key: "illOmens", label: "Ill-Omens", mode: "Extended", subtype: "Astropathic", summary: "Terrify power; in response to Boarding Action, inflict 1d5+DoS Morale damage." },
  { key: "inspiringPresence", label: "Inspiring Presence", mode: "Extended", subtype: "Astropathic", summary: "Inspire power; +10% x DoS to either Pilot (Spacecraft) or Command during Hit & Run." },
  { key: "maskOfTheVoid", label: "Mask of the Void", mode: "Extended", subtype: "Astropathic", summary: "Delude power; choose a vessel within 10 VUs; Ballistic Skill and Astropathic actions suffer penalties." },
  { key: "psychicDeflection", label: "Psychic Deflection", mode: "Extended", subtype: "Astropathic", summary: "Telekinesis discipline; counts as having 1(+DoS) extra Void Shield against one shot." },
  { key: "quellFlames", label: "Quell Flames", mode: "Extended", subtype: "Astropathic", summary: "Telekinesis discipline; extinguish 1 fire, plus more at higher DoS." },
  { key: "takingTheShot", label: "Taking the Shot", mode: "Extended", subtype: "Astropathic", summary: "Divination discipline; +10% Shooting Action during the entire combat." },
  { key: "telepathicJamming", label: "Telepathic Jamming", mode: "Extended", subtype: "Astropathic", summary: "Psyniscience Focus Power; jam Astro-Telepathic signals within a VU-radius area." },
  { key: "tiesThatBind", label: "The Ties that Bind", mode: "Extended", subtype: "Astropathic", summary: "Mind Link power; if successful, +5 to all players for the next Strategic Round." },
  { key: "unnaturalResolve", label: "Unnatural Resolve", mode: "Extended", subtype: "Astropathic", summary: "Inspire power; restore 1d5(+DoS) Morale; once per game session." },
  { key: "emergencyJump", label: "Emergency Jump", mode: "Extended", subtype: "Navigator", summary: "-30 Navigation (Warp); immediately translate into the Warp until next turn." },
  { key: "relentlessPursuit", label: "Relentless Pursuit", mode: "Extended", subtype: "Navigator", summary: "-10 Navigation (Stellar); every DoS reduces DoS needed to catch in Stern Chase." },
  { key: "scanningTheAether", label: "Scanning the Aether", mode: "Extended", subtype: "Navigator", summary: "-10 Psyniscience; Active Augury with extended range even if Augury is damaged." },
  { key: "tacticalPositioning", label: "Tactical Positioning", mode: "Extended", subtype: "Navigator", summary: "-10 Psyniscience; adds 1 DoS to successful Ballistic Skill or Evasive Manoeuvres tests." },
  { key: "tacticalRetreat", label: "Tactical Retreat", mode: "Extended", subtype: "Navigator", summary: "-10 Navigation (Stellar); every 2 DoS reduces DoS needed to escape in Stern Chase." },
  { key: "warpInterference", label: "Warp Interference", mode: "Extended", subtype: "Navigator", summary: "-20 Psyniscience; target vessel suffers -10 Detection for 1(+DoS) Rounds." }
];

function isVoidshipCrewActor(actor) {
  return actor?.type === "character" || actor?.type === "npc";
}

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

function getShipProfileStatData(statData) {
  if (statData && typeof statData === "object") {
    return {
      permanent: Number(statData.permanent ?? 0) || 0,
      temporary: Number(statData.temporary ?? 0) || 0
    };
  }

  return {
    permanent: Number(statData ?? 0) || 0,
    temporary: 0
  };
}

function getShipProfileDisplayData(statData, effectiveValue) {
  const normalized = getShipProfileStatData(statData);
  const effective = Number(effectiveValue ?? 0) || 0;
  let stateClass = "";
  if (effective > normalized.permanent) {
    stateClass = "is-buffed";
  } else if (effective < normalized.permanent) {
    stateClass = "is-debuffed";
  }

  return {
    ...normalized,
    effective,
    stateClass
  };
}

function getShipCurrentPermanentDisplayData(currentValue, permanentValue) {
  const current = Number(currentValue ?? 0) || 0;
  const permanent = Number(permanentValue ?? 0) || 0;
  let stateClass = "";
  if (current > permanent) {
    stateClass = "is-buffed";
  } else if (current < permanent) {
    stateClass = "is-debuffed";
  }

  return {
    current,
    permanent,
    stateClass
  };
}

function getShipUsageDisplayData(usedValue, totalValue) {
  const used = Number(usedValue ?? 0) || 0;
  const total = Number(totalValue ?? 0) || 0;
  let stateClass = "";
  if (used > total) {
    stateClass = "is-debuffed";
  }

  return {
    current: used,
    permanent: total,
    stateClass
  };
}

function getActorInitials(actor) {
  const name = String(actor?.name ?? "").trim();
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "page-one" }],
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    const items = Array.from(this.actor.items ?? []);
    const speedData = getShipProfileStatData(this.actor.system?.speed);
    const maneuverabilityData = getShipProfileStatData(this.actor.system?.maneuverability);
    const detectionData = getShipProfileStatData(this.actor.system?.detection);
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

    const essentialPowerUsed = essentialComponents
      .filter((component) => String(component.componentType ?? "").trim() !== "plasmaDrives")
      .reduce((total, component) => total + Math.abs(Number(component.power ?? 0) || 0), 0);
    const supplementalPowerUsed = supplementalComponents.reduce((total, component) => total + Math.abs(Number(component.power ?? 0) || 0), 0);
    const shipWeaponPowerUsed = shipWeapons.reduce((total, weapon) => total + Math.abs(Number(weapon.power ?? 0) || 0), 0);
    const essentialSpaceUsed = essentialComponents.reduce((total, component) => total + component.space, 0);
    const supplementalSpaceUsed = supplementalComponents.reduce((total, component) => total + component.space, 0);
    const shipWeaponSpaceUsed = shipWeapons.reduce((total, weapon) => total + (Number(weapon.space ?? 0) || 0), 0);
    const powerUsed = essentialPowerUsed + supplementalPowerUsed + shipWeaponPowerUsed;
    const spaceUsed = essentialSpaceUsed + supplementalSpaceUsed + shipWeaponSpaceUsed;
    const totalPower = Number(this.actor.system?.power?.value ?? 0) || 0;
    const totalSpace = Number(this.actor.system?.space?.value ?? 0) || 0;
    const weaponLocationUsage = this._buildWeaponLocationUsage(shipWeapons);
    const activeHull = this._getActiveHullEntry(starshipHulls);
    const roster = this._buildShipRoster();
    const shipActions = this._buildShipActions();
    const shipEffects = this._buildShipEffects({
      speedData,
      maneuverabilityData,
      detectionData
    });

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
      effects: shipEffects,
      actions: shipActions,
      roster,
      hasEssentialComponents: essentialComponents.length > 0,
      hasSupplementalComponents: supplementalComponents.length > 0,
      hasShipWeapons: shipWeapons.length > 0,
      hasCargo: cargo.length > 0,
      hasEffects: shipEffects.length > 0,
      hasActions: shipActions.length > 0,
      torpedoLoadOptions: TORPEDO_LOAD_OPTIONS,
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
      profileStats: {
        speed: getShipProfileDisplayData(speedData, effectiveSpeed),
        maneuverability: getShipProfileDisplayData(maneuverabilityData, effectiveManeuverability),
        detection: getShipProfileDisplayData(detectionData, effectiveDetection)
      },
      resourceStats: {
        hullIntegrity: getShipCurrentPermanentDisplayData(
          this.actor.system?.resources?.hullIntegrity?.value,
          this.actor.system?.resources?.hullIntegrity?.max
        ),
        crew: getShipCurrentPermanentDisplayData(
          this.actor.system?.crew?.value,
          this.actor.system?.crew?.max
        ),
        morale: getShipCurrentPermanentDisplayData(
          this.actor.system?.resources?.morale?.value,
          this.actor.system?.resources?.morale?.max
        ),
        power: getShipUsageDisplayData(powerUsed, totalPower),
        space: getShipUsageDisplayData(spaceUsed, totalSpace)
      },
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
    html.find(".ship-roster-slot[draggable='true']").on("dragstart", this._onRosterActorDragStart.bind(this));
    html.find(".ship-item-delete").on("click", this._onDeleteItem.bind(this));
    html.find(".ship-weapon-fire").on("click", this._onShipWeaponFire.bind(this));
    html.find(".ship-weapon-load").on("click", this._onShipWeaponLoad.bind(this));
    html.find(".ship-item-create").on("click", this._onCreateItem.bind(this));
    html.find(".ship-construct-button").on("click", this._onConstructVoidship.bind(this));
    html.find(".ship-roster-clear").on("click", this._onClearRosterAssignment.bind(this));
    html.find(".ship-profile-roll").on("click", this._onShipProfileRoll.bind(this));
    html.find(".ship-action-button").on("click", this._onShipActionAssign.bind(this));
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
      componentType: String(item.system?.componentType ?? item.system?.categoryType ?? "").trim(),
      shipPointCost: Number(item.system?.shipPointCost ?? 0) || 0,
      power: Number(item.system?.power ?? 0) || 0,
      space: Number(item.system?.space ?? 0) || 0,
      generation: Number(item.system?.generation ?? 0) || 0,
      origin: String(item.system?.origin ?? "").trim(),
      shortDescription: String(item.system?.shortDescription ?? "").trim()
    };
  }

  _buildShipWeaponEntry(item) {
    const locationKey = String(item.system?.location ?? "dorsal").trim().toLowerCase();
    const weaponClass = String(item.system?.weaponClass ?? "macrobattery").trim().toLowerCase();
    const strengthData = this.actor.getEffectiveShipWeaponStrength?.(item) ?? {
      effectiveValue: 0,
      label: String(item.system?.strength ?? "").trim()
    };
    const isTorpedoTube = weaponClass === "torpedo";
    const torpedoLoaded = isTorpedoTube ? Boolean(item.system?.torpedoLoaded ?? true) : false;
    const torpedoLoading = isTorpedoTube ? Boolean(item.system?.torpedoLoading) : false;
    const torpedoLoadingMode = String(item.system?.torpedoLoadingMode ?? "").trim();
    const torpedoLoadingModeLabel = torpedoLoadingMode === "normal"
      ? "Loading"
      : torpedoLoadingMode === "quickTechUse"
        ? "Quick Load (Tech-Use)"
        : torpedoLoadingMode === "quickCommand"
          ? "Quick Load (Command)"
          : "Loading";
    return {
      id: item.id,
      img: item.img || "icons/svg/item-bag.svg",
      name: item.name,
      weaponClass,
      weaponClassLabel: SHIP_WEAPON_CLASS_LABELS[weaponClass] ?? "Weapon",
      shipPointCost: Number(item.system?.shipPointCost ?? 0) || 0,
      power: Number(item.system?.power ?? 0) || 0,
      space: Number(item.system?.space ?? 0) || 0,
      torpedoType: String(item.system?.torpedoType ?? "").trim().toLowerCase(),
      torpedoSpeed: Number(item.system?.torpedoSpeed ?? 0) || 0,
      strength: strengthData.label,
      rawStrength: String(item.system?.strength ?? "").trim(),
      effectiveStrength: Number(strengthData.effectiveValue ?? 0) || 0,
      critRating: String(item.system?.critRating ?? "").trim(),
      damage: String(item.system?.damage ?? "").trim(),
      range: String(item.system?.range ?? "").trim(),
      location: locationKey,
      locationLabel: SHIP_WEAPON_LOCATION_LABELS[locationKey] ?? "Unknown",
      shortDescription: String(item.system?.shortDescription ?? "").trim(),
      isTorpedoTube,
      torpedoLoaded,
      torpedoLoading,
      torpedoLoadingMode,
      torpedoLoadingModeLabel
    };
  }

  _getCurrentShipActionActor() {
    const assignedCharacter = game.user?.character;
    if (isVoidshipCrewActor(assignedCharacter)) return assignedCharacter;

    const controlledToken = canvas?.tokens?.controlled?.find?.((token) => token?.actor && token.actor.type !== "ship");
    if (isVoidshipCrewActor(controlledToken?.actor)) return controlledToken.actor;

    return null;
  }

  async _rollShipActionSkillTest({ title, skillName, characteristicKey, modifier = 0 } = {}) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "player").trim().toLowerCase() === "npc";
    if (isNpcControlled) {
      const npcCrewRating = Number(this.actor.system?.npcCrewRating ?? 0) || 0;
      return rollD100Test({
        actor: null,
        title,
        target: npcCrewRating,
        modifier,
        breakdown: [
          `NPC Crew Rating: ${npcCrewRating}`,
          `Action Modifier: ${modifier >= 0 ? `+${modifier}` : modifier}`
        ]
      });
    }

    const actionActor = this._getCurrentShipActionActor();
    if (!actionActor) {
      ui.notifications?.warn("Rogue Trader | Select your character or a controlled crew token first.");
      return null;
    }

    const roleLike = { characteristicKey, skillName };
    const primaryValue = this._getRosterRolePrimaryValue(actionActor, roleLike);
    if (primaryValue?.value == null) {
      ui.notifications?.warn(`Rogue Trader | ${actionActor.name} cannot use ${skillName}.`);
      return null;
    }

    return rollD100Test({
      actor: actionActor,
      title,
      target: primaryValue.value,
      modifier,
      breakdown: [
        `${skillName}: ${primaryValue.label}`,
        `Action Modifier: ${modifier >= 0 ? `+${modifier}` : modifier}`
      ]
    });
  }

  _buildCargoEntry(item) {
    return {
      id: item.id,
      name: item.name,
      typeLabel: this._getCargoTypeLabel(item.type),
      shortDescription: String(item.system?.shortDescription ?? item.system?.description ?? "").trim()
    };
  }

  _buildShipActions() {
    const actionAssignments = this.actor.system?.actionAssignments ?? {};

    return STARSHIP_ACTION_DEFINITIONS.map((action) => {
      const actorUuid = String(actionAssignments?.[action.key]?.actorUuid ?? "").trim();
      const assignedActor = actorUuid ? fromUuidSync(actorUuid) : null;
      const initials = assignedActor ? getActorInitials(assignedActor) : "";
      const tooltip = `${action.label}\n${action.mode} • ${action.subtype}\n${action.summary}`;

      return {
        ...action,
        actorUuid,
        assignedActor,
        assignedName: assignedActor?.name ?? "",
        initials,
        isAssigned: Boolean(assignedActor),
        tooltip
      };
    });
  }

  _buildShipEffects({ speedData, maneuverabilityData, detectionData } = {}) {
    const actor = this.actor;
    const effects = [];
    const pushEffect = (source, type, effectText) => {
      const cleanSource = String(source ?? "").trim();
      const cleanType = String(type ?? "").trim();
      const cleanEffect = String(effectText ?? "").trim();
      if (!cleanSource || !cleanType || !cleanEffect) return;
      effects.push({
        source: cleanSource,
        type: cleanType,
        effect: cleanEffect
      });
    };

    const speedTemporary = Number(speedData?.temporary ?? 0) || 0;
    const maneuverabilityTemporary = Number(maneuverabilityData?.temporary ?? 0) || 0;
    const detectionTemporary = Number(detectionData?.temporary ?? 0) || 0;

    if (speedTemporary) {
      pushEffect("Temporary Speed Modifier", speedTemporary > 0 ? "Buff" : "Debuff", `SPD ${speedTemporary > 0 ? "+" : ""}${speedTemporary}`);
    }
    if (maneuverabilityTemporary) {
      pushEffect("Temporary Manoeuvrability Modifier", maneuverabilityTemporary > 0 ? "Buff" : "Debuff", `MAN ${maneuverabilityTemporary > 0 ? "+" : ""}${maneuverabilityTemporary}`);
    }
    if (detectionTemporary) {
      pushEffect("Temporary Detection Modifier", detectionTemporary > 0 ? "Buff" : "Debuff", `DET ${detectionTemporary > 0 ? "+" : ""}${detectionTemporary}`);
    }

    if (actor.isCrippled?.()) {
      pushEffect("Crippled", "Critical Damage", "SPD halved, MAN -10, DET -10, ship weapon Strength halved (rounded up).");
    }
    if (actor.isSensorsDamaged?.()) {
      pushEffect("Sensors Damaged", "Critical Damage", "All ship shooting tests suffer -30, and Active Augury automatically fails.");
    }
    if (actor.isThrustersDamaged?.()) {
      pushEffect(
        "Thrusters Damaged",
        "Critical Damage",
        actor.isShipTurningDisabled?.()
          ? "The ship cannot turn."
          : "MAN -20."
      );
    }
    if (actor.isShipOnFire?.()) {
      pushEffect("Fire!", "Critical Damage", "Shipboard fire is active.");
    }
    if (actor.isEnginesCrippled?.()) {
      pushEffect(
        "Engines Crippled",
        "Critical Damage",
        Boolean(actor.system?.conditions?.enginesCrippled?.speedReducedToOne)
          ? "SPD reduced to 1."
          : "SPD halved."
      );
    }

    const currentCrew = Math.max(0, Number(actor.system?.crew?.value ?? 0) || 0);
    const currentMorale = Math.max(0, Number(actor.system?.resources?.morale?.value ?? 0) || 0);
    if (currentCrew <= 80) {
      pushEffect("Crew Reduced (80%)", "Crew Population", "The ship increases all travel times by 1d5 days.");
    }
    if (currentCrew <= 60) {
      pushEffect("Crew Reduced (60%)", "Crew Population", "All Tests involving Boarding Actions, repulsing Hit and Run attacks, fighting fires, and making Emergency Repairs suffer -5.");
    }
    if (currentCrew <= 50) {
      pushEffect("Crew Reduced (50%)", "Crew Population", "MAN -10.");
    }
    if (currentCrew <= 40) {
      pushEffect("Crew Reduced (40%)", "Crew Population", "The ship loses any bonus to Achievement Points it would normally receive for its Components.");
    }
    if (currentCrew <= 20) {
      pushEffect(
        "Crew Reduced (20%)",
        "Crew Population",
        actor.isCrippled?.()
          ? "With the ship already Crippled, it may only take a Strategic Turn on every other Strategic Round."
          : "In combat, the ship counts as Crippled."
      );
    }
    if (currentCrew <= 10) {
      pushEffect("Crew Reduced (10%)", "Crew Population", "The ship may not perform Boarding Actions or Hit and Run attacks. Any attempt to repulse a Boarding Action or Hit and Run attack, fight fires, or make Emergency Repairs suffers -20.");
    }
    if (currentCrew <= 0) {
      pushEffect("Ship is a Tomb", "Crew Population", "The ship becomes an empty tomb and cannot operate again without at least some crew to run it.");
    }

    if (currentMorale <= 80) {
      pushEffect("Low Morale (80)", "Morale", "All Command Tests involving the ship or its crew suffer -5.");
    }
    if (currentMorale <= 60) {
      pushEffect("Low Morale (60)", "Morale", "All Ballistic Skill Tests made to fire the ship's weapons suffer -5.");
    }
    if (currentMorale <= 50) {
      pushEffect("Low Morale (50)", "Morale", "All Command Tests involving the ship or its crew suffer an additional -10 (-15 total).");
    }
    if (currentMorale <= 40) {
      pushEffect("Low Morale (40)", "Morale", "MAN -10. Ship weapon Ballistic Skill Tests suffer an additional -5 (-10 total).");
    }
    if (currentMorale <= 20) {
      pushEffect("Low Morale (20)", "Morale", "The ship may no longer perform Boarding Actions or Hit and Run attacks.");
    }
    if (currentMorale <= 10) {
      pushEffect("Low Morale (10)", "Morale", "Command Tests suffer an additional -15 (-30 total). SPD, MAN, and DET suffer an additional -10.");
    }
    if (currentMorale <= 0) {
      pushEffect("Mutinous Crew", "Morale", "The crew rises in a murderous frenzy and seizes control of the ship.");
    }

    return effects;
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
      "system.speed.permanent": Number(system.speed ?? 0) || 0,
      "system.speed.temporary": 0,
      "system.maneuverability.permanent": Number(system.maneuverability ?? 0) || 0,
      "system.maneuverability.temporary": 0,
      "system.detection.permanent": Number(system.detection ?? 0) || 0,
      "system.detection.temporary": 0,
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

  _onRosterActorDragStart(event) {
    const actorUuid = String(event.currentTarget?.dataset?.actorUuid ?? "").trim();
    if (!actorUuid) return;

    const actor = fromUuidSync(actorUuid);
    if (!isVoidshipCrewActor(actor)) return;

    event.originalEvent?.dataTransfer?.setData("text/plain", JSON.stringify({
      type: "Actor",
      uuid: actor.uuid
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
        torpedoType: "",
        torpedoGuidance: "standard",
        torpedoSpeed: 0,
        torpedoLoaded: true,
        torpedoLoading: false,
        torpedoLoadingMode: "",
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
        speed: { permanent: 0, temporary: 0 },
        maneuverability: { permanent: 0, temporary: 0 },
        detection: { permanent: 0, temporary: 0 },
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

  async _onShipActionAssign(event) {
    event.preventDefault();
    const actionKey = String(event.currentTarget?.dataset?.actionKey ?? "").trim();
    if (!actionKey) return;

    const currentActor = this._getCurrentShipActionActor();
    const existingActorUuid = String(this.actor.system?.actionAssignments?.[actionKey]?.actorUuid ?? "").trim();

    if (!currentActor) {
      if (!existingActorUuid) {
        ui.notifications?.warn("Rogue Trader | Select your character or a controlled crew token first.");
        return;
      }

      await this.actor.update({
        [`system.actionAssignments.${actionKey}.actorUuid`]: ""
      });
      return;
    }

    const nextActorUuid = existingActorUuid === currentActor.uuid ? "" : currentActor.uuid;
    await this.actor.update({
      [`system.actionAssignments.${actionKey}.actorUuid`]: nextActorUuid
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

    const result = await rollStarshipWeaponAttack(this.actor, item);
    if (result && String(item.system?.weaponClass ?? "").trim().toLowerCase() === "torpedo") {
      await item.update({
        "system.torpedoLoaded": false,
        "system.torpedoLoading": false,
        "system.torpedoLoadingMode": ""
      });
    }
  }

  async _onShipWeaponLoad(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "shipWeapon") {
      ui.notifications?.warn("Rogue Trader | Could not find that ship weapon.");
      return;
    }

    if (String(item.system?.weaponClass ?? "").trim().toLowerCase() !== "torpedo") {
      ui.notifications?.warn("Rogue Trader | Only torpedo tubes use loading actions.");
      return;
    }

    if (item.system?.torpedoLoaded) {
      ui.notifications?.warn("Rogue Trader | That torpedo tube is already loaded.");
      return;
    }

    if (item.system?.torpedoLoading) {
      ui.notifications?.warn("Rogue Trader | That torpedo tube is already loading.");
      return;
    }

    const root = event.currentTarget?.closest?.("tr") ?? null;
    const select = root?.querySelector?.(`.ship-weapon-load-mode[data-item-id="${itemId}"]`);
    const selectedMode = String(select?.value ?? "normal").trim() || "normal";

    if (selectedMode === "normal") {
      if (game.combat) {
        await item.update({
          "system.torpedoLoaded": false,
          "system.torpedoLoading": true,
          "system.torpedoLoadingMode": "normal"
        });
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `
            <div class="roguetrader-roll-card">
              <h3>${this.actor.name}: ${item.name}</h3>
              <p><strong>Action:</strong> Load Normally</p>
              <p>The torpedo tube will be loaded at the start of the ship's next turn.</p>
            </div>
          `
        });
      } else {
        await item.update({
          "system.torpedoLoaded": true,
          "system.torpedoLoading": false,
          "system.torpedoLoadingMode": ""
        });
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `
            <div class="roguetrader-roll-card">
              <h3>${this.actor.name}: ${item.name}</h3>
              <p><strong>Action:</strong> Load Normally</p>
              <p>The torpedo tube is loaded.</p>
            </div>
          `
        });
      }
      return;
    }

    const quickLoadConfig = selectedMode === "quickCommand"
      ? {
        skillName: "Command",
        characteristicKey: "fellowship",
        actionLabel: "Load Quickly (Command -10)"
      }
      : {
        skillName: "Tech-Use",
        characteristicKey: "intelligence",
        actionLabel: "Load Quickly (Tech-Use -10)"
      };

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: ${item.name} ${quickLoadConfig.actionLabel}`,
      skillName: quickLoadConfig.skillName,
      characteristicKey: quickLoadConfig.characteristicKey,
      modifier: -10
    });

    if (result?.success) {
      await item.update({
        "system.torpedoLoaded": true,
        "system.torpedoLoading": false,
        "system.torpedoLoadingMode": ""
      });
    } else {
      await item.update({
        "system.torpedoLoaded": false,
        "system.torpedoLoading": false,
        "system.torpedoLoadingMode": ""
      });
    }
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
    const actionButton = event.target?.closest?.("[data-action-key]");
    const rosterSlot = event.target?.closest?.("[data-ship-roster-role]");
    if (!actionButton && !rosterSlot) return super._onDrop(event);

    let data = null;
    try {
      data = TextEditor.getDragEventData(event);
    } catch (_error) {
      data = null;
    }

    const droppedActor = await this._resolveDroppedRosterActor(data);

    if (actionButton) {
      const actionKey = String(actionButton.dataset?.actionKey ?? "").trim();
      if (!actionKey || !STARSHIP_ACTION_DEFINITIONS.some((entry) => entry.key === actionKey)) {
        return super._onDrop(event);
      }

      if (!isVoidshipCrewActor(droppedActor) || !this._isActorAssignedToShipRoster(droppedActor?.uuid)) {
        ui.notifications?.warn("Rogue Trader | Drop a crew member already assigned to the voidship roster onto an action.");
        return super._onDrop(event);
      }

      event.preventDefault();
      event.stopPropagation();
      await this.actor.update({
        [`system.actionAssignments.${actionKey}.actorUuid`]: droppedActor.uuid
      });
      return this.render(false);
    }

    const role = String(rosterSlot.dataset?.shipRosterRole ?? "").trim();
    if (!role || !SHIP_ROSTER_ROLES.some((entry) => entry.key === role)) {
      return super._onDrop(event);
    }

    if (!isVoidshipCrewActor(droppedActor)) {
      return super._onDrop(event);
    }

    event.preventDefault();
    event.stopPropagation();
    await this.actor.update({
      [`system.roster.${role}.actorUuid`]: droppedActor.uuid
    });
    return this.render(false);
  }

  _isActorAssignedToShipRoster(actorUuid) {
    const targetUuid = String(actorUuid ?? "").trim();
    if (!targetUuid) return false;
    return SHIP_ROSTER_ROLES.some((role) =>
      String(this.actor.system?.roster?.[role.key]?.actorUuid ?? "").trim() === targetUuid
    );
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
