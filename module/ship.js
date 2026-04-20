import { RogueTraderShipConstructionApplication } from "./ship-construction.js";
import { getShipFacingDegrees, getRelativeBearing, getIncomingArmorFacingData, rollStarshipWeaponAttack, resolveStarshipCriticalHit } from "./starship-combat.js";
import { rollD100Test } from "./rolls.js";
import { resolveReferenceTableResult } from "./reference-tables.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;
const SHIP_MOVEMENT_SOUND = "systems/roguetrader/assets/sounds/ship-movement-1.mp3";

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

function normalizeShipSimpleName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function shipActorHasTalentNamed(actor, name) {
  const normalizedTarget = normalizeShipSimpleName(name);
  if (!normalizedTarget) return false;

  return (actor?.items ?? []).some((item) =>
    item?.type === "talent"
    && normalizeShipSimpleName(item.name) === normalizedTarget
  );
}

const SHIP_ACTION_GROUP_DEFINITIONS = [
  {
    key: "move-manoeuvre",
    label: "Move / Manoeuvre",
    mode: "Move",
    subtype: "Manoeuvre",
    accentClass: "is-move"
  },
  {
    key: "shooting-attack",
    label: "Shooting / Attack",
    mode: "Shooting",
    subtype: "Attack",
    accentClass: "is-attack"
  },
  {
    key: "extended-social",
    label: "Extended / Social",
    mode: "Extended",
    subtype: "Social",
    accentClass: "is-social"
  },
  {
    key: "extended-technological",
    label: "Extended / Technological",
    mode: "Extended",
    subtype: "Technological",
    accentClass: "is-technological"
  },
  {
    key: "extended-other",
    label: "Extended / Other",
    mode: "Extended",
    subtype: null,
    accentClass: "is-other"
  },
  {
    key: "extended-navigator",
    label: "Extended / Navigator",
    mode: "Extended",
    subtype: "Navigator",
    accentClass: "is-navigator"
  },
  {
    key: "extended-astropathic",
    label: "Extended / Astropathic",
    mode: "Extended",
    subtype: "Astropathic",
    accentClass: "is-astropathic"
  }
];
const ASTROPATHIC_POWER_OPTIONS = [
  { key: "compel", label: "Compel" },
  { key: "delude", label: "Delude" },
  { key: "divination", label: "Divination" },
  { key: "telekinesis", label: "Telekinesis" },
  { key: "terrify", label: "Terrify" },
  { key: "inspire", label: "Inspire" },
  { key: "mindLink", label: "Mind Link" }
];
const ASTROPATHIC_ACTION_POWER_REQUIREMENTS = {
  controlWeakMind: ["compel"],
  darkLabyrinth: ["delude"],
  diviningTheWay: ["divination"],
  flashFire: ["telekinesis"],
  illOmens: ["terrify"],
  inspiringPresence: ["inspire"],
  maskOfTheVoid: ["delude"],
  psychicDeflection: ["telekinesis"],
  quellFlames: ["telekinesis"],
  takingTheShot: ["divination"],
  tiesThatBind: ["mindLink"],
  unnaturalResolve: ["inspire"]
};
const SHIP_MODIFIER_DEFINITIONS = [
  { key: "extraSpeed", label: "Extra SPD", shortLabel: "SPD" },
  { key: "extraManeuverability", label: "Extra MAN", shortLabel: "MAN" },
  { key: "extraDetection", label: "Extra DET", shortLabel: "DET" },
  { key: "extraTurrets", label: "Extra Turrets", shortLabel: "Turrets" },
  { key: "extraShields", label: "Extra Shields", shortLabel: "Shields" },
  { key: "extraArmor", label: "Extra Armour (All)", shortLabel: "Armour" },
  { key: "extraArmorProw", label: "Extra Armour (Prow)", shortLabel: "Prow Arm" },
  { key: "extraArmorPort", label: "Extra Armour (Port)", shortLabel: "Port Arm" },
  { key: "extraArmorStarboard", label: "Extra Armour (Starboard)", shortLabel: "Stbd Arm" },
  { key: "extraArmorAft", label: "Extra Armour (Aft)", shortLabel: "Aft Arm" },
  { key: "extraHullIntegrity", label: "Extra HI", shortLabel: "HI" },
  { key: "extraCrewPercent", label: "Extra Crew%", shortLabel: "Crew%" },
  { key: "extraMoralePercent", label: "Extra Morale%", shortLabel: "Morale%" },
  { key: "extraPower", label: "Extra Power", shortLabel: "Power" },
  { key: "extraSpace", label: "Extra Space", shortLabel: "Space" },
  { key: "repairBonus", label: "Repair Bonus", shortLabel: "Repair" },
  { key: "commandBonus", label: "Command Bonus", shortLabel: "Command" },
  { key: "hitAndRunAttackBonus", label: "Hit & Run Attack", shortLabel: "H&R Atk" },
  { key: "hitAndRunDefenseBonus", label: "Hit & Run Defense", shortLabel: "H&R Def" },
  { key: "pilotingBonus", label: "Piloting Bonus", shortLabel: "Pilot" },
  { key: "navigationBonus", label: "Navigation Bonus", shortLabel: "Navigate" },
  { key: "crewRatingBonus", label: "Crew Rating Bonus", shortLabel: "Crew Rating" },
  { key: "extraAccuracy", label: "Extra Accuracy", shortLabel: "Accuracy" },
  { key: "extraEvasion", label: "Evasion", shortLabel: "Evasion" },
  { key: "travelTimeModifier", label: "Travel Time Modifier", shortLabel: "Travel" },
  { key: "warpEncounterModifier", label: "Warp Encounter Mod", shortLabel: "Warp" },
  { key: "addedMoraleLoss", label: "Added Morale Loss", shortLabel: "Morale Loss" },
  { key: "addedCrewLoss", label: "Added Crew Loss", shortLabel: "Crew Loss" }
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
const NINETY_DEGREE_TURN_HULL_CLASSES = new Set(["transport", "frigate", "raider"]);

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
  { key: "disinformation", label: "Disinformation", mode: "Extended", subtype: "Social", summary: "-10 Deceive or Blather; restore 1d5 Morale, plus an additional 1d5 per DoS, to your own ship." },
  { key: "emergencyRepairs", label: "Emergency Repairs", mode: "Extended", subtype: "Technological", summary: "-10 Tech-Use; repair an Unpowered, Damaged, or Depressurised Component; time taken 1d5-DoS Turns." },
  { key: "flankSpeed", label: "Flank Speed", mode: "Extended", subtype: "Manoeuvre", summary: "Tech-Use; +1 VU Speed plus +1 VU per DoS; 2 DoF causes Engine Crippled." },
  { key: "focusedAugury", label: "Focused Augury", mode: "Extended", subtype: "Technological", summary: "Scrutiny + Detection; identify enemy components within 20 VUs, with more revealed at higher DoS." },
  { key: "hailEnemy", label: "Hail the Enemy", mode: "Extended", subtype: "Social", summary: "Open communications with ships within range; can be performed by characters who have participated in Manoeuvre or Shooting." },
  { key: "hitAndRun", label: "Hit & Run", mode: "Extended", subtype: null, summary: "Pilot (Spacecraft), -10 per Turret Rating, 5 VU range; if successful, make a Command test to inflict critical effects and Hull Integrity damage." },
  { key: "holdFast", label: "Hold Fast!", mode: "Extended", subtype: "Social", summary: "Air of Authority required; Willpower; on success restore Morale lost during the previous turn by 1, plus 1 per DoS, up to the amount actually lost." },
  { key: "jamCommunications", label: "Jam Communications", mode: "Extended", subtype: "Technological", summary: "-10 Tech-Use; if successful, target ship cannot use Social actions; range 10 VU + DoS." },
  { key: "lockOnTarget", label: "Lock on Target", mode: "Extended", subtype: "Technological", summary: "Scrutiny + Detection; +5 Ballistic Skill for one weapon component, plus +5 per 2 DoS." },
  { key: "prepareRepelBoarders", label: "Prepare to Repel Boarders!", mode: "Extended", subtype: "Social", summary: "Command; if successful +10 Command, plus +5 per DoS, against Boarding Actions as long as maintained." },
  { key: "putBacksIntoIt", label: "Put your Backs into it!", mode: "Extended", subtype: "Social", summary: "Intimidate or Charm; boost one weapon, Emergency Repairs, or Firefighting; +1 additional action per 3 DoS." },
  { key: "triage", label: "Triage", mode: "Extended", subtype: "Technological", summary: "-10 Medicae; reduce Crew Population damage by 1, plus DoS, minimum 1, during the current turn." },
  { key: "silentRunning", label: "Silent Running", mode: "Extended", subtype: "Manoeuvre", summary: "Undetectable except with Augury; Manoeuvre Tests -10; +10 Pilot (Spacecraft) + Manoeuvrability to do a Standard Move." },
  { key: "firefighting", label: "Firefighting", mode: "Extended", subtype: "Technological", summary: "-10 Command; if successful, remove Fire; may choose to vent into the void." },
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

function normalizeShipHullClass(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "");
}

function getRammingDamageFormulaForHullClass(hullClass) {
  const normalized = normalizeShipHullClass(hullClass);
  if (["transport", "raider"].includes(normalized)) return "1d5";
  if (normalized === "frigate") return "1d10";
  if (normalized === "lightcruiser") return "2d5";
  if (["cruiser", "battlecruiser"].includes(normalized)) return "2d10";
  if (["grandcruiser", "battleship"].includes(normalized)) return "3d10";
  return "1d10";
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

function getShipProfileDisplayData(statData, effectiveValue, modifierTotals = {}) {
  const normalized = getShipProfileStatData(statData);
  const permanentModifier = Number(modifierTotals?.permanent ?? 0) || 0;
  const temporaryModifier = Number(modifierTotals?.temporary ?? 0) || 0;
  const displayPermanent = normalized.permanent + permanentModifier;
  const displayTemporary = normalized.temporary + temporaryModifier;
  const effective = Number(effectiveValue ?? 0) || 0;
  let stateClass = "";
  if (effective > displayPermanent) {
    stateClass = "is-buffed";
  } else if (effective < displayPermanent) {
    stateClass = "is-debuffed";
  }

  return {
    permanent: displayPermanent,
    temporary: displayTemporary,
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

export class RogueTraderShipSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #activeTab = "page-one";
  #standardMoveAssist = null;

  static register() {
    Actors.registerSheet("roguetrader", RogueTraderShipSheet, {
      types: ["ship"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "actor", "ship"],
    position: {
      width: 1280,
      height: 940
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
      template: "systems/roguetrader/templates/actors/ship-sheet.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this.#activeTab ||= "page-one";

    context.activeTab = this.#activeTab;
    context.tabs = {
      pageOne: this.#activeTab === "page-one",
      pageTwo: this.#activeTab === "page-two"
    };
    return this._prepareLegacyContext(context);
  }

  _prepareLegacyContext(context) {
    context.system ??= this.actor.system ?? {};
    const rawArmor = this.actor.system?.armor ?? context.system?.armor;
    const sharedArmor = Number(rawArmor?.value ?? rawArmor ?? 0) || 0;
    context.system.armor = {
      prow: Number(rawArmor?.prow ?? sharedArmor) || 0,
      port: Number(rawArmor?.port ?? sharedArmor) || 0,
      starboard: Number(rawArmor?.starboard ?? sharedArmor) || 0,
      aft: Number(rawArmor?.aft ?? sharedArmor) || 0
    };

    const items = Array.from(this.actor.items ?? []);
    const speedData = getShipProfileStatData(this.actor.system?.speed);
    const maneuverabilityData = getShipProfileStatData(this.actor.system?.maneuverability);
    const detectionData = getShipProfileStatData(this.actor.system?.detection);
    const speedModifierTotals = {
      permanent: Number(this.actor.getShipModifierPermanentTotal?.("extraSpeed") ?? 0) || 0,
      temporary: Number(this.actor.getShipModifierTemporaryTotal?.("extraSpeed") ?? 0) || 0
    };
    const maneuverabilityModifierTotals = {
      permanent: Number(this.actor.getShipModifierPermanentTotal?.("extraManeuverability") ?? 0) || 0,
      temporary: Number(this.actor.getShipModifierTemporaryTotal?.("extraManeuverability") ?? 0) || 0
    };
    const detectionModifierTotals = {
      permanent: Number(this.actor.getShipModifierPermanentTotal?.("extraDetection") ?? 0) || 0,
      temporary: Number(this.actor.getShipModifierTemporaryTotal?.("extraDetection") ?? 0) || 0
    };
    const effectiveSpeed = this.actor.getEffectiveShipSpeed?.() ?? (Number(this.actor.system?.speed ?? 0) || 0);
    const effectiveManeuverability = this.actor.getEffectiveShipManeuverability?.() ?? (Number(this.actor.system?.maneuverability ?? 0) || 0);
    const effectiveDetection = this.actor.getEffectiveShipDetection?.() ?? (Number(this.actor.system?.detection ?? 0) || 0);
    const effectiveShields = this.actor.getEffectiveShipShields?.() ?? (Number(this.actor.system?.shields ?? 0) || 0);
    const effectiveTurretRating = this.actor.getEffectiveShipTurretRating?.() ?? (Number(this.actor.system?.turretRating ?? 0) || 0);
    const effectiveArmorProfile = this.actor.getEffectiveShipArmorProfile?.() ?? {
      prow: Number(this.actor.system?.armor?.prow ?? this.actor.system?.armor ?? 0) || 0,
      port: Number(this.actor.system?.armor?.port ?? this.actor.system?.armor ?? 0) || 0,
      starboard: Number(this.actor.system?.armor?.starboard ?? this.actor.system?.armor ?? 0) || 0,
      aft: Number(this.actor.system?.armor?.aft ?? this.actor.system?.armor ?? 0) || 0
    };
    const portStarArmorDisplay = effectiveArmorProfile.port === effectiveArmorProfile.starboard
      ? String(effectiveArmorProfile.port)
      : `${effectiveArmorProfile.port} / ${effectiveArmorProfile.starboard}`;
    const effectiveHullIntegrity = this.actor.getEffectiveShipHullIntegrityValue?.() ?? (Number(this.actor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
    const effectiveHullIntegrityMax = this.actor.getEffectiveShipHullIntegrityMax?.() ?? (Number(this.actor.system?.resources?.hullIntegrity?.max ?? 0) || 0);
    const effectiveCrewValue = this.actor.getEffectiveShipCrewPopulationValue?.() ?? (Number(this.actor.system?.crew?.value ?? 0) || 0);
    const effectiveCrewMax = this.actor.getEffectiveShipCrewPopulationMax?.() ?? (Number(this.actor.system?.crew?.max ?? 0) || 0);
    const effectiveMoraleValue = this.actor.getEffectiveShipMoraleValue?.() ?? (Number(this.actor.system?.resources?.morale?.value ?? 0) || 0);
    const effectiveMoraleMax = this.actor.getEffectiveShipMoraleMax?.() ?? (Number(this.actor.system?.resources?.morale?.max ?? 0) || 0);
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
    const supplementalSystems = [...supplementalComponents, ...shipWeapons]
      .sort((left, right) => left.name.localeCompare(right.name));
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
    const shipActionGroups = this._buildShipActionGroups(shipActions);
    const shipActionColumns = this._buildShipActionColumns(shipActionGroups);
    const hasAssignedAstropath = Boolean(roster.find((entry) => entry.key === "astropath")?.assignedActor);
    const astropathicPowerState = this.actor.system?.astropathicPowers ?? {};
    const shipModifierState = this.actor.system?.modifiers ?? {};
    const showShipActions = Boolean(game.combat);
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
      supplementalComponents: supplementalSystems,
      shipWeapons,
      cargo,
      effects: shipEffects,
      actions: shipActions,
      actionGroups: shipActionGroups,
      actionColumns: shipActionColumns,
      showActions: showShipActions,
      hasAssignedAstropath,
      astropathicPowerOptions: ASTROPATHIC_POWER_OPTIONS.map((option) => ({
        ...option,
        checked: Boolean(astropathicPowerState?.[option.key])
      })),
      modifiers: SHIP_MODIFIER_DEFINITIONS.map((definition) => {
        const modifierState = shipModifierState?.[definition.key] ?? {};
        const manual = Number(modifierState?.manual ?? 0) || 0;
        const automatic = Number(this.actor.getShipAutomaticModifierTotal?.(definition.key) ?? modifierState?.automatic ?? 0) || 0;
        const temporary = Number(modifierState?.temporary ?? 0) || 0;
        return {
          ...definition,
          manual,
          automatic,
          temporary,
          permanentTotal: manual + automatic,
          total: manual + automatic + temporary
        };
      }),
      roster,
      hasEssentialComponents: essentialComponents.length > 0,
      hasSupplementalComponents: supplementalSystems.length > 0,
      hasShipWeapons: shipWeapons.length > 0,
      hasCargo: cargo.length > 0,
      hasEffects: shipEffects.length > 0,
      hasActions: showShipActions && shipActions.length > 0,
      torpedoLoadOptions: TORPEDO_LOAD_OPTIONS,
      art: this.actor.img || "icons/svg/ship.svg",
      controlMode: String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc" ? "npc" : "player",
      controlModeOptions: SHIP_CONTROL_MODE_OPTIONS.map((option) => ({
        ...option,
        selected: option.value === (String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc" ? "npc" : "player")
      })),
      npcCrewRating: Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 30) || 30,
      npcCrewRatingOptions: NPC_CREW_RATING_OPTIONS.map((option) => ({
        ...option,
        selected: option.value === (Number(this.actor.system?.npcCrewRating ?? 30) || 30)
      })),
      isNpcControlled: String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc",
      isCrippled: Boolean(this.actor.isCrippled?.()),
      profileStats: {
        speed: getShipProfileDisplayData(speedData, effectiveSpeed, speedModifierTotals),
        maneuverability: getShipProfileDisplayData(maneuverabilityData, effectiveManeuverability, maneuverabilityModifierTotals),
        detection: getShipProfileDisplayData(detectionData, effectiveDetection, detectionModifierTotals)
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
      effectiveShields,
      effectiveTurretRating,
      effectiveArmorProfile,
      portStarArmorDisplay,
      effectiveHullIntegrity,
      effectiveHullIntegrityMax,
      effectiveCrewValue,
      effectiveCrewMax,
      effectiveMoraleValue,
      effectiveMoraleMax,
      effectivePower: this.actor.getEffectiveShipPower?.() ?? totalPower,
      effectiveSpace: this.actor.getEffectiveShipSpace?.() ?? totalSpace,
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

  async _onRender(context, options) {
    await super._onRender(context, options);

    const root = this.#getRootElement();
    if (!root) return;

    this.#configureScrollLayout(root);
    this.#applyActiveTab(root);
    this.#bindShipListeners(root);
  }

  #getRootElement() {
    if (this.element instanceof HTMLElement) return this.element;
    return this.element?.[0] ?? null;
  }

  #configureScrollLayout(root) {
    const windowContent = root.matches(".window-content")
      ? root
      : root.querySelector(".window-content");
    const shipSheet = root.matches(".ship-sheet")
      ? root
      : root.querySelector(".ship-sheet");
    const sheetBody = shipSheet?.querySelector(".sheet-body");
    const shipFrame = shipSheet?.querySelector(".ship-sheet-frame");

    if (windowContent) {
      windowContent.style.display = "flex";
      windowContent.style.flexDirection = "column";
      windowContent.style.minHeight = "0";
      windowContent.style.height = "100%";
      windowContent.style.overflowY = "auto";
      windowContent.style.overflowX = "hidden";
      windowContent.style.padding = "0";
    }

    if (shipSheet) {
      shipSheet.style.display = "flex";
      shipSheet.style.flexDirection = "column";
      shipSheet.style.minHeight = "0";
      shipSheet.style.height = "auto";
      shipSheet.style.overflow = "visible";
    }

    if (sheetBody) {
      sheetBody.style.flex = "1 1 auto";
      sheetBody.style.minHeight = "auto";
      sheetBody.style.overflow = "visible";
    }

    if (shipFrame) {
      shipFrame.style.minHeight = "auto";
    }
  }

  #applyActiveTab(root) {
    const activeTab = this.#activeTab || "page-one";
    for (const tabButton of root.querySelectorAll(".sheet-tabs [data-tab]")) {
      const tab = String(tabButton.dataset?.tab ?? "");
      tabButton.classList.toggle("active", tab === activeTab);
    }
    for (const tabPanel of root.querySelectorAll(".sheet-body .tab[data-tab]")) {
      const tab = String(tabPanel.dataset?.tab ?? "");
      tabPanel.classList.toggle("active", tab === activeTab);
      tabPanel.hidden = tab !== activeTab;
    }
  }

  #bindShipListeners(root) {
    for (const button of root.querySelectorAll(".sheet-tabs [data-tab]")) {
      button.addEventListener("click", this._onTabChange.bind(this));
    }

    for (const button of root.querySelectorAll(".ship-item-open")) {
      button.setAttribute("draggable", "true");
      button.addEventListener("click", this._onItemOpen.bind(this));
      button.addEventListener("dragstart", this._onItemDragStart.bind(this));
    }
    for (const slot of root.querySelectorAll(".ship-roster-slot[draggable='true']")) {
      slot.addEventListener("dragstart", this._onRosterActorDragStart.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-item-delete")) {
      element.addEventListener("click", this._onDeleteItem.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-weapon-fire")) {
      element.addEventListener("click", this._onShipWeaponFire.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-weapon-load")) {
      element.addEventListener("click", this._onShipWeaponLoad.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-item-create")) {
      element.addEventListener("click", this._onCreateItem.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-construct-button")) {
      element.addEventListener("click", this._onConstructVoidship.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-roster-clear")) {
      element.addEventListener("click", this._onClearRosterAssignment.bind(this));
    }
    for (const element of root.querySelectorAll(".ship-action-button")) {
      element.addEventListener("click", this._onShipActionAssign.bind(this));
      element.addEventListener("contextmenu", this._onShipActionExecute.bind(this));
    }
  }

  _onTabChange(event) {
    event.preventDefault();
    const nextTab = String(event.currentTarget?.dataset?.tab ?? "").trim();
    if (!nextTab || nextTab === this.#activeTab) return;
    this.#activeTab = nextTab;
    const root = this.#getRootElement();
    if (!root) return;
    this.#applyActiveTab(root);
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
    const rawComponentType = String(item.system?.componentType ?? item.system?.categoryType ?? "").trim();
    const displayComponentType = {
      augmentsEnhancements: "Enhancements",
      additionalFacilities: "Facilities",
      cargoPassengerHolds: "Holds"
    }[rawComponentType] ?? rawComponentType;
    const statusKey = String(item.system?.status ?? "intact").trim().toLowerCase();
    const normalizedStatusKey = ["intact", "unpowered", "damaged", "destroyed"].includes(statusKey)
      ? statusKey
      : "intact";
    const statusLabel = {
      intact: "Intact",
      unpowered: "Unpowered",
      damaged: "Damaged",
      destroyed: "Destroyed"
    }[normalizedStatusKey] ?? "Intact";
    const isDepressurized = Boolean(item.system?.depressurized);
    const isOnFire = Boolean(item.system?.onFire);
    const repairRemainingTurns = Math.max(0, Number(item.system?.emergencyRepair?.remainingTurns ?? 0) || 0);
    const isRepairing = Boolean(item.system?.emergencyRepair?.active) && repairRemainingTurns > 0;
    const hazardLabels = [
      ...(isRepairing ? [`Repairing (${repairRemainingTurns})`] : []),
      ...(isDepressurized ? ["Depressurized"] : []),
      ...(isOnFire ? ["On Fire"] : [])
    ];

    return {
      id: item.id,
      img: item.img || "icons/svg/item-bag.svg",
      name: item.name,
      componentType: displayComponentType,
      shipPointCost: Number(item.system?.shipPointCost ?? 0) || 0,
      power: Number(item.system?.power ?? 0) || 0,
      space: Number(item.system?.space ?? 0) || 0,
      generation: Number(item.system?.generation ?? 0) || 0,
      origin: String(item.system?.origin ?? "").trim(),
      shortDescription: String(item.system?.shortDescription ?? "").trim(),
      status: normalizedStatusKey,
      statusLabel,
      statusClass: `is-${normalizedStatusKey}`,
      isDepressurized,
      isOnFire,
      isRepairing,
      repairRemainingTurns,
      hasHazards: hazardLabels.length > 0,
      hazardLabels,
      hazardSummary: hazardLabels.join(", ")
    };
  }

  _buildShipWeaponEntry(item) {
    const locationKey = String(item.system?.location ?? "dorsal").trim().toLowerCase();
    const weaponClass = String(item.system?.weaponClass ?? "macrobattery").trim().toLowerCase();
    const statusKey = String(item.system?.status ?? "intact").trim().toLowerCase();
    const normalizedStatusKey = ["intact", "unpowered", "damaged", "destroyed"].includes(statusKey)
      ? statusKey
      : "intact";
    const statusLabel = {
      intact: "Intact",
      unpowered: "Unpowered",
      damaged: "Damaged",
      destroyed: "Destroyed"
    }[normalizedStatusKey] ?? "Intact";
    const isDepressurized = Boolean(item.system?.depressurized);
    const isOnFire = Boolean(item.system?.onFire);
    const repairRemainingTurns = Math.max(0, Number(item.system?.emergencyRepair?.remainingTurns ?? 0) || 0);
    const isRepairing = Boolean(item.system?.emergencyRepair?.active) && repairRemainingTurns > 0;
    const hazardLabels = [
      ...(isRepairing ? [`Repairing (${repairRemainingTurns})`] : []),
      ...(isDepressurized ? ["Depressurized"] : []),
      ...(isOnFire ? ["On Fire"] : [])
    ];
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
      componentType: SHIP_WEAPON_CLASS_LABELS[weaponClass] ?? "Weapon",
      shortDescription: String(item.system?.shortDescription ?? "").trim(),
      status: normalizedStatusKey,
      statusLabel,
      statusClass: `is-${normalizedStatusKey}`,
      isDepressurized,
      isOnFire,
      isRepairing,
      repairRemainingTurns,
      hasHazards: hazardLabels.length > 0,
      hazardLabels,
      hazardSummary: hazardLabels.join(", "),
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

  _getAssignedShipActionActor(actionKey) {
    const actorUuid = String(this.actor.system?.actionAssignments?.[actionKey]?.actorUuid ?? "").trim();
    if (!actorUuid) return null;
    const assignedActor = fromUuidSync(actorUuid);
    return isVoidshipCrewActor(assignedActor) ? assignedActor : null;
  }

  async _rollShipActionSkillTest({
    title,
    skillName,
    characteristicKey,
    modifier = 0,
    actionActor = null,
    modifierLabel = "Action Modifier",
    extraBreakdown = []
  } = {}) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const normalizedSkillName = String(skillName ?? "").trim().toLowerCase();
    const commandBonus = normalizedSkillName === "command"
      ? (Number(this.actor.getShipModifierTotal?.("commandBonus") ?? 0) || 0)
      : 0;
    const pilotingBonus = normalizedSkillName === "pilot (spacecraft)"
      ? (Number(this.actor.getShipModifierTotal?.("pilotingBonus") ?? 0) || 0)
      : 0;
    const navigationBonus = normalizedSkillName === "psyniscience"
      ? (Number(this.actor.getShipModifierTotal?.("navigationBonus") ?? 0) || 0)
      : 0;
    const totalModifier = modifier + commandBonus + pilotingBonus + navigationBonus;
    const modifierBreakdown = [
      ...(Array.isArray(extraBreakdown) ? extraBreakdown : []),
      ...(commandBonus ? [`Command Bonus: ${commandBonus >= 0 ? `+${commandBonus}` : commandBonus}`] : []),
      ...(pilotingBonus ? [`Piloting Bonus: ${pilotingBonus >= 0 ? `+${pilotingBonus}` : pilotingBonus}`] : []),
      ...(navigationBonus ? [`Navigation Bonus: ${navigationBonus >= 0 ? `+${navigationBonus}` : navigationBonus}`] : []),
      `${modifierLabel}: ${totalModifier >= 0 ? `+${totalModifier}` : totalModifier}`
    ];

    if (isNpcControlled) {
      const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
      return rollD100Test({
        actor: null,
        title,
        target: npcCrewRating,
        modifier: totalModifier,
        breakdown: [
          `NPC Crew Rating: ${npcCrewRating}`,
          ...modifierBreakdown
        ]
      });
    }

    const resolvedActionActor = actionActor ?? this._getCurrentShipActionActor();
    if (!resolvedActionActor) {
      ui.notifications?.warn("Rogue Trader | Select your character or a controlled crew token first.");
      return null;
    }

    const roleLike = { characteristicKey, skillName };
    const primaryValue = this._getRosterRolePrimaryValue(resolvedActionActor, roleLike);
    if (primaryValue?.value == null) {
      ui.notifications?.warn(`Rogue Trader | ${resolvedActionActor.name} cannot use ${skillName}.`);
      return null;
    }

    return rollD100Test({
      actor: resolvedActionActor,
      title,
      target: primaryValue.value,
      modifier: totalModifier,
      breakdown: [
        `${skillName}: ${primaryValue.label}`,
        ...modifierBreakdown
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
    const astropathicPowerState = this.actor.system?.astropathicPowers ?? {};
    const hasAssignedAstropath = Boolean(this.actor.system?.roster?.astropath?.actorUuid);
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";

    return STARSHIP_ACTION_DEFINITIONS.filter((action) => this._isShipActionAvailable(action, {
      astropathicPowerState,
      hasAssignedAstropath
    })).map((action) => {
      const assignmentState = actionAssignments?.[action.key] ?? {};
      const actorUuid = String(assignmentState?.actorUuid ?? "").trim();
      const order = Math.max(0, Number(assignmentState?.order ?? 0) || 0);
      const assignedActor = actorUuid ? fromUuidSync(actorUuid) : null;
      const initials = isNpcControlled
        ? (order > 0 ? String(order) : "")
        : (assignedActor ? getActorInitials(assignedActor) : "");
      const tooltip = `${action.label}\n${action.mode} • ${action.subtype}\n${action.summary}`;

      return {
        ...action,
        actorUuid,
        order,
        assignedActor,
        assignedName: isNpcControlled ? (order > 0 ? `Action ${order}` : "") : (assignedActor?.name ?? ""),
        initials,
        isAssigned: isNpcControlled ? order > 0 : Boolean(assignedActor),
        isAttackAction: (String(action.mode ?? "") === "Shooting" && String(action.subtype ?? "") === "Attack") || String(action.key ?? "") === "hitAndRun",
        tooltip
      };
    });
  }

  _isShipActionAvailable(action, { astropathicPowerState = {}, hasAssignedAstropath = false } = {}) {
    if (this.actor.isJammedCommunications?.() && String(action?.mode ?? "") === "Extended" && String(action?.subtype ?? "") === "Social") return false;
    if (String(action?.mode ?? "") !== "Extended" || String(action?.subtype ?? "") !== "Astropathic") return true;
    if (!hasAssignedAstropath) return false;

    const requiredPowers = ASTROPATHIC_ACTION_POWER_REQUIREMENTS[action.key] ?? [];
    if (!requiredPowers.length) return true;
    return requiredPowers.every((powerKey) => Boolean(astropathicPowerState?.[powerKey]));
  }

  _buildShipActionGroups(actions = []) {
    const groupedKeys = new Set();
    const groups = [];

    for (const definition of SHIP_ACTION_GROUP_DEFINITIONS) {
      const groupedActions = actions.filter((action) => {
        if (String(action.mode ?? "") !== definition.mode) return false;
        if (definition.key === "extended-other") {
          return !["Social", "Technological", "Navigator", "Astropathic"].includes(String(action.subtype ?? ""));
        }
        if (definition.subtype == null) return true;
        return String(action.subtype ?? "") === definition.subtype;
      });

      if (!groupedActions.length) continue;
      for (const action of groupedActions) groupedKeys.add(action.key);

      groups.push({
        key: definition.key,
        label: definition.label,
        accentClass: definition.accentClass,
        actions: groupedActions
      });
    }

    const remainingActions = actions.filter((action) => !groupedKeys.has(action.key));
    if (remainingActions.length) {
      groups.push({
        key: "other-actions",
        label: "Other Actions",
        accentClass: "is-other",
        actions: remainingActions
      });
    }

    return groups;
  }

  _buildShipActionColumns(groups = []) {
    const columnCount = Math.max(1, Math.min(5, groups.length || 1));
    const columns = Array.from({ length: columnCount }, (_, index) => ({
      key: `column-${index + 1}`,
      groups: [],
      weight: 0
    }));

    for (const group of groups) {
      const nextColumn = columns.reduce((best, column) => (column.weight < best.weight ? column : best), columns[0]);
      nextColumn.groups.push(group);
      nextColumn.weight += Math.max(1, Array.isArray(group.actions) ? group.actions.length : 0);
    }

    return columns.filter((column) => column.groups.length > 0);
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
    if (actor.isSilentRunning?.()) {
      pushEffect("Silent Running", "Manoeuvre", "SPD halved. All Manoeuvre action tests suffer -10 while the ship remains in stealth mode.");
    }
    if (actor.isJammedCommunications?.()) {
      pushEffect("Jammed Communications", "Technological", "The ship cannot use Extended / Social actions until the end of its turn.");
    }
    if (actor.isWarpInterferenceActive?.()) {
      const penalty = Math.abs(Number(actor.system?.conditions?.warpInterference?.penalty ?? 10) || 10);
      const roundsRemaining = Math.max(0, Number(actor.system?.conditions?.warpInterference?.remainingRounds ?? 0) || 0);
      pushEffect("Warp Interference", "Navigator", `Detection suffers -${penalty} for ${roundsRemaining} more Strategic Round${roundsRemaining === 1 ? "" : "s"}.`);
    }
    if (Boolean(actor.system?.pendingLockOnTarget?.active)) {
      const pendingLock = actor.system?.pendingLockOnTarget ?? {};
      const weaponLabel = String(pendingLock.weaponName ?? "").trim() || "Selected Weapon";
      const targetLabel = String(pendingLock.targetName ?? "").trim() || "Selected Target";
      const bonus = Math.max(0, Number(pendingLock.bonus ?? 0) || 0);
      pushEffect("Lock on Target", "Technological", `${weaponLabel} gains +${bonus} Ballistic Skill against ${targetLabel} on its next attack this turn.`);
    }
    if (Boolean(actor.system?.pendingTacticalPositioning?.active)) {
      const pendingTacticalPositioning = actor.system?.pendingTacticalPositioning ?? {};
      const mode = String(pendingTacticalPositioning.mode ?? "").trim();
      const bonusDegrees = Math.max(0, Number(pendingTacticalPositioning.bonusDegrees ?? 0) || 0);
      const modeLabel = mode === "evasiveManeuvers"
        ? "next successful Evasive Manoeuvres test"
        : "next successful ship weapon Ballistic Skill test";
      pushEffect("Tactical Positioning", "Navigator", `${modeLabel} gains +${bonusDegrees} DoS this Strategic Turn.`);
    }
    if (Boolean(actor.system?.conditions?.evasiveManeuvers?.active)) {
      const penalty = Math.abs(Number(actor.system?.conditions?.evasiveManeuvers?.penalty ?? 0) || 0);
      pushEffect("Evasive Manoeuvres", "Manoeuvre", `Incoming and outgoing ship shooting tests suffer -${penalty} until the start of the ship's next turn.`);
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
    const advanceBonus = skill.system?.advance20
      ? 20
      : (skill.system?.advance10 ? 10 : 0);
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
      "system.armor.prow": Number(system.armor ?? 0) || 0,
      "system.armor.port": Number(system.armor ?? 0) || 0,
      "system.armor.starboard": Number(system.armor ?? 0) || 0,
      "system.armor.aft": Number(system.armor ?? 0) || 0,
      "system.space.value": Number(system.space ?? 0) || 0,
      "system.shipPoints.value": Number(system.shipPoints ?? 0) || 0,
      "system.resources.hullIntegrity.max": Number(system.hullIntegrity ?? 0) || 0,
      "system.resources.hullIntegrity.value": Number(system.hullIntegrity ?? 0) || 0,
      "system.resources.morale.max": 100,
      "system.resources.morale.value": 100,
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

    event.dataTransfer?.setData("text/plain", JSON.stringify({
      type: "Item",
      uuid: item.uuid
    }));
  }

  _onRosterActorDragStart(event) {
    const actorUuid = String(event.currentTarget?.dataset?.actorUuid ?? "").trim();
    if (!actorUuid) return;

    const actor = fromUuidSync(actorUuid);
    if (!isVoidshipCrewActor(actor)) return;

    event.dataTransfer?.setData("text/plain", JSON.stringify({
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
        status: "intact",
        depressurized: false,
        onFire: false,
        emergencyRepair: {
          active: false,
          remainingTurns: 0,
          source: "",
          operatorName: ""
        },
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
        status: "intact",
        depressurized: false,
        onFire: false,
        emergencyRepair: {
          active: false,
          remainingTurns: 0,
          source: "",
          operatorName: ""
        },
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
        armor: {
          prow: 0,
          port: 0,
          starboard: 0,
          aft: 0
        },
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

  _getShipActionBand(actionKey) {
    const actionDefinition = STARSHIP_ACTION_DEFINITIONS.find((entry) => entry.key === String(actionKey ?? "").trim());
    if (!actionDefinition) return null;

    if (String(actionDefinition.mode ?? "").trim() === "Move" && String(actionDefinition.subtype ?? "").trim() === "Manoeuvre") {
      return "move";
    }
    if (String(actionDefinition.mode ?? "").trim() === "Shooting" && String(actionDefinition.subtype ?? "").trim() === "Attack") {
      return "shooting";
    }
    return null;
  }

  async _onShipActionAssign(event) {
    event.preventDefault();
    const actionKey = String(event.currentTarget?.dataset?.actionKey ?? "").trim();
    if (!actionKey) return;
    const actionBand = this._getShipActionBand(actionKey);

    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    if (isNpcControlled) {
      const actionAssignments = foundry.utils.deepClone(this.actor.system?.actionAssignments ?? {});
      const existingOrder = Math.max(0, Number(actionAssignments?.[actionKey]?.order ?? 0) || 0);

      if (existingOrder > 0) {
        actionAssignments[actionKey] ??= {};
        actionAssignments[actionKey].order = 0;
        actionAssignments[actionKey].actorUuid = "";

        const orderedEntries = Object.entries(actionAssignments)
          .map(([key, assignment]) => ({
            key,
            order: Math.max(0, Number(assignment?.order ?? 0) || 0)
          }))
          .filter((entry) => entry.order > 0)
          .sort((left, right) => left.order - right.order);

        orderedEntries.forEach((entry, index) => {
          actionAssignments[entry.key] ??= {};
          actionAssignments[entry.key].order = index + 1;
          actionAssignments[entry.key].actorUuid = "";
        });
      } else {
        if (actionBand) {
          for (const [key, assignment] of Object.entries(actionAssignments)) {
            if (key === actionKey) continue;
            if (this._getShipActionBand(key) !== actionBand) continue;
            if (Math.max(0, Number(assignment?.order ?? 0) || 0) <= 0) continue;
            actionAssignments[key] ??= {};
            actionAssignments[key].order = 0;
            actionAssignments[key].actorUuid = "";
          }
        }

        const nextOrder = Object.values(actionAssignments).reduce((maxOrder, assignment) =>
          Math.max(maxOrder, Math.max(0, Number(assignment?.order ?? 0) || 0)), 0) + 1;
        actionAssignments[actionKey] ??= {};
        actionAssignments[actionKey].order = nextOrder;
        actionAssignments[actionKey].actorUuid = "";
      }

      await this.actor.update({
        "system.actionAssignments": actionAssignments
      });
      return;
    }

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
    const updateData = {
      [`system.actionAssignments.${actionKey}.actorUuid`]: nextActorUuid
    };

    if (nextActorUuid && actionBand) {
      const actionAssignments = this.actor.system?.actionAssignments ?? {};
      for (const key of Object.keys(actionAssignments)) {
        if (key === actionKey) continue;
        if (this._getShipActionBand(key) !== actionBand) continue;
        if (!String(actionAssignments?.[key]?.actorUuid ?? "").trim()) continue;
        updateData[`system.actionAssignments.${key}.actorUuid`] = "";
      }
    }

    await this.actor.update(updateData);
  }

  async _onShipActionExecute(event) {
    event.preventDefault();
    event.stopPropagation();

    const actionKey = String(event.currentTarget?.dataset?.actionKey ?? "").trim();
    if (!actionKey) return;
    const actionDefinition = STARSHIP_ACTION_DEFINITIONS.find((entry) => entry.key === actionKey) ?? null;
    const consumesBand = actionDefinition
      ? (
          String(actionDefinition.mode ?? "").trim() === "Move" && String(actionDefinition.subtype ?? "").trim() === "Manoeuvre"
            ? "move"
            : String(actionDefinition.mode ?? "").trim() === "Shooting" && String(actionDefinition.subtype ?? "").trim() === "Attack"
              ? "shooting"
              : null
        )
      : null;

    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const assignmentState = this.actor.system?.actionAssignments?.[actionKey] ?? {};
    const isDesignated = isNpcControlled
      ? Math.max(0, Number(assignmentState?.order ?? 0) || 0) > 0
      : Boolean(String(assignmentState?.actorUuid ?? "").trim());
    const assignedActor = this._getAssignedShipActionActor(actionKey);
    if (!isDesignated) {
      ui.notifications?.warn("Rogue Trader | Designate a crew member to that action before executing it.");
      return;
    }

    const silentRunningAssignment = this.actor.system?.actionAssignments?.silentRunning ?? {};
    const silentRunningQueued = this.actor.isSilentRunning?.() !== true && (
      Math.max(0, Number(silentRunningAssignment?.order ?? 0) || 0) > 0
      || Boolean(String(silentRunningAssignment?.actorUuid ?? "").trim())
    );
    if (actionKey !== "silentRunning" && silentRunningQueued) {
      ui.notifications?.warn("Rogue Trader | Silent Running must be executed before any other selected ship actions this turn.");
      return;
    }

    if (consumesBand && game.combat && !this.actor.canUseShipActionBand?.(consumesBand, game.combat)) {
      ui.notifications?.warn(`Rogue Trader | ${consumesBand === "move" ? "One Move / Manoeuvre action" : "One Shooting / Attack action"} has already been used this Strategic Turn.`);
      return;
    }

    let result = null;
    switch (actionKey) {
      case "activeAugury":
        result = await this._rollActiveAugury(assignedActor ?? null);
        break;
      case "standardMove":
        result = await this._performStandardMoveAssist();
        break;
      case "adjustSpeed":
        result = await this._performAdjustSpeedAssist(assignedActor ?? null);
        break;
      case "adjustBearing":
        result = await this._performAdjustBearingAssist(assignedActor ?? null);
        break;
      case "adjustSpeedBearing":
        result = await this._performAdjustSpeedBearingAssist(assignedActor ?? null);
        break;
      case "comeAbout":
        result = await this._performComeAboutAssist(assignedActor ?? null);
        break;
      case "evasiveManeuvers":
        result = await this._performEvasiveManeuversAssist(assignedActor ?? null);
        break;
      case "silentRunning":
        result = await this._performSilentRunningAction();
        break;
      case "aidMachineSpirit":
        result = await this._performAidMachineSpiritAction(assignedActor ?? null);
        break;
      case "flankSpeed":
        result = await this._performFlankSpeedAction(assignedActor ?? null);
        break;
      case "jamCommunications":
        result = await this._performJamCommunicationsAction(assignedActor ?? null);
        break;
      case "hitAndRun":
        result = await this._performHitAndRunAction(assignedActor ?? null);
        break;
      case "ramming":
        result = await this._performRammingAction(assignedActor ?? null);
        break;
      case "disinformation":
        result = await this._performDisinformationAction(assignedActor ?? null);
        break;
      case "holdFast":
        result = await this._performHoldFastAction(assignedActor ?? null);
        break;
      case "firefighting":
        result = await this._performFirefightingAction(assignedActor ?? null);
        break;
      case "fireWeapons":
        result = await this._performFireWeaponsAction(assignedActor ?? null);
        break;
      case "emergencyRepairs":
        result = await this._performEmergencyRepairsAction(assignedActor ?? null);
        break;
      case "focusedAugury":
        result = await this._performFocusedAugury(assignedActor);
        break;
      case "lockOnTarget":
        result = await this._performLockOnTargetAction(assignedActor ?? null);
        break;
      case "scanningTheAether":
        result = await this._performScanningTheAetherAction(assignedActor ?? null);
        break;
      case "warpInterference":
        result = await this._performWarpInterferenceAction(assignedActor ?? null);
        break;
      case "tacticalPositioning":
        result = await this._performTacticalPositioningAction(assignedActor ?? null);
        break;
      default:
        ui.notifications?.info(`Rogue Trader | ${STARSHIP_ACTION_DEFINITIONS.find((entry) => entry.key === actionKey)?.label ?? "That action"} automation is not built yet.`);
        return;
    }

    if (result !== null && consumesBand && game.combat) {
      await this.actor.markShipActionBandUsed?.(consumesBand, game.combat);
    }

    if (result) {
      await this._clearShipActionAssignment(actionKey);
    }
  }

  async _clearShipActionAssignment(actionKey) {
    const key = String(actionKey ?? "").trim();
    if (!key) return;

    const actionAssignments = foundry.utils.deepClone(this.actor.system?.actionAssignments ?? {});
    if (!actionAssignments[key]) return;

    actionAssignments[key].actorUuid = "";
    actionAssignments[key].order = 0;

    const orderedEntries = Object.entries(actionAssignments)
      .map(([entryKey, assignment]) => ({
        key: entryKey,
        order: Math.max(0, Number(assignment?.order ?? 0) || 0)
      }))
      .filter((entry) => entry.order > 0)
      .sort((left, right) => left.order - right.order);

    orderedEntries.forEach((entry, index) => {
      actionAssignments[entry.key] ??= {};
      actionAssignments[entry.key].order = index + 1;
      actionAssignments[entry.key].actorUuid = "";
    });

    await this.actor.update({
      "system.actionAssignments": actionAssignments
    });
  }

  async _performStandardMoveAssist() {
    const speed = Math.max(0, Number(this.actor.getEffectiveShipSpeed?.() ?? this.actor.system?.speed ?? 0) || 0);
    return this._performGuidedStandardMove({
      actionLabel: "Standard Move",
      speed,
      choiceIntro: "Select whether the ship will move at half or full speed. This lightweight assist previews the straight-line move only; end-of-move turning is not automated yet."
    });
  }

  _getShipManoeuvreTestModifier(baseModifier = 0) {
    const effectiveManoeuvrability = Number(this.actor.getEffectiveShipManeuverability?.() ?? this.actor.system?.maneuverability ?? 0) || 0;
    const silentRunningPenalty = this.actor.isSilentRunning?.() ? -10 : 0;
    return effectiveManoeuvrability + (Number(baseModifier ?? 0) || 0) + silentRunningPenalty;
  }

  async _performAdjustSpeedAssist(actionActor = null) {
    const baseSpeed = Math.max(0, Number(this.actor.getEffectiveShipSpeed?.() ?? this.actor.system?.speed ?? 0) || 0);
    const moveChoice = await this._promptStandardMoveChoice(baseSpeed, {
      title: `${this.actor.name}: Adjust Speed`,
      intro: "Choose whether the ship will attempt a half or full move. The pilot test will then determine which adjusted-speed endpoints are legal for that move."
    });
    if (!moveChoice) return null;

    const maneuverabilityModifier = this._getShipManoeuvreTestModifier();
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Adjust Speed`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: maneuverabilityModifier,
      actionActor,
      modifierLabel: "Ship Manoeuvrability"
    });

    if (!result?.success) {
      return this._performGuidedStandardMove({
        actionLabel: "Adjust Speed",
        speed: baseSpeed,
        endpointOptions: [{
          distance: moveChoice.mode === "half" ? Math.floor(baseSpeed / 2) : baseSpeed,
          label: `${moveChoice.label} (Normal Speed)`
        }],
        choiceIntro: `Adjust Speed failed, so the ship must complete its chosen ${moveChoice.label.toLowerCase()} move at normal speed.`,
        adjustedFromSpeed: baseSpeed,
        speedDelta: 0
      });
    }

    const maxAdjustment = Math.max(1, 1 + (Number(result.degrees ?? 0) || 0));
    const adjustedSpeedOptions = [];
    for (let delta = -maxAdjustment; delta <= maxAdjustment; delta += 1) {
      if (delta === 0) continue;
      const adjustedSpeed = Math.min(baseSpeed * 2, Math.max(0, baseSpeed + delta));
      const distance = moveChoice.mode === "half" ? Math.floor(adjustedSpeed / 2) : adjustedSpeed;
      adjustedSpeedOptions.push({
        delta,
        adjustedSpeed,
        distance,
        label: `${delta > 0 ? "+" : ""}${delta} SPD -> ${moveChoice.label} (${distance} VU)`
      });
    }

    const endpointOptions = adjustedSpeedOptions
      .reduce((options, entry) => {
        if (!options.some((option) => option.distance === entry.distance)) {
          options.push({
            distance: entry.distance,
            label: entry.label
          });
        }
        return options;
      }, [])
      .sort((left, right) => left.distance - right.distance);

    if (!endpointOptions.length) {
      ui.notifications?.warn("Rogue Trader | Adjust Speed produced no legal movement endpoints for that move choice.");
      return null;
    }

    return this._performGuidedStandardMove({
      actionLabel: "Adjust Speed",
      speed: Math.max(...endpointOptions.map((option) => option.distance)),
      endpointOptions,
      choiceIntro: `Adjust Speed succeeded with ${result.degrees} DoS. Move the token to any highlighted legal ${moveChoice.label.toLowerCase()} endpoint.`,
      adjustedFromSpeed: baseSpeed,
      speedDelta: maxAdjustment
    });
  }

  async _performAdjustBearingAssist(actionActor = null) {
    const baseSpeed = Math.max(0, Number(this.actor.getEffectiveShipSpeed?.() ?? this.actor.system?.speed ?? 0) || 0);
    const moveChoice = await this._promptStandardMoveChoice(baseSpeed, {
      title: `${this.actor.name}: Adjust Bearing`,
      intro: "Choose whether the ship will attempt a half or full move. The pilot test will then determine how early the ship may turn and which one-turn endpoints are legal."
    });
    if (!moveChoice) return null;

    if (moveChoice.distance <= 1) {
      ui.notifications?.warn("Rogue Trader | Adjust Bearing needs enough movement to move at least 1 VU before turning and still have distance remaining afterward.");
      return null;
    }

    const maneuverabilityModifier = this._getShipManoeuvreTestModifier();
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Adjust Bearing`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: maneuverabilityModifier,
      actionActor,
      modifierLabel: "Ship Manoeuvrability"
    });

    if (!result?.success) {
      return this._performGuidedStandardMove({
        actionLabel: "Adjust Bearing",
        speed: baseSpeed,
        endpointOptions: [{
          distance: moveChoice.distance,
          label: `${moveChoice.label} (Normal Move)`
        }],
        choiceIntro: `Adjust Bearing failed, so the ship must complete its chosen ${moveChoice.label.toLowerCase()} move without the early turn benefit.`,
        adjustedFromSpeed: baseSpeed,
        speedDelta: 0
      });
    }

    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    const tokenDocument = sourceToken?.document ?? sourceToken ?? null;
    if (!tokenDocument || !canvas?.scene) {
      ui.notifications?.warn("Rogue Trader | Place the voidship token on the scene before using Adjust Bearing.");
      return null;
    }

    const gridSize = Number(canvas.grid?.size ?? canvas.dimensions?.size ?? 100) || 100;
    const gridDistance = Number(canvas.grid?.distance ?? canvas.dimensions?.distance ?? 1) || 1;
    const startCenter = getShipTokenCenter(tokenDocument);
    const facing = getShipFacingDegrees(tokenDocument);
    const turnAngle = this._getShipTurnAngleDegrees();
    const earliestTurnDistance = Math.max(1, moveChoice.distance - (2 + (Number(result.degrees ?? 0) || 0)));
    const endpoints = [];
    const seen = new Set();

    for (let turnDistance = earliestTurnDistance; turnDistance <= moveChoice.distance - 1; turnDistance += 1) {
      const remainingDistance = moveChoice.distance - turnDistance;
      const firstLegPixels = (turnDistance / gridDistance) * gridSize;
      const pivot = {
        x: startCenter.x + (Math.cos((facing * Math.PI) / 180) * firstLegPixels),
        y: startCenter.y + (Math.sin((facing * Math.PI) / 180) * firstLegPixels)
      };

      for (const direction of [-1, 1]) {
        const turnedFacing = facing + (turnAngle * direction);
        const secondLegPixels = (remainingDistance / gridDistance) * gridSize;
        const expectedCenter = {
          x: pivot.x + (Math.cos((turnedFacing * Math.PI) / 180) * secondLegPixels),
          y: pivot.y + (Math.sin((turnedFacing * Math.PI) / 180) * secondLegPixels)
        };
        const key = `${Math.round(expectedCenter.x)}:${Math.round(expectedCenter.y)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        endpoints.push({
          distance: moveChoice.distance,
          label: `${direction < 0 ? "Left" : "Right"} ${turnAngle}° after ${turnDistance} VU`,
          expectedCenter
        });
      }
    }

    if (!endpoints.length) {
      ui.notifications?.warn("Rogue Trader | Adjust Bearing did not produce any legal end positions.");
      return null;
    }

    return this._performEndpointGuideMove({
      actionLabel: "Adjust Bearing",
      tokenDocument,
      endpointOptions: endpoints,
      totalDistance: moveChoice.distance,
      intro: `Adjust Bearing succeeded with ${result.degrees} DoS. Move the token to any highlighted legal endpoint after one ${turnAngle}° turn.`,
      summaryHtml: `
        <p><strong>Move:</strong> ${moveChoice.label}</p>
        <p><strong>Distance:</strong> ${moveChoice.distance} VU</p>
        <p><strong>Turn Angle:</strong> ${turnAngle}&deg;</p>
        <p><strong>Earliest Turn:</strong> after ${earliestTurnDistance} VU</p>
      `
    });
  }

  async _performAdjustSpeedBearingAssist(actionActor = null) {
    const baseSpeed = Math.max(0, Number(this.actor.getEffectiveShipSpeed?.() ?? this.actor.system?.speed ?? 0) || 0);
    const moveChoice = await this._promptStandardMoveChoice(baseSpeed, {
      title: `${this.actor.name}: Adjust Speed & Bearing`,
      intro: "Choose whether the ship will attempt a half or full move. The pilot test will then determine which adjusted-speed endpoints are legal and how early the ship may turn."
    });
    if (!moveChoice) return null;

    const maneuverabilityModifier = this._getShipManoeuvreTestModifier(-20);
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Adjust Speed & Bearing`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: maneuverabilityModifier,
      actionActor,
      modifierLabel: "Ship Manoeuvrability - 20"
    });

    if (!result?.success) {
      return this._performGuidedStandardMove({
        actionLabel: "Adjust Speed & Bearing",
        speed: baseSpeed,
        endpointOptions: [{
          distance: moveChoice.mode === "half" ? Math.floor(baseSpeed / 2) : baseSpeed,
          label: `${moveChoice.label} (Normal Speed)`
        }],
        choiceIntro: "Adjust Speed & Bearing failed, so the ship must move its normal amount.",
        adjustedFromSpeed: baseSpeed,
        speedDelta: 0
      });
    }

    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    const tokenDocument = sourceToken?.document ?? sourceToken ?? null;
    if (!tokenDocument || !canvas?.scene) {
      ui.notifications?.warn("Rogue Trader | Place the voidship token on the scene before using Adjust Speed & Bearing.");
      return null;
    }

    const gridSize = Number(canvas.grid?.size ?? canvas.dimensions?.size ?? 100) || 100;
    const gridDistance = Number(canvas.grid?.distance ?? canvas.dimensions?.distance ?? 1) || 1;
    const startCenter = getShipTokenCenter(tokenDocument);
    const facing = getShipFacingDegrees(tokenDocument);
    const turnAngle = this._getShipTurnAngleDegrees();
    const degrees = Number(result.degrees ?? 0) || 0;
    const maxAdjustment = Math.max(1, 1 + degrees);
    const maxSpeed = Math.max(0, baseSpeed * 2);
    const endpoints = [];
    const seen = new Set();
    let zeroMoveLegal = false;

    for (let delta = -maxAdjustment; delta <= maxAdjustment; delta += 1) {
      const adjustedSpeed = Math.min(maxSpeed, Math.max(0, baseSpeed + delta));
      const moveDistance = moveChoice.mode === "half" ? Math.floor(adjustedSpeed / 2) : adjustedSpeed;

      if (moveDistance <= 0) {
        zeroMoveLegal = true;
        continue;
      }

      if (moveDistance <= 1) continue;

      const earliestTurnDistance = Math.max(1, moveDistance - (2 + degrees));
      for (let turnDistance = earliestTurnDistance; turnDistance <= moveDistance - 1; turnDistance += 1) {
        const remainingDistance = moveDistance - turnDistance;
        const firstLegPixels = (turnDistance / gridDistance) * gridSize;
        const pivot = {
          x: startCenter.x + (Math.cos((facing * Math.PI) / 180) * firstLegPixels),
          y: startCenter.y + (Math.sin((facing * Math.PI) / 180) * firstLegPixels)
        };

        for (const direction of [-1, 1]) {
          const turnedFacing = facing + (turnAngle * direction);
          const secondLegPixels = (remainingDistance / gridDistance) * gridSize;
          const expectedCenter = {
            x: pivot.x + (Math.cos((turnedFacing * Math.PI) / 180) * secondLegPixels),
            y: pivot.y + (Math.sin((turnedFacing * Math.PI) / 180) * secondLegPixels)
          };
          const key = `${Math.round(expectedCenter.x)}:${Math.round(expectedCenter.y)}:${moveDistance}:${direction < 0 ? "L" : "R"}`;
          if (seen.has(key)) continue;
          seen.add(key);
          endpoints.push({
            distance: moveDistance,
            label: `${delta >= 0 ? "+" : ""}${delta} SPD, ${direction < 0 ? "Left" : "Right"} ${turnAngle}° after ${turnDistance} VU`,
            expectedCenter
          });
        }
      }
    }

    if (!endpoints.length && !zeroMoveLegal) {
      ui.notifications?.warn("Rogue Trader | Adjust Speed & Bearing did not produce any legal end positions.");
      return null;
    }

    if (zeroMoveLegal) {
      const zeroMoveChoice = await this._promptZeroMoveOption("Adjust Speed & Bearing");
      if (zeroMoveChoice === "stay") {
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `
            <div class="roguetrader-roll-card">
              <h3>${this.actor.name}: Adjust Speed & Bearing</h3>
              <p><strong>Move:</strong> Stay in Place</p>
              <p><strong>Distance:</strong> 0 VU</p>
              <p>The ship held position as a legal result of the manoeuvre.</p>
            </div>
          `
        });
        return {
          success: true,
          distance: 0,
          label: "Stay in Place"
        };
      }
      if (zeroMoveChoice == null) return null;
    }

    return this._performEndpointGuideMove({
      actionLabel: "Adjust Speed & Bearing",
      tokenDocument,
      endpointOptions: endpoints,
      totalDistance: Math.max(...endpoints.map((endpoint) => endpoint.distance)),
      intro: `Adjust Speed & Bearing succeeded with ${degrees} DoS. Move the token to any highlighted legal endpoint after one ${turnAngle}° turn.`,
      summaryHtml: `
        <p><strong>Move:</strong> ${moveChoice.label}</p>
        <p><strong>Allowed Speed Change:</strong> up to ${maxAdjustment} VU</p>
        <p><strong>Turn Angle:</strong> ${turnAngle}&deg;</p>
        <p><strong>Limits:</strong> minimum 0 VU, maximum ${maxSpeed} VU</p>
      `
    });
  }

  async _performComeAboutAssist(actionActor = null) {
    const baseSpeed = Math.max(0, Number(this.actor.getEffectiveShipSpeed?.() ?? this.actor.system?.speed ?? 0) || 0);
    if (baseSpeed <= 1) {
      ui.notifications?.warn("Rogue Trader | Come About needs enough movement to reach half Speed, turn, and then continue moving.");
      return null;
    }

    const maneuverabilityModifier = this._getShipManoeuvreTestModifier(-10);
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Come About to New Heading`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: maneuverabilityModifier,
      actionActor,
      modifierLabel: "Ship Manoeuvrability - 10"
    });

    if (!result?.success) {
      return this._performGuidedStandardMove({
        actionLabel: "Come About to New Heading",
        speed: baseSpeed,
        endpointOptions: [{
          distance: baseSpeed,
          label: "Full Speed (Normal Move)"
        }],
        choiceIntro: "Come About failed, so the ship must make a normal full move instead.",
        adjustedFromSpeed: baseSpeed,
        speedDelta: 0
      });
    }

    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    const tokenDocument = sourceToken?.document ?? sourceToken ?? null;
    if (!tokenDocument || !canvas?.scene) {
      ui.notifications?.warn("Rogue Trader | Place the voidship token on the scene before using Come About to New Heading.");
      return null;
    }

    const gridSize = Number(canvas.grid?.size ?? canvas.dimensions?.size ?? 100) || 100;
    const gridDistance = Number(canvas.grid?.distance ?? canvas.dimensions?.distance ?? 1) || 1;
    const startCenter = getShipTokenCenter(tokenDocument);
    const facing = getShipFacingDegrees(tokenDocument);
    const turnAngle = this._getShipTurnAngleDegrees();
    const firstLegDistance = Math.max(1, Math.floor(baseSpeed / 2));
    const secondLegDistance = Math.max(0, baseSpeed - firstLegDistance);
    const firstLegPixels = (firstLegDistance / gridDistance) * gridSize;
    const secondLegPixels = (secondLegDistance / gridDistance) * gridSize;
    const pivot = {
      x: startCenter.x + (Math.cos((facing * Math.PI) / 180) * firstLegPixels),
      y: startCenter.y + (Math.sin((facing * Math.PI) / 180) * firstLegPixels)
    };

    const endpoints = [];
    for (const direction of [-1, 1]) {
      const turnedFacing = facing + (turnAngle * direction);
      endpoints.push({
        distance: baseSpeed,
        label: `${direction < 0 ? "Left" : "Right"} ${turnAngle}° at ${firstLegDistance} VU, then final ${turnAngle}° turn at end`,
        expectedCenter: {
          x: pivot.x + (Math.cos((turnedFacing * Math.PI) / 180) * secondLegPixels),
          y: pivot.y + (Math.sin((turnedFacing * Math.PI) / 180) * secondLegPixels)
        }
      });
    }

    const moveResult = await this._performEndpointGuideMove({
      actionLabel: "Come About to New Heading",
      tokenDocument,
      endpointOptions: endpoints,
      totalDistance: baseSpeed,
      intro: `Come About succeeded. Move the token to either highlighted legal endpoint. Ship weapon Ballistic Skill Tests suffer -20 during this turn.`,
      summaryHtml: `
        <p><strong>Move:</strong> Full Speed (${baseSpeed} VU)</p>
        <p><strong>First Turn:</strong> after ${firstLegDistance} VU</p>
        <p><strong>Second Turn:</strong> at the end of the move</p>
        <p><strong>Turn Angle:</strong> ${turnAngle}&deg;</p>
        <p><strong>Reminder:</strong> Ship weapon Ballistic Skill Tests suffer -20 this turn.</p>
      `
    });

    if (!moveResult?.success) return moveResult;

    await this.actor.update({
      "system.modifiers.extraAccuracy.temporary": -20
    });

    return moveResult;
  }

  async _performEvasiveManeuversAssist(actionActor = null) {
    const baseSpeed = Math.max(0, Number(this.actor.getEffectiveShipSpeed?.() ?? this.actor.system?.speed ?? 0) || 0);
    const moveChoice = await this._promptStandardMoveChoice(baseSpeed, {
      title: `${this.actor.name}: Evasive Manoeuvres`,
      intro: "Choose whether the ship will attempt a half or full move. The pilot test will determine the shooting penalty applied until the beginning of the ship's next turn."
    });
    if (!moveChoice) return null;

    const maneuverabilityModifier = this._getShipManoeuvreTestModifier(-10);
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Evasive Manoeuvres`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: maneuverabilityModifier,
      actionActor,
      modifierLabel: "Ship Manoeuvrability - 10"
    });

    const moveResult = await this._performGuidedStandardMove({
      actionLabel: "Evasive Manoeuvres",
      speed: baseSpeed,
      endpointOptions: [{
        distance: moveChoice.distance,
        label: result?.success ? `${moveChoice.label} (Evasive)` : `${moveChoice.label} (Normal Speed)`
      }],
      choiceIntro: result?.success
        ? `Evasive Manoeuvres succeeded with ${result.degrees} DoS. Complete the chosen move to apply the shooting penalty.`
        : "Evasive Manoeuvres failed, so the ship still moves its chosen normal amount but gains no shooting penalty.",
      adjustedFromSpeed: baseSpeed,
      speedDelta: 0
    });

    if (!moveResult?.success) return moveResult;
    if (!result?.success) return moveResult;

    const tacticalPositioningBonusDegrees = Number(this.actor.getPendingTacticalPositioningBonusDegrees?.("evasiveManeuvers") ?? 0) || 0;
    if (tacticalPositioningBonusDegrees > 0) {
      result.degrees = Math.max(0, Number(result.degrees ?? 0) || 0) + tacticalPositioningBonusDegrees;
      await this.actor.consumePendingTacticalPositioning?.("evasiveManeuvers");
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Tactical Positioning</h3>
            <p><strong>Effect Applied:</strong> +${tacticalPositioningBonusDegrees} DoS to Evasive Manoeuvres.</p>
          </div>
        `
      });
    }

    const additionalDegrees = Math.max(0, Number(result.degrees ?? 0) || 0);
    const successfulSteps = 1 + additionalDegrees;
    const penalty = successfulSteps * 10;
    await this.actor.applyEvasiveManeuvers?.(penalty, { combat: game.combat ?? null, sourceName: "Evasive Manoeuvres" });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Evasive Manoeuvres</h3>
          <p><strong>Penalty Applied:</strong> -${penalty} to all shooting directed against the ship.</p>
          <p><strong>Also Applies To:</strong> The ship's own shooting tests.</p>
          <p><strong>Duration:</strong> Until the beginning of the ship's next turn.</p>
        </div>
      `
    });

    return moveResult;
  }

  async _performSilentRunningAction() {
    if (this.actor.isSilentRunning?.()) {
      ui.notifications?.info("Rogue Trader | This ship is already on Silent Running.");
      return null;
    }

    const existingEffect = Array.from(this.actor.effects ?? []).find((effect) =>
      effect?.statuses?.has?.("silent-running")
      || Array.isArray(effect?.statuses) && effect.statuses.includes("silent-running")
    );
    if (!existingEffect) {
      await this.actor.createEmbeddedDocuments("ActiveEffect", [{
        name: "Silent Running",
        img: "systems/roguetrader/assets/svg/hidden.svg",
        statuses: ["silent-running"]
      }]);
    }

    await this.actor.update({
      "system.conditions.silentRunning.source": "Silent Running",
      "system.conditions.silentRunning.appliedAt": {
        combatId: String(game.combat?.id ?? ""),
        round: Number(game.combat?.round ?? 0) || 0,
        turn: Number(game.combat?.turn ?? 0) || 0
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Silent Running</h3>
          <p><strong>Status:</strong> Silent Running engaged.</p>
          <p><strong>Effects:</strong> Speed is halved and all Manoeuvre action tests suffer -10 while the ship remains in stealth mode.</p>
        </div>
      `
    });

    return {
      success: true,
      label: "Silent Running"
    };
  }

  async _promptAidMachineSpiritTarget() {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.actor.name}: Aid the Machine Spirit`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Choose which ship system the machine spirit will aid this turn.</p>
          </div>
        `,
        buttons: {
          maneuverability: {
            label: "Manoeuvrability",
            callback: () => finish({
              key: "extraManeuverability",
              label: "Manoeuvrability"
            })
          },
          detection: {
            label: "Detection",
            callback: () => finish({
              key: "extraDetection",
              label: "Detection"
            })
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "maneuverability",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _performAidMachineSpiritAction(actionActor = null) {
    const selectedTarget = await this._promptAidMachineSpiritTarget();
    if (!selectedTarget) return null;

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Aid the Machine Spirit`,
      skillName: "Tech-Use",
      characteristicKey: "intelligence",
      modifier: 0,
      actionActor,
      modifierLabel: "Action Modifier"
    });
    if (!result) return null;

    const degrees = Math.max(0, Number(result.degrees ?? 0) || 0);
    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Aid the Machine Spirit</h3>
            <p><strong>Target System:</strong> ${selectedTarget.label}</p>
            <p><strong>Result:</strong> Failed</p>
            <p>The machine spirit does not grant any bonus this turn.</p>
          </div>
        `
      });
      return result;
    }

    const bonus = 5 * (1 + degrees);
    const currentTemporary = Number(this.actor.getShipModifierTemporaryTotal?.(selectedTarget.key) ?? 0) || 0;
    await this.actor.update({
      [`system.modifiers.${selectedTarget.key}.temporary`]: currentTemporary + bonus
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Aid the Machine Spirit</h3>
          <p><strong>Target System:</strong> ${selectedTarget.label}</p>
          <p><strong>Bonus Applied:</strong> +${bonus}</p>
          <p><strong>Duration:</strong> Until the beginning of the ship's next turn.</p>
        </div>
      `
    });

    return {
      ...result,
      appliedModifierKey: selectedTarget.key,
      appliedBonus: bonus
    };
  }

  async _performFlankSpeedAction(actionActor = null) {
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Flank Speed`,
      skillName: "Tech-Use",
      characteristicKey: "intelligence",
      modifier: 0,
      actionActor,
      modifierLabel: "Action Modifier"
    });
    if (!result) return null;

    const degrees = Math.max(0, Number(result.degrees ?? 0) || 0);
    if (result.success) {
      const bonus = 1 + degrees;
      const currentTemporary = Number(this.actor.getShipModifierTemporaryTotal?.("extraSpeed") ?? 0) || 0;
      await this.actor.update({
        "system.modifiers.extraSpeed.temporary": currentTemporary + bonus
      });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Flank Speed</h3>
            <p><strong>Speed Bonus Applied:</strong> +${bonus} VU</p>
            <p><strong>Duration:</strong> Until the beginning of the ship's next turn.</p>
          </div>
        `
      });

      return {
        ...result,
        appliedModifierKey: "extraSpeed",
        appliedBonus: bonus
      };
    }

    if (degrees >= 2) {
      await this.actor.applyEnginesCrippled?.({
        sourceName: "Flank Speed",
        announced: true
      });
    } else {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Flank Speed</h3>
            <p><strong>Result:</strong> Failed</p>
            <p>The engines do not grant any additional speed this turn.</p>
          </div>
        `
      });
    }

    return result;
  }

  async _performJamCommunicationsAction(actionActor = null) {
    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | Place the voidship token on the scene before using Jam Communications.");
      return null;
    }

    const targetToken = Array.from(game.user?.targets ?? []).find((token) =>
      token?.actor?.type === "ship" && token.actor.uuid !== this.actor.uuid
    ) ?? null;
    if (!targetToken) {
      ui.notifications?.warn("Rogue Trader | Target a ship to use Jam Communications.");
      return null;
    }

    const distanceVu = getDistanceVuBetweenTokens(sourceToken, targetToken);
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Jam Communications`,
      skillName: "Tech-Use",
      characteristicKey: "intelligence",
      modifier: -10,
      actionActor,
      modifierLabel: "Action Modifier"
    });
    if (!result) return null;
    if (!result.success) return result;

    const degrees = Math.max(0, Number(result.degrees ?? 0) || 0);
    const maxRange = 10 + degrees;
    if (distanceVu > maxRange) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Jam Communications</h3>
            <p><strong>Target:</strong> ${targetToken.name}</p>
            <p><strong>Result:</strong> Signal lock failed</p>
            <p><strong>Range:</strong> ${distanceVu.toFixed(1)} / ${maxRange} VU</p>
          </div>
        `
      });
      return {
        ...result,
        success: false,
        outOfRange: true
      };
    }

    const targetActor = targetToken.actor;
    if (!targetActor.isJammedCommunications?.()) {
      await targetActor.createEmbeddedDocuments("ActiveEffect", [{
        name: "Jammed Communications",
        img: "systems/roguetrader/assets/svg/walkie-talkie.svg",
        statuses: ["jammed-communications"]
      }]);
    }

    await targetActor.update({
      "system.conditions.jammedCommunications.source": this.actor.name
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Jam Communications</h3>
          <p><strong>Target:</strong> ${targetToken.name}</p>
          <p><strong>Status Applied:</strong> Jammed Communications</p>
          <p><strong>Range:</strong> ${distanceVu.toFixed(1)} / ${maxRange} VU</p>
          <p><strong>Effect:</strong> The target cannot use Extended / Social actions until the end of its turn.</p>
        </div>
      `
    });

    return result;
  }

  async _promptDisinformationSkill() {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.actor.name}: Disinformation`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Choose which social skill will be used for the deception campaign.</p>
          </div>
        `,
        buttons: {
          deceive: {
            label: "Deceive",
            callback: () => finish("Deceive")
          },
          blather: {
            label: "Blather",
            callback: () => finish("Blather")
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "deceive",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _performDisinformationAction(actionActor = null) {
    const selectedSkill = await this._promptDisinformationSkill();
    if (!selectedSkill) return null;

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Disinformation`,
      skillName: selectedSkill,
      characteristicKey: "fellowship",
      modifier: -10,
      actionActor,
      modifierLabel: "Difficult Test"
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Disinformation</h3>
            <p><strong>Skill:</strong> ${selectedSkill}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>The disinformation campaign fails to bolster the crew's morale.</p>
          </div>
        `
      });
      return result;
    }

    const degrees = Math.max(0, Number(result.degrees ?? 0) || 0);
    const moraleDice = 1 + degrees;
    const moraleRoll = await (new Roll(`${moraleDice}d5`)).evaluate({ async: true });
    const moraleGain = Math.max(0, Number(moraleRoll.total ?? 0) || 0);
    const moraleModifier = Number(this.actor.getShipModifierTotal?.("extraMoralePercent") ?? 0) || 0;
    const currentMorale = Math.max(0, Number(this.actor.getEffectiveShipMoraleValue?.() ?? this.actor.system?.resources?.morale?.value ?? 0) || 0);
    const maxMorale = Math.max(0, Number(this.actor.getEffectiveShipMoraleMax?.() ?? this.actor.system?.resources?.morale?.max ?? 0) || 0);
    const newMorale = Math.min(maxMorale, currentMorale + moraleGain);

    await this.actor.update({
      "system.resources.morale.value": Math.max(0, newMorale - moraleModifier)
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Disinformation</h3>
          <p><strong>Skill:</strong> ${selectedSkill}</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Morale Restored:</strong> ${moraleRoll.formula} = ${moraleGain}</p>
          <p><strong>Morale:</strong> ${currentMorale} -> ${newMorale}</p>
        </div>
      `
    });

    return {
      ...result,
      selectedSkill,
      moraleGain,
      moraleRoll,
      moraleAfter: newMorale
    };
  }

  async _performHoldFastAction(actionActor = null) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    if (!isNpcControlled && !shipActorHasTalentNamed(actionActor, "Air of Authority")) {
      ui.notifications?.warn("Rogue Trader | Hold Fast! requires Air of Authority.");
      return null;
    }

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Hold Fast!`,
      skillName: "",
      characteristicKey: "willpower",
      modifier: 0,
      actionActor,
      modifierLabel: "Challenging Test"
    });
    if (!result) return null;

    const operatorLabel = isNpcControlled
      ? `NPC Crew (${Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0})`
      : (actionActor?.name ?? "Assigned Officer");
    const previousMoraleLoss = Math.max(0, Number(this.actor.getPreviousTurnShipMoraleLoss?.() ?? 0) || 0);

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Hold Fast!</h3>
            <p><strong>Officer:</strong> ${operatorLabel}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>No morale was recovered.</p>
          </div>
        `
      });
      return result;
    }

    const attemptedRecovery = Math.max(1, 1 + Math.max(0, Number(result.degrees ?? 0) || 0));
    const moraleRecovered = Math.min(previousMoraleLoss, attemptedRecovery);
    const currentMorale = Math.max(0, Number(this.actor.getEffectiveShipMoraleValue?.() ?? this.actor.system?.resources?.morale?.value ?? 0) || 0);
    const moraleModifier = Number(this.actor.getShipModifierTotal?.("extraMoralePercent") ?? 0) || 0;
    const maxMorale = Math.max(0, Number(this.actor.getEffectiveShipMoraleMax?.() ?? this.actor.system?.resources?.morale?.max ?? 0) || 0);
    const newMorale = Math.min(maxMorale, currentMorale + moraleRecovered);

    if (moraleRecovered > 0) {
      await this.actor.update({
        "system.resources.morale.value": Math.max(0, newMorale - moraleModifier)
      }, {
        roguetraderSkipShipLossTracking: true
      });
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Hold Fast!</h3>
          <p><strong>Officer:</strong> ${operatorLabel}</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Previous Turn Morale Loss:</strong> ${previousMoraleLoss}</p>
          <p><strong>Recovery Attempt:</strong> ${attemptedRecovery}</p>
          <p><strong>Morale Restored:</strong> ${moraleRecovered}</p>
          <p><strong>Morale:</strong> ${currentMorale} -> ${newMorale}</p>
        </div>
      `
    });

    return {
      ...result,
      previousMoraleLoss,
      attemptedRecovery,
      moraleRecovered,
      moraleAfter: newMorale
    };
  }

  _getShipRosterActor(shipActor, roleKey) {
    const actorUuid = String(shipActor?.system?.roster?.[roleKey]?.actorUuid ?? "").trim();
    return actorUuid ? fromUuidSync(actorUuid) : null;
  }

  _getShipRolePrimaryValueForActor(shipActor, roleKey) {
    const role = SHIP_ROSTER_ROLES.find((entry) => entry.key === roleKey) ?? null;
    if (!role) return { value: null, label: "-" };
    const assignedActor = this._getShipRosterActor(shipActor, roleKey);
    return this._getRosterRolePrimaryValue(assignedActor, role);
  }

  async _rollShipDefenderCommandTest(targetShipActor, { title = "", modifier = 10, extraBreakdown = [] } = {}) {
    if (!targetShipActor || targetShipActor.type !== "ship") return null;

    const isNpcControlled = String(targetShipActor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const assignedCaptain = this._getShipRosterActor(targetShipActor, "captain");
    const commandBonus = Number(targetShipActor.getShipModifierTotal?.("commandBonus") ?? 0) || 0;
    const hitAndRunDefenseBonus = Number(targetShipActor.getShipModifierTotal?.("hitAndRunDefenseBonus") ?? 0) || 0;
    const totalModifier = modifier + commandBonus + hitAndRunDefenseBonus;
    const breakdown = [
      ...(commandBonus ? [`Command Bonus: ${commandBonus >= 0 ? `+${commandBonus}` : commandBonus}`] : []),
      ...(hitAndRunDefenseBonus ? [`Hit & Run Defense: ${hitAndRunDefenseBonus >= 0 ? `+${hitAndRunDefenseBonus}` : hitAndRunDefenseBonus}`] : []),
      ...(Array.isArray(extraBreakdown) ? extraBreakdown : []),
      `Ordinary Test: ${totalModifier >= 0 ? `+${totalModifier}` : totalModifier}`
    ];

    if (isNpcControlled) {
      const npcCrewRating = Number(targetShipActor.getEffectiveShipCrewRating?.() ?? targetShipActor.system?.npcCrewRating ?? 0) || 0;
      return rollD100Test({
        actor: null,
        title,
        target: npcCrewRating,
        modifier: totalModifier,
        breakdown: [
          `NPC Crew Rating: ${npcCrewRating}`,
          ...breakdown
        ]
      });
    }

    const primaryValue = this._getRosterRolePrimaryValue(assignedCaptain, SHIP_ROSTER_ROLES.find((entry) => entry.key === "captain") ?? null);
    if (primaryValue?.value == null) {
      const fallbackTarget = Number(targetShipActor.getEffectiveShipCrewRating?.() ?? targetShipActor.system?.npcCrewRating ?? 0) || 0;
      return rollD100Test({
        actor: null,
        title,
        target: fallbackTarget,
        modifier: totalModifier,
        breakdown: [
          `Fallback Crew Rating: ${fallbackTarget}`,
          ...breakdown
        ]
      });
    }

    return rollD100Test({
      actor: assignedCaptain,
      title,
      target: Number(primaryValue.value ?? 0) || 0,
      modifier: totalModifier,
      breakdown: [
        `Command: ${primaryValue.label}`,
        ...breakdown
      ]
    });
  }

  async _promptHitAndRunCriticalChoice(targetShipActor, options = []) {
    if (!Array.isArray(options) || !options.length) return null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const optionMarkup = options.map((option, index) => `
        <div class="ship-critical-subresult">
          <h4>Option ${index + 1}: ${option.roll.formula} = ${option.rollTotal}</h4>
          <p><strong>${option.entry?.name ?? "Critical Result"}</strong></p>
          <p>${option.entry?.description ?? ""}</p>
        </div>
      `).join("");

      new Dialog({
        title: `${this.actor.name}: Select Hit & Run Critical`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Select which critical effect to apply to ${targetShipActor?.name ?? "the target ship"}.</p>
            ${optionMarkup}
          </div>
        `,
        buttons: Object.fromEntries(options.map((option, index) => [
          `option${index + 1}`,
          {
            label: `Choose Option ${index + 1}`,
            callback: () => finish(option)
          }
        ]).concat([
          ["cancel", { label: "Cancel", callback: () => finish(null) }]
        ])),
        default: "option1",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _performHitAndRunAction(actionActor = null) {
    const sourceToken = this.actor.getActiveTokens?.(true)?.[0] ?? this.actor.getActiveTokens?.()[0] ?? null;
    const targetedTokens = Array.from(game.user?.targets ?? []).filter((token) => token?.actor?.type === "ship" && token.actor.id !== this.actor.id);
    const targetToken = targetedTokens[0] ?? null;
    const targetShipActor = targetToken?.actor ?? null;

    if (!sourceToken || !targetToken || !targetShipActor) {
      ui.notifications?.warn("Rogue Trader | Target one enemy ship token before performing Hit & Run.");
      return null;
    }

    const distanceVu = getDistanceVuBetweenTokens(sourceToken, targetToken);
    if (distanceVu > 5) {
      ui.notifications?.warn(`Rogue Trader | ${targetToken.name} is out of Hit & Run range (${distanceVu.toFixed(1)} / 5.0 VU).`);
      return null;
    }

    await this.actor._playAutomatedAttackAnimation?.({
      id: "ship-action-hit-and-run",
      name: "Hit & Run",
      type: "shipAction",
      img: "systems/roguetrader/assets/svg/black-flag.svg"
    }, [targetToken]);

    const turretRating = Math.max(0, Number(targetShipActor.getEffectiveShipTurretRating?.() ?? targetShipActor.system?.turretRating ?? 0) || 0);
    const pilotPenalty = turretRating * -10;
    const pilotResult = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Hit & Run Approach`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: pilotPenalty,
      actionActor,
      modifierLabel: "Target Turret Penalty",
      extraBreakdown: [
        `Target: ${targetShipActor.name}`,
        `Range: ${distanceVu.toFixed(1)} / 5.0 VU`,
        `Target Turret Rating: ${turretRating}`
      ]
    });
    if (!pilotResult) return null;

    if (!pilotResult.success) {
      const catastrophicFailure = Math.max(0, Number(pilotResult.degrees ?? 0) || 0) >= 4;
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Hit & Run</h3>
            <p><strong>Target:</strong> ${targetShipActor.name}</p>
            <p><strong>Approach:</strong> Failed (${pilotResult.degrees} DoF)</p>
            <p>${catastrophicFailure ? "The boarding craft is shot down." : "The raiders are forced to break off and return to their ship."}</p>
          </div>
        `
      });
      return {
        ...pilotResult,
        stage: "approach",
        targetShipId: targetShipActor.id,
        targetShipName: targetShipActor.name
      };
    }

    const hitAndRunAttackBonus = Number(this.actor.getShipModifierTotal?.("hitAndRunAttackBonus") ?? 0) || 0;
    const attackerCommandResult = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Hit & Run Command`,
      skillName: "Command",
      characteristicKey: "fellowship",
      modifier: 10 + hitAndRunAttackBonus,
      actionActor,
      modifierLabel: "Ordinary Test",
      extraBreakdown: [
        `Target: ${targetShipActor.name}`,
        ...(hitAndRunAttackBonus ? [`Hit & Run Attack: ${hitAndRunAttackBonus >= 0 ? `+${hitAndRunAttackBonus}` : hitAndRunAttackBonus}`] : [])
      ]
    });
    if (!attackerCommandResult) return null;

    const defenderCommandResult = await this._rollShipDefenderCommandTest(targetShipActor, {
      title: `${targetShipActor.name}: Repel Hit & Run`,
      modifier: 10,
      extraBreakdown: [`Attacker: ${this.actor.name}`]
    });
    if (!defenderCommandResult) return null;

    const attackerWon = Boolean(attackerCommandResult.success)
      && (!defenderCommandResult.success || Number(attackerCommandResult.degrees ?? 0) > Number(defenderCommandResult.degrees ?? 0));

    if (!attackerWon) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Hit & Run</h3>
            <p><strong>Target:</strong> ${targetShipActor.name}</p>
            <p><strong>Approach:</strong> Success (${pilotResult.degrees} DoS)</p>
            <p><strong>Attacker Command:</strong> ${attackerCommandResult.success ? `Success (${attackerCommandResult.degrees} DoS)` : `Failed (${attackerCommandResult.degrees} DoF)`}</p>
            <p><strong>Defender Command:</strong> ${defenderCommandResult.success ? `Success (${defenderCommandResult.degrees} DoS)` : `Failed (${defenderCommandResult.degrees} DoF)`}</p>
            <p>The raiding party is forced to retreat without causing damage.</p>
          </div>
        `
      });
      return {
        success: false,
        stage: "command",
        pilotResult,
        attackerCommandResult,
        defenderCommandResult
      };
    }

    const criticalOptions = [];
    for (let index = 0; index < 2; index += 1) {
      const roll = await (new Roll("1d5")).evaluate({ async: true });
      const rollTotal = Math.max(1, Number(roll.total ?? 0) || 1);
      criticalOptions.push({
        roll,
        rollTotal,
        entry: resolveReferenceTableResult("starshipCriticalHits", rollTotal)
      });
    }

    const selectedCritical = await this._promptHitAndRunCriticalChoice(targetShipActor, criticalOptions);
    if (!selectedCritical) return null;

    const hullDamage = 1 + Math.max(0, Number(attackerCommandResult.degrees ?? 0) || 0);
    const currentHullIntegrity = Math.max(0, Number(targetShipActor.getEffectiveShipHullIntegrityValue?.() ?? targetShipActor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
    const hullModifier = Number(targetShipActor.getShipModifierTotal?.("extraHullIntegrity") ?? 0) || 0;
    const newHullIntegrity = Math.max(0, currentHullIntegrity - hullDamage);

    await targetShipActor.update({
      "system.resources.hullIntegrity.value": Math.max(0, newHullIntegrity - hullModifier)
    });
    await targetShipActor.syncCrippledState?.({ announced: true, sourceName: `Hit & Run (${this.actor.name})` });

    const criticalResult = await resolveStarshipCriticalHit(targetShipActor, this.actor, { name: "Hit & Run" }, selectedCritical.rollTotal, {
      sourceLabel: `Hit & Run (${this.actor.name})`
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Hit & Run</h3>
          <p><strong>Target:</strong> ${targetShipActor.name}</p>
          <p><strong>Approach:</strong> Success (${pilotResult.degrees} DoS)</p>
          <p><strong>Attacker Command:</strong> Success (${attackerCommandResult.degrees} DoS)</p>
          <p><strong>Defender Command:</strong> ${defenderCommandResult.success ? `Success (${defenderCommandResult.degrees} DoS)` : `Failed (${defenderCommandResult.degrees} DoF)`}</p>
          <p><strong>Hull Integrity Damage:</strong> ${currentHullIntegrity} -> ${newHullIntegrity} (${hullDamage})</p>
          <p><strong>Critical Chosen:</strong> ${selectedCritical.roll.formula} = ${selectedCritical.rollTotal} (${selectedCritical.entry?.name ?? "Critical Result"})</p>
        </div>
      `
    });

    return {
      success: true,
      pilotResult,
      attackerCommandResult,
      defenderCommandResult,
      selectedCritical,
      criticalResult,
      hullDamage,
      currentHullIntegrity,
      newHullIntegrity
    };
  }

  async _performRammingAction(actionActor = null) {
    const sourceToken = this.actor.getActiveTokens?.(true)?.[0] ?? this.actor.getActiveTokens?.()[0] ?? null;
    const targetedTokens = Array.from(game.user?.targets ?? []).filter((token) => token?.actor?.type === "ship" && token.actor.id !== this.actor.id);
    const targetToken = targetedTokens[0] ?? null;
    const targetShipActor = targetToken?.actor ?? null;

    if (!sourceToken || !targetToken || !targetShipActor) {
      ui.notifications?.warn("Rogue Trader | Target one enemy ship token before performing Ramming.");
      return null;
    }

    const distanceVu = getDistanceVuBetweenTokens(sourceToken, targetToken);
    if (distanceVu > 1) {
      ui.notifications?.warn(`Rogue Trader | ${targetToken.name} is out of ramming range (${distanceVu.toFixed(1)} / 1.0 VU).`);
      return null;
    }

    const targetBearing = getRelativeBearing(sourceToken, targetToken);
    if (String(targetBearing?.bearing ?? "") !== "fore") {
      ui.notifications?.warn("Rogue Trader | The target must be in the ship's fore arc to ram it.");
      return null;
    }

    await this.actor._playAutomatedAttackAnimation?.({
      id: "ship-action-ramming",
      name: "Ramming",
      type: "shipAction",
      img: "systems/roguetrader/assets/svg/boat-engine.svg"
    }, [targetToken]);

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Ramming`,
      skillName: "Pilot (Spacecraft)",
      characteristicKey: "agility",
      modifier: -20,
      actionActor,
      modifierLabel: "Hard Test",
      extraBreakdown: [
        `Target: ${targetShipActor.name}`,
        `Range: ${distanceVu.toFixed(1)} / 1.0 VU`,
        `Bearing: ${targetBearing?.bearingLabel ?? "Fore"}`
      ]
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Ramming</h3>
            <p><strong>Target:</strong> ${targetShipActor.name}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>The helmsman fails to line up the collision and the ram does not connect.</p>
          </div>
        `
      });
      return result;
    }

    const attackerHullClass = String(this.actor.system?.class ?? "").trim();
    const attackerRammingFormula = getRammingDamageFormulaForHullClass(attackerHullClass);
    const attackerRammingRoll = await (new Roll(attackerRammingFormula)).evaluate({ async: true });
    const attackerProwArmor = Math.max(0, Number(this.actor.getEffectiveShipArmor?.("prow") ?? 0) || 0);
    const extraRammingDamageFormula = String(this.actor.getShipModifierFormulaTotal?.("rammingDamageBonus") ?? "").trim();
    const extraRammingDamageRoll = extraRammingDamageFormula
      ? await (new Roll(extraRammingDamageFormula)).evaluate({ async: true })
      : null;
    const outgoingRawDamage = Math.max(
      0,
      (Number(attackerRammingRoll.total ?? 0) || 0)
      + attackerProwArmor
      + (Number(extraRammingDamageRoll?.total ?? 0) || 0)
    );

    const incomingArmorData = getIncomingArmorFacingData(targetToken, sourceToken);
    const defenderArmor = Math.max(0, Number(targetShipActor.getEffectiveShipArmor?.(incomingArmorData.armorFacing) ?? 0) || 0);
    const outgoingDamage = Math.max(0, outgoingRawDamage - defenderArmor);
    const selfDamageRoll = await (new Roll("1d5")).evaluate({ async: true });
    const selfRawDamage = Math.max(0, defenderArmor + (Number(selfDamageRoll.total ?? 0) || 0));
    const selfDamage = Math.max(0, selfRawDamage - attackerProwArmor);

    const targetCurrentHullIntegrity = Math.max(0, Number(targetShipActor.getEffectiveShipHullIntegrityValue?.() ?? targetShipActor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
    const targetHullModifier = Number(targetShipActor.getShipModifierTotal?.("extraHullIntegrity") ?? 0) || 0;
    const targetNewHullIntegrity = Math.max(0, targetCurrentHullIntegrity - outgoingDamage);
    const targetCurrentCrew = Math.max(0, Number(targetShipActor.getEffectiveShipCrewPopulationValue?.() ?? targetShipActor.system?.crew?.value ?? 0) || 0);
    const targetCrewModifier = Number(targetShipActor.getShipModifierTotal?.("extraCrewPercent") ?? 0) || 0;
    const targetCurrentMorale = Math.max(0, Number(targetShipActor.getEffectiveShipMoraleValue?.() ?? targetShipActor.system?.resources?.morale?.value ?? 0) || 0);
    const targetMoraleModifier = Number(targetShipActor.getShipModifierTotal?.("extraMoralePercent") ?? 0) || 0;
    const targetNewCrew = Math.max(0, targetCurrentCrew - outgoingDamage);
    const targetNewMorale = Math.max(0, targetCurrentMorale - outgoingDamage);

    const sourceCurrentHullIntegrity = Math.max(0, Number(this.actor.getEffectiveShipHullIntegrityValue?.() ?? this.actor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
    const sourceHullModifier = Number(this.actor.getShipModifierTotal?.("extraHullIntegrity") ?? 0) || 0;
    const sourceNewHullIntegrity = Math.max(0, sourceCurrentHullIntegrity - selfDamage);
    const sourceCurrentCrew = Math.max(0, Number(this.actor.getEffectiveShipCrewPopulationValue?.() ?? this.actor.system?.crew?.value ?? 0) || 0);
    const sourceCrewModifier = Number(this.actor.getShipModifierTotal?.("extraCrewPercent") ?? 0) || 0;
    const sourceCurrentMorale = Math.max(0, Number(this.actor.getEffectiveShipMoraleValue?.() ?? this.actor.system?.resources?.morale?.value ?? 0) || 0);
    const sourceMoraleModifier = Number(this.actor.getShipModifierTotal?.("extraMoralePercent") ?? 0) || 0;
    const sourceNewCrew = Math.max(0, sourceCurrentCrew - selfDamage);
    const sourceNewMorale = Math.max(0, sourceCurrentMorale - selfDamage);

    await targetShipActor.update({
      "system.resources.hullIntegrity.value": Math.max(0, targetNewHullIntegrity - targetHullModifier),
      "system.crew.value": Math.max(0, targetNewCrew - targetCrewModifier),
      "system.resources.morale.value": Math.max(0, targetNewMorale - targetMoraleModifier)
    });
    await targetShipActor.syncCrippledState?.({ announced: true, sourceName: `Ramming (${this.actor.name})` });

    await this.actor.update({
      "system.resources.hullIntegrity.value": Math.max(0, sourceNewHullIntegrity - sourceHullModifier),
      "system.crew.value": Math.max(0, sourceNewCrew - sourceCrewModifier),
      "system.resources.morale.value": Math.max(0, sourceNewMorale - sourceMoraleModifier)
    });
    await this.actor.syncCrippledState?.({ announced: true, sourceName: `Ramming (${targetShipActor.name})` });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Ramming</h3>
          <p><strong>Target:</strong> ${targetShipActor.name}</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Attacker Hull Class:</strong> ${attackerHullClass || "Unknown"}</p>
          <p><strong>Base Ramming Damage:</strong> ${attackerRammingRoll.formula} = ${Number(attackerRammingRoll.total ?? 0) || 0}</p>
          <p><strong>Prow Armour Added:</strong> ${attackerProwArmor}</p>
          ${extraRammingDamageRoll ? `<p><strong>Extra Ramming Damage:</strong> ${extraRammingDamageRoll.formula} = ${Number(extraRammingDamageRoll.total ?? 0) || 0}</p>` : ""}
          <p><strong>Impact Facing:</strong> ${incomingArmorData?.bearingLabel ?? "Fore"} / ${incomingArmorData?.armorFacing ?? "prow"}</p>
          <p><strong>Raw Damage to ${targetShipActor.name}:</strong> ${outgoingRawDamage}</p>
          <p><strong>${targetShipActor.name} Armour:</strong> ${defenderArmor}</p>
          <p><strong>Applied Damage to ${targetShipActor.name}:</strong> ${targetCurrentHullIntegrity} -> ${targetNewHullIntegrity} (${outgoingDamage})</p>
          <p><strong>${targetShipActor.name} Crew:</strong> ${targetCurrentCrew} -> ${targetNewCrew}</p>
          <p><strong>${targetShipActor.name} Morale:</strong> ${targetCurrentMorale} -> ${targetNewMorale}</p>
          <p><strong>Self-Damage Roll:</strong> ${defenderArmor} + ${selfDamageRoll.formula} = ${selfRawDamage}</p>
          <p><strong>${this.actor.name} Prow Armour:</strong> ${attackerProwArmor}</p>
          <p><strong>Applied Self-Damage:</strong> ${sourceCurrentHullIntegrity} -> ${sourceNewHullIntegrity} (${selfDamage})</p>
          <p><strong>${this.actor.name} Crew:</strong> ${sourceCurrentCrew} -> ${sourceNewCrew}</p>
          <p><strong>${this.actor.name} Morale:</strong> ${sourceCurrentMorale} -> ${sourceNewMorale}</p>
          <p><strong>Void Shields:</strong> Ignored on both ships.</p>
        </div>
      `
    });

    return {
      ...result,
      attackerHullClass,
      attackerRammingRoll,
      attackerProwArmor,
      extraRammingDamageRoll,
      outgoingRawDamage,
      outgoingDamage,
      incomingArmorData,
      defenderArmor,
      selfDamageRoll,
      selfRawDamage,
      selfDamage,
      targetCurrentHullIntegrity,
      targetNewHullIntegrity,
      targetCurrentCrew,
      targetNewCrew,
      targetCurrentMorale,
      targetNewMorale,
      sourceCurrentHullIntegrity,
      sourceNewHullIntegrity,
      sourceCurrentCrew,
      sourceNewCrew,
      sourceCurrentMorale,
      sourceNewMorale
    };
  }

  async _promptFirefightingComponent(components = []) {
    if (!Array.isArray(components) || !components.length) return null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const optionMarkup = components.map((item) => {
        const itemTypeLabel = item.type === "shipWeapon"
          ? "Weapon Component"
          : item.type === "supplementalComponent"
            ? "Supplemental Component"
            : "Essential Component";
        const qualifiers = [];
        if (Boolean(item.system?.depressurized)) qualifiers.push("depressurized");
        if (Boolean(item.system?.onFire)) qualifiers.push("on fire");
        return `<option value="${item.id}">${item.name} (${itemTypeLabel}${qualifiers.length ? ` | ${qualifiers.join(", ")}` : ""})</option>`;
      }).join("");

      new Dialog({
        title: `${this.actor.name}: Firefighting`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Select a burning component to address.</p>
            <div class="form-group">
              <label for="rt-firefighting-component">Component</label>
              <select id="rt-firefighting-component" name="componentId">${optionMarkup}</select>
            </div>
          </div>
        `,
        buttons: {
          confirm: {
            label: "Confirm",
            callback: (html) => {
              const root = html?.[0] ?? html;
              const componentId = String(root?.querySelector?.('[name="componentId"]')?.value ?? "").trim();
              finish(componentId || null);
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

  async _promptFirefightingMethod() {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.actor.name}: Firefighting Method`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Choose how to deal with the blaze.</p>
            <p><strong>Organise Team:</strong> Make a Difficult (-10) Command Test to extinguish the fire.</p>
            <p><strong>Vent to Void:</strong> Immediately extinguish the fire. The component becomes depressurized, and the ship suffers 1d5 Crew Population damage and 2d10 Morale damage.</p>
          </div>
        `,
        buttons: {
          team: {
            label: "Organise Team",
            callback: () => finish("team")
          },
          vent: {
            label: "Vent to Void",
            callback: () => finish("vent")
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "team",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _performFirefightingAction(actionActor = null) {
    const burningComponents = Array.from(this.actor.items ?? []).filter((item) => {
      if (!["shipComponent", "essentialComponent", "supplementalComponent", "shipWeapon"].includes(item?.type)) return false;
      return Boolean(item.system?.onFire);
    }).sort((left, right) => left.name.localeCompare(right.name));

    if (!burningComponents.length) {
      ui.notifications?.info("Rogue Trader | No burning ship components are currently available for Firefighting.");
      return null;
    }

    const selectedComponentId = await this._promptFirefightingComponent(burningComponents);
    if (!selectedComponentId) return null;

    const selectedComponent = this.actor.items.get(selectedComponentId);
    if (!selectedComponent || !selectedComponent.system?.onFire) {
      ui.notifications?.warn("Rogue Trader | Could not find the selected burning component.");
      return null;
    }

    const selectedMethod = await this._promptFirefightingMethod();
    if (!selectedMethod) return null;

    if (selectedMethod === "vent") {
      const crewRoll = await (new Roll("1d5")).evaluate({ async: true });
      const moraleRoll = await (new Roll("2d10")).evaluate({ async: true });
      const crewDamage = Math.max(0, Number(crewRoll.total ?? 0) || 0);
      const moraleDamage = Math.max(0, Number(moraleRoll.total ?? 0) || 0);
      const crewModifier = Number(this.actor.getShipModifierTotal?.("extraCrewPercent") ?? 0) || 0;
      const moraleModifier = Number(this.actor.getShipModifierTotal?.("extraMoralePercent") ?? 0) || 0;
      const currentCrew = Math.max(0, Number(this.actor.getEffectiveShipCrewPopulationValue?.() ?? this.actor.system?.crew?.value ?? 0) || 0);
      const currentMorale = Math.max(0, Number(this.actor.getEffectiveShipMoraleValue?.() ?? this.actor.system?.resources?.morale?.value ?? 0) || 0);
      const newCrew = Math.max(0, currentCrew - crewDamage);
      const newMorale = Math.max(0, currentMorale - moraleDamage);

      await selectedComponent.update({
        "system.onFire": false,
        "system.depressurized": true
      });

      await this.actor.update({
        "system.crew.value": Math.max(0, newCrew - crewModifier),
        "system.resources.morale.value": Math.max(0, newMorale - moraleModifier)
      });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Firefighting</h3>
            <p><strong>Component:</strong> ${selectedComponent.name}</p>
            <p><strong>Method:</strong> Vent to Void</p>
            <p><strong>Result:</strong> Fire extinguished immediately. The component is now depressurized.</p>
            <p><strong>Crew Population Damage:</strong> ${crewRoll.formula} = ${crewDamage} (${currentCrew} -> ${newCrew})</p>
            <p><strong>Morale Damage:</strong> ${moraleRoll.formula} = ${moraleDamage} (${currentMorale} -> ${newMorale})</p>
          </div>
        `
      });

      return {
        success: true,
        componentId: selectedComponent.id,
        componentName: selectedComponent.name,
        method: selectedMethod,
        crewDamage,
        moraleDamage,
        crewRoll,
        moraleRoll
      };
    }

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Firefighting`,
      skillName: "Command",
      characteristicKey: "fellowship",
      modifier: -10,
      actionActor,
      modifierLabel: "Difficult Test"
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Firefighting</h3>
            <p><strong>Component:</strong> ${selectedComponent.name}</p>
            <p><strong>Method:</strong> Organise Team</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>The firefighting team fails to extinguish the blaze.</p>
          </div>
        `
      });
      return {
        ...result,
        componentId: selectedComponent.id,
        componentName: selectedComponent.name,
        method: selectedMethod
      };
    }

    await selectedComponent.update({ "system.onFire": false });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Firefighting</h3>
          <p><strong>Component:</strong> ${selectedComponent.name}</p>
          <p><strong>Method:</strong> Organise Team</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p>The firefighting team extinguishes the blaze.</p>
        </div>
      `
    });

    return {
      ...result,
      componentId: selectedComponent.id,
      componentName: selectedComponent.name,
      method: selectedMethod
    };
  }

  async _promptEmergencyRepairComponent(components = []) {
    if (!Array.isArray(components) || !components.length) return null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const optionMarkup = components.map((item) => {
        const itemTypeLabel = item.type === "shipWeapon"
          ? "Weapon Component"
          : item.type === "supplementalComponent"
            ? "Supplemental Component"
            : "Essential Component";
        const statusLabel = String(item.system?.status ?? "intact").trim() || "intact";
        const qualifiers = [
          ...(statusLabel !== "intact" && statusLabel !== "destroyed" ? [statusLabel] : []),
          ...(Boolean(item.system?.depressurized) ? ["depressurized"] : [])
        ].join(", ");
        return `<option value="${item.id}">${item.name} (${itemTypeLabel}${qualifiers ? ` | ${qualifiers}` : ""})</option>`;
      }).join("");

      new Dialog({
        title: `${this.actor.name}: Emergency Repairs`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Select an unpowered, damaged, or depressurized component to repair.</p>
            <div class="form-group">
              <label for="rt-emergency-repairs-component">Component</label>
              <select id="rt-emergency-repairs-component" name="componentId">${optionMarkup}</select>
            </div>
          </div>
        `,
        buttons: {
          confirm: {
            label: "Confirm",
            callback: (html) => {
              const root = html?.[0] ?? html;
              const componentId = String(root?.querySelector?.('[name="componentId"]')?.value ?? "").trim();
              finish(componentId || null);
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

  async _performEmergencyRepairsAction(actionActor = null) {
    const repairCandidates = Array.from(this.actor.items ?? []).filter((item) => {
      if (!["shipComponent", "essentialComponent", "supplementalComponent", "shipWeapon"].includes(item?.type)) return false;
      const status = String(item.system?.status ?? "intact").trim().toLowerCase();
      const isDestroyed = status === "destroyed";
      const needsRepair = ["unpowered", "damaged"].includes(status) || Boolean(item.system?.depressurized);
      const isAlreadyRepairing = Boolean(item.system?.emergencyRepair?.active);
      return !isDestroyed && needsRepair && !isAlreadyRepairing;
    }).sort((left, right) => left.name.localeCompare(right.name));

    if (!repairCandidates.length) {
      ui.notifications?.info("Rogue Trader | No unpowered, damaged, or depressurized ship components are currently available for Emergency Repairs.");
      return null;
    }

    const selectedComponentId = await this._promptEmergencyRepairComponent(repairCandidates);
    if (!selectedComponentId) return null;

    const selectedComponent = this.actor.items.get(selectedComponentId);
    if (!selectedComponent) {
      ui.notifications?.warn("Rogue Trader | Could not find the selected component.");
      return null;
    }

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Emergency Repairs`,
      skillName: "Tech-Use",
      characteristicKey: "intelligence",
      modifier: -10 + (Number(this.actor.getShipModifierTotal?.("repairBonus") ?? 0) || 0),
      actionActor,
      modifierLabel: "Difficult Test + Repair Bonus"
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Emergency Repairs</h3>
            <p><strong>Component:</strong> ${selectedComponent.name}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>No repair progress was made.</p>
          </div>
        `
      });
      return result;
    }

    const repairRoll = await (new Roll("1d5")).evaluate({ async: true });
    const baseTurns = Math.max(1, Number(repairRoll.total ?? 0) || 1);
    const degrees = Math.max(0, Number(result.degrees ?? 0) || 0);
    const repairTurns = Math.max(1, baseTurns - degrees);
    const operatorName = actionActor?.name ?? (String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc"
      ? `NPC Crew (${Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0})`
      : "Assigned Repair Crew");

    await selectedComponent.update({
      "system.emergencyRepair.active": true,
      "system.emergencyRepair.remainingTurns": repairTurns,
      "system.emergencyRepair.source": "Emergency Repairs",
      "system.emergencyRepair.operatorName": operatorName
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Emergency Repairs</h3>
          <p><strong>Component:</strong> ${selectedComponent.name}</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Repair Time:</strong> ${repairRoll.formula} = ${baseTurns}, reduced by ${degrees} to ${repairTurns} turn${repairTurns === 1 ? "" : "s"}.</p>
          <p><strong>Completion:</strong> The component will be repaired at the start of the ship's turn when the countdown reaches 0.</p>
        </div>
      `
    });

    return {
      ...result,
      componentId: selectedComponent.id,
      componentName: selectedComponent.name,
      baseTurns,
      repairTurns,
      repairRoll
    };
  }

  async _performGuidedStandardMove({
    actionLabel = "Standard Move",
    speed = 0,
    endpointOptions = null,
      choiceIntro = "",
    movePrefixLabel = "",
    adjustedFromSpeed = null,
    speedDelta = 0
  } = {}) {
    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    const tokenDocument = sourceToken?.document ?? sourceToken ?? null;
    if (!tokenDocument || !canvas?.scene) {
      ui.notifications?.warn(`Rogue Trader | Place the voidship token on the scene before using ${actionLabel}.`);
      return null;
    }

    if (speed <= 0 && !(Array.isArray(endpointOptions) && endpointOptions.length > 0)) {
      ui.notifications?.warn(`Rogue Trader | This voidship has no Speed to use for ${actionLabel}.`);
      return null;
    }

    const moveOptions = endpointOptions?.length
      ? endpointOptions
      : [await this._promptStandardMoveChoice(speed, {
        title: `${this.actor.name}: ${actionLabel}`,
        intro: choiceIntro,
        prefixLabel: movePrefixLabel
      })].filter(Boolean);
    if (!moveOptions.length) return null;

    await this._clearStandardMoveAssist();

    const gridSize = Number(canvas.grid?.size ?? canvas.dimensions?.size ?? 100) || 100;
    const gridDistance = Number(canvas.grid?.distance ?? canvas.dimensions?.distance ?? 1) || 1;
    const tokenRadiusPixels = (Math.max(Number(tokenDocument?.width ?? 1) || 1, Number(tokenDocument?.height ?? 1) || 1) * gridSize) / 2;
    const startCenter = getShipTokenCenter(tokenDocument);
    const facing = getShipFacingDegrees(tokenDocument);
    const radians = (facing * Math.PI) / 180;
    const tolerancePixels = Math.max(24, tokenRadiusPixels, gridSize * 0.5);
    const expectedEndpoints = moveOptions.map((option) => {
      const distancePixels = (option.distance / gridDistance) * gridSize;
      return {
        ...option,
        expectedCenter: {
          x: startCenter.x + (Math.cos(radians) * distancePixels),
          y: startCenter.y + (Math.sin(radians) * distancePixels)
        }
      };
    });

    if (expectedEndpoints.some((endpoint) => endpoint.distance === 0)) {
      const zeroMoveChoice = await this._promptZeroMoveOption(actionLabel);
      if (zeroMoveChoice === "stay") {
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `
            <div class="roguetrader-roll-card">
              <h3>${this.actor.name}: ${actionLabel}</h3>
              ${endpointOptions?.length ? `<p><strong>Allowed Speed Change:</strong> up to ${speedDelta} VU</p>` : ""}
              <p><strong>Move:</strong> Stay in Place</p>
              <p><strong>Distance:</strong> 0 VU</p>
              <p>The ship held position as a legal result of the manoeuvre.</p>
            </div>
          `
        });
        return {
          success: true,
          distance: 0,
          label: "Stay in Place"
        };
      }
      if (zeroMoveChoice == null) return null;
    }

    return this._performEndpointGuideMove({
      actionLabel,
      tokenDocument,
      endpointOptions: expectedEndpoints,
      totalDistance: Math.max(...moveOptions.map((option) => option.distance)),
      intro: `${actionLabel} guide active: move the token in a straight line, then stop near any highlighted legal endpoint. Press Escape to cancel.`,
      summaryHtml: `
        ${endpointOptions?.length ? `<p><strong>Allowed Speed Change:</strong> up to ${speedDelta} VU</p>` : ""}
        ${adjustedFromSpeed != null && endpointOptions?.length ? "" : (adjustedFromSpeed != null ? `<p><strong>Adjusted Speed:</strong> ${adjustedFromSpeed} ${speedDelta >= 0 ? "+" : ""}${speedDelta} = ${speed} VU</p>` : "")}
      `
    });
  }

  async _promptStandardMoveChoice(speed, { title = `${this.actor.name}: Standard Move`, intro = "", prefixLabel = "" } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p><strong>Current Speed:</strong> ${speed} VU</p>
            <p>${intro || "Select whether the ship will move at half or full speed. This lightweight assist previews the straight-line move only; end-of-move turning is not automated yet."}</p>
          </div>
        `,
        buttons: {
          half: {
            label: `${prefixLabel ? `${prefixLabel} ` : ""}Half Speed (${Math.floor(speed / 2)} VU)`,
            callback: () => finish({
              mode: "half",
              label: "Half Speed",
              distance: Math.floor(speed / 2)
            })
          },
          full: {
            label: `${prefixLabel ? `${prefixLabel} ` : ""}Full Speed (${speed} VU)`,
            callback: () => finish({
              mode: "full",
              label: "Full Speed",
              distance: speed
            })
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "full",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _promptAdjustSpeedChoice(currentSpeed, maxAdjustment) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const adjustmentOptions = Array.from({ length: maxAdjustment }, (_, index) => index + 1)
        .map((value) => `<option value="${value}">${value}</option>`)
        .join("");

      new Dialog({
        title: `${this.actor.name}: Adjust Speed`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p><strong>Current Speed:</strong> ${currentSpeed} VU</p>
            <p><strong>Allowed Adjustment:</strong> up to ${maxAdjustment} VU</p>
            <div class="form-group">
              <label for="rt-adjust-speed-direction">Direction</label>
              <select id="rt-adjust-speed-direction" name="direction">
                <option value="increase">Increase Speed</option>
                <option value="decrease">Decrease Speed</option>
              </select>
            </div>
            <div class="form-group">
              <label for="rt-adjust-speed-amount">Amount</label>
              <select id="rt-adjust-speed-amount" name="amount">${adjustmentOptions}</select>
            </div>
          </div>
        `,
        buttons: {
          confirm: {
            label: "Continue",
            callback: (html) => {
              const root = html?.[0] ?? html;
              const direction = String(root?.querySelector?.('[name="direction"]')?.value ?? "increase").trim();
              const amount = Math.max(1, Math.min(maxAdjustment, Number(root?.querySelector?.('[name="amount"]')?.value ?? 1) || 1));
              const signedAmount = direction === "decrease"
                ? -Math.min(amount, currentSpeed)
                : amount;
              const nextSpeed = Math.max(0, currentSpeed + signedAmount);
              finish({
                direction,
                amount: Math.abs(signedAmount),
                delta: signedAmount,
                nextSpeed,
                label: `${direction === "decrease" ? "Decrease" : "Increase"} Speed by ${Math.abs(signedAmount)}`
              });
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

  async _promptZeroMoveOption(actionLabel) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.actor.name}: ${actionLabel}`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>A 0 VU move is legal for this manoeuvre result.</p>
            <p>You can either keep the ship in place immediately, or continue to the guide and choose one of the highlighted endpoints.</p>
          </div>
        `,
        buttons: {
          stay: {
            label: "Stay in Place",
            callback: () => finish("stay")
          },
          guide: {
            label: "Show Guide",
            callback: () => finish("guide")
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "guide",
        close: () => finish(null)
      }).render(true);
    });
  }

  _getShipTurnAngleDegrees() {
    const hullClassKey = normalizeShipHullClass(this.actor.system?.class ?? "");
    return NINETY_DEGREE_TURN_HULL_CLASSES.has(hullClassKey) ? 90 : 45;
  }

  async _performEndpointGuideMove({
    actionLabel,
    tokenDocument,
    endpointOptions = [],
    totalDistance = 0,
    intro = "",
    summaryHtml = ""
  } = {}) {
    if (!tokenDocument || !canvas?.scene || !endpointOptions.length) return null;

    await this._clearStandardMoveAssist();

    const gridSize = Number(canvas.grid?.size ?? canvas.dimensions?.size ?? 100) || 100;
    const tokenRadiusPixels = (Math.max(Number(tokenDocument?.width ?? 1) || 1, Number(tokenDocument?.height ?? 1) || 1) * gridSize) / 2;
    const tolerancePixels = Math.max(24, tokenRadiusPixels, gridSize * 0.5);
    const startCenter = getShipTokenCenter(tokenDocument);
    const facing = getShipFacingDegrees(tokenDocument);
    const templateIds = await this._createStandardMoveGuideTemplates({
      sourceCenter: startCenter,
      expectedEndpoints: endpointOptions,
      facing,
      distance: totalDistance,
      tokenDocument
    });

    if (intro) {
      ui.notifications?.info(`Rogue Trader | ${intro}`);
    }

    return new Promise((resolve) => {
      let settled = false;
      let reverting = false;
      let hookId = null;

      const finish = async (value) => {
        if (settled) return;
        settled = true;

        if (hookId !== null) Hooks.off("updateToken", hookId);
        document.removeEventListener("keydown", handleEscape);
        await this._clearStandardMoveAssist();
        resolve(value);
      };

      const handleEscape = async (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        await finish(null);
      };

      hookId = Hooks.on("updateToken", async (updatedToken, changed) => {
        if (settled || reverting) return;
        if (updatedToken?.id !== tokenDocument.id) return;
        if (!("x" in changed) && !("y" in changed)) return;

        const nextX = Number(changed?.x ?? updatedToken?.x ?? 0) || 0;
        const nextY = Number(changed?.y ?? updatedToken?.y ?? 0) || 0;
        const nextWidth = Number(updatedToken?.width ?? tokenDocument?.width ?? 1) || 1;
        const nextHeight = Number(updatedToken?.height ?? tokenDocument?.height ?? 1) || 1;
        const actualCenter = {
          x: nextX + ((nextWidth * gridSize) / 2),
          y: nextY + ((nextHeight * gridSize) / 2)
        };
        const matchedEndpoint = endpointOptions.find((endpoint) =>
          Math.hypot(actualCenter.x - endpoint.expectedCenter.x, actualCenter.y - endpoint.expectedCenter.y) <= tolerancePixels
        );

        if (matchedEndpoint) {
          reverting = true;
          const startX = Number(this.#standardMoveAssist?.start?.x ?? tokenDocument.x ?? 0) || 0;
          const startY = Number(this.#standardMoveAssist?.start?.y ?? tokenDocument.y ?? 0) || 0;
          await updatedToken.update({
            x: startX,
            y: startY
          }, {
            animate: false,
            animation: { duration: 0 }
          });
          await this._animateShipTokenMove(updatedToken, {
            x: nextX,
            y: nextY,
            distanceVu: matchedEndpoint.distance
          });
          reverting = false;

          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `
              <div class="roguetrader-roll-card">
                <h3>${this.actor.name}: ${actionLabel}</h3>
                ${summaryHtml}
                <p><strong>Result:</strong> ${matchedEndpoint.label}</p>
                <p><strong>Distance:</strong> ${matchedEndpoint.distance} VU</p>
                <p>The ship completed its guided move.</p>
              </div>
            `
          });
          await finish({
            success: true,
            distance: matchedEndpoint.distance,
            label: matchedEndpoint.label
          });
          return;
        }

        reverting = true;
        ui.notifications?.warn(`Rogue Trader | That token move did not match the ${actionLabel} guide. The ship has been returned to its starting position.`);
        await updatedToken.update({
          x: Number(this.#standardMoveAssist?.start?.x ?? 0),
          y: Number(this.#standardMoveAssist?.start?.y ?? 0)
        });
        reverting = false;
      });

      document.addEventListener("keydown", handleEscape, { once: false });
      this.#standardMoveAssist = {
        templateIds,
        hookId,
        start: {
          x: Number(tokenDocument.x ?? 0),
          y: Number(tokenDocument.y ?? 0)
        }
      };
    });
  }

  async _animateShipTokenMove(tokenDocument, { x, y, distanceVu = 0 } = {}) {
    if (!tokenDocument) return false;

    const targetX = Number(x ?? tokenDocument.x ?? 0) || 0;
    const targetY = Number(y ?? tokenDocument.y ?? 0) || 0;
    const duration = Math.max(900, Math.min(6400, Math.round((Number(distanceVu ?? 0) || 0) * 360)));
    let sound = null;

    try {
      try {
        sound = await AudioHelper.play({
          src: SHIP_MOVEMENT_SOUND,
          volume: 0.55,
          loop: true
        }, false);
      } catch (error) {
        console.warn("Rogue Trader | Failed to play ship movement sound.", error);
      }

      await tokenDocument.update({
        x: targetX,
        y: targetY
      }, {
        animate: true,
        animation: {
          duration
        }
      });

      if (sound) {
        await new Promise((resolve) => setTimeout(resolve, duration));
      }
      return true;
    } catch (error) {
      console.warn("Rogue Trader | Ship movement animation failed; falling back to direct token update.", error);
      await tokenDocument.update({
        x: targetX,
        y: targetY
      });
      return false;
    } finally {
      try {
        sound?.stop?.();
      } catch (error) {
        console.warn("Rogue Trader | Failed to stop ship movement sound.", error);
      }
    }
  }

  async _createStandardMoveGuideTemplates({ sourceCenter, expectedEndpoints = [], facing, distance, tokenDocument }) {
    if (!canvas?.scene) return [];

    const gridDistance = Number(canvas.grid?.distance ?? canvas.dimensions?.distance ?? 1) || 1;
    const endpointRadius = Math.max(
      gridDistance * 0.5,
      ((Math.max(Number(tokenDocument?.width ?? 1) || 1, Number(tokenDocument?.height ?? 1) || 1)) * gridDistance) / 2
    );

    const templateData = [
      {
        t: "ray",
        user: game.user?.id,
        x: sourceCenter.x,
        y: sourceCenter.y,
        direction: facing,
        distance,
        width: gridDistance,
        borderColor: "#5fa89a",
        fillColor: "#7bc7b8",
        flags: {
          roguetrader: {
            sourceActorUuid: this.actor.uuid,
            temporaryMovementGuide: true
          }
        }
      }
    ];

    for (const endpoint of expectedEndpoints) {
      templateData.push({
        t: "circle",
        user: game.user?.id,
        x: endpoint.expectedCenter.x,
        y: endpoint.expectedCenter.y,
        distance: endpointRadius,
        borderColor: "#d1b469",
        fillColor: "#f0d38a",
        flags: {
          roguetrader: {
            sourceActorUuid: this.actor.uuid,
            temporaryMovementGuide: true,
            standardMoveEndpoint: true,
            endpointDistance: endpoint.distance
          }
        }
      });
    }

    const created = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", templateData);
    return Array.from(created ?? []).map((entry) => entry.id).filter(Boolean);
  }

  async _clearStandardMoveAssist() {
    const state = this.#standardMoveAssist;
    if (!state) return;

    if (state.hookId !== null && state.hookId !== undefined) {
      Hooks.off("updateToken", state.hookId);
    }

    const templateIds = Array.isArray(state.templateIds) ? state.templateIds.filter(Boolean) : [];
    if (templateIds.length && canvas?.scene) {
      const existingTemplateIds = templateIds.filter((id) => canvas.scene.templates.has(id));
      if (existingTemplateIds.length) {
        await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", existingTemplateIds);
      }
    }

    this.#standardMoveAssist = null;
  }

  async _onShipWeaponFire(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "shipWeapon") {
      ui.notifications?.warn("Rogue Trader | Could not find that ship weapon.");
      return;
    }

    if (game.combat && !this.actor.isFireWeaponsActive?.(game.combat)) {
      ui.notifications?.warn("Rogue Trader | Activate Fire Weapons before firing any ship weapons this Strategic Turn.");
      return;
    }

    if (game.combat && this.actor.hasShipWeaponFiredThisTurn?.(item.id, game.combat)) {
      ui.notifications?.warn(`Rogue Trader | ${item.name} has already fired this Strategic Turn.`);
      return;
    }

    const result = await rollStarshipWeaponAttack(this.actor, item);
    if (result && game.combat) {
      await this.actor.markShipWeaponFiredThisTurn?.(item.id, game.combat);
    }
    if (result && String(item.system?.weaponClass ?? "").trim().toLowerCase() === "torpedo") {
      await item.update({
        "system.torpedoLoaded": false,
        "system.torpedoLoading": false,
        "system.torpedoLoadingMode": ""
      });
    }
  }

  async _performFireWeaponsAction(actionActor = null) {
    if (!game.combat) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Fire Weapons</h3>
            <p><strong>Effect:</strong> Ship weapons are ready to fire.</p>
          </div>
        `
      });

      return { success: true };
    }

    if (this.actor.isFireWeaponsActive?.(game.combat)) {
      ui.notifications?.info("Rogue Trader | Fire Weapons is already active for this Strategic Turn.");
      return null;
    }

    await this.actor.activateFireWeapons?.(game.combat);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Fire Weapons</h3>
          <p><strong>Effect:</strong> The ship may now fire each weapon component once during this Strategic Turn.</p>
        </div>
      `
    });

    return {
      success: true,
      activated: true
    };
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

  async _performFocusedAugury(assignedActor) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
    const operatorLabel = assignedActor?.name ?? (isNpcControlled ? `NPC Crew (${npcCrewRating})` : "Unassigned Operator");

    if (this.actor.isSensorsDamaged?.()) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader ship-critical-hit-card">
            <div class="ship-critical-hit-banner">Focused Augury Failed</div>
            <h3>${this.actor.name}</h3>
            <p><strong>Operator:</strong> ${operatorLabel}</p>
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

    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | Place the voidship token on the scene before using Focused Augury.");
      return null;
    }

    const targetToken = Array.from(game.user?.targets ?? []).find((token) => token?.actor?.type === "ship" && token.actor.uuid !== this.actor.uuid) ?? null;
    if (!targetToken) {
      ui.notifications?.warn("Rogue Trader | Target an enemy ship within 20 VUs to use Focused Augury.");
      return null;
    }

    const distanceVu = getDistanceVuBetweenTokens(sourceToken, targetToken);
    if (distanceVu > 20) {
      ui.notifications?.warn(`Rogue Trader | ${targetToken.name} is out of Focused Augury range (${distanceVu.toFixed(1)} / 20.0 VU).`);
      return null;
    }

    const detectionModifier = Number(this.actor.getEffectiveShipDetection?.() ?? this.actor.system?.detection ?? 0) || 0;
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Focused Augury`,
      skillName: "Scrutiny",
      characteristicKey: "perception",
      modifier: detectionModifier,
      actionActor: assignedActor,
      modifierLabel: "Ship Detection"
    });

    if (!result) return null;

    const targetActor = targetToken.actor;
    const allShipItems = Array.from(targetActor?.items ?? []);
    const essentialComponents = allShipItems.filter((item) =>
      item?.type === "essentialComponent" || item?.type === "shipComponent"
    );
    const supplementalComponents = allShipItems.filter((item) => item?.type === "supplementalComponent");
    const weaponComponents = allShipItems.filter((item) => item?.type === "shipWeapon");
    const augurArrays = essentialComponents.filter((item) =>
      String(item.system?.componentType ?? item.system?.categoryType ?? "").trim().toLowerCase() === "augurarrays"
    );
    const voidShields = essentialComponents.filter((item) =>
      String(item.system?.componentType ?? item.system?.categoryType ?? "").trim().toLowerCase() === "voidshields"
    );
    const standardEssentials = essentialComponents.filter((item) => !augurArrays.includes(item) && !voidShields.includes(item));

    const revealGroups = [];
    const pushGroup = (label, items) => {
      const visibleItems = Array.from(new Map((items ?? []).map((item) => [item.id, item])).values());
      if (!visibleItems.length) return;
      revealGroups.push({
        label,
        items: visibleItems
      });
    };

    if (result.success) {
      pushGroup("Essential Components", standardEssentials);

      const additionalDegrees = Math.max(0, Number(result.degrees ?? 0) - 1);
      if (additionalDegrees >= 1) {
        pushGroup("Weapon Components", weaponComponents);
      }
      if (additionalDegrees >= 2) {
        pushGroup("Augur Arrays & Void Shields", [...augurArrays, ...voidShields]);
      }
      if (additionalDegrees >= 3) {
        pushGroup("Supplemental Components", supplementalComponents);
      }

      const revealMarkup = revealGroups.length
        ? revealGroups.map((group) => `
            <div class="ship-augury-reveal-group">
              <p><strong>${group.label}:</strong></p>
              <ul>
                ${group.items.map((item) => `<li>${item.name}</li>`).join("")}
              </ul>
            </div>
          `).join("")
        : `<p>No ship components were revealed.</p>`;

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Focused Augury</h3>
            <p><strong>Operator:</strong> ${operatorLabel}</p>
            <p><strong>Target:</strong> ${targetActor?.name ?? targetToken.name}</p>
            <p><strong>Range:</strong> ${distanceVu.toFixed(1)} / 20.0 VU</p>
            <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
            ${revealMarkup}
          </div>
        `
      });
    } else {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Focused Augury</h3>
            <p><strong>Operator:</strong> ${operatorLabel}</p>
            <p><strong>Target:</strong> ${targetActor?.name ?? targetToken.name}</p>
            <p><strong>Range:</strong> ${distanceVu.toFixed(1)} / 20.0 VU</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>No additional component data was revealed.</p>
          </div>
        `
      });
    }

    return result;
  }

  async _performLockOnTargetAction(assignedActor = null) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
    const operatorLabel = assignedActor?.name ?? (isNpcControlled ? `NPC Crew (${npcCrewRating})` : "Unassigned Operator");

    if (this.actor.isSensorsDamaged?.()) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader ship-critical-hit-card">
            <div class="ship-critical-hit-banner">Lock on Target Failed</div>
            <h3>${this.actor.name}</h3>
            <p><strong>Operator:</strong> ${operatorLabel}</p>
            <p><strong>Reason:</strong> Sensors Damaged</p>
            <p>All sensor targeting attempts automatically fail until the damage is repaired.</p>
          </div>
        `
      });
      return {
        success: false,
        failedAutomatically: true,
        reason: "Sensors Damaged"
      };
    }

    const targetToken = Array.from(game.user?.targets ?? []).find((token) => token?.actor?.type === "ship" && token.actor.uuid !== this.actor.uuid) ?? null;
    if (!targetToken) {
      ui.notifications?.warn("Rogue Trader | Target an enemy ship before using Lock on Target.");
      return null;
    }

    const shipWeapons = Array.from(this.actor.items ?? [])
      .filter((item) => item?.type === "shipWeapon")
      .sort((left, right) => left.name.localeCompare(right.name));
    if (!shipWeapons.length) {
      ui.notifications?.warn("Rogue Trader | This voidship has no weapon components to lock onto a target.");
      return null;
    }

    const detectionModifier = Number(this.actor.getEffectiveShipDetection?.() ?? this.actor.system?.detection ?? 0) || 0;
    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Lock on Target`,
      skillName: "Scrutiny",
      characteristicKey: "perception",
      modifier: detectionModifier,
      actionActor: assignedActor,
      modifierLabel: "Ship Detection"
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Lock on Target</h3>
            <p><strong>Operator:</strong> ${operatorLabel}</p>
            <p><strong>Target:</strong> ${targetToken.actor?.name ?? targetToken.name}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>No firing solution was established.</p>
          </div>
        `
      });
      return result;
    }

    const selectedWeaponId = await this._promptShipWeaponSelection({
      title: `${this.actor.name}: Lock on Target`,
      intro: `Select the weapon component that will receive the firing solution bonus against ${targetToken.actor?.name ?? targetToken.name}.`,
      weapons: shipWeapons
    });
    if (!selectedWeaponId) return null;

    const selectedWeapon = this.actor.items.get(selectedWeaponId);
    if (!selectedWeapon || selectedWeapon.type !== "shipWeapon") {
      ui.notifications?.warn("Rogue Trader | Could not find the selected weapon component.");
      return null;
    }

    const bonus = 5 + (Math.floor(Math.max(0, (Number(result.degrees ?? 0) || 0) - 1) / 2) * 5);
    await this.actor.applyPendingLockOnTarget?.({
      weaponId: selectedWeapon.id,
      weaponName: selectedWeapon.name,
      targetActorUuid: String(targetToken.actor?.uuid ?? ""),
      targetName: String(targetToken.actor?.name ?? targetToken.name ?? ""),
      bonus,
      sourceName: "Lock on Target",
      operatorName: operatorLabel,
      combat: game.combat ?? null
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Lock on Target</h3>
          <p><strong>Operator:</strong> ${operatorLabel}</p>
          <p><strong>Target:</strong> ${targetToken.actor?.name ?? targetToken.name}</p>
          <p><strong>Weapon:</strong> ${selectedWeapon.name}</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Bonus:</strong> +${bonus} to the next Ballistic Skill Test made to fire this weapon at that target during this turn.</p>
        </div>
      `
    });

    return {
      ...result,
      bonus,
      weaponId: selectedWeapon.id,
      weaponName: selectedWeapon.name,
      targetActorUuid: String(targetToken.actor?.uuid ?? ""),
      targetName: String(targetToken.actor?.name ?? targetToken.name ?? "")
    };
  }

  async _promptShipWeaponSelection({ title = `${this.actor.name}: Select Weapon`, intro = "", weapons = [] } = {}) {
    if (!Array.isArray(weapons) || !weapons.length) return null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const optionMarkup = weapons.map((weapon) => {
        const mountLabel = SHIP_WEAPON_LOCATION_LABELS[String(weapon.system?.location ?? "").trim().toLowerCase()] ?? "Unknown Mount";
        return `<option value="${weapon.id}">${weapon.name} (${mountLabel})</option>`;
      }).join("");

      new Dialog({
        title,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>${intro || "Select a weapon component."}</p>
            <div class="form-group">
              <label for="rt-ship-weapon-selection">Weapon</label>
              <select id="rt-ship-weapon-selection" name="weaponId">${optionMarkup}</select>
            </div>
          </div>
        `,
        buttons: {
          confirm: {
            label: "Confirm",
            callback: (html) => {
              const root = html?.[0] ?? html;
              const weaponId = String(root?.querySelector?.('[name="weaponId"]')?.value ?? "").trim();
              finish(weaponId || null);
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

  async _rollActiveAugury(actionActor = null) {
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
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";

    if (isNpcControlled) {
      const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
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
    const assignedActor = actionActor ?? (actorUuid ? fromUuidSync(actorUuid) : null);
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

  async _performScanningTheAetherAction(assignedActor = null) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
    const operatorLabel = assignedActor?.name ?? (isNpcControlled ? `NPC Crew (${npcCrewRating})` : "Unassigned Navigator");
    const perceptionBonus = isNpcControlled
      ? Math.max(0, Math.floor(npcCrewRating / 10))
      : Math.max(
        0,
        Number(assignedActor?.getCharacteristicBonus?.("perception")
          ?? Math.floor((Number(assignedActor?.system?.characteristics?.perception?.value ?? 0) || 0) / 10)
          ?? 0) || 0
      );
    const rangeVu = Math.max(0, perceptionBonus * 3);
    if (rangeVu <= 0) {
      ui.notifications?.warn("Rogue Trader | The assigned Navigator needs a valid Perception Bonus to use Scanning the Aether.");
      return null;
    }

    await this._playActiveAugurySequence({ radiusVu: rangeVu });

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Scanning the Aether`,
      skillName: "Psyniscience",
      characteristicKey: "perception",
      modifier: -10,
      actionActor: assignedActor,
      modifierLabel: "Difficult Test",
      extraBreakdown: [`Extended Augury Range: ${rangeVu} VU (${perceptionBonus} PB x 3)`]
    });
    if (!result) return null;

    if (result.success) {
      await this._postActiveAuguryContacts({
        rangeVu,
        title: "Scanning the Aether Contacts",
        emptyMessage: `No contacts detected within ${rangeVu} VU.`,
        scanSourceLabel: "Scanning the Aether"
      });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Scanning the Aether</h3>
            <p><strong>Navigator:</strong> ${operatorLabel}</p>
            <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
            <p><strong>Range:</strong> ${rangeVu} VU (${perceptionBonus} Perception Bonus x 3)</p>
            <p><strong>Effect:</strong> The ship counts as having successfully performed Active Augury at this extended range.</p>
            ${this.actor.isSensorsDamaged?.() ? "<p><strong>Auspex Override:</strong> Damaged augers count as operational for this scan until the vessel's next Strategic Turn.</p>" : ""}
          </div>
        `
      });
    } else {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Scanning the Aether</h3>
            <p><strong>Navigator:</strong> ${operatorLabel}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p><strong>Range:</strong> ${rangeVu} VU (${perceptionBonus} Perception Bonus x 3)</p>
            <p>No warp-sight contacts were revealed.</p>
          </div>
        `
      });
    }

    return {
      ...result,
      rangeVu,
      perceptionBonus
    };
  }

  _getNavigatorPerceptionBonus(actionActor = null) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
    if (isNpcControlled) {
      return Math.max(0, Math.floor(npcCrewRating / 10));
    }

    return Math.max(
      0,
      Number(actionActor?.getCharacteristicBonus?.("perception")
        ?? Math.floor((Number(actionActor?.system?.characteristics?.perception?.value ?? 0) || 0) / 10)
        ?? 0) || 0
    );
  }

  async _performWarpInterferenceAction(assignedActor = null) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const npcCrewRating = Number(this.actor.getEffectiveShipCrewRating?.() ?? this.actor.system?.npcCrewRating ?? 0) || 0;
    const operatorLabel = assignedActor?.name ?? (isNpcControlled ? `NPC Crew (${npcCrewRating})` : "Unassigned Navigator");
    const perceptionBonus = this._getNavigatorPerceptionBonus(assignedActor);
    const rangeVu = Math.max(0, perceptionBonus * 3);
    if (rangeVu <= 0) {
      ui.notifications?.warn("Rogue Trader | The assigned Navigator needs a valid Perception Bonus to use Warp Interference.");
      return null;
    }

    const targetToken = Array.from(game.user?.targets ?? []).find((token) => token?.actor?.type === "ship" && token.actor.uuid !== this.actor.uuid) ?? null;
    if (!targetToken) {
      ui.notifications?.warn("Rogue Trader | Target an enemy ship before using Warp Interference.");
      return null;
    }

    const sourceToken = this.actor.getActiveTokens?.(true)?.[0]
      ?? this.actor.getActiveTokens?.()[0]
      ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | Place the voidship token on the scene before using Warp Interference.");
      return null;
    }

    const distanceVu = getDistanceVuBetweenTokens(sourceToken, targetToken);
    if (distanceVu > rangeVu) {
      ui.notifications?.warn(`Rogue Trader | ${targetToken.name} is out of Warp Interference range (${distanceVu.toFixed(1)} / ${rangeVu.toFixed(1)} VU).`);
      return null;
    }

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Warp Interference`,
      skillName: "Psyniscience",
      characteristicKey: "perception",
      modifier: -20,
      actionActor: assignedActor,
      modifierLabel: "Hard Test",
      extraBreakdown: [`Navigator Range: ${rangeVu} VU (${perceptionBonus} PB x 3)`]
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Warp Interference</h3>
            <p><strong>Navigator:</strong> ${operatorLabel}</p>
            <p><strong>Target:</strong> ${targetToken.actor?.name ?? targetToken.name}</p>
            <p><strong>Range:</strong> ${distanceVu.toFixed(1)} / ${rangeVu.toFixed(1)} VU</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>No warp interference was imposed.</p>
          </div>
        `
      });
      return result;
    }

    const durationRounds = Math.max(1, 1 + (Number(result.degrees ?? 0) || 0));
    await targetToken.actor.applyWarpInterference?.({
      sourceName: "Warp Interference",
      sourceShipName: this.actor.name,
      rounds: durationRounds,
      penalty: 10,
      announced: false
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Warp Interference</h3>
          <p><strong>Navigator:</strong> ${operatorLabel}</p>
          <p><strong>Target:</strong> ${targetToken.actor?.name ?? targetToken.name}</p>
          <p><strong>Range:</strong> ${distanceVu.toFixed(1)} / ${rangeVu.toFixed(1)} VU</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Effect:</strong> ${targetToken.actor?.name ?? targetToken.name} suffers -10 Detection.</p>
          <p><strong>Duration:</strong> ${durationRounds} Strategic Round${durationRounds === 1 ? "" : "s"}.</p>
        </div>
      `
    });

    return {
      ...result,
      rangeVu,
      perceptionBonus,
      durationRounds,
      targetActorUuid: String(targetToken.actor?.uuid ?? ""),
      targetName: String(targetToken.actor?.name ?? targetToken.name ?? "")
    };
  }

  async _performTacticalPositioningAction(assignedActor = null) {
    const isNpcControlled = String(this.actor.system?.controlMode ?? "npc").trim().toLowerCase() === "npc";
    const npcCrewRating = Number(this.actor.system?.npcCrewRating ?? 0) || 0;
    const operatorLabel = assignedActor?.name ?? (isNpcControlled ? `NPC Crew (${npcCrewRating})` : "Unassigned Navigator");

    const result = await this._rollShipActionSkillTest({
      title: `${this.actor.name}: Tactical Positioning`,
      skillName: "Psyniscience",
      characteristicKey: "perception",
      modifier: -10,
      actionActor: assignedActor,
      modifierLabel: "Difficult Test"
    });
    if (!result) return null;

    if (!result.success) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Tactical Positioning</h3>
            <p><strong>Navigator:</strong> ${operatorLabel}</p>
            <p><strong>Result:</strong> Failed (${result.degrees} DoF)</p>
            <p>No tactical positioning bonus was established.</p>
          </div>
        `
      });
      return result;
    }

    const selectedMode = await this._promptTacticalPositioningMode();
    if (!selectedMode) return null;

    await this.actor.applyPendingTacticalPositioning?.({
      mode: selectedMode,
      bonusDegrees: 1,
      sourceName: "Tactical Positioning",
      operatorName: operatorLabel,
      combat: game.combat ?? null
    });

    const modeLabel = selectedMode === "evasiveManeuvers"
      ? "the next successful Evasive Manoeuvres test"
      : "the next successful ship weapon Ballistic Skill test";

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Tactical Positioning</h3>
          <p><strong>Navigator:</strong> ${operatorLabel}</p>
          <p><strong>Result:</strong> Success (${result.degrees} DoS)</p>
          <p><strong>Effect:</strong> ${modeLabel} gains +1 DoS during this Strategic Turn.</p>
        </div>
      `
    });

    return {
      ...result,
      mode: selectedMode,
      bonusDegrees: 1
    };
  }

  async _promptTacticalPositioningMode() {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.actor.name}: Tactical Positioning`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Choose which kind of successful test will benefit from Tactical Positioning during this Strategic Turn.</p>
          </div>
        `,
        buttons: {
          shooting: {
            label: "Weapon Attack",
            callback: () => finish("shooting")
          },
          evasive: {
            label: "Evasive Manoeuvres",
            callback: () => finish("evasiveManeuvers")
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "shooting",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _playActiveAugurySequence({ radiusVu = ACTIVE_AUGURY_RADIUS_METERS } = {}) {
    const sourceToken = this.actor.getActiveTokens?.()?.[0] ?? null;
    if (!sourceToken || !globalThis.Sequence) return;

    try {
      await new globalThis.Sequence()
        .effect()
        .file(ACTIVE_AUGURY_SEQUENCE_FILE)
        .atLocation(sourceToken)
        .size((Math.max(0, Number(radiusVu ?? ACTIVE_AUGURY_RADIUS_METERS) || ACTIVE_AUGURY_RADIUS_METERS)) * 2, { gridUnits: true })
        .opacity(0.9)
        .belowTokens()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play Active Augury Sequencer effect.", error);
    }
  }

  async _postActiveAuguryContacts({
    rangeVu = ACTIVE_AUGURY_RADIUS_METERS,
    title = "Active Augury Contacts",
    emptyMessage = null,
    scanSourceLabel = "Active Augury"
  } = {}) {
    const sourceToken = this.actor.getActiveTokens?.()?.[0] ?? null;
    if (!sourceToken || !canvas?.tokens) return;

    const detectedTokens = canvas.tokens.placeables
      .filter((token) =>
        token
        && token.id !== sourceToken.id
        && token.actor
        && !token.document?.hidden
        && getDistanceVuBetweenTokens(sourceToken, token) <= rangeVu
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
          <h3>${this.actor.name}: ${title}</h3>
          <p><strong>Scan:</strong> ${scanSourceLabel} (${rangeVu} VU)</p>
          <ul>${contacts.join("")}</ul>
        </div>
      `
      : `
        <div class="roguetrader ship-augury-results">
          <h3>${this.actor.name}: ${title}</h3>
          <p><strong>Scan:</strong> ${scanSourceLabel} (${rangeVu} VU)</p>
          <p>${emptyMessage ?? `No contacts detected within ${rangeVu} VU.`}</p>
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
