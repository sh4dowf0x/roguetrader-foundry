import {
  getCharacteristicLabel,
  getPsychicTestLabel,
  rollD100Test,
  calculateDegrees,
  getOutcomeLabel
} from "../rolls.js";
import { getPerilsOfTheWarpEntry, getPsychicPhenomenaEntry } from "../psychic-tables.js";
import { resolveReferenceTableResult, buildReferenceTableItemData, listCriticalInjuries, buildCriticalInjuryItemData } from "../reference-tables.js";

const SKILL_CHARACTERISTIC_SHORT = {
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

const ATTACK_TYPE_MODIFIERS = {
  standard: 0,
  calledShot: -20,
  charge: 10,
  allOut: 20,
  semiAuto: 10,
  fullAuto: -10,
  suppressiveFire: -20,
  flame: 0
};

const ATTACK_TYPE_LABELS = {
  standard: "Standard Attack",
  calledShot: "Called Shot",
  charge: "Charge",
  allOut: "All Out Attack",
  semiAuto: "Semi-Auto Burst",
  fullAuto: "Full Auto Burst",
  suppressiveFire: "Suppressive Fire",
  flame: "Flame Template"
};

const CRITICAL_EFFECT_TABLE_KEYS = Object.freeze({
  energy: {
    head: "criticalEffectsEnergyHead",
    arm: "criticalEffectsEnergyArm",
    body: "criticalEffectsEnergyBody",
    leg: "criticalEffectsEnergyLeg"
  },
  explosive: {
    head: "criticalEffectsExplosiveHead",
    arm: "criticalEffectsExplosiveArm",
    body: "criticalEffectsExplosiveBody",
    leg: "criticalEffectsExplosiveLeg"
  },
  impact: {
    head: "criticalEffectsImpactHead",
    arm: "criticalEffectsImpactArm",
    body: "criticalEffectsImpactBody",
    leg: "criticalEffectsImpactLeg"
  },
  rending: {
    head: "criticalEffectsRendingHead",
    arm: "criticalEffectsRendingArm",
    body: "criticalEffectsRendingBody",
    leg: "criticalEffectsRendingLeg"
  }
});

const FEAR_TEST_MODIFIERS = Object.freeze({
  1: { label: "Disturbing", modifier: 0 },
  2: { label: "Frightening", modifier: -10 },
  3: { label: "Horrifying", modifier: -20 },
  4: { label: "Terrifying", modifier: -30 }
});

const HIT_LOCATION_TABLE = [
  { min: 1, max: 10, label: "Head" },
  { min: 11, max: 20, label: "Right Arm" },
  { min: 21, max: 30, label: "Left Arm" },
  { min: 31, max: 70, label: "Body" },
  { min: 71, max: 85, label: "Right Leg" },
  { min: 86, max: 100, label: "Left Leg" }
];

const MULTIPLE_HIT_LOCATION_SEQUENCE = {
  Head: ["Head", "Arm", "Body", "Arm", "Body"],
  Arm: ["Arm", "Body", "Head", "Body", "Arm"],
  Body: ["Body", "Arm", "Head", "Arm", "Body"],
  Leg: ["Leg", "Body", "Arm", "Head", "Body"]
};

const CORRUPTION_MUTATION_THRESHOLDS = [31, 61, 91];
const CHARACTERISTIC_MODIFIER_ALIASES = {
  ws: "weaponSkill",
  weaponskill: "weaponSkill",
  bs: "ballisticSkill",
  ballisticskill: "ballisticSkill",
  s: "strength",
  strength: "strength",
  strenght: "strength",
  t: "toughness",
  toughness: "toughness",
  ag: "agility",
  agility: "agility",
  int: "intelligence",
  intelligence: "intelligence",
  per: "perception",
  perception: "perception",
  wp: "willpower",
  willpower: "willpower",
  willpwr: "willpower",
  willpowercharacteristic: "willpower",
  willpowerscore: "willpower",
  fel: "fellowship",
  fellowship: "fellowship"
};

const RESOURCE_MODIFIER_ALIASES = {
  wound: "wounds",
  wounds: "wounds"
};

const UNNATURAL_CHARACTERISTIC_TRAIT_NAMES = {
  weaponSkill: "unnatural weapon skill",
  ballisticSkill: "unnatural ballistic skill",
  strength: "unnatural strength",
  toughness: "unnatural toughness",
  agility: "unnatural agility",
  intelligence: "unnatural intelligence",
  perception: "unnatural perception",
  willpower: "unnatural willpower",
  fellowship: "unnatural fellowship"
};
const ON_FIRE_STATUS_ID = "on-fire";
const STUNNED_STATUS_ID = "stunned";
const SNARED_STATUS_ID = "snared";
const FEAR_STATUS_ID = "fear";
const PINNED_STATUS_ID = "pinned";
const BRACED_STATUS_ID = "braced";
const FATIGUED_STATUS_ID = "fatigued";
const PRONE_STATUS_ID = "prone";
const FRENZIED_STATUS_ID = "frenzied";
const CRIPPLED_STATUS_ID = "crippled";
const SENSORS_DAMAGED_STATUS_ID = "sensors-damaged";
const THRUSTERS_DAMAGED_STATUS_ID = "thrusters-damaged";
const SHIP_FIRE_STATUS_ID = "ship-fire";
const ENGINES_CRIPPLED_STATUS_ID = "engines-crippled";
const CREW_POPULATION_80_STATUS_ID = "crew-population-80";
const CREW_POPULATION_60_STATUS_ID = "crew-population-60";
const CREW_POPULATION_50_STATUS_ID = "crew-population-50";
const CREW_POPULATION_40_STATUS_ID = "crew-population-40";
const CREW_POPULATION_20_STATUS_ID = "crew-population-20";
const CREW_POPULATION_10_STATUS_ID = "crew-population-10";
const CREW_POPULATION_0_STATUS_ID = "crew-population-0";
const MORALE_80_STATUS_ID = "morale-80";
const MORALE_60_STATUS_ID = "morale-60";
const MORALE_50_STATUS_ID = "morale-50";
const MORALE_40_STATUS_ID = "morale-40";
const MORALE_20_STATUS_ID = "morale-20";
const MORALE_10_STATUS_ID = "morale-10";
const MORALE_0_STATUS_ID = "morale-0";
const SHIP_CREW_POPULATION_THRESHOLDS = Object.freeze([
  { threshold: 80, statusId: CREW_POPULATION_80_STATUS_ID, name: "Crew Reduced (80%)", img: "modules/game-icons-net/whitetransparent/team-downgrade.svg" },
  { threshold: 60, statusId: CREW_POPULATION_60_STATUS_ID, name: "Crew Reduced (60%)", img: "modules/game-icons-net/whitetransparent/team-downgrade.svg" },
  { threshold: 50, statusId: CREW_POPULATION_50_STATUS_ID, name: "Crew Reduced (50%)", img: "modules/game-icons-net/whitetransparent/team-downgrade.svg" },
  { threshold: 40, statusId: CREW_POPULATION_40_STATUS_ID, name: "Crew Reduced (40%)", img: "modules/game-icons-net/whitetransparent/team-downgrade.svg" },
  { threshold: 20, statusId: CREW_POPULATION_20_STATUS_ID, name: "Crew Reduced (20%)", img: "modules/game-icons-net/whitetransparent/team-downgrade.svg" },
  { threshold: 10, statusId: CREW_POPULATION_10_STATUS_ID, name: "Crew Reduced (10%)", img: "modules/game-icons-net/whitetransparent/team-downgrade.svg" },
  { threshold: 0, statusId: CREW_POPULATION_0_STATUS_ID, name: "Ship is a Tomb", img: "modules/game-icons-net/whitetransparent/black-flag.svg" }
]);
const SHIP_MORALE_THRESHOLDS = Object.freeze([
  { threshold: 80, statusId: MORALE_80_STATUS_ID, name: "Low Morale (80)", img: "modules/game-icons-net/whitetransparent/despair.svg" },
  { threshold: 60, statusId: MORALE_60_STATUS_ID, name: "Low Morale (60)", img: "modules/game-icons-net/whitetransparent/despair.svg" },
  { threshold: 50, statusId: MORALE_50_STATUS_ID, name: "Low Morale (50)", img: "modules/game-icons-net/whitetransparent/despair.svg" },
  { threshold: 40, statusId: MORALE_40_STATUS_ID, name: "Low Morale (40)", img: "modules/game-icons-net/whitetransparent/despair.svg" },
  { threshold: 20, statusId: MORALE_20_STATUS_ID, name: "Low Morale (20)", img: "modules/game-icons-net/whitetransparent/despair.svg" },
  { threshold: 10, statusId: MORALE_10_STATUS_ID, name: "Low Morale (10)", img: "modules/game-icons-net/whitetransparent/despair.svg" },
  { threshold: 0, statusId: MORALE_0_STATUS_ID, name: "Mutinous Crew", img: "modules/game-icons-net/whitetransparent/black-flag.svg" }
]);
const FATIGUE_UNCONSCIOUS_FLAG = "fatigueUnconscious";
const SIZE_MOVEMENT_MODIFIERS = Object.freeze({
  miniscule: -3,
  puny: -2,
  scrawny: -1,
  hulking: 1,
  enormous: 2,
  massive: 3
});
const CALLED_SHOT_LOCATIONS = Object.freeze({
  head: "Head",
  rightArm: "Right Arm",
  leftArm: "Left Arm",
  body: "Body",
  rightLeg: "Right Leg",
  leftLeg: "Left Leg"
});

function getCorruptionTrackData(points) {
  const total = Math.max(0, Number(points ?? 0) || 0);

  if (total >= 100) {
    return {
      degree: "Damned",
      malignancyModifier: 0,
      malignancyModifierLabel: "+0",
      mutationStage: null
    };
  }

  if (total >= 91) {
    return {
      degree: "Profane",
      malignancyModifier: -30,
      malignancyModifierLabel: "-30",
      mutationStage: "Third Test"
    };
  }

  if (total >= 61) {
    return {
      degree: "Debased",
      malignancyModifier: -20,
      malignancyModifierLabel: "-20",
      mutationStage: "Second Test"
    };
  }

  if (total >= 31) {
    return {
      degree: "Soiled",
      malignancyModifier: -10,
      malignancyModifierLabel: "-10",
      mutationStage: "First Test"
    };
  }

  return {
    degree: "Tainted",
    malignancyModifier: 0,
    malignancyModifierLabel: "+0",
    mutationStage: null
  };
}

function getRollDigitsForHitLocation(rollTotal) {
  const parsed = Number(rollTotal ?? 0);
  if (parsed === 100) return "00";
  return String(Math.max(0, parsed)).padStart(2, "0").slice(-2);
}

function reverseRollForHitLocation(rollTotal) {
  const digits = getRollDigitsForHitLocation(rollTotal);
  const reversedDigits = digits.split("").reverse().join("");
  const reversedValue = Number(reversedDigits);
  return reversedValue === 0 ? 100 : reversedValue;
}

function getHitLocationLabelFromRoll(rollTotal) {
  const reversedRoll = reverseRollForHitLocation(rollTotal);
  const location = HIT_LOCATION_TABLE.find((entry) => reversedRoll >= entry.min && reversedRoll <= entry.max);
  return {
    reversedRoll,
    label: location?.label ?? "Unknown"
  };
}

function getMultipleHitLocationCategory(locationLabel) {
  const normalized = String(locationLabel ?? "").toLowerCase();
  if (normalized.includes("head")) return "Head";
  if (normalized.includes("arm")) return "Arm";
  if (normalized.includes("leg")) return "Leg";
  return "Body";
}

function getMultipleHitLocations(firstLocationLabel, totalHits) {
  const count = Math.max(0, Number(totalHits ?? 0));
  if (count <= 1) return [firstLocationLabel];

  const category = getMultipleHitLocationCategory(firstLocationLabel);
  const sequence = MULTIPLE_HIT_LOCATION_SEQUENCE[category] ?? MULTIPLE_HIT_LOCATION_SEQUENCE.Body;
  const locations = [firstLocationLabel];

  for (let index = 2; index <= count; index += 1) {
    const sequenceIndex = Math.min(index - 2, sequence.length - 1);
    locations.push(sequence[sequenceIndex]);
  }

  return locations;
}

function getAttackAmmoRequirement(attackType, rof) {
  switch (attackType) {
    case "flame":
      return 1;
    case "semiAuto":
      return Math.max(0, Number(rof?.semiAuto ?? 0));
    case "fullAuto":
    case "suppressiveFire":
      return Math.max(0, Number(rof?.fullAuto ?? 0));
    case "standard":
    case "calledShot":
      return 1;
    default:
      return 0;
  }
}

function getCalledShotLocationLabel(locationKey) {
  return CALLED_SHOT_LOCATIONS[String(locationKey ?? "body").trim()] ?? "Body";
}

function isFlameWeapon(weapon) {
  return Boolean(weapon?.system?.special?.flame)
    || String(weapon?.system?.weaponType ?? "").trim().toLowerCase() === "flame";
}

function isCleansingFireWeapon(weapon) {
  return Boolean(weapon?.system?.special?.cleansingFire);
}

function isBlastWeapon(weapon) {
  return Boolean(weapon?.system?.special?.blast);
}

function isGrenadeWeapon(weapon) {
  return String(weapon?.system?.weaponType ?? "").trim().toLowerCase() === "grenade";
}

function getBlastRadius(weapon) {
  return Math.max(0, Number(weapon?.system?.special?.blastValue ?? 0));
}

function getBlastTemplateDistance(blastRadius) {
  const radius = Math.max(0, Number(blastRadius ?? 0));
  const gridDistance = Number(canvas?.dimensions?.distance ?? 1) || 1;
  return radius + (gridDistance / 2);
}

function areTokensHostileToEachOther(leftToken, rightToken) {
  const leftDisposition = Number(leftToken?.document?.disposition ?? leftToken?.disposition ?? 0);
  const rightDisposition = Number(rightToken?.document?.disposition ?? rightToken?.disposition ?? 0);
  if (leftDisposition === 0 || rightDisposition === 0) return false;
  return leftDisposition !== rightDisposition;
}

function areTokensAdjacent(leftToken, rightToken) {
  if (!leftToken || !rightToken) return false;

  const leftCenter = getTokenCenter(leftToken);
  const rightCenter = getTokenCenter(rightToken);
  const leftWidth = Number(leftToken?.w ?? leftToken?.object?.w ?? (Number(leftToken?.width ?? 1) * (Number(canvas?.dimensions?.size ?? 100) || 100)));
  const leftHeight = Number(leftToken?.h ?? leftToken?.object?.h ?? (Number(leftToken?.height ?? 1) * (Number(canvas?.dimensions?.size ?? 100) || 100)));
  const rightWidth = Number(rightToken?.w ?? rightToken?.object?.w ?? (Number(rightToken?.width ?? 1) * (Number(canvas?.dimensions?.size ?? 100) || 100)));
  const rightHeight = Number(rightToken?.h ?? rightToken?.object?.h ?? (Number(rightToken?.height ?? 1) * (Number(canvas?.dimensions?.size ?? 100) || 100)));

  const horizontalGap = Math.abs(leftCenter.x - rightCenter.x) - ((leftWidth + rightWidth) / 2);
  const verticalGap = Math.abs(leftCenter.y - rightCenter.y) - ((leftHeight + rightHeight) / 2);
  const tolerance = 2;

  return horizontalGap <= tolerance && verticalGap <= tolerance;
}

function getCanvasDistanceInPixels(distance) {
  const gridDistance = Number(canvas?.dimensions?.distance ?? 1) || 1;
  const gridSize = Number(canvas?.dimensions?.size ?? 100) || 100;
  return (Number(distance ?? 0) / gridDistance) * gridSize;
}

function getAngleDegreesBetweenPoints(from, to) {
  const dx = Number(to?.x ?? 0) - Number(from?.x ?? 0);
  const dy = Number(to?.y ?? 0) - Number(from?.y ?? 0);
  return (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
}

function getNormalizedAngleDifference(a, b) {
  const raw = Math.abs((Number(a ?? 0) - Number(b ?? 0)) % 360);
  return raw > 180 ? 360 - raw : raw;
}

function getTokenCenter(token) {
  if (token?.object?.center) {
    return token.object.center;
  }

  if (token?.center) {
    return token.center;
  }

  const gridSize = Number(canvas?.dimensions?.size ?? 100) || 100;
  const widthPixels = token?.w != null
    ? Number(token.w)
    : Number(token?.width ?? 1) * gridSize;
  const heightPixels = token?.h != null
    ? Number(token.h)
    : Number(token?.height ?? 1) * gridSize;

  return {
    x: Number(token?.x ?? 0) + widthPixels / 2,
    y: Number(token?.y ?? 0) + heightPixels / 2
  };
}

function getPointerPositionOnCanvas(event) {
  if (typeof event?.getLocalPosition === "function") {
    return event.getLocalPosition(canvas.stage);
  }

  if (typeof event?.data?.getLocalPosition === "function") {
    return event.data.getLocalPosition(canvas.stage);
  }

  const global = event?.global ?? event?.data?.global ?? null;
  if (!global) return null;
  return canvas.stage.toLocal(global);
}

function getCanvasDistanceInMetersBetweenPoints(from, to) {
  const dx = Number(to?.x ?? 0) - Number(from?.x ?? 0);
  const dy = Number(to?.y ?? 0) - Number(from?.y ?? 0);
  const pixelDistance = Math.hypot(dx, dy);
  const gridDistance = Number(canvas?.dimensions?.distance ?? 1) || 1;
  const gridSize = Number(canvas?.dimensions?.size ?? 100) || 100;
  return (pixelDistance / gridSize) * gridDistance;
}

function getConfiguredStatusEffectByStatus(statusId) {
  const normalizedStatusId = String(statusId ?? "").trim();
  if (!normalizedStatusId) return null;

  return (CONFIG.statusEffects ?? []).find((effect) => {
    if (String(effect?.id ?? "").trim() === normalizedStatusId) return true;
    const statuses = effect?.statuses;
    if (Array.isArray(statuses)) return statuses.includes(normalizedStatusId);
    if (statuses instanceof Set) return statuses.has(normalizedStatusId);
    if (typeof statuses?.has === "function") return statuses.has(normalizedStatusId);
    return false;
  }) ?? null;
}

function getUnconsciousStatusId() {
  return getConfiguredStatusEffectByStatus("unconscious")?.id ?? "unconscious";
}

function getSizeCategoryFromTraitItem(item) {
  if (!item) return "";

  const normalizedName = normalizeTraitName(item.name);
  const nameMatch = normalizedName.match(/size\s*\(([^)]+)\)/i);
  if (nameMatch?.[1]) {
    const category = normalizeTraitName(nameMatch[1]);
    if (category in SIZE_MOVEMENT_MODIFIERS) return category;
  }

  const ratingCategory = normalizeTraitName(item.system?.rating);
  if (ratingCategory in SIZE_MOVEMENT_MODIFIERS) return ratingCategory;

  return "";
}

function getGrenadeRangeBandData(distanceMeters, standardRangeMeters) {
  const distance = Math.max(0, Number(distanceMeters ?? 0));
  const standardRange = Math.max(0, Number(standardRangeMeters ?? 0));

  if (distance <= 2) {
    return { key: "pointBlank", label: "Point Blank (+30)", modifier: 30 };
  }

  if (distance <= (standardRange / 2)) {
    return { key: "short", label: "Short Range (+10)", modifier: 10 };
  }

  if (distance <= standardRange) {
    return { key: "standard", label: "Standard Range (+0)", modifier: 0 };
  }

  if (distance <= (standardRange * 2)) {
    return { key: "long", label: "Long Range (-10)", modifier: -10 };
  }

  return { key: "extreme", label: "Extreme Range (-30)", modifier: -30 };
}

function getWeaponAmmoState(weapon) {
  const maxClip = Number(weapon?.system?.clip ?? 0);
  const storedCurrentClip = Number(weapon?.system?.currentClip ?? Number.NaN);
  const ammoInitialized = Boolean(weapon?.flags?.roguetrader?.ammoInitialized);
  let currentClip = Number.isFinite(storedCurrentClip) ? storedCurrentClip : maxClip;

  if (!ammoInitialized && maxClip > 0) {
    currentClip = maxClip;
  }

  currentClip = Math.max(0, Math.min(currentClip, maxClip));

  return {
    maxClip,
    currentClip,
    ammoInitialized
  };
}

function parseRateOfFire(rofValue) {
  const source = String(rofValue ?? "").trim();
  const [single = "-", semi = "-", full = "-"] = source.split("/");
  const parseBurstValue = (value) => {
    const cleaned = String(value ?? "").trim();
    if (!cleaned || cleaned === "-") return 0;
    const parsed = Number.parseInt(cleaned, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    source,
    single,
    semi,
    full,
    semiAuto: parseBurstValue(semi),
    fullAuto: parseBurstValue(full)
  };
}

function parseWeaponDamageProfile(damageValue) {
  const source = String(damageValue ?? "").trim();
  const match = source.match(/^([0-9dD+\-*/()\s]+)\s*([A-Za-z]+)?$/);
  if (!match) {
    return {
      source,
      expression: source,
      damageType: ""
    };
  }

  return {
    source,
    expression: String(match[1] ?? "").trim(),
    damageType: String(match[2] ?? "").trim().toUpperCase()
  };
}

function parseSimpleD10DamageExpression(expression) {
  const normalized = String(expression ?? "").replace(/\s+/g, "");
  const match = normalized.match(/^(\d+)d10(?:(\+|\-)(\d+))?$/i);
  if (!match) return null;
  return {
    dice: Math.max(1, Number(match[1] ?? 1)),
    modifier: (match[2] === "-" ? -1 : 1) * Number(match[3] ?? 0)
  };
}

async function rollExplodingD10Chain() {
  const rolls = [];
  let total = 0;
  let continueRolling = true;

  while (continueRolling) {
    const roll = await (new Roll("1d10")).evaluate({ async: true });
    const value = Number(roll.total ?? 0);
    rolls.push({
      roll,
      value
    });
    total += value;
    continueRolling = value === 10;
  }

  return {
    rolls,
    total
  };
}

async function rollWeaponDamageWithRighteousFury(damageValue, { extraDice = 0, flatBonus = 0, tearing = false } = {}) {
  const profile = parseWeaponDamageProfile(damageValue);
  const simple = parseSimpleD10DamageExpression(profile.expression);
  const additionalDice = Math.max(0, Number(extraDice ?? 0));
  const additionalFlatBonus = Number(flatBonus ?? 0);

  if (!simple) {
    const expression = [
      profile.expression || "0",
      additionalDice > 0 ? `${additionalDice}d10` : "",
      additionalFlatBonus ? (additionalFlatBonus > 0 ? `${additionalFlatBonus}` : `(${additionalFlatBonus})`) : ""
    ].filter(Boolean).join(" + ");
    const roll = await (new Roll(expression)).evaluate({ async: true });
    return {
      source: profile.source,
      expression,
      damageType: profile.damageType,
      roll,
      total: Number(roll.total ?? 0),
      righteousFury: false,
      righteousFuryDice: 0,
      baseDice: [],
      furyChains: [],
      modifier: additionalFlatBonus,
      extraDice: additionalDice,
      tearing: Boolean(tearing),
      keptDice: []
    };
  }

  const baseDice = [];
  const keptDice = [];
  let total = 0;
  const furyChains = [];
  const totalDice = simple.dice + additionalDice + (tearing ? 1 : 0);

  for (let index = 0; index < totalDice; index += 1) {
    const baseRoll = await (new Roll("1d10")).evaluate({ async: true });
    const value = Number(baseRoll.total ?? 0);
    baseDice.push({
      roll: baseRoll,
      value
    });
  }

  const keptEntries = tearing
    ? [...baseDice].sort((a, b) => b.value - a.value).slice(0, simple.dice + additionalDice)
    : baseDice;

  for (const keptEntry of keptEntries) {
    keptDice.push(keptEntry.value);
    total += keptEntry.value;

    if (keptEntry.value === 10) {
      const furyChain = await rollExplodingD10Chain();
      furyChains.push(furyChain);
      total += furyChain.total;
    }
  }

  total += simple.modifier + additionalFlatBonus;

  return {
    source: profile.source,
    expression: profile.expression,
    damageType: profile.damageType,
    roll: null,
    total,
    righteousFury: furyChains.length > 0,
    righteousFuryDice: furyChains.reduce((sum, chain) => sum + chain.rolls.length, 0),
    baseDice,
    keptDice,
    furyChains,
    modifier: simple.modifier + additionalFlatBonus,
    extraDice: additionalDice,
    tearing: Boolean(tearing)
  };
}

function formatDamageRollBreakdown(result) {
  if (result.roll) {
    return `${result.expression} = ${result.total}`;
  }

  const base = result.baseDice.map((entry) => entry.value).join(", ");
  const kept = Array.isArray(result.keptDice) && result.keptDice.length
    ? result.keptDice.join(", ")
    : "";
  const furyParts = result.furyChains.map((chain, index) => {
    const values = chain.rolls.map((entry) => entry.value).join(" -> ");
    return `RF${index + 1}[${values}]`;
  });
  const modifier = result.modifier
    ? `${result.modifier > 0 ? "+" : ""}${result.modifier}`
    : "";

  return [
    base ? `Base[${base}]` : "",
    result.tearing && kept ? `Kept[${kept}]` : "",
    furyParts.length ? furyParts.join(", ") : "",
    modifier
  ].filter(Boolean).join(" ");
}

async function applyUnstableDamageAdjustment(damageResult, { weapon = null } = {}) {
  if (!damageResult || !weapon || !isUnstableWeapon(weapon)) return damageResult;

  const unstableRoll = await (new Roll("1d10")).evaluate();
  const unstableValue = Number(unstableRoll.total ?? 0);
  let unstableMultiplier = 1;
  if (unstableValue === 1) unstableMultiplier = 0.5;
  else if (unstableValue === 10) unstableMultiplier = 2;

  const adjustedTotal = unstableMultiplier === 1
    ? Number(damageResult.total ?? 0)
    : Math.floor(Number(damageResult.total ?? 0) * unstableMultiplier);

  return {
    ...damageResult,
    total: adjustedTotal,
    unstable: true,
    unstableRoll: unstableValue,
    unstableMultiplier
  };
}

function isAccurateWeapon(weapon) {
  return Boolean(weapon?.system?.special?.accurate);
}

function isBalancedWeapon(weapon) {
  return Boolean(weapon?.system?.special?.balanced);
}

function isUnbalancedWeapon(weapon) {
  return Boolean(weapon?.system?.special?.unbalanced);
}

function isDefensiveWeapon(weapon) {
  return Boolean(weapon?.system?.special?.defensive);
}

function isFlexibleWeapon(weapon) {
  return Boolean(weapon?.system?.special?.flexible);
}

function isOverheatsWeapon(weapon) {
  return Boolean(weapon?.system?.special?.overheats);
}

function isPrimitiveWeapon(weapon) {
  return Boolean(weapon?.system?.special?.primitive);
}

function isRechargeWeapon(weapon) {
  return Boolean(weapon?.system?.special?.recharge);
}

function isReliableWeapon(weapon) {
  return Boolean(weapon?.system?.special?.reliable);
}

function isScatterWeapon(weapon) {
  return Boolean(weapon?.system?.special?.scatter);
}

function isShockingWeapon(weapon) {
  return Boolean(weapon?.system?.special?.shocking);
}

function isSnareWeapon(weapon) {
  return Boolean(weapon?.system?.special?.snare);
}

function isStormWeapon(weapon) {
  return Boolean(weapon?.system?.special?.storm);
}

function isTearingWeapon(weapon) {
  return Boolean(weapon?.system?.special?.tearing);
}

function isToxicWeapon(weapon) {
  return Boolean(weapon?.system?.special?.toxic);
}

function isTwinLinkedWeapon(weapon) {
  return Boolean(weapon?.system?.special?.twinLinked);
}

function isUnreliableWeapon(weapon) {
  return Boolean(weapon?.system?.special?.unreliable);
}

function isUnstableWeapon(weapon) {
  return Boolean(weapon?.system?.special?.unstable);
}

function isUnwieldyWeapon(weapon) {
  return Boolean(weapon?.system?.special?.unwieldy);
}

function isPowerFistWeapon(weapon) {
  const normalizedName = String(weapon?.name ?? "").trim().toLowerCase();
  return normalizedName === "power fist" || normalizedName.includes("power fist");
}

function isThunderHammerWeapon(weapon) {
  const normalizedName = String(weapon?.name ?? "").trim().toLowerCase();
  return normalizedName === "thunder hammer" || normalizedName.includes("thunder hammer");
}

function isPowerFieldWeapon(weapon) {
  return Boolean(weapon?.system?.special?.powerField);
}

function isWarpWeapon(weapon) {
  return Boolean(weapon?.system?.special?.warpWeapon)
    || String(weapon?.name ?? "").trim().toLowerCase() === "warp weapon";
}

function isPlasmaWeapon(weapon) {
  return String(weapon?.system?.weaponType ?? "").trim().toLowerCase() === "plasma";
}

function isNaturalWeapon(weapon) {
  return Boolean(weapon?.flags?.roguetrader?.generatedNaturalWeapon)
    || String(weapon?.name ?? "").trim().toLowerCase() === "natural weapons";
}

function buildGeneratedNaturalWeaponItemData({ primitive = true } = {}) {
  return {
    name: "Natural Weapons",
    type: "weapon",
    img: "icons/creatures/claws/clawed-hand-monster-glowing-blue.webp",
    system: {
      description: "Generated from the Natural Weapons trait. Counts as armed, cannot be disarmed, and cannot be used to Parry.",
      equipped: true,
      availability: "rare",
      craftsmanship: "common",
      class: "melee",
      weaponType: "primitive",
      range: 0,
      rof: "Melee",
      damage: "1d10+0 R",
      penetration: 0,
      clip: 0,
      currentClip: 0,
      reload: "full",
      weight: 0,
      special: {
        primitive: Boolean(primitive)
      }
    },
    flags: {
      roguetrader: {
        generatedNaturalWeapon: true,
        protectedNaturalWeapon: true
      }
    }
  };
}

function isGeneratedHulkingSizeTrait(item) {
  return Boolean(item?.flags?.roguetrader?.generatedHulkingSizeTrait);
}

function buildGeneratedHulkingSizeTraitItemData() {
  return {
    name: "Size (Hulking)",
    type: "talent",
    img: "icons/svg/downgrade.svg",
    system: {
      category: "trait",
      rating: "Hulking",
      prerequisites: "",
      benefit: "Temporarily counts as Size (Hulking) while the source armour is equipped.",
      description: "This generated trait is granted while armour with the Hulking quality is equipped. It modifies movement and makes the wearer easier to hit with Ballistic Skill attacks as Size (Hulking)."
    },
    flags: {
      roguetrader: {
        generatedHulkingSizeTrait: true,
        protectedHulkingSizeTrait: true
      }
    }
  };
}

function normalizeSimpleName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function actorHasTalentNamed(actor, name) {
  const normalizedTarget = normalizeSimpleName(name);
  return (actor?.items ?? []).some((item) =>
    item?.type === "talent"
    && normalizeSimpleName(item.name) === normalizedTarget
  );
}

function actorHasArchMilitantWeaponMaster(actor, category) {
  const normalizedCategory = normalizeSimpleName(category);
  if (!normalizedCategory) return false;

  return (actor?.items ?? []).some((item) => {
    if (item?.type !== "talent") return false;
    const normalizedCategoryKey = normalizeSimpleName(item.system?.category ?? "");
    if (normalizedCategoryKey !== "specialability") return false;

    const normalizedCareer = normalizeSimpleName(item.system?.rating ?? "");
    const isArchMilitant = normalizedCareer === "archmilitant" || normalizedCareer === "arch militant";
    if (!isArchMilitant) return false;

    return normalizeSimpleName(item.system?.weaponMasterClass ?? "") === normalizedCategory;
  });
}

function actorHasExoticWeaponTraining(actor, weapon) {
  const weaponName = normalizeSimpleName(weapon?.name ?? "");
  if (!weaponName) return false;

  return (actor?.items ?? []).some((item) => {
    if (item?.type !== "talent") return false;
    const normalizedName = normalizeSimpleName(item.name);
    if (!normalizedName.startsWith("exotic weapon training")) return false;
    return normalizedName.includes(weaponName);
  });
}

function getWeaponTypeTrainingLabel(weaponType) {
  switch (String(weaponType ?? "").trim().toLowerCase()) {
    case "las":
      return "Las";
    case "sp":
      return "SP";
    case "bolt":
      return "Bolt";
    case "melta":
      return "Melta";
    case "plasma":
      return "Plasma";
    case "launcher":
      return "Launcher";
    case "grenade":
      return "Grenade";
    case "missile":
      return "Missile";
    case "primitive":
      return "Primitive";
    case "flame":
      return "Flame";
    case "chain":
      return "Chain";
    case "power":
      return "Power";
    case "shock":
      return "Shock";
    default:
      return "";
  }
}

function getWeaponClassTrainingPrefix(weaponClass) {
  switch (String(weaponClass ?? "").trim().toLowerCase()) {
    case "basic":
      return "Basic Weapon Training";
    case "pistol":
      return "Pistol Weapon Training";
    case "heavy":
      return "Heavy Weapon Training";
    case "thrown":
      return "Thrown Weapon Training";
    case "melee":
      return "Melee Weapon Training";
    default:
      return "";
  }
}

function getParryWeaponModifier(weapon) {
  if (!weapon) return 0;
  let modifier = 0;
  if (isBalancedWeapon(weapon)) modifier += 10;
  if (isUnbalancedWeapon(weapon)) modifier -= 10;
  if (isDefensiveWeapon(weapon)) modifier += 15;
  return modifier;
}

function getWeaponOverheatCooldownState(weapon) {
  return foundry.utils.deepClone(weapon?.flags?.roguetrader?.overheatCooldown ?? null);
}

function getWeaponRechargeCooldownState(weapon) {
  return foundry.utils.deepClone(weapon?.flags?.roguetrader?.rechargeCooldown ?? null);
}

function isWeaponJammed(weapon) {
  return Boolean(weapon?.flags?.roguetrader?.jammed);
}

function getAccurateAimBonus(weapon, aimKey) {
  if (!isAccurateWeapon(weapon)) return 0;
  return String(aimKey ?? "none") !== "none" ? 10 : 0;
}

function getAccurateDamageDice(weapon, { attackType = "standard", aimKey = "none", degrees = 0 } = {}) {
  const weaponClass = String(weapon?.system?.class ?? "").trim().toLowerCase();
  if (!isAccurateWeapon(weapon)) return 0;
  if (weaponClass !== "basic") return 0;
  if (!["standard", "calledShot"].includes(String(attackType ?? "").trim())) return 0;
  if (String(aimKey ?? "none") === "none") return 0;
  return Math.max(0, Math.min(2, Math.floor(Number(degrees ?? 0) / 2)));
}

function getArmourSourceKeyFromHitLocation(locationLabel) {
  switch (String(locationLabel ?? "").trim().toLowerCase()) {
    case "head":
      return "head";
    case "right arm":
    case "left arm":
    case "arm":
      return "arms";
    case "body":
      return "body";
    case "right leg":
    case "left leg":
    case "leg":
      return "legs";
    default:
      return "body";
  }
}

function normalizeCharacteristicModifierLabel(label) {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function normalizeResourceModifierLabel(label) {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function resolveResourceModifierKey(label) {
  return RESOURCE_MODIFIER_ALIASES[normalizeResourceModifierLabel(label)] ?? null;
}

function normalizeTraitName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatSignedModifier(value) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return String(value ?? 0);
  return numericValue >= 0 ? `+${numericValue}` : `${numericValue}`;
}

function formatDamageTypeLabel(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  switch (normalized) {
    case "e":
    case "energy":
      return "Energy";
    case "x":
    case "explosive":
      return "Explosive";
    case "i":
    case "impact":
      return "Impact";
    case "r":
    case "rending":
      return "Rending";
    default:
      return String(value ?? "-").toUpperCase();
  }
}

function normalizeCriticalDamageType(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  switch (normalized) {
    case "e":
    case "energy":
      return "energy";
    case "x":
    case "explosive":
      return "explosive";
    case "i":
    case "impact":
      return "impact";
    case "r":
    case "rending":
      return "rending";
    default:
      return "";
  }
}

function normalizeCriticalLocation(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("head")) return "head";
  if (normalized.includes("arm")) return "arm";
  if (normalized.includes("leg")) return "leg";
  return "body";
}

function getCriticalEffectTableKey(damageType, location) {
  const damageTypeKey = normalizeCriticalDamageType(damageType);
  const locationKey = normalizeCriticalLocation(location);
  return CRITICAL_EFFECT_TABLE_KEYS[damageTypeKey]?.[locationKey] ?? "";
}

function isLethalCriticalEntry(entry) {
  if (!entry) return false;

  const text = [entry.name, entry.benefit, entry.description]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .join(" ");

  return [
    /\bdies\b/,
    /\bdeath\b/,
    /\bkilled\b/,
    /\bslain\b/,
    /\bdoes not survive\b/,
    /\binstantly killed\b/,
    /\binstantly slain\b/
  ].some((pattern) => pattern.test(text));
}

const SIZE_ATTACK_MODIFIERS = {
  miniscule: -30,
  puny: -20,
  scrawny: -10,
  hulking: 10,
  enormous: 20,
  massive: 30
};

function parseSizeCategoryFromTrait(item) {
  if (!item || item.type !== "talent") return "";
  if (String(item.system?.category ?? "").trim().toLowerCase() !== "trait") return "";

  const normalizedName = normalizeTraitName(item.name);
  if (!normalizedName.startsWith("size")) return "";

  const match = String(item.name ?? "").match(/\(([^)]+)\)/);
  if (match?.[1]) {
    return normalizeTraitName(match[1]);
  }

  const directRating = normalizeTraitName(item.system?.rating);
  if (SIZE_ATTACK_MODIFIERS[directRating] !== undefined) {
    return directRating;
  }

  const fallbackText = [
    item.system?.benefit,
    item.system?.description
  ]
    .map((value) => String(value ?? ""))
    .join(" ");

  for (const category of Object.keys(SIZE_ATTACK_MODIFIERS)) {
    if (new RegExp(`\\b${category}\\b`, "i").test(fallbackText)) {
      return category;
    }
  }

  return "";
}

function getEquippedArmourSizeCategory(actor) {
  for (const item of actor?.items ?? []) {
    if (item?.type !== "armor") continue;
    if (!item.system?.equipped) continue;
    if (Boolean(item.system?.special?.hulking)) return "hulking";
  }

  return "";
}

function parseUnnaturalTraitRating(item) {
  const directRating = Number(item?.system?.rating ?? 0);
  if (Number.isFinite(directRating) && directRating >= 2) {
    return directRating;
  }

  const nameMatch = String(item?.name ?? "").match(/\((\d+)\)\s*$/);
  if (!nameMatch) return 0;

  const parsed = Number(nameMatch[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumericTraitRating(item) {
  const directRating = Number(item?.system?.rating ?? 0);
  if (Number.isFinite(directRating) && directRating > 0) {
    return directRating;
  }

  const nameMatch = String(item?.name ?? "").match(/\((\d+)\)\s*$/);
  if (!nameMatch) return 0;

  const parsed = Number(nameMatch[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFearTraitRating(item) {
  if (!item || item.type !== "talent") return 0;
  if (String(item.system?.category ?? "").trim().toLowerCase() !== "trait") return 0;
  if (normalizeTraitName(item.name).replace(/\s*\(\d+\)\s*$/, "") !== "fear") return 0;

  const rating = parseNumericTraitRating(item);
  return Math.max(0, Math.min(4, rating));
}

function isForceWeapon(weapon) {
  return Boolean(weapon?.system?.special?.force);
}

function isSanctifiedWeapon(weapon) {
  return Boolean(weapon?.system?.special?.sanctified);
}

function resolveCharacteristicModifierKey(label) {
  return CHARACTERISTIC_MODIFIER_ALIASES[normalizeCharacteristicModifierLabel(label)] ?? null;
}

function parseCharacteristicModifierExpression(expression) {
  const modifiers = {};
  const source = String(expression ?? "").trim();
  if (!source) return modifiers;

  const entries = source
    .split(/[\r\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const match = entry.match(/^(.+?)\s*([+-]\s*\d+)$/);
    if (!match) continue;

    const characteristicKey = resolveCharacteristicModifierKey(match[1]);
    if (!characteristicKey) continue;

    const numericValue = Number(match[2].replace(/\s+/g, ""));
    if (!Number.isFinite(numericValue) || numericValue === 0) continue;

    modifiers[characteristicKey] = Number(modifiers[characteristicKey] ?? 0) + numericValue;
  }

  return modifiers;
}

function itemProvidesCharacteristicModifiers(item) {
  if (!getItemResolvedModifierExpression(item)) return false;
  if (item.type === "armor") return Boolean(item.system?.equipped);
  return ["mutation", "malignancy", "mentalDisorder", "criticalInjury"].includes(item.type);
}

function getItemResolvedModifierExpression(item) {
  const unified = String(item?.system?.resolvedModifiers ?? "").trim();
  if (unified) return unified;

  const unifiedFormula = String(item?.system?.modifierFormula ?? "").trim();
  if (unifiedFormula) return unifiedFormula;

  const characteristic = String(item?.system?.characteristicModifiers ?? "").trim();
  const skill = String(item?.system?.skillModifiers ?? "").trim();
  return [characteristic, skill].filter(Boolean).join(", ");
}

function normalizeSkillModifierLabel(label) {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseSkillModifierExpression(expression) {
  const modifiers = {};
  const source = String(expression ?? "").trim();
  if (!source) return modifiers;

  const entries = source
    .split(/[\r\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const match = entry.match(/^(.+?)\s*([+-]\s*\d+)$/);
    if (!match) continue;

    const skillLabel = normalizeSkillModifierLabel(match[1]);
    if (!skillLabel) continue;

    const numericValue = Number(match[2].replace(/\s+/g, ""));
    if (!Number.isFinite(numericValue) || numericValue === 0) continue;

    modifiers[skillLabel] = Number(modifiers[skillLabel] ?? 0) + numericValue;
  }

  return modifiers;
}

function parseResourceModifierExpression(expression) {
  const modifiers = {};
  const source = String(expression ?? "").trim();
  if (!source) return modifiers;

  const entries = source
    .split(/[\r\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const match = entry.match(/^(.+?)\s*([+-]\s*\d+)$/);
    if (!match) continue;

    const resourceKey = resolveResourceModifierKey(match[1]);
    if (!resourceKey) continue;

    const numericValue = Number(match[2].replace(/\s+/g, ""));
    if (!Number.isFinite(numericValue) || numericValue === 0) continue;

    modifiers[resourceKey] = Number(modifiers[resourceKey] ?? 0) + numericValue;
  }

  return modifiers;
}

function itemProvidesSkillModifiers(item) {
  if (!getItemResolvedModifierExpression(item)) return false;
  if (item.type === "armor") return Boolean(item.system?.equipped);
  return ["mutation", "malignancy", "mentalDisorder", "criticalInjury"].includes(item.type);
}

const PSYCHIC_MODE_DEFINITIONS = [
  { index: 0, key: "fettered", label: "Fettered", push: 0 },
  { index: 1, key: "unfettered", label: "Unfettered", push: 0 },
  { index: 2, key: "push1", label: "Push 1", push: 1 },
  { index: 3, key: "push2", label: "Push 2", push: 2 },
  { index: 4, key: "push3", label: "Push 3", push: 3 },
  { index: 5, key: "push4", label: "Push 4", push: 4 }
];

export class RogueTraderActor extends Actor {
  getAdjacentHostileTokens() {
    const sourceToken = this.getActiveTokens?.()[0] ?? null;
    if (!sourceToken || !canvas?.tokens) return [];

    return canvas.tokens.placeables.filter((token) =>
      token?.id !== sourceToken.id
      && token?.actor
      && areTokensHostileToEachOther(sourceToken, token)
      && areTokensAdjacent(sourceToken, token)
    );
  }

  isRestrictedFromRangedAttack(weaponRef) {
    const weapon = weaponRef?.type === "weapon" ? weaponRef : this._resolveOwnedItem(weaponRef, "weapon");
    if (!weapon) return false;

    const weaponClass = String(weapon.system?.class ?? "").trim().toLowerCase();
    if (weaponClass === "melee" || weaponClass === "pistol") return false;

    return this.getAdjacentHostileTokens().length > 0;
  }

  getBestParryWeapon() {
    const equippedMeleeWeapons = this.items.filter((item) =>
      item.type === "weapon"
      && Boolean(item.system?.equipped)
      && String(item.system?.class ?? "").trim().toLowerCase() === "melee"
      && !isUnwieldyWeapon(item)
      && !isNaturalWeapon(item)
    );

    if (!equippedMeleeWeapons.length) return null;

    return equippedMeleeWeapons.sort((left, right) => {
      const leftModifier = getParryWeaponModifier(left);
      const rightModifier = getParryWeaponModifier(right);
      return rightModifier - leftModifier || left.name.localeCompare(right.name);
    })[0];
  }

  hasNaturalWeaponsTrait() {
    return this.hasTrait("natural weapons");
  }

  hasImprovedNaturalWeaponsTrait() {
    return this.hasTrait("improved natural weapons");
  }

  getNaturalWeaponItem() {
    return (this.items ?? []).find((item) => item.type === "weapon" && isNaturalWeapon(item)) ?? null;
  }

  hasEquippedHulkingArmor() {
    return (this.items ?? []).some((item) =>
      item?.type === "armor"
      && Boolean(item.system?.equipped)
      && Boolean(item.system?.special?.hulking)
    );
  }

  getGeneratedHulkingSizeTraitItem() {
    return (this.items ?? []).find((item) => item.type === "talent" && isGeneratedHulkingSizeTrait(item)) ?? null;
  }

  getExplicitSizeTraitItem() {
    return (this.items ?? []).find((item) =>
      item?.type === "talent"
      && String(item.system?.category ?? "").trim().toLowerCase() === "trait"
      && !isGeneratedHulkingSizeTrait(item)
      && normalizeTraitName(item.name).startsWith("size")
    ) ?? null;
  }

  getEquippedWeaponsInHandOrder() {
    return (this.items ?? []).filter((item) =>
      item?.type === "weapon"
      && Boolean(item.system?.equipped)
      && !isNaturalWeapon(item)
    ).sort((left, right) => {
      const leftOrder = Number(left.flags?.roguetrader?.equippedOrder ?? Number.MAX_SAFE_INTEGER);
      const rightOrder = Number(right.flags?.roguetrader?.equippedOrder ?? Number.MAX_SAFE_INTEGER);
      return leftOrder - rightOrder || Number(left.sort ?? 0) - Number(right.sort ?? 0) || left.name.localeCompare(right.name);
    });
  }

  async getNextEquippedWeaponOrder() {
    const current = Number(this.getFlag("roguetrader", "nextEquippedWeaponOrder") ?? 0) || 0;
    const next = current + 1;
    await this.setFlag("roguetrader", "nextEquippedWeaponOrder", next);
    return next;
  }

  getPrimaryHandWeapon() {
    return this.getEquippedWeaponsInHandOrder()[0] ?? null;
  }

  getOffHandWeapon() {
    return this.getEquippedWeaponsInHandOrder()[1] ?? null;
  }

  getWeaponEquipValidation(weapon) {
    if (!weapon || weapon.type !== "weapon") {
      return { ok: true, reason: "" };
    }

    if (isNaturalWeapon(weapon)) {
      return { ok: true, reason: "" };
    }

    if (Boolean(weapon.system?.equipped)) {
      return { ok: true, reason: "" };
    }

    const equippedWeapons = this.getEquippedWeaponsInHandOrder().filter((item) => item.id !== weapon.id);
    const normalizedClass = String(weapon.system?.class ?? "").trim().toLowerCase();
    const existingTwoHandedClass = equippedWeapons.find((item) => {
      const itemClass = String(item.system?.class ?? "").trim().toLowerCase();
      return itemClass === "basic" || itemClass === "heavy";
    });

    if (normalizedClass === "basic" || normalizedClass === "heavy") {
      if (equippedWeapons.length > 0) {
        return {
          ok: false,
          reason: "Only one Basic or Heavy weapon may be equipped at a time."
        };
      }

      return { ok: true, reason: "" };
    }

    if (existingTwoHandedClass) {
      return {
        ok: false,
        reason: "You cannot equip a second weapon while a Basic or Heavy weapon is equipped."
      };
    }

    if (equippedWeapons.length >= 2) {
      return {
        ok: false,
        reason: "You may only equip two weapons at a time."
      };
    }

    return { ok: true, reason: "" };
  }

  async ensureNaturalWeaponsState() {
    const hasNaturalWeapons = this.hasNaturalWeaponsTrait();
    const improvedNaturalWeapons = this.hasImprovedNaturalWeaponsTrait();
    const naturalWeaponItem = this.getNaturalWeaponItem();

    if (!hasNaturalWeapons) {
      if (naturalWeaponItem) {
        await naturalWeaponItem.delete();
      }
      return null;
    }

    const desiredPrimitive = !improvedNaturalWeapons;

    if (!naturalWeaponItem) {
      const [created] = await this.createEmbeddedDocuments("Item", [
        buildGeneratedNaturalWeaponItemData({ primitive: desiredPrimitive })
      ]);
      return created ?? null;
    }

    const updates = {};
    if (!naturalWeaponItem.system?.equipped) {
      updates["system.equipped"] = true;
    }
    if (String(naturalWeaponItem.system?.class ?? "").trim().toLowerCase() !== "melee") {
      updates["system.class"] = "melee";
    }
    if (String(naturalWeaponItem.system?.weaponType ?? "").trim().toLowerCase() !== "primitive") {
      updates["system.weaponType"] = "primitive";
    }
    if (String(naturalWeaponItem.system?.damage ?? "").trim() !== "1d10+0 R") {
      updates["system.damage"] = "1d10+0 R";
    }
    if (Boolean(naturalWeaponItem.system?.special?.primitive) !== desiredPrimitive) {
      updates["system.special.primitive"] = desiredPrimitive;
    }
    if (!naturalWeaponItem.flags?.roguetrader?.generatedNaturalWeapon) {
      updates["flags.roguetrader.generatedNaturalWeapon"] = true;
    }
    if (!naturalWeaponItem.flags?.roguetrader?.protectedNaturalWeapon) {
      updates["flags.roguetrader.protectedNaturalWeapon"] = true;
    }

    if (Object.keys(updates).length) {
      await naturalWeaponItem.update(updates);
    }

    return naturalWeaponItem;
  }

  async ensureHulkingArmorState() {
    const hasHulkingArmor = this.hasEquippedHulkingArmor();
    const generatedTrait = this.getGeneratedHulkingSizeTraitItem();
    const explicitSizeTrait = this.getExplicitSizeTraitItem();

    if (!hasHulkingArmor || explicitSizeTrait) {
      if (generatedTrait) {
        await generatedTrait.delete();
      }
      return null;
    }

    if (!generatedTrait) {
      const [created] = await this.createEmbeddedDocuments("Item", [
        buildGeneratedHulkingSizeTraitItemData()
      ]);
      return created ?? null;
    }

    const updates = {};
    if (String(generatedTrait.name ?? "").trim() !== "Size (Hulking)") {
      updates.name = "Size (Hulking)";
    }
    if (String(generatedTrait.system?.category ?? "").trim().toLowerCase() !== "trait") {
      updates["system.category"] = "trait";
    }
    if (String(generatedTrait.system?.rating ?? "").trim() !== "Hulking") {
      updates["system.rating"] = "Hulking";
    }
    if (!generatedTrait.flags?.roguetrader?.generatedHulkingSizeTrait) {
      updates["flags.roguetrader.generatedHulkingSizeTrait"] = true;
    }
    if (!generatedTrait.flags?.roguetrader?.protectedHulkingSizeTrait) {
      updates["flags.roguetrader.protectedHulkingSizeTrait"] = true;
    }

    if (Object.keys(updates).length) {
      await generatedTrait.update(updates);
    }

    return generatedTrait;
  }

  _getStatusEffectByStatusId(statusId) {
    const normalizedStatusId = String(statusId ?? "").trim();
    if (!normalizedStatusId) return null;

    return this.effects.find((effect) => {
      const statuses = effect?.statuses;
      if (Array.isArray(statuses)) {
        return statuses.includes(normalizedStatusId);
      }
      if (statuses instanceof Set) {
        return statuses.has(normalizedStatusId);
      }
      if (typeof statuses?.has === "function") {
        return statuses.has(normalizedStatusId);
      }
      return false;
    }) ?? null;
  }

  async _preUpdate(changed, options, user) {
    if (foundry.utils.hasProperty(changed, "system.corruption.points")) {
      options.roguetraderPreviousCorruptionPoints = Number(this.system?.corruption?.points ?? 0) || 0;
    }

    return super._preUpdate(changed, options, user);
  }

  async _onUpdate(changed, options, userId) {
    await super._onUpdate(changed, options, userId);

    if (this.type !== "character") return;
    if (!foundry.utils.hasProperty(changed, "system.corruption.points")) return;
    if (options?.roguetraderSkipCorruptionAutomation) return;
    if (game.user?.id !== userId) return;

    const previousPoints = Number(options?.roguetraderPreviousCorruptionPoints ?? this.system?.corruption?.points ?? 0) || 0;
    const currentPoints = Number(this.system?.corruption?.points ?? 0) || 0;
    await this._handleCorruptionAutomation(previousPoints, currentPoints);
  }

  getRollData() {
    const data = super.getRollData();
    data.agilityBonus = this.getCharacteristicBonus("agility");
    data.initiativeBonus = this.type === "ship"
      ? this.getEffectiveShipDetection()
      : data.agilityBonus;
    return data;
  }

  async _handleCorruptionAutomation(previousPoints, currentPoints) {
    if (currentPoints <= previousPoints) return;

    const testedThresholds = Array.isArray(this.system?.corruption?.testedThresholds)
      ? [...this.system.corruption.testedThresholds]
      : [];
    const testedMutationThresholds = Array.isArray(this.system?.corruption?.testedMutationThresholds)
      ? [...this.system.corruption.testedMutationThresholds]
      : [];

    const thresholdsToTest = [];
    for (let threshold = 10; threshold < 100; threshold += 10) {
      if (threshold <= previousPoints || threshold > currentPoints) continue;
      if (testedThresholds.includes(threshold)) continue;
      thresholdsToTest.push(threshold);
    }

    const mutationThresholdsToTest = CORRUPTION_MUTATION_THRESHOLDS.filter((threshold) =>
      threshold > previousPoints
      && threshold <= currentPoints
      && !testedMutationThresholds.includes(threshold)
    );

    for (const threshold of thresholdsToTest) {
      await this._runCorruptionMalignancyTest(threshold, currentPoints);
      testedThresholds.push(threshold);
    }

    for (const threshold of mutationThresholdsToTest) {
      await this._rollAndApplyCorruptionMutation(threshold, currentPoints);
      testedMutationThresholds.push(threshold);
    }

    if (!thresholdsToTest.length && !mutationThresholdsToTest.length) return;

    await this.update({
      "system.corruption.testedThresholds": testedThresholds,
      "system.corruption.testedMutationThresholds": testedMutationThresholds
    }, { roguetraderSkipCorruptionAutomation: true });
  }

  getCurrentFate() {
    return Number(this.system.resources?.fate?.value ?? 0);
  }

  async spendFate(amount = 1) {
    const current = this.getCurrentFate();
    const cost = Number(amount ?? 0);

    if (current < cost) return false;

    await this.update({ "system.resources.fate.value": current - cost });
    return true;
  }

  async spendFateToHeal() {
    const spent = await this.spendFate(1);
    if (!spent) {
      ui.notifications?.warn("Rogue Trader | No fate points remaining.");
      return null;
    }

    const roll = await (new Roll("1d5")).evaluate();
    const currentWounds = Number(this.system.resources?.wounds?.value ?? 0);
    const maxWounds = this.getEffectiveWoundsMax();
    const healed = Math.max(0, Math.min(Number(roll.total ?? 0), maxWounds - currentWounds));
    const newWounds = Math.min(maxWounds, currentWounds + healed);

    await this.update({ "system.resources.wounds.value": newWounds });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Fate Healing</h3>
          <p><strong>Effect:</strong> Spent 1 Fate Point to heal wounds.</p>
          <p><strong>Recovered:</strong> ${healed}</p>
          <p><strong>Wounds:</strong> ${currentWounds} -> ${newWounds}</p>
          <p><strong>Critical Damage:</strong> Unchanged</p>
        </div>
      `
    });

    return { roll, healed, newWounds };
  }

  async _runCorruptionMalignancyTest(threshold, currentPoints) {
    const corruptionTrack = getCorruptionTrackData(currentPoints);
    const result = await this.rollCharacteristic("willpower", {
      modifier: corruptionTrack.malignancyModifier,
      label: `${this.name}: Malignancy Test (${threshold} Corruption)`,
      extra: [
        `Corruption: ${currentPoints}`,
        `Threshold: ${threshold}`,
        `Degree: ${corruptionTrack.degree}`,
        `Malignancy Modifier: ${corruptionTrack.malignancyModifierLabel}`
      ]
    });

    if (result?.success) return;

    await this._rollAndApplyMalignancy(threshold, currentPoints, corruptionTrack);
  }

  async _rollAndApplyMalignancy(threshold, currentPoints, corruptionTrack) {
    const roll = await (new Roll("1d100")).evaluate({ async: true });
    const total = Number(roll.total ?? 0);
    const entry = resolveReferenceTableResult("malignancies", total);
    const itemData = await this._getReferenceCompendiumItemData("malignancies", total, "malignancy");

    if (itemData) {
      await this.createEmbeddedDocuments("Item", [itemData]);
    }

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Malignancy Roll</h3>
          <p><strong>Corruption:</strong> ${currentPoints}</p>
          <p><strong>Threshold:</strong> ${threshold}</p>
          <p><strong>Degree:</strong> ${corruptionTrack.degree}</p>
          <p><strong>Modifier:</strong> ${corruptionTrack.malignancyModifierLabel}</p>
          <p><strong>Result:</strong> ${entry?.name ?? "Unknown malignancy"}</p>
        </div>
      `
    });
  }

  async _rollAndApplyCorruptionMutation(threshold, currentPoints) {
    const corruptionTrack = getCorruptionTrackData(currentPoints);
    const roll = await (new Roll("1d100")).evaluate({ async: true });
    const total = Number(roll.total ?? 0);
    const entry = resolveReferenceTableResult("mutations", total);
    const itemData = await this._getReferenceCompendiumItemData("mutations", total, "mutation");

    if (itemData) {
      await this.createEmbeddedDocuments("Item", [itemData]);
    }

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Mutation Roll</h3>
          <p><strong>Corruption:</strong> ${currentPoints}</p>
          <p><strong>Threshold:</strong> ${threshold}</p>
          <p><strong>Mutation Stage:</strong> ${corruptionTrack.mutationStage ?? "Unknown"}</p>
          <p><strong>Result:</strong> ${entry?.name ?? "Unknown mutation"}</p>
        </div>
      `
    });
  }

  async _getReferenceCompendiumItemData(tableKey, rollTotal, itemType) {
    const referenceEntry = resolveReferenceTableResult(tableKey, rollTotal);
    const fallbackItemData = buildReferenceTableItemData(tableKey, rollTotal, { type: itemType });
    const pack = game.packs.get("roguetrader.character-creation-options");

    if (!pack || pack.documentName !== "Item" || !referenceEntry?.name) {
      return fallbackItemData;
    }

    const documents = await pack.getDocuments();
    const item = documents.find((doc) =>
      doc.type === itemType
      && String(doc.name ?? "").trim().toLowerCase() === String(referenceEntry.name ?? "").trim().toLowerCase()
    );

    if (!item) return fallbackItemData;

    const itemData = item.toObject();
    delete itemData._id;
    return itemData;
  }

  async _applyCriticalEffect({ damageType = "", location = "Body", sourceName = "", applied = null } = {}) {
    if (!applied || Number(applied.criticalOverflow ?? 0) <= 0) return null;

    const tableKey = getCriticalEffectTableKey(damageType, location);
    if (!tableKey) return null;

    const totalCriticalDamage = Math.max(1, Number(applied.newCriticalDamage ?? 0));
    const resolvedSeverity = Math.min(10, totalCriticalDamage);
    const entry = resolveReferenceTableResult(tableKey, resolvedSeverity);
    if (!entry) return null;

    let createdInjury = null;
    const lethal = isLethalCriticalEntry(entry);
    const injuryHint = String(entry.injuryHint ?? "").trim();
    if (entry.createsCriticalInjury && injuryHint) {
      const injuryDefinition = listCriticalInjuries().find((definition) =>
        (definition.sourceInjuryHints ?? []).some((hint) => String(hint).trim().toLowerCase() === injuryHint.toLowerCase())
      );

      if (injuryDefinition) {
        const alreadyHasInjury = (this.items ?? []).some((item) =>
          item.type === "criticalInjury"
          && String(item.name ?? "").trim().toLowerCase() === String(injuryDefinition.name ?? "").trim().toLowerCase()
        );

        if (!alreadyHasInjury) {
          const itemData = buildCriticalInjuryItemData(injuryDefinition.key, {
            severity: String(resolvedSeverity),
            notes: `Applied from ${formatDamageTypeLabel(damageType)} Critical Damage to the ${location}. Source: ${sourceName || "Unknown"}.`
          });

          if (itemData) {
            const [created] = await this.createEmbeddedDocuments("Item", [itemData]);
            createdInjury = created ?? itemData;
          }
        }
      }
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Critical Damage</h3>
          <p><strong>Source:</strong> ${sourceName || "Unknown"}</p>
          <p><strong>Type:</strong> ${formatDamageTypeLabel(damageType)}</p>
          <p><strong>Location:</strong> ${location}</p>
          ${Number(applied.effectiveCriticalDamage ?? applied.criticalOverflow ?? 0) !== Number(applied.criticalOverflow ?? 0)
            ? `<p><strong>True Grit:</strong> ${applied.criticalOverflow} -> ${applied.effectiveCriticalDamage} Critical Damage</p>`
            : ""}
          <p><strong>Critical Damage Total:</strong> ${totalCriticalDamage}${totalCriticalDamage > 10 ? " (resolved as 10+)" : ""}</p>
          <p><strong>Effect:</strong> ${entry.name}</p>
          <p>${entry.description}</p>
          ${lethal ? "<p><strong>Lethal Result:</strong> Target is slain.</p>" : ""}
          ${createdInjury ? `<p><strong>Critical Injury Added:</strong> ${createdInjury.name}</p>` : ""}
        </div>
      `
    });

    if (lethal) {
      await this.applyDead({ sourceName: sourceName || `${formatDamageTypeLabel(damageType)} Critical Damage` });
    }

    return {
      tableKey,
      severity: resolvedSeverity,
      totalCriticalDamage,
      entry,
      createdInjury,
      lethal
    };
  }

  getPsyRating() {
    const psyRatingItem = this.items.find((item) => item.type === "talent" && item.name?.toLowerCase() === "psy rating");
    return Number(psyRatingItem?.system?.rating ?? 0);
  }

  getPsychicModeData(modeIndex = 0) {
    const basePsyRating = this.getPsyRating();
    const mode = PSYCHIC_MODE_DEFINITIONS.find((entry) => entry.index === Number(modeIndex)) ?? PSYCHIC_MODE_DEFINITIONS[0];
    const push = Number(mode.push ?? 0);
    const psyRatingUsed = mode.key === "fettered"
      ? Math.max(0, Math.ceil(basePsyRating / 2))
      : basePsyRating + push;

    return {
      ...mode,
      basePsyRating,
      psyRatingUsed,
      modifier: psyRatingUsed * 5,
      causesPhenomenaOnDoubles: mode.key === "unfettered",
      causesPhenomenaAutomatically: push > 0,
      phenomenaModifier: push * 5
    };
  }

  getCharacteristicValue(characteristicKey) {
    const characteristic = this.system.characteristics?.[characteristicKey] ?? {};
    const baseValue = Number(characteristic.value ?? 0);
    const totalModifier = this.getCharacteristicTotalModifier(characteristicKey);
    return baseValue + totalModifier;
  }

  getCharacteristicBonus(characteristicKey) {
    const value = this.getCharacteristicValue(characteristicKey);
    const multiplier = this.getCharacteristicBonusMultiplier(characteristicKey);
    return Math.floor(value / 10) * multiplier;
  }

  getBaseCharacteristicBonus(characteristicKey) {
    const value = this.getCharacteristicValue(characteristicKey);
    return Math.floor(value / 10);
  }

  getSizeMovementModifier() {
    for (const item of this.items ?? []) {
      if (item.type !== "talent") continue;
      if (String(item.system?.category ?? "").trim().toLowerCase() !== "trait") continue;
      if (normalizeTraitName(item.name).replace(/\s*\([^)]*\)\s*$/, "") !== "size") continue;

      const category = getSizeCategoryFromTraitItem(item);
      if (category) {
        return Number(SIZE_MOVEMENT_MODIFIERS[category] ?? 0);
      }
    }

    const armourSizeCategory = getEquippedArmourSizeCategory(this);
    if (armourSizeCategory) {
      return Number(SIZE_MOVEMENT_MODIFIERS[armourSizeCategory] ?? 0);
    }

    return 0;
  }

  getQuadrupedMovementMultiplier() {
    return this.hasTrait("quadruped") ? 2 : 1;
  }

  getMovementAgilityBonus() {
    const adjustedBaseBonus = Math.max(1, this.getBaseCharacteristicBonus("agility") + this.getSizeMovementModifier());
    return Math.max(1, adjustedBaseBonus * this.getQuadrupedMovementMultiplier());
  }

  getCharacteristicBonusMultiplier(characteristicKey) {
    const characteristic = this.system.characteristics?.[characteristicKey] ?? {};
    const baseMultiplier = Math.max(1, Number(characteristic.bonusMultiplier ?? 1));
    const targetTraitName = UNNATURAL_CHARACTERISTIC_TRAIT_NAMES[characteristicKey] ?? "";

    if (!targetTraitName) return baseMultiplier;

    let itemMultiplier = 0;
    for (const item of this.items ?? []) {
      if (item.type !== "talent") continue;
      if (String(item.system?.category ?? "").trim().toLowerCase() !== "trait") continue;
      if (normalizeTraitName(item.name).replace(/\s*\(\d+\)\s*$/, "") !== targetTraitName) continue;

      const rating = parseUnnaturalTraitRating(item);
      if (rating > itemMultiplier) {
        itemMultiplier = rating;
      }
    }

    return Math.max(baseMultiplier, itemMultiplier || 1);
  }

    getMachineArmourBonus() {
      let machineRating = 0;

    for (const item of this.items ?? []) {
      if (item.type !== "talent") continue;
      if (String(item.system?.category ?? "").trim().toLowerCase() !== "trait") continue;
      if (normalizeTraitName(item.name).replace(/\s*\(\d+\)\s*$/, "") !== "machine") continue;

      const rating = parseNumericTraitRating(item);
      if (rating > machineRating) {
        machineRating = rating;
      }
    }

      return machineRating;
    }

    getNaturalArmourBonus() {
      let naturalArmourRating = 0;

      for (const item of this.items ?? []) {
        if (item.type !== "talent") continue;
        if (String(item.system?.category ?? "").trim().toLowerCase() !== "trait") continue;
        if (normalizeTraitName(item.name).replace(/\s*\(\d+\)\s*$/, "") !== "natural armour") continue;

        const rating = parseNumericTraitRating(item);
        if (rating > naturalArmourRating) {
          naturalArmourRating = rating;
        }
      }

      return naturalArmourRating;
    }

    hasTrait(traitName) {
      const normalizedTarget = normalizeTraitName(traitName).replace(/\s*\(\d+\)\s*$/, "");
      if (!normalizedTarget) return false;

      return (this.items ?? []).some((item) =>
        item.type === "talent"
        && String(item.system?.category ?? "").trim().toLowerCase() === "trait"
        && normalizeTraitName(item.name).replace(/\s*\(\d+\)\s*$/, "") === normalizedTarget
      );
    }

    getSizeAttackModifier() {
      for (const item of this.items ?? []) {
        const sizeCategory = parseSizeCategoryFromTrait(item);
        if (!sizeCategory) continue;

        const modifier = SIZE_ATTACK_MODIFIERS[sizeCategory];
        if (modifier === undefined) continue;

        return {
          category: sizeCategory,
          label: sizeCategory.charAt(0).toUpperCase() + sizeCategory.slice(1),
          modifier
        };
      }

      const armourSizeCategory = getEquippedArmourSizeCategory(this);
      if (armourSizeCategory) {
        const modifier = SIZE_ATTACK_MODIFIERS[armourSizeCategory];
        if (modifier !== undefined) {
          return {
            category: armourSizeCategory,
            label: armourSizeCategory.charAt(0).toUpperCase() + armourSizeCategory.slice(1),
            modifier
          };
        }
      }

      return {
        category: "",
        label: "",
        modifier: 0
      };
    }

    getFearRating() {
      let highestFear = 0;

      for (const item of this.items ?? []) {
        const rating = parseFearTraitRating(item);
        if (rating > highestFear) {
          highestFear = rating;
        }
      }

      return highestFear;
    }

    isImmuneToFear() {
      return this.hasTrait("from beyond")
        || actorHasTalentNamed(this, "Fearless")
        || actorHasTalentNamed(this, "Rite of Pure Thought")
        || this.isFrenzied();
    }

    isImmuneToPinning() {
      return this.hasTrait("from beyond")
        || actorHasTalentNamed(this, "Fearless")
        || actorHasTalentNamed(this, "Rite of Pure Thought")
        || actorHasTalentNamed(this, "Frenzy")
        || this.isFrenzied();
    }

    isAlwaysBracedForHeavyWeapons() {
      return actorHasTalentNamed(this, "Bulging Biceps")
        || this.hasTrait("auto-stabilised");
    }

    isHeavyWeaponBraced(weaponRef = null) {
      const weapon = weaponRef?.type === "weapon" ? weaponRef : this._resolveOwnedItem(weaponRef, "weapon");
      const weaponClass = String(weapon?.system?.class ?? "").trim().toLowerCase();
      if (weapon && weaponClass !== "heavy") return false;
      return this.isAlwaysBracedForHeavyWeapons() || this.isBraced();
    }

    getFearResistanceModifier() {
      return actorHasTalentNamed(this, "Resistance (Fear)") ? 10 : 0;
    }

    async resolveFearTest({ fearRating = 1, sourceActor = null, sourceName = "", fateReroll = false } = {}) {
      const rating = Math.max(1, Math.min(4, Number(fearRating ?? 1) || 1));
      const fearData = FEAR_TEST_MODIFIERS[rating] ?? FEAR_TEST_MODIFIERS[1];
      const sourceLabel = sourceName || sourceActor?.name || "Fear Source";

      if (this.isImmuneToFear()) {
        return {
          immune: true,
          success: true,
          fearRating: rating,
          fearLabel: fearData.label,
          fearModifier: fearData.modifier,
          resistanceModifier: 0,
          totalModifier: 0,
          sourceLabel,
          result: null,
          initialResult: null,
          rerolled: false,
          shockModifier: 0,
          shockRoll: null,
          shockTotal: 0,
          shockEntry: null
        };
      }

      const resistanceModifier = this.getFearResistanceModifier();
      const totalModifier = fearData.modifier + resistanceModifier;
      const baseTarget = this.getCharacteristicValue("willpower");
      const extra = [
        `Source: ${sourceLabel}`,
        `Fear Rating: Fear (${rating}) - ${fearData.label}`,
        `Fear Modifier: ${fearData.modifier >= 0 ? `+${fearData.modifier}` : fearData.modifier}`,
        ...(resistanceModifier ? [`Resistance (Fear): +${resistanceModifier}`] : [])
      ];

      let result = await this.rollCharacteristic("willpower", {
        label: `${this.name}: Fear Test`,
        modifier: totalModifier,
        extra,
        createMessage: false
      });

      let rerolled = false;
      let initialResult = result;
      if (!result?.success && actorHasTalentNamed(this, "Unshakeable Faith")) {
        rerolled = true;
        result = await this.rollCharacteristic("willpower", {
          label: `${this.name}: Fear Test (Unshakeable Faith Reroll)`,
          modifier: totalModifier,
          extra: [...extra, "Unshakeable Faith: Free reroll on failed Fear test"],
          createMessage: false
        });
      }

      const shockModifier = !result?.success
        ? Math.max(0, Number(result?.degrees ?? 0) * 10)
        : 0;
      let shockRoll = null;
      let shockTotal = 0;
      let shockEntry = null;
      if (!result?.success) {
        shockRoll = await (new Roll("1d100")).evaluate({ async: true });
        shockTotal = Math.max(1, Number(shockRoll.total ?? 0) + shockModifier);
        shockEntry = resolveReferenceTableResult("shockTable", shockTotal);
      }

      return {
        immune: false,
        success: Boolean(result?.success),
        fearRating: rating,
        fearLabel: fearData.label,
        fearModifier: fearData.modifier,
        resistanceModifier,
        totalModifier,
        sourceLabel,
        initialResult,
        result,
        rerolled,
        shockModifier,
        shockRoll,
        shockTotal,
        shockEntry
      };
    }

    async rollFearTest({ fearRating = 1, sourceActor = null, sourceName = "", fateReroll = false, replaceMessage = null } = {}) {
      const resolution = await this.resolveFearTest({
        fearRating,
        sourceActor,
        sourceName,
        fateReroll
      });
      const {
        immune,
        success,
        fearRating: rating,
        fearLabel,
        fearModifier,
        sourceLabel,
        initialResult,
        result,
        rerolled,
        shockModifier,
        shockRoll,
        shockTotal,
        shockEntry,
        totalModifier
      } = resolution;

      if (immune) {
        const message = await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: `
            <div class="roguetrader-roll-card">
              <h3>${this.name}: Fear Resolution</h3>
              <p><strong>Source:</strong> ${sourceLabel}</p>
              <p><strong>Fear Rating:</strong> Fear (${rating}) - ${fearLabel}</p>
              <p><strong>Outcome:</strong> Immune to Fear.</p>
            </div>
          `
        });

        if (replaceMessage) {
          await replaceMessage.delete();
        }

        return {
          ...resolution,
          message
        };
      }

      const rerollHint = !result?.success && !fateReroll
        ? `<p class="roguetrader-roll-hint">Right-click to spend Fate for a reroll.</p>`
        : "";
      const fateMarkup = fateReroll
        ? "<p><strong>Fate:</strong> Rerolled</p>"
        : "";

      const message = await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card" data-fate-reroll="${!result?.success ? "true" : "false"}">
            <h3>${this.name}: Fear Resolution</h3>
            <p><strong>Source:</strong> ${sourceLabel}</p>
            <p><strong>Fear Rating:</strong> Fear (${rating}) - ${fearLabel}</p>
            <p><strong>Fear Test:</strong> ${initialResult?.rollTotal ?? "?"} vs ${initialResult?.finalTarget ?? "?"} (${initialResult?.outcome ?? "Unknown"})</p>
            ${rerolled ? `<p><strong>Unshakeable Faith Reroll:</strong> ${result?.rollTotal ?? "?"} vs ${result?.finalTarget ?? "?"} (${result?.outcome ?? "Unknown"})</p>` : ""}
            <p><strong>Outcome:</strong> ${success ? "Passed" : "Failed"}</p>
            ${fateMarkup}
            ${rerolled ? "<p><strong>Unshakeable Faith:</strong> Free reroll used.</p>" : ""}
            ${!result?.success ? `<p><strong>Shock Roll:</strong> ${shockRoll?.total ?? "?"} ${shockModifier ? `+ ${shockModifier}` : ""} = ${shockTotal}</p>` : ""}
            ${!result?.success ? `<p><strong>Shock Table:</strong> ${shockEntry?.name ?? `Resolve result ${shockTotal}`}</p>` : ""}
            ${!result?.success && shockEntry?.description ? `<p>${shockEntry.description}</p>` : ""}
            ${rerollHint}
          </div>
        `,
        flags: {
          roguetrader: {
            rollContext: {
              actorUuid: this.uuid,
              title: `${this.name}: Fear Resolution`,
              target: baseTarget,
              modifier: totalModifier,
              breakdown: [
                `Willpower: ${baseTarget}`
              ],
              extra: [
                `Source: ${sourceLabel}`,
                `Fear Rating: Fear (${rating}) - ${fearLabel}`,
                `Fear Modifier: ${fearModifier >= 0 ? `+${fearModifier}` : fearModifier}`
              ],
              rerollCount: fateReroll ? 1 : 0,
              successDegreeBonus: 0,
              fearContext: {
                fearRating: rating,
                sourceActorUuid: sourceActor?.uuid ?? null,
                sourceName: sourceLabel
              }
            }
          }
        }
      });

      if (replaceMessage) {
        await replaceMessage.delete();
      }

      return {
        message,
        immune: false,
        success: Boolean(result?.success),
        fearRating: rating,
        rerolled,
        shockModifier,
        shockRoll,
        shockTotal,
        result
      };
    }

    getEffectiveToughnessBonusForDamage({ sourceWeapon = null, sourceIsPsychic = false } = {}) {
      const baseToughnessBonus = this.getCharacteristicBonus("toughness");
      const hasDaemonic = this.hasTrait("daemonic");
      const bypassesDaemonicProtection = Boolean(sourceIsPsychic) || isForceWeapon(sourceWeapon) || isSanctifiedWeapon(sourceWeapon);

      return {
        hasDaemonic,
        bypassesDaemonicProtection,
        baseToughnessBonus,
        effectiveToughnessBonus: hasDaemonic && !bypassesDaemonicProtection
          ? baseToughnessBonus * 2
          : baseToughnessBonus
      };
    }

    getDisplayedCharacteristicBonus(characteristicKey) {
      if (String(characteristicKey ?? "") === "toughness") {
        return this.getEffectiveToughnessBonusForDamage().effectiveToughnessBonus;
      }

      return this.getCharacteristicBonus(characteristicKey);
    }

    getArmourPointsForLocation(locationLabel, { sourceWeapon = null, sourceRangeBand = "standard" } = {}) {
      return this.getArmourBreakdownForLocation(locationLabel, { sourceWeapon, sourceRangeBand }).totalArmour;
    }

    getArmourBreakdownForLocation(locationLabel, { sourceWeapon = null, sourceRangeBand = "standard" } = {}) {
      const sourceKey = getArmourSourceKeyFromHitLocation(locationLabel);
      const equippedArmor = (this.items ?? []).filter((item) => item.type === "armor" && item.system?.equipped);
      const installedCybernetics = (this.items ?? []).filter((item) => item.type === "cybernetic");
      const primitiveAttack = isPrimitiveWeapon(sourceWeapon);
      const scatterAttack = isScatterWeapon(sourceWeapon)
        && ["long", "extreme"].includes(String(sourceRangeBand ?? "standard").trim().toLowerCase());
      let wornArmour = 0;
      let primitiveAdjustedArmour = 0;
      let cyberneticArmour = 0;
      let primitiveAdjustedCyberneticArmour = 0;

      for (const item of equippedArmor) {
        if (!item.system?.locations?.[sourceKey]) continue;
        const itemAp = Number(item.system?.ap?.[sourceKey] ?? 0);
        if (!Number.isFinite(itemAp) || itemAp <= 0) continue;
        wornArmour += itemAp;

        const armourIsPrimitive = Boolean(item.system?.special?.primitive)
          || String(item.system?.armorType ?? "").trim().toLowerCase() === "primitive";
        primitiveAdjustedArmour += primitiveAttack && !armourIsPrimitive
          ? itemAp * 2
          : itemAp;
      }

      for (const item of installedCybernetics) {
        const addsArmour = Boolean(item.system?.addsArmour)
          || ["head", "arms", "body", "legs"].some((key) => Number(item.system?.armourBonus?.[key] ?? 0) > 0);
        if (!addsArmour) continue;
        const itemAp = Number(item.system?.armourBonus?.[sourceKey] ?? 0);
        if (!Number.isFinite(itemAp) || itemAp <= 0) continue;
        cyberneticArmour += itemAp;
        primitiveAdjustedCyberneticArmour += primitiveAttack
          ? itemAp * 2
          : itemAp;
      }

      const machineArmour = this.getMachineArmourBonus();
      const naturalArmour = this.getNaturalArmourBonus();
      const finalWornArmour = scatterAttack ? primitiveAdjustedArmour * 2 : primitiveAdjustedArmour;
      const finalCyberneticArmour = scatterAttack ? primitiveAdjustedCyberneticArmour * 2 : primitiveAdjustedCyberneticArmour;
      const finalMachineArmour = scatterAttack ? machineArmour * 2 : machineArmour;
      const finalNaturalArmour = scatterAttack ? naturalArmour * 2 : naturalArmour;

      return {
        primitiveAttack,
        scatterAttack,
        wornArmour,
        cyberneticArmour,
        effectiveWornArmour: finalWornArmour,
        effectiveCyberneticArmour: finalCyberneticArmour,
        machineArmour: finalMachineArmour,
        naturalArmour: finalNaturalArmour,
        totalArmour: finalWornArmour + finalCyberneticArmour + finalMachineArmour + finalNaturalArmour
      };
    }

  async applyDamageToLocation({ damage = 0, penetration = 0, location = "Body", damageType = "", sourceName = "", sourceWeapon = null, sourceRangeBand = "standard", sourceIsPsychic = false } = {}) {
      const rawDamage = Math.max(0, Number(damage ?? 0));
      const rawPenetration = Math.max(0, Number(penetration ?? 0));
      const armourBreakdown = this.getArmourBreakdownForLocation(location, { sourceWeapon, sourceRangeBand });
      const armour = armourBreakdown.totalArmour;
      const effectiveArmour = Math.max(0, armour - rawPenetration);
      const toughnessData = this.getEffectiveToughnessBonusForDamage({ sourceWeapon, sourceIsPsychic });
      const toughnessBonus = toughnessData.effectiveToughnessBonus;
      const mitigatedDamage = effectiveArmour + toughnessBonus;
      const appliedDamage = Math.max(0, rawDamage - mitigatedDamage);

      const currentWounds = Math.max(0, Number(this.system.resources?.wounds?.value ?? 0));
      const currentCriticalDamage = Math.max(0, Number(this.system.resources?.criticalDamage ?? 0));
      const newWounds = Math.max(0, currentWounds - appliedDamage);
      const criticalOverflow = Math.max(0, appliedDamage - currentWounds);
      const effectiveCriticalDamage = this.getCriticalDamageTaken(criticalOverflow);
      const newCriticalDamage = currentCriticalDamage + effectiveCriticalDamage;

      await this.update({
        "system.resources.wounds.value": newWounds,
        "system.resources.criticalDamage": newCriticalDamage
      });

      const criticalEffect = await this._applyCriticalEffect({
        damageType,
        location,
        sourceName,
        applied: {
          criticalOverflow,
          effectiveCriticalDamage,
          newCriticalDamage
        }
      });

      return {
        damageType,
        sourceName,
        location,
        rawDamage,
        penetration: rawPenetration,
        primitiveAttack: armourBreakdown.primitiveAttack,
        scatterAttack: armourBreakdown.scatterAttack,
        wornArmour: armourBreakdown.wornArmour,
        effectiveWornArmour: armourBreakdown.effectiveWornArmour,
        machineArmour: armourBreakdown.machineArmour,
        naturalArmour: armourBreakdown.naturalArmour,
        armour,
        effectiveArmour,
        daemonicProtection: toughnessData.hasDaemonic && !toughnessData.bypassesDaemonicProtection,
        baseToughnessBonus: toughnessData.baseToughnessBonus,
        toughnessBonus,
        mitigatedDamage,
        appliedDamage,
        currentWounds,
        newWounds,
        criticalOverflow,
        effectiveCriticalDamage,
        newCriticalDamage,
        criticalEffect
      };
    }

  getCharacteristicManualModifier(characteristicKey) {
    return Number(this.system.characteristics?.[characteristicKey]?.tempModifier ?? 0) || 0;
  }

  async applyDamageIgnoringArmour({ damage = 0, location = "Body", damageType = "", sourceName = "", sourceWeapon = null, sourceIsPsychic = false } = {}) {
    const rawDamage = Math.max(0, Number(damage ?? 0));
    const toughnessData = this.getEffectiveToughnessBonusForDamage({ sourceWeapon, sourceIsPsychic });
    const toughnessBonus = toughnessData.effectiveToughnessBonus;
    const appliedDamage = Math.max(0, rawDamage - toughnessBonus);

    const currentWounds = Math.max(0, Number(this.system.resources?.wounds?.value ?? 0));
    const currentCriticalDamage = Math.max(0, Number(this.system.resources?.criticalDamage ?? 0));
    const newWounds = Math.max(0, currentWounds - appliedDamage);
    const criticalOverflow = Math.max(0, appliedDamage - currentWounds);
    const effectiveCriticalDamage = this.getCriticalDamageTaken(criticalOverflow);
    const newCriticalDamage = currentCriticalDamage + effectiveCriticalDamage;

    await this.update({
      "system.resources.wounds.value": newWounds,
      "system.resources.criticalDamage": newCriticalDamage
    });

    const criticalEffect = await this._applyCriticalEffect({
      damageType,
      location,
      sourceName,
      applied: {
        criticalOverflow,
        effectiveCriticalDamage,
        newCriticalDamage
      }
    });

    return {
      damageType,
      sourceName,
      location,
      rawDamage,
      penetration: 0,
      armour: 0,
      effectiveArmour: 0,
      daemonicProtection: toughnessData.hasDaemonic && !toughnessData.bypassesDaemonicProtection,
      baseToughnessBonus: toughnessData.baseToughnessBonus,
      toughnessBonus,
      mitigatedDamage: toughnessBonus,
      appliedDamage,
      currentWounds,
      newWounds,
      criticalOverflow,
      effectiveCriticalDamage,
      newCriticalDamage,
      criticalEffect
    };
  }

  async applyDirectDamage({ damage = 0, location = "Body", damageType = "", sourceName = "" } = {}) {
    const rawDamage = Math.max(0, Number(damage ?? 0));
    const appliedDamage = rawDamage;

    const currentWounds = Math.max(0, Number(this.system.resources?.wounds?.value ?? 0));
    const currentCriticalDamage = Math.max(0, Number(this.system.resources?.criticalDamage ?? 0));
    const newWounds = Math.max(0, currentWounds - appliedDamage);
    const criticalOverflow = Math.max(0, appliedDamage - currentWounds);
    const effectiveCriticalDamage = this.getCriticalDamageTaken(criticalOverflow);
    const newCriticalDamage = currentCriticalDamage + effectiveCriticalDamage;

    await this.update({
      "system.resources.wounds.value": newWounds,
      "system.resources.criticalDamage": newCriticalDamage
    });

    const criticalEffect = await this._applyCriticalEffect({
      damageType,
      location,
      sourceName,
      applied: {
        criticalOverflow,
        effectiveCriticalDamage,
        newCriticalDamage
      }
    });

    return {
      damageType,
      sourceName,
      location,
      rawDamage,
      penetration: 0,
      armour: 0,
      effectiveArmour: 0,
      toughnessBonus: 0,
      mitigatedDamage: 0,
      appliedDamage,
      currentWounds,
      newWounds,
      criticalOverflow,
      effectiveCriticalDamage,
      newCriticalDamage,
      criticalEffect
    };
  }

  isOnFire() {
    return Boolean(this.statuses?.has?.(ON_FIRE_STATUS_ID) || this._getStatusEffectByStatusId(ON_FIRE_STATUS_ID));
  }

  isStunned() {
    return Boolean(this.statuses?.has?.(STUNNED_STATUS_ID) || this._getStatusEffectByStatusId(STUNNED_STATUS_ID));
  }

  isSnared() {
    return Boolean(this.statuses?.has?.(SNARED_STATUS_ID) || this._getStatusEffectByStatusId(SNARED_STATUS_ID));
  }

  isAfraid() {
    return Boolean(this.statuses?.has?.(FEAR_STATUS_ID) || this._getStatusEffectByStatusId(FEAR_STATUS_ID));
  }

  isPinned() {
    return Boolean(this.statuses?.has?.(PINNED_STATUS_ID) || this._getStatusEffectByStatusId(PINNED_STATUS_ID));
  }

  isBraced() {
    return Boolean(this.statuses?.has?.(BRACED_STATUS_ID) || this._getStatusEffectByStatusId(BRACED_STATUS_ID));
  }

  isFrenzied() {
    return Boolean(this.statuses?.has?.(FRENZIED_STATUS_ID) || this._getStatusEffectByStatusId(FRENZIED_STATUS_ID));
  }

  isCrippled() {
    return Boolean(this.statuses?.has?.(CRIPPLED_STATUS_ID) || this._getStatusEffectByStatusId(CRIPPLED_STATUS_ID));
  }

  isSensorsDamaged() {
    return Boolean(this.statuses?.has?.(SENSORS_DAMAGED_STATUS_ID) || this._getStatusEffectByStatusId(SENSORS_DAMAGED_STATUS_ID));
  }

  isThrustersDamaged() {
    return Boolean(this.statuses?.has?.(THRUSTERS_DAMAGED_STATUS_ID) || this._getStatusEffectByStatusId(THRUSTERS_DAMAGED_STATUS_ID));
  }

  isShipOnFire() {
    return Boolean(this.statuses?.has?.(SHIP_FIRE_STATUS_ID) || this._getStatusEffectByStatusId(SHIP_FIRE_STATUS_ID));
  }

  isEnginesCrippled() {
    return Boolean(this.statuses?.has?.(ENGINES_CRIPPLED_STATUS_ID) || this._getStatusEffectByStatusId(ENGINES_CRIPPLED_STATUS_ID));
  }

  getShipCrewPopulation() {
    if (this.type !== "ship") return 0;
    return Math.max(0, Number(this.system?.crew?.value ?? 0) || 0);
  }

  getShipCrewPopulationPercent() {
    if (this.type !== "ship") return 0;
    const current = this.getShipCrewPopulation();
    const maximum = Math.max(0, Number(this.system?.crew?.max ?? 0) || 0);
    if (maximum <= 0) return current;
    return Math.max(0, (current / maximum) * 100);
  }

  getShipMorale() {
    if (this.type !== "ship") return 0;
    return Math.max(0, Number(this.system?.resources?.morale?.value ?? 0) || 0);
  }

  getShipMoralePercent() {
    if (this.type !== "ship") return 0;
    const current = this.getShipMorale();
    const maximum = Math.max(0, Number(this.system?.resources?.morale?.max ?? 0) || 0);
    if (maximum <= 0) return current;
    return Math.max(0, (current / maximum) * 100);
  }

  hasShipCrewPopulationThreshold(threshold) {
    if (this.type !== "ship") return false;
    return this.getShipCrewPopulationPercent() <= Math.max(0, Number(threshold ?? 0) || 0);
  }

  hasShipMoraleThreshold(threshold) {
    if (this.type !== "ship") return false;
    return this.getShipMoralePercent() <= Math.max(0, Number(threshold ?? 0) || 0);
  }

  isCrewPopulationCombatCrippled() {
    if (this.type !== "ship") return false;
    return this.hasShipCrewPopulationThreshold(20);
  }

  shouldSkipCrewPopulationTurn(combat = null) {
    if (this.type !== "ship") return false;
    const activeCombat = combat ?? game.combat ?? null;
    if (!activeCombat?.started) return false;
    if (!this.isCrippled() || !this.hasShipCrewPopulationThreshold(20)) return false;
    const round = Math.max(0, Number(activeCombat.round ?? 0) || 0);
    return round % 2 === 1;
  }

  getShipCommandModifier() {
    if (this.type !== "ship") return 0;
    let modifier = 0;
    if (this.hasShipMoraleThreshold(80)) modifier -= 5;
    if (this.hasShipMoraleThreshold(50)) modifier -= 10;
    if (this.hasShipMoraleThreshold(10)) modifier -= 15;
    return modifier;
  }

  getShipCrewPopulationShootingModifier() {
    return 0;
  }

  getShipMoraleShootingModifier() {
    if (this.type !== "ship") return 0;
    let modifier = 0;
    if (this.hasShipMoraleThreshold(60)) modifier -= 5;
    if (this.hasShipMoraleThreshold(40)) modifier -= 5;
    return modifier;
  }

  getShipCrewPopulationSpeedModifier() {
    return 0;
  }

  getShipMoraleSpeedModifier() {
    if (this.type !== "ship") return 0;
    return this.hasShipMoraleThreshold(10) ? -10 : 0;
  }

  getShipCrewPopulationManeuverabilityModifier() {
    if (this.type !== "ship") return 0;
    return this.hasShipCrewPopulationThreshold(50) ? -10 : 0;
  }

  getShipMoraleManeuverabilityModifier() {
    if (this.type !== "ship") return 0;
    let modifier = 0;
    if (this.hasShipMoraleThreshold(40)) modifier -= 10;
    if (this.hasShipMoraleThreshold(10)) modifier -= 10;
    return modifier;
  }

  getShipCrewPopulationDetectionModifier() {
    return 0;
  }

  getShipMoraleDetectionModifier() {
    if (this.type !== "ship") return 0;
    return this.hasShipMoraleThreshold(10) ? -10 : 0;
  }

  isFatigued() {
    return Boolean(this.statuses?.has?.(FATIGUED_STATUS_ID) || this._getStatusEffectByStatusId(FATIGUED_STATUS_ID));
  }

  isProne() {
    return Boolean(this.statuses?.has?.(PRONE_STATUS_ID) || this._getStatusEffectByStatusId(PRONE_STATUS_ID));
  }

  getFatigueLevel() {
    return Math.max(0, Number(this.system?.resources?.fatigue ?? 0) || 0);
  }

  getFatigueThreshold() {
    return Math.max(1, Number(this.getCharacteristicBonus("toughness") ?? 0) || 0);
  }

  getFatigueTestModifier() {
    if (this.isFrenzied()) return 0;
    return this.getFatigueLevel() > 0 ? -10 : 0;
  }

  getFrenzyCharacteristicModifier(characteristicKey) {
    if (!this.isFrenzied()) return 0;

    switch (String(characteristicKey ?? "")) {
      case "weaponSkill":
      case "strength":
      case "toughness":
      case "willpower":
        return 10;
      case "ballisticSkill":
      case "intelligence":
        return -20;
      default:
        return 0;
    }
  }

  getCharacteristicConditionModifier(characteristicKey) {
    return this.getFrenzyCharacteristicModifier(characteristicKey);
  }

  getProneWeaponSkillModifier() {
    return this.isProne() ? -10 : 0;
  }

  getShipBaseSpeed() {
    const speedData = this.system?.speed;
    if (speedData && typeof speedData === "object") {
      return Math.max(0, (Number(speedData.permanent ?? 0) || 0) + (Number(speedData.temporary ?? 0) || 0));
    }
    return Math.max(0, Number(speedData ?? 0) || 0);
  }

  getShipBaseManeuverability() {
    const maneuverabilityData = this.system?.maneuverability;
    if (maneuverabilityData && typeof maneuverabilityData === "object") {
      return (Number(maneuverabilityData.permanent ?? 0) || 0) + (Number(maneuverabilityData.temporary ?? 0) || 0);
    }
    return Number(maneuverabilityData ?? 0) || 0;
  }

  getShipBaseDetection() {
    const detectionData = this.system?.detection;
    if (detectionData && typeof detectionData === "object") {
      return (Number(detectionData.permanent ?? 0) || 0) + (Number(detectionData.temporary ?? 0) || 0);
    }
    return Number(detectionData ?? 0) || 0;
  }

  getEffectiveShipSpeed() {
    const baseSpeed = this.getShipBaseSpeed();
    if (this.type !== "ship") return baseSpeed;
    let effectiveSpeed = baseSpeed + this.getShipCrewPopulationSpeedModifier() + this.getShipMoraleSpeedModifier();
    if (this.isCrippled() || this.isCrewPopulationCombatCrippled()) {
      effectiveSpeed = Math.max(0, Math.ceil(effectiveSpeed / 2));
    }
    if (this.isEnginesCrippled()) {
      if (Boolean(this.system?.conditions?.enginesCrippled?.speedReducedToOne)) {
        effectiveSpeed = 1;
      } else {
        effectiveSpeed = Math.max(0, Math.ceil(effectiveSpeed / 2));
      }
    }
    return Math.max(0, effectiveSpeed);
  }

  getEffectiveShipManeuverability() {
    const baseManeuverability = this.getShipBaseManeuverability();
    if (this.type !== "ship") return baseManeuverability;
    let effectiveManeuverability = baseManeuverability + this.getShipCrewPopulationManeuverabilityModifier() + this.getShipMoraleManeuverabilityModifier();
    if (this.isCrippled() || this.isCrewPopulationCombatCrippled()) effectiveManeuverability -= 10;
    if (this.isThrustersDamaged() && !this.isShipTurningDisabled()) effectiveManeuverability -= 20;
    return effectiveManeuverability;
  }

  getEffectiveShipDetection() {
    const baseDetection = this.getShipBaseDetection();
    if (this.type !== "ship") return baseDetection;
    let effectiveDetection = baseDetection + this.getShipCrewPopulationDetectionModifier() + this.getShipMoraleDetectionModifier();
    if (this.isCrippled() || this.isCrewPopulationCombatCrippled()) effectiveDetection -= 10;
    return effectiveDetection;
  }

  getShipShootingModifier() {
    if (this.type !== "ship") return 0;
    return (this.isSensorsDamaged() ? -30 : 0) + this.getShipCrewPopulationShootingModifier() + this.getShipMoraleShootingModifier();
  }

  isShipTurningDisabled() {
    if (this.type !== "ship") return false;
    return this.isThrustersDamaged() && Boolean(this.system?.conditions?.thrustersDamaged?.turningDisabled);
  }

  getEffectiveShipWeaponStrength(weaponRef) {
    const weapon = typeof weaponRef === "string" ? this.items.get(weaponRef) : weaponRef;
    const rawStrengthValue = String(weapon?.system?.strength ?? "").trim();
    const match = rawStrengthValue.match(/-?\d+/);
    if (!match) return {
      raw: rawStrengthValue,
      value: 0,
      effectiveValue: 0,
      label: rawStrengthValue
    };

    const rawValue = Math.max(0, Number(match[0]) || 0);
    const effectiveValue = this.type === "ship" && (this.isCrippled() || this.isCrewPopulationCombatCrippled())
      ? Math.max(0, Math.ceil(rawValue / 2))
      : rawValue;
    const label = this.type === "ship" && (this.isCrippled() || this.isCrewPopulationCombatCrippled()) && effectiveValue !== rawValue
      ? `${effectiveValue} (Reduced from ${rawValue})`
      : `${effectiveValue}`;

    return {
      raw: rawStrengthValue,
      value: rawValue,
      effectiveValue,
      label
    };
  }

  getCriticalDamageTaken(criticalOverflow) {
    const rawCritical = Math.max(0, Number(criticalOverflow ?? 0));
    if (!rawCritical) return 0;
    if (!actorHasTalentNamed(this, "True Grit")) return rawCritical;
    return Math.ceil(rawCritical / 2);
  }

  getWeaponMasterCategoryForWeapon(weaponRef) {
    const weapon = typeof weaponRef === "string" ? this.items.get(weaponRef) : weaponRef;
    const weaponClass = String(weapon?.system?.class ?? "").trim().toLowerCase();
    const validCategories = new Set(["basic", "melee", "pistol", "thrown", "heavy"]);
    return validCategories.has(weaponClass) ? weaponClass : "";
  }

  getWeaponMasterData(weaponRef) {
    const category = this.getWeaponMasterCategoryForWeapon(weaponRef);
    if (!category) {
      return {
        category: "",
        label: "",
        attackBonus: 0,
        damageBonus: 0
      };
    }

    const label = category.charAt(0).toUpperCase() + category.slice(1);
    const hasWeaponMaster = actorHasTalentNamed(this, `Weapon Master (${label})`)
      || actorHasArchMilitantWeaponMaster(this, category);
    return {
      category,
      label,
      attackBonus: hasWeaponMaster ? 10 : 0,
      damageBonus: hasWeaponMaster ? 2 : 0
    };
  }

  getChargeAttackModifier() {
    return actorHasTalentNamed(this, "Berserk Charge") ? 20 : 10;
  }

  _getFatigueAppliedUnconsciousEffect() {
    return this.effects.find((effect) => Boolean(effect?.getFlag?.("roguetrader", FATIGUE_UNCONSCIOUS_FLAG))) ?? null;
  }

  async applyDead({ sourceName = "Critical Damage" } = {}) {
    const defeatedStatusId = CONFIG.specialStatusEffects?.DEFEATED ?? "defeated";
    const preferredDeadStatusId = (CONFIG.statusEffects ?? []).some((effect) =>
      effect?.id === "dead" || effect?.statuses?.includes?.("dead")
    )
      ? "dead"
      : defeatedStatusId;

    const hasDeadStatus = Boolean(
      this.statuses?.has?.(preferredDeadStatusId)
      || this._getStatusEffectByStatusId(preferredDeadStatusId)
      || (preferredDeadStatusId !== defeatedStatusId
        && (this.statuses?.has?.(defeatedStatusId) || this._getStatusEffectByStatusId(defeatedStatusId)))
    );

    if (!hasDeadStatus) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Dead",
        img: "icons/svg/skull.svg",
        statuses: [preferredDeadStatusId]
      }]);
    }

    for (const combatant of game.combat?.combatants ?? []) {
      if (combatant?.actor?.uuid !== this.uuid) continue;
      if (combatant.defeated) continue;
      await combatant.update({ defeated: true });
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Dead</h3>
          <p><strong>Status Applied:</strong> Dead / Defeated</p>
          <p><strong>Source:</strong> ${sourceName}</p>
        </div>
      `
    });

    return true;
  }

  async applyOnFire({ sourceName = "Flame", cleansingFire = false } = {}) {
    if (this.isOnFire()) {
      if (cleansingFire && !Boolean(this.system?.conditions?.onFire?.cleansingFire)) {
        await this.update({
          "system.conditions.onFire.cleansingFire": true
        });
      }
      return false;
    }

    await this.createEmbeddedDocuments("ActiveEffect", [{
      name: "On Fire",
      img: "icons/svg/fire.svg",
      statuses: [ON_FIRE_STATUS_ID]
    }]);

    await this.update({
      "system.conditions.onFire.active": true,
      "system.conditions.onFire.source": String(sourceName ?? "Flame"),
      "system.conditions.onFire.cleansingFire": Boolean(cleansingFire),
      "system.conditions.onFire.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: On Fire</h3>
          <p><strong>Condition Applied:</strong> The target is on fire.</p>
          <p><strong>Source:</strong> ${sourceName}</p>
          ${cleansingFire ? "<p><strong>Cleansing Fire:</strong> Failed extinguish tests inflict an additional 1d10 Energy damage that ignores Armour and Toughness.</p>" : ""}
        </div>
      `
    });

    return true;
  }

  async clearOnFire({ announced = true } = {}) {
    if (!this.isOnFire()) return false;

    const effect = this._getStatusEffectByStatusId(ON_FIRE_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.onFire.active": false,
      "system.conditions.onFire.source": "",
      "system.conditions.onFire.cleansingFire": false,
      "system.conditions.onFire.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Flames Extinguished</h3>
            <p><strong>Condition Removed:</strong> The fire is out.</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyStunned(rounds = 1, { sourceName = "Shocking" } = {}) {
    if (this.isFrenzied()) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Stunned Ignored</h3>
            <p><strong>Immunity:</strong> Frenzied characters are immune to stunned.</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
      return false;
    }

    const appliedRounds = Math.max(1, Number(rounds ?? 1) || 1);
    const existingRounds = Math.max(0, Number(this.system?.conditions?.stunned?.roundsRemaining ?? 0) || 0);
    const newRounds = Math.max(existingRounds, appliedRounds);

    if (!this.isStunned()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Stunned",
        img: "icons/svg/daze.svg",
        statuses: [STUNNED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.stunned.active": true,
      "system.conditions.stunned.source": String(sourceName ?? "Shocking"),
      "system.conditions.stunned.roundsRemaining": newRounds,
      "system.conditions.stunned.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Stunned</h3>
          <p><strong>Condition Applied:</strong> The target is stunned.</p>
          <p><strong>Duration:</strong> ${newRounds} round${newRounds === 1 ? "" : "s"}</p>
          <p><strong>Source:</strong> ${sourceName}</p>
        </div>
      `
    });

    return true;
  }

  async clearStunned({ announced = true } = {}) {
    if (!this.isStunned()) return false;

    const effect = this._getStatusEffectByStatusId(STUNNED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.stunned.active": false,
      "system.conditions.stunned.source": "",
      "system.conditions.stunned.roundsRemaining": 0,
      "system.conditions.stunned.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Recovered</h3>
            <p><strong>Condition Removed:</strong> The target is no longer stunned.</p>
          </div>
        `
      });
    }

    return true;
  }

  async applySnared({ sourceName = "Snare" } = {}) {
    if (this.isSnared()) return false;

    await this.createEmbeddedDocuments("ActiveEffect", [{
      name: "Snared",
      img: "icons/svg/net.svg",
      statuses: [SNARED_STATUS_ID]
    }]);

    await this.update({
      "system.conditions.snared.active": true,
      "system.conditions.snared.source": String(sourceName ?? "Snare"),
      "system.conditions.snared.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Snared</h3>
          <p><strong>Condition Applied:</strong> The target is immobilised and counts as helpless until it escapes.</p>
          <p><strong>Source:</strong> ${sourceName}</p>
        </div>
      `
    });

    return true;
  }

  async clearSnared({ announced = true } = {}) {
    if (!this.isSnared()) return false;

    const effect = this._getStatusEffectByStatusId(SNARED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.snared.active": false,
      "system.conditions.snared.source": "",
      "system.conditions.snared.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Freed</h3>
            <p><strong>Condition Removed:</strong> The target is no longer snared.</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyFear({ sourceName = "Fear" } = {}) {
    if (!this.isAfraid()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Fear",
        img: "icons/svg/terror.svg",
        statuses: [FEAR_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.fear.active": true,
      "system.conditions.fear.source": String(sourceName ?? "Fear")
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card roguetrader-fear-card roguetrader-fear-card-resolution">
          <h3>${this.name}: Fear</h3>
          <p><strong>Condition Applied:</strong> The target is marked as afraid.</p>
          <p><strong>Source:</strong> ${sourceName || "Fear"}</p>
        </div>
      `
    });

    return true;
  }

  async clearFear({ announced = true } = {}) {
    if (!this.isAfraid()) return false;

    const effect = this._getStatusEffectByStatusId(FEAR_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.fear.active": false,
      "system.conditions.fear.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card roguetrader-fear-card roguetrader-fear-card-resolution">
            <h3>${this.name}: Fear</h3>
            <p><strong>Condition Removed:</strong> The target is no longer marked as afraid.</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyCrippled({ sourceName = "Hull Integrity Reduced to 0", announced = true } = {}) {
    if (this.type !== "ship") return false;

    if (!this.isCrippled()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Crippled",
        img: "modules/game-icons-net/whitetransparent/ship-wreck.svg",
        statuses: [CRIPPLED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.crippled.active": true,
      "system.conditions.crippled.source": String(sourceName ?? "Hull Integrity Reduced to 0")
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Crippled</h3>
            <p><strong>Status Applied:</strong> The ship is crippled.</p>
            <p><strong>Effects:</strong> Speed halved, Manoeuvrability -10, Detection -10, and weapon Strength halved (round up).</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return true;
  }

  async clearCrippled({ announced = false } = {}) {
    if (this.type !== "ship") return false;
    if (!this.isCrippled()) return false;

    const effect = this._getStatusEffectByStatusId(CRIPPLED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.crippled.active": false,
      "system.conditions.crippled.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Crippled Cleared</h3>
            <p><strong>Status Removed:</strong> The ship is no longer crippled.</p>
          </div>
        `
      });
    }

    return true;
  }

  async syncCrippledState({ announced = true, sourceName = "Hull Integrity Reduced to 0" } = {}) {
    if (this.type !== "ship") return false;
    const currentHullIntegrity = Math.max(0, Number(this.system?.resources?.hullIntegrity?.value ?? 0) || 0);
    if (currentHullIntegrity <= 0) {
      await this.applyCrippled({ sourceName, announced });
      return true;
    }

    await this.clearCrippled({ announced: false });
    return false;
  }

  async applySensorsDamaged({ sourceName = "Starship Critical Hit", announced = true } = {}) {
    if (this.type !== "ship") return false;

    if (!this.isSensorsDamaged()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Sensors Damaged",
        img: "icons/svg/blind.svg",
        statuses: [SENSORS_DAMAGED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.sensorsDamaged.active": true,
      "system.conditions.sensorsDamaged.source": String(sourceName ?? "Starship Critical Hit")
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Sensors Damaged</h3>
            <p><strong>Status Applied:</strong> Sensors Damaged</p>
            <p><strong>Effects:</strong> -30 to all shooting tests, and all sensor sweep attempts fail automatically.</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return true;
  }

  async clearSensorsDamaged({ announced = false } = {}) {
    if (this.type !== "ship") return false;
    if (!this.isSensorsDamaged()) return false;

    const effect = this._getStatusEffectByStatusId(SENSORS_DAMAGED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.sensorsDamaged.active": false,
      "system.conditions.sensorsDamaged.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Sensors Repaired</h3>
            <p><strong>Status Removed:</strong> Sensors Damaged</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyThrustersDamaged({ sourceName = "Starship Critical Hit", severityRoll = null, announced = true } = {}) {
    if (this.type !== "ship") return false;

    const roll = severityRoll instanceof Roll
      ? severityRoll
      : await (new Roll("1d10")).evaluate({ async: true });
    const rollTotal = Math.max(1, Number(roll.total ?? 0) || 1);
    const turningDisabled = rollTotal >= 8;
    const maneuverPenalty = turningDisabled ? 0 : -20;

    if (!this.isThrustersDamaged()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Thrusters Damaged",
        img: "modules/game-icons-net/whitetransparent/boat-propeller.svg",
        statuses: [THRUSTERS_DAMAGED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.thrustersDamaged.active": true,
      "system.conditions.thrustersDamaged.source": String(sourceName ?? "Starship Critical Hit"),
      "system.conditions.thrustersDamaged.rollTotal": rollTotal,
      "system.conditions.thrustersDamaged.turningDisabled": turningDisabled,
      "system.conditions.thrustersDamaged.maneuverPenalty": maneuverPenalty
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Thrusters Damaged</h3>
            <p><strong>Status Applied:</strong> Thrusters Damaged</p>
            <p><strong>Roll:</strong> ${roll.formula} = ${rollTotal}</p>
            <p><strong>Effect:</strong> ${turningDisabled ? "Thrusters completely damaged; the ship cannot turn." : "Manoeuvrability reduced by -20."}</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return {
      roll,
      rollTotal,
      turningDisabled,
      maneuverPenalty
    };
  }

  async clearThrustersDamaged({ announced = false } = {}) {
    if (this.type !== "ship") return false;
    if (!this.isThrustersDamaged()) return false;

    const effect = this._getStatusEffectByStatusId(THRUSTERS_DAMAGED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.thrustersDamaged.active": false,
      "system.conditions.thrustersDamaged.source": "",
      "system.conditions.thrustersDamaged.rollTotal": 0,
      "system.conditions.thrustersDamaged.turningDisabled": false,
      "system.conditions.thrustersDamaged.maneuverPenalty": 0
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Thrusters Repaired</h3>
            <p><strong>Status Removed:</strong> Thrusters Damaged</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyShipFire({ sourceName = "Starship Critical Hit", announced = true } = {}) {
    if (this.type !== "ship") return false;

    const crewRoll = await (new Roll("1d5")).evaluate({ async: true });
    const moraleRoll = await (new Roll("1d10")).evaluate({ async: true });
    const crewDamage = Math.max(0, Number(crewRoll.total ?? 0) || 0);
    const moraleDamage = Math.max(0, Number(moraleRoll.total ?? 0) || 0);
    const currentCrew = Math.max(0, Number(this.system?.crew?.value ?? 0) || 0);
    const currentMorale = Math.max(0, Number(this.system?.resources?.morale?.value ?? 0) || 0);
    const newCrew = Math.max(0, currentCrew - crewDamage);
    const newMorale = Math.max(0, currentMorale - moraleDamage);

    if (!this.isShipOnFire()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Fire!",
        img: "icons/svg/fire.svg",
        statuses: [SHIP_FIRE_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.shipFire.active": true,
      "system.conditions.shipFire.source": String(sourceName ?? "Starship Critical Hit"),
      "system.crew.value": newCrew,
      "system.resources.morale.value": newMorale
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Fire!</h3>
            <p><strong>Status Applied:</strong> Shipboard Fire</p>
            <p><strong>Immediate Crew Damage:</strong> ${crewRoll.formula} = ${crewDamage} (${currentCrew} -> ${newCrew})</p>
            <p><strong>Immediate Morale Damage:</strong> ${moraleRoll.formula} = ${moraleDamage} (${currentMorale} -> ${newMorale})</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return {
      crewRoll,
      moraleRoll,
      crewDamage,
      moraleDamage,
      currentCrew,
      newCrew,
      currentMorale,
      newMorale
    };
  }

  async clearShipFire({ announced = false } = {}) {
    if (this.type !== "ship") return false;
    if (!this.isShipOnFire()) return false;

    const effect = this._getStatusEffectByStatusId(SHIP_FIRE_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.shipFire.active": false,
      "system.conditions.shipFire.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Fire Contained</h3>
            <p><strong>Status Removed:</strong> Shipboard Fire</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyEnginesCrippled({ sourceName = "Starship Critical Hit", severityRoll = null, announced = true } = {}) {
    if (this.type !== "ship") return false;

    const roll = severityRoll instanceof Roll
      ? severityRoll
      : await (new Roll("1d10")).evaluate({ async: true });
    const rollTotal = Math.max(1, Number(roll.total ?? 0) || 1);
    const speedReducedToOne = rollTotal >= 8;
    const speedHalved = !speedReducedToOne;

    if (!this.isEnginesCrippled()) {
      await this.createEmbeddedDocuments("ActiveEffect", [({
        name: "Engines Crippled",
        img: "modules/game-icons-net/whitetransparent/boat-engine.svg",
        statuses: [ENGINES_CRIPPLED_STATUS_ID]
      })]);
    }

    await this.update({
      "system.conditions.enginesCrippled.active": true,
      "system.conditions.enginesCrippled.source": String(sourceName ?? "Starship Critical Hit"),
      "system.conditions.enginesCrippled.rollTotal": rollTotal,
      "system.conditions.enginesCrippled.speedHalved": speedHalved,
      "system.conditions.enginesCrippled.speedReducedToOne": speedReducedToOne
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Engines Crippled</h3>
            <p><strong>Status Applied:</strong> Engines Crippled</p>
            <p><strong>Roll:</strong> ${roll.formula} = ${rollTotal}</p>
            <p><strong>Effect:</strong> ${speedReducedToOne ? "Drives totally wrecked; Speed reduced to 1." : "Speed reduced by half."}</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return {
      roll,
      rollTotal,
      speedHalved,
      speedReducedToOne
    };
  }

  async clearEnginesCrippled({ announced = false } = {}) {
    if (this.type !== "ship") return false;
    if (!this.isEnginesCrippled()) return false;

    const effect = this._getStatusEffectByStatusId(ENGINES_CRIPPLED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.enginesCrippled.active": false,
      "system.conditions.enginesCrippled.source": "",
      "system.conditions.enginesCrippled.rollTotal": 0,
      "system.conditions.enginesCrippled.speedHalved": false,
      "system.conditions.enginesCrippled.speedReducedToOne": false
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Engines Repaired</h3>
            <p><strong>Status Removed:</strong> Engines Crippled</p>
          </div>
        `
      });
    }

    return true;
  }

  async syncCrewPopulationStatusEffects() {
    if (this.type !== "ship") return false;

    for (const entry of SHIP_CREW_POPULATION_THRESHOLDS) {
      const shouldBeActive = this.hasShipCrewPopulationThreshold(entry.threshold);
      const existingEffect = this._getStatusEffectByStatusId(entry.statusId);

      if (shouldBeActive && !existingEffect) {
        await this.createEmbeddedDocuments("ActiveEffect", [{
          name: entry.name,
          img: entry.img,
          statuses: [entry.statusId],
          flags: {
            roguetrader: {
              derivedCrewPopulationStatus: true,
              threshold: entry.threshold
            }
          }
        }]);
      } else if (!shouldBeActive && existingEffect) {
        await existingEffect.delete();
      }
    }

    return true;
  }

  async syncMoraleStatusEffects() {
    if (this.type !== "ship") return false;

    for (const entry of SHIP_MORALE_THRESHOLDS) {
      const shouldBeActive = this.hasShipMoraleThreshold(entry.threshold);
      const existingEffect = this._getStatusEffectByStatusId(entry.statusId);

      if (shouldBeActive && !existingEffect) {
        await this.createEmbeddedDocuments("ActiveEffect", [{
          name: entry.name,
          img: entry.img,
          statuses: [entry.statusId],
          flags: {
            roguetrader: {
              derivedMoraleStatus: true,
              threshold: entry.threshold
            }
          }
        }]);
      } else if (!shouldBeActive && existingEffect) {
        await existingEffect.delete();
      }
    }

    return true;
  }

  async applyPinned({ sourceName = "Suppressive Fire" } = {}) {
    if (!this.isPinned()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Pinned",
        img: "icons/svg/anchor.svg",
        statuses: [PINNED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.pinned.active": true,
      "system.conditions.pinned.source": String(sourceName ?? "Suppressive Fire"),
      "system.conditions.pinned.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Pinned</h3>
          <p><strong>Condition Applied:</strong> The target is pinned.</p>
          <p><strong>Effect:</strong> Only Half Actions; -20 to Ballistic Skill Tests; must seek or remain in cover.</p>
          <p><strong>Source:</strong> ${sourceName}</p>
        </div>
      `
    });

    return true;
  }

  async clearPinned({ announced = true } = {}) {
    if (!this.isPinned()) return false;

    const effect = this._getStatusEffectByStatusId(PINNED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.pinned.active": false,
      "system.conditions.pinned.source": "",
      "system.conditions.pinned.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Recovered</h3>
            <p><strong>Condition Removed:</strong> The target is no longer pinned.</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyFatigued({ sourceName = "Fatigue", announced = false } = {}) {
    if (!this.isFatigued()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Fatigued",
        img: "icons/svg/daze.svg",
        statuses: [FATIGUED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.fatigued.active": true,
      "system.conditions.fatigued.source": String(sourceName ?? "Fatigue")
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Fatigued</h3>
            <p><strong>Condition Applied:</strong> The target is fatigued.</p>
            <p><strong>Effect:</strong> -10 to all tests.</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyFrenzied({ sourceName = "Frenzy", announced = false } = {}) {
    if (!this.isFrenzied()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Frenzied",
        img: "icons/svg/blood.svg",
        statuses: [FRENZIED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.frenzied.active": true,
      "system.conditions.frenzied.source": String(sourceName ?? "Frenzy")
    });

    await this.clearFear({ announced: false });
    await this.clearPinned({ announced: false });
    await this.clearStunned({ announced: false });
    await this.syncFatigueStates({ sourceName, announced: false });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Frenzied</h3>
            <p><strong>Condition Applied:</strong> The target is frenzied.</p>
            <p><strong>Effects:</strong> +10 WS, S, T, WP; -20 BS and Int; immune to fear, pinning, stunned, and fatigue effects; cannot parry; must use All Out Attack.</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return true;
  }

  async clearFrenzied({ announced = false } = {}) {
    if (!this.isFrenzied()) return false;

    const effect = this._getStatusEffectByStatusId(FRENZIED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.frenzied.active": false,
      "system.conditions.frenzied.source": ""
    });

    await this.syncFatigueStates({ sourceName: "Fatigue", announced: false });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Recovered</h3>
            <p><strong>Condition Removed:</strong> The target is no longer frenzied.</p>
          </div>
        `
      });
    }

    return true;
  }

  async clearFatigued({ announced = false } = {}) {
    if (!this.isFatigued()) return false;

    const effect = this._getStatusEffectByStatusId(FATIGUED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.fatigued.active": false,
      "system.conditions.fatigued.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Recovered</h3>
            <p><strong>Condition Removed:</strong> The target is no longer fatigued.</p>
          </div>
        `
      });
    }

    return true;
  }

  async applyProne({ sourceName = "Prone", announced = false } = {}) {
    if (!this.isProne()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Prone",
        img: "icons/svg/falling.svg",
        statuses: [PRONE_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.prone.active": true,
      "system.conditions.prone.source": String(sourceName ?? "Prone")
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Prone</h3>
            <p><strong>Condition Applied:</strong> The target is prone.</p>
            <p><strong>Effects:</strong> -10 WS tests, -20 Dodge tests, +10 to be hit in melee, -10 to be hit with ranged attacks outside Point Blank.</p>
            <p><strong>Source:</strong> ${sourceName}</p>
          </div>
        `
      });
    }

    return true;
  }

  async clearProne({ announced = false } = {}) {
    if (!this.isProne()) return false;

    const effect = this._getStatusEffectByStatusId(PRONE_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.prone.active": false,
      "system.conditions.prone.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Recovered</h3>
            <p><strong>Condition Removed:</strong> The target is no longer prone.</p>
          </div>
        `
      });
    }

    return true;
  }

  async syncFatigueStates({ sourceName = "Fatigue", announced = false } = {}) {
    const fatigue = this.getFatigueLevel();
    const threshold = this.getFatigueThreshold();
    const shouldBeFatigued = fatigue > 0;
    const shouldBeUnconscious = !this.isFrenzied() && fatigue > threshold;

    if (shouldBeFatigued) {
      await this.applyFatigued({ sourceName, announced });
    } else {
      await this.clearFatigued({ announced });
    }

    const fatigueUnconsciousEffect = this._getFatigueAppliedUnconsciousEffect();
    if (shouldBeUnconscious && !fatigueUnconsciousEffect) {
      const unconsciousStatusId = getUnconsciousStatusId();
      const configuredEffect = getConfiguredStatusEffectByStatus("unconscious");
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: configuredEffect?.name ?? "Unconscious",
        img: configuredEffect?.img ?? "icons/svg/sleep.svg",
        statuses: [unconsciousStatusId],
        flags: {
          roguetrader: {
            [FATIGUE_UNCONSCIOUS_FLAG]: true
          }
        }
      }]);

      if (announced) {
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: `
            <div class="roguetrader-roll-card">
              <h3>${this.name}: Unconscious</h3>
              <p><strong>Status Applied:</strong> The target collapses from exhaustion.</p>
              <p><strong>Fatigue:</strong> ${fatigue} exceeds Toughness Bonus ${threshold}.</p>
            </div>
          `
        });
      }
    }

    if (!shouldBeUnconscious && fatigueUnconsciousEffect) {
      await fatigueUnconsciousEffect.delete();
    }

    return {
      fatigue,
      threshold,
      fatigued: shouldBeFatigued,
      unconscious: shouldBeUnconscious
    };
  }

  async applyBraced({ sourceName = "Heavy Weapon Bracing" } = {}) {
    if (!this.isBraced()) {
      await this.createEmbeddedDocuments("ActiveEffect", [{
        name: "Braced",
        img: "icons/svg/anchor.svg",
        statuses: [BRACED_STATUS_ID]
      }]);
    }

    await this.update({
      "system.conditions.braced.active": true,
      "system.conditions.braced.source": String(sourceName ?? "Heavy Weapon Bracing")
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Braced</h3>
          <p><strong>Condition Applied:</strong> The target is braced for heavy weapon fire.</p>
          <p><strong>Source:</strong> ${sourceName}</p>
        </div>
      `
    });

    return true;
  }

  async clearBraced({ announced = true } = {}) {
    if (!this.isBraced()) return false;

    const effect = this._getStatusEffectByStatusId(BRACED_STATUS_ID);
    if (effect) {
      await effect.delete();
    }

    await this.update({
      "system.conditions.braced.active": false,
      "system.conditions.braced.source": ""
    });

    if (announced) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Bracing Removed</h3>
            <p><strong>Condition Removed:</strong> The target is no longer braced.</p>
          </div>
        `
      });
    }

    return true;
  }

  async toggleBraced({ sourceName = "Heavy Weapon Bracing" } = {}) {
    if (this.isAlwaysBracedForHeavyWeapons()) {
      ui.notifications?.info("Rogue Trader | This actor already counts as braced for heavy weapons.");
      return this.isBraced();
    }

    if (this.isBraced()) {
      return this.clearBraced();
    }

    return this.applyBraced({ sourceName });
  }

  async resolvePinningTest({ sourceActor = null, sourceName = "" } = {}) {
    const sourceLabel = sourceName || sourceActor?.name || "Suppressive Fire";

    if (this.isImmuneToPinning()) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Pinning Test</h3>
            <p><strong>Source:</strong> ${sourceLabel}</p>
            <p><strong>Outcome:</strong> Immune to Pinning.</p>
          </div>
        `
      });
      return { immune: true, success: true };
    }

    if (this.getAdjacentHostileTokens().length > 0) {
      await this.clearPinned({ announced: false });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Pinning Test</h3>
            <p><strong>Source:</strong> ${sourceLabel}</p>
            <p><strong>Outcome:</strong> Engaged in melee and automatically escapes Pinning.</p>
          </div>
        `
      });
      return { immune: false, success: true, autoEscaped: true };
    }

    const result = await this.rollCharacteristic("willpower", {
      label: `${this.name}: Pinning Test`,
      modifier: 0,
      extra: [
        `Source: ${sourceLabel}`,
        "Failure: Gain the Pinned condition"
      ],
      createMessage: false
    });

    if (!result?.success) {
      await this.applyPinned({ sourceName: sourceLabel });
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Pinning Test</h3>
          <p><strong>Source:</strong> ${sourceLabel}</p>
          <p><strong>Willpower Test:</strong> ${result?.rollTotal ?? "?"} vs ${result?.finalTarget ?? "?"} (${result?.outcome ?? "Unknown"})</p>
          <p><strong>Outcome:</strong> ${result?.success ? "Held firm." : "Pinned."}</p>
        </div>
      `
    });

    return {
      immune: false,
      success: Boolean(result?.success),
      result
    };
  }

  async attemptEscapeSnare(method = "agility") {
    if (!this.isSnared()) return null;

    const useStrength = String(method ?? "agility").trim().toLowerCase() === "strength";
    const characteristicKey = useStrength ? "strength" : "agility";
    const result = await this.rollCharacteristic(characteristicKey, {
      label: `${this.name}: Escape Snare`,
      modifier: 0,
      extra: [
        `Method: ${useStrength ? "Burst Bonds (Strength)" : "Wriggle Free (Agility)"}`,
        "Success: Escape the snare"
      ]
    });

    if (result?.success) {
      await this.clearSnared();
    }

    return result;
  }

  async spendFateToClearStunned() {
    if (!this.isStunned()) return null;

    const spent = await this.spendFate(1);
    if (!spent) {
      ui.notifications?.warn("Rogue Trader | No fate points remaining.");
      return null;
    }

    await this.clearStunned({ announced: false });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Fate Spent</h3>
          <p><strong>Effect:</strong> Spent 1 Fate Point to remove the Stunned condition.</p>
        </div>
      `
    });

    return true;
  }

  async checkIgniteFromFlameHit({ weapon = null, appliedDamage = 0, hitLanded = false } = {}) {
    const cleansingFire = isCleansingFireWeapon(weapon);
    const shouldTest = cleansingFire
      ? Boolean(hitLanded)
      : Number(appliedDamage ?? 0) > 0;

    if (!shouldTest) return null;

    const usesWillpower = cleansingFire;
    const characteristicKey = usesWillpower ? "willpower" : "agility";
    const characteristicLabel = usesWillpower ? "Willpower" : "Agility";
    const result = await this.rollCharacteristic(characteristicKey, {
      label: `${this.name}: Avoid Catching Fire`,
      modifier: 0,
      extra: [
        `Source: ${weapon?.name ?? "Flame Weapon"}`,
        `Test: Challenging (+0) ${characteristicLabel}`,
        "Failure: Gain the On Fire condition"
      ]
    });

    if (!result?.success) {
      await this.applyOnFire({
        sourceName: weapon?.name ?? "Flame Weapon",
        cleansingFire
      });
    }

    return result;
  }

  async attemptExtinguishFire() {
    if (!this.isOnFire()) return null;

    const result = await this.rollCharacteristic("agility", {
      label: `${this.name}: Extinguish Flames`,
      modifier: -20,
      extra: [
        "Action: Drop prone and attempt to extinguish the flames",
        "Test: Hard (-20) Agility"
      ]
    });

    if (result?.success) {
      await this.clearOnFire();
    } else if (Boolean(this.system?.conditions?.onFire?.cleansingFire)) {
      const cleansingDamageRoll = await (new Roll("1d10")).evaluate({ async: true });
      const applied = await this.applyDirectDamage({
        damage: Number(cleansingDamageRoll.total ?? 0),
        location: "Body",
        damageType: "E",
        sourceName: "Cleansing Fire"
      });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Cleansing Fire</h3>
            <p><strong>Trigger:</strong> Failed extinguish test.</p>
            <p><strong>Damage:</strong> ${Number(cleansingDamageRoll.total ?? 0)} E</p>
            <p><strong>After Soak:</strong> ${Number(applied?.appliedDamage ?? 0)} (ignores Armour and Toughness)</p>
          </div>
        `
      });
    }

    return result;
  }

  async handleStunnedTurnStart(combat = null) {
    if (!this.isStunned()) return null;

    const combatId = String(combat?.id ?? "");
    const round = Number(combat?.round ?? 0);
    const turn = Number(combat?.turn ?? 0);
    const lastProcessed = this.system?.conditions?.stunned?.lastProcessed ?? {};
    const alreadyProcessed = String(lastProcessed.combatId ?? "") === combatId
      && Number(lastProcessed.round ?? -1) === round
      && Number(lastProcessed.turn ?? -1) === turn;
    if (alreadyProcessed) return null;

    const roundsRemaining = Math.max(1, Number(this.system?.conditions?.stunned?.roundsRemaining ?? 1) || 1);
    await this.update({
      "system.conditions.stunned.lastProcessed": {
        combatId,
        round,
        turn
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Stunned</h3>
          <p><strong>Effect:</strong> The target is stunned and can take no actions this turn.</p>
          <p><strong>Rounds Remaining:</strong> ${roundsRemaining}</p>
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-clear-stunned-fate="true" data-rt-stunned-actor-uuid="${this.uuid}">Spend Fate to Recover</button>
          </div>
        </div>
      `
    });

    if (roundsRemaining <= 1) {
      await this.clearStunned({ announced: true });
      return { roundsRemaining: 0, cleared: true };
    }

    await this.update({
      "system.conditions.stunned.roundsRemaining": roundsRemaining - 1
    });

    return { roundsRemaining: roundsRemaining - 1, cleared: false };
  }

  async handleSnaredTurnStart(combat = null) {
    if (!this.isSnared()) return null;

    const combatId = String(combat?.id ?? "");
    const round = Number(combat?.round ?? 0);
    const turn = Number(combat?.turn ?? 0);
    const lastProcessed = this.system?.conditions?.snared?.lastProcessed ?? {};
    const alreadyProcessed = String(lastProcessed.combatId ?? "") === combatId
      && Number(lastProcessed.round ?? -1) === round
      && Number(lastProcessed.turn ?? -1) === turn;
    if (alreadyProcessed) return null;

    await this.update({
      "system.conditions.snared.lastProcessed": {
        combatId,
        round,
        turn
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Snared</h3>
          <p><strong>Effect:</strong> The target is immobilised and counts as helpless until it escapes.</p>
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-escape-snare="agility" data-rt-snared-actor-uuid="${this.uuid}">Wriggle Free</button>
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-escape-snare="strength" data-rt-snared-actor-uuid="${this.uuid}">Burst Bonds</button>
          </div>
        </div>
      `
    });

    return true;
  }

  async handlePinnedTurnStart(combat = null) {
    if (!this.isPinned()) return null;

    if (this.getAdjacentHostileTokens().length > 0) {
      await this.clearPinned({ announced: true });
      return { autoCleared: true };
    }

    const combatId = String(combat?.id ?? "");
    const round = Number(combat?.round ?? 0);
    const turn = Number(combat?.turn ?? 0);
    const lastProcessed = this.system?.conditions?.pinned?.lastProcessed ?? {};
    const alreadyProcessed = String(lastProcessed.combatId ?? "") === combatId
      && Number(lastProcessed.round ?? -1) === round
      && Number(lastProcessed.turn ?? -1) === turn;
    if (alreadyProcessed) return null;

    await this.update({
      "system.conditions.pinned.lastProcessed": {
        combatId,
        round,
        turn
      }
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Pinned</h3>
          <p><strong>Effect:</strong> Only Half Actions this turn and -20 to Ballistic Skill Tests.</p>
          <p><strong>Reminder:</strong> A pinned character should seek cover, remain in cover, or retreat while staying in cover.</p>
        </div>
      `
    });

    return true;
  }

  async handleRegenerationTurnStart(combat = null) {
    if (!this.hasTrait("regeneration")) return null;
    if (this.statuses?.has?.("dead") || this.statuses?.has?.(CONFIG.specialStatusEffects?.DEFEATED ?? "defeated")) return null;

    const combatId = String(combat?.id ?? "");
    const round = Number(combat?.round ?? 0);
    const turn = Number(combat?.turn ?? 0);
    const lastProcessed = this.getFlag("roguetrader", "regenerationLastProcessed") ?? {};
    const alreadyProcessed = String(lastProcessed.combatId ?? "") === combatId
      && Number(lastProcessed.round ?? -1) === round
      && Number(lastProcessed.turn ?? -1) === turn;
    if (alreadyProcessed) return null;

    await this.setFlag("roguetrader", "regenerationLastProcessed", {
      combatId,
      round,
      turn
    });

    const currentCriticalDamage = Math.max(0, Number(this.system.resources?.criticalDamage ?? 0));
    const currentWounds = Math.max(0, Number(this.system.resources?.wounds?.value ?? 0));
    const maxWounds = Math.max(0, Number(this.getEffectiveWoundsMax?.() ?? this.system.resources?.wounds?.max ?? 0));
    if (currentCriticalDamage <= 0 && currentWounds >= maxWounds) return null;

    const result = await this.rollCharacteristic("toughness", {
      label: `${this.name}: Regeneration`,
      modifier: 0,
      extra: [
        `Critical Damage: ${currentCriticalDamage}`,
        `Wounds: ${currentWounds}/${maxWounds}`,
        "Success: Remove 1 point of damage"
      ]
    });

    if (!result?.success) return result;

    const newCriticalDamage = Math.max(0, currentCriticalDamage - 1);
    const healedCritical = currentCriticalDamage > 0 ? 1 : 0;
    const healedWounds = healedCritical ? 0 : (currentWounds < maxWounds ? 1 : 0);
    const newWounds = Math.min(maxWounds, currentWounds + healedWounds);

    await this.update({
      "system.resources.criticalDamage": newCriticalDamage,
      "system.resources.wounds.value": newWounds
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Regeneration</h3>
          <p><strong>Effect:</strong> Regeneration restores 1 point of damage.</p>
          ${healedCritical ? `<p><strong>Critical Damage:</strong> ${currentCriticalDamage} -> ${newCriticalDamage}</p>` : ""}
          ${healedWounds ? `<p><strong>Wounds:</strong> ${currentWounds} -> ${newWounds}</p>` : ""}
        </div>
      `
    });

    return {
      ...result,
      healedCritical,
      healedWounds,
      newCriticalDamage,
      newWounds
    };
  }

  async checkShockingEffect({ weapon = null, applied = null, location = "Body" } = {}) {
    if (!isShockingWeapon(weapon)) return null;
    if (!applied || Number(applied.appliedDamage ?? 0) <= 0) return null;

    const armourBonus = Math.max(0, Number(applied.armour ?? 0)) * 10;
    const rounds = Math.max(1, Math.floor(Number(applied.appliedDamage ?? 0) / 2));
    const result = await this.rollCharacteristic("toughness", {
      label: `${this.name}: Resist Shocking`,
      modifier: armourBonus,
      extra: [
        `Source: ${weapon?.name ?? "Shocking Weapon"}`,
        `Location: ${location}`,
        `Armour Bonus: +${armourBonus}`,
        `Failure: Stunned for ${rounds} round${rounds === 1 ? "" : "s"}`
      ]
    });

    if (!result?.success) {
      await this.applyStunned(rounds, { sourceName: weapon?.name ?? "Shocking Weapon" });
    }

    return result;
  }

  async checkSnareEffect({ weapon = null } = {}) {
    if (!isSnareWeapon(weapon)) return null;

    const result = await this.rollCharacteristic("agility", {
      label: `${this.name}: Resist Snare`,
      modifier: 0,
      extra: [
        `Source: ${weapon?.name ?? "Snare Weapon"}`,
        "Failure: Become immobilised and helpless until escape"
      ]
    });

    if (!result?.success) {
      await this.applySnared({ sourceName: weapon?.name ?? "Snare Weapon" });
    }

    return result;
  }

  async checkToxicEffect({ weapon = null, applied = null, location = "Body" } = {}) {
    if (!isToxicWeapon(weapon)) return null;
    if (!applied || Number(applied.appliedDamage ?? 0) <= 0) return null;

    const penalty = -5 * Math.max(0, Number(applied.appliedDamage ?? 0));
    const result = await this.rollCharacteristic("toughness", {
      label: `${this.name}: Resist Toxic`,
      modifier: penalty,
      extra: [
        `Source: ${weapon?.name ?? "Toxic Weapon"}`,
        `Location: ${location}`,
        `Penalty: ${penalty}`,
        "Failure: Suffer 1d10 Impact Damage with no Armour or Toughness reduction"
      ]
    });

    if (result?.success) return result;

    const toxicRoll = await (new Roll("1d10")).evaluate({ async: true });
    const toxicDamage = Number(toxicRoll.total ?? 0);
    const appliedToxic = await this.applyDirectDamage({
      damage: toxicDamage,
      location,
      damageType: "I",
      sourceName: `${weapon?.name ?? "Toxic Weapon"} Toxic`
    });

    await toxicRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Toxic Damage</h3>
          <p><strong>Source:</strong> ${weapon?.name ?? "Toxic Weapon"}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Damage:</strong> ${toxicDamage} Impact</p>
          <p><strong>After Soak:</strong> ${appliedToxic.appliedDamage} (no Armour or Toughness reduction)</p>
        </div>
      `
    });

    return {
      result,
      toxicRoll,
      applied: appliedToxic
    };
  }

  async handleOnFireTurnStart(combat = null) {
    if (!this.isOnFire()) return null;

    const combatId = String(combat?.id ?? "");
    const round = Number(combat?.round ?? 0);
    const turn = Number(combat?.turn ?? 0);
    const lastProcessed = this.system?.conditions?.onFire?.lastProcessed ?? {};
    const alreadyProcessed = String(lastProcessed.combatId ?? "") === combatId
      && Number(lastProcessed.round ?? -1) === round
      && Number(lastProcessed.turn ?? -1) === turn;
    if (alreadyProcessed) return null;

    await this.update({
      "system.conditions.onFire.lastProcessed": {
        combatId,
        round,
        turn
      }
    });

    const willpowerResult = await this.rollCharacteristic("willpower", {
      label: `${this.name}: Act While On Fire`,
      modifier: 0,
      extra: [
        "Test: Challenging (+0) Willpower",
        "Failure: The character runs around and screams, counting as a Full Action"
      ]
    });

    const damageRoll = await (new Roll("1d10")).evaluate({ async: true });
    const machineProtectedFromFire = this.hasTrait("machine");
    const applied = machineProtectedFromFire
      ? await this.applyDamageToLocation({
        damage: Number(damageRoll.total ?? 0),
        penetration: 0,
        location: "Body",
        damageType: "E",
        sourceName: "On Fire"
      })
      : await this.applyDamageIgnoringArmour({
        damage: Number(damageRoll.total ?? 0),
        location: "Body",
        damageType: "E",
        sourceName: "On Fire"
      });

    const currentFatigue = Math.max(0, Number(this.system.resources?.fatigue ?? 0));
    const newFatigue = currentFatigue + 1;
    await this.update({
      "system.resources.fatigue": newFatigue
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: On Fire</h3>
          <p><strong>Willpower:</strong> ${willpowerResult?.success ? "Keeps control" : "Runs around and screams (Full Action)"}</p>
          <p><strong>Fire Damage:</strong> ${Number(damageRoll.total ?? 0)} E</p>
          <p><strong>After Soak:</strong> ${Number(applied?.appliedDamage ?? 0)} ${machineProtectedFromFire ? "(Machine: Armour applies against fire)" : "(ignores Armour)"}</p>
          <p><strong>Fatigue:</strong> ${currentFatigue} -> ${newFatigue}</p>
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-onfire-extinguish="true" data-rt-onfire-actor-uuid="${this.uuid}">Extinguish Flames</button>
          </div>
        </div>
      `
    });

    return {
      willpowerResult,
      damageRoll,
      applied,
      fatigueApplied: 1
    };
  }

  getCharacteristicItemModifierTotals() {
    const totals = {};
    for (const item of this.items ?? []) {
      if (!itemProvidesCharacteristicModifiers(item)) continue;

      const parsed = parseCharacteristicModifierExpression(getItemResolvedModifierExpression(item));
      for (const [characteristicKey, value] of Object.entries(parsed)) {
        totals[characteristicKey] = Number(totals[characteristicKey] ?? 0) + Number(value ?? 0);
      }
    }

    return totals;
  }

  getCharacteristicItemModifier(characteristicKey) {
    const totals = this.getCharacteristicItemModifierTotals();
    return Number(totals?.[characteristicKey] ?? 0) || 0;
  }

  getCharacteristicTotalModifier(characteristicKey) {
    return this.getCharacteristicManualModifier(characteristicKey)
      + this.getCharacteristicItemModifier(characteristicKey)
      + this.getCharacteristicConditionModifier(characteristicKey);
  }

  async handleTorpedoReloadTurnStart(combat = null) {
    if (this.type !== "ship") return null;

    const combatId = String(combat?.id ?? "");
    const round = Number(combat?.round ?? 0);
    const turn = Number(combat?.turn ?? 0);
    const lastProcessed = this.getFlag("roguetrader", "torpedoReloadLastProcessed") ?? {};
    const alreadyProcessed = String(lastProcessed.combatId ?? "") === combatId
      && Number(lastProcessed.round ?? -1) === round
      && Number(lastProcessed.turn ?? -1) === turn;
    if (alreadyProcessed) return null;

    await this.setFlag("roguetrader", "torpedoReloadLastProcessed", {
      combatId,
      round,
      turn
    });

    const reloadableWeapons = Array.from(this.items ?? []).filter((item) =>
      item?.type === "shipWeapon"
      && String(item.system?.weaponClass ?? "").trim().toLowerCase() === "torpedo"
      && Boolean(item.system?.torpedoLoading)
      && String(item.system?.torpedoLoadingMode ?? "").trim() === "normal"
    );

    if (!reloadableWeapons.length) return [];

    await this.updateEmbeddedDocuments("Item", reloadableWeapons.map((item) => ({
      _id: item.id,
      "system.torpedoLoaded": true,
      "system.torpedoLoading": false,
      "system.torpedoLoadingMode": ""
    })));

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Torpedoes Loaded</h3>
          <p>${reloadableWeapons.map((item) => `<strong>${item.name}</strong>`).join(", ")} ready to fire.</p>
        </div>
      `
    });

    return reloadableWeapons;
  }

  getBaseWoundsMax() {
    return Number(this.system.resources?.wounds?.max ?? 0) || 0;
  }

  getWoundsItemModifierTotals() {
    const totals = {};
    for (const item of this.items ?? []) {
      if (!getItemResolvedModifierExpression(item)) continue;

      if (item.type === "armor" && !item.system?.equipped) continue;
      if (item.type !== "armor" && !["mutation", "malignancy", "mentalDisorder", "criticalInjury"].includes(item.type)) continue;

      const parsed = parseResourceModifierExpression(getItemResolvedModifierExpression(item));
      for (const [resourceKey, value] of Object.entries(parsed)) {
        totals[resourceKey] = Number(totals[resourceKey] ?? 0) + Number(value ?? 0);
      }
    }

    return totals;
  }

  getWoundsItemModifier() {
    const totals = this.getWoundsItemModifierTotals();
    return Number(totals?.wounds ?? 0) || 0;
  }

  getEffectiveWoundsMax() {
    return this.getBaseWoundsMax() + this.getWoundsItemModifier();
  }

  getSkillItemModifierTotals() {
    const totals = {};
    for (const item of this.items ?? []) {
      if (!itemProvidesSkillModifiers(item)) continue;

      const parsed = parseSkillModifierExpression(getItemResolvedModifierExpression(item));
      for (const [skillLabel, value] of Object.entries(parsed)) {
        totals[skillLabel] = Number(totals[skillLabel] ?? 0) + Number(value ?? 0);
      }
    }

    return totals;
  }

  getSkillItemModifier(skillName) {
    const totals = this.getSkillItemModifierTotals();
    return Number(totals?.[normalizeSkillModifierLabel(skillName)] ?? 0) || 0;
  }

  getWeaponTrainingData(weaponRef) {
    const weapon = weaponRef?.type === "weapon" ? weaponRef : this._resolveOwnedItem(weaponRef, "weapon");
    if (!weapon) {
      return {
        trained: true,
        untrainedPenalty: 0,
        dodgeModifierAgainstFlame: 0,
        jamThreshold: null,
        reason: ""
      };
    }

    if (this.type === "npc") {
      return {
        trained: true,
        untrainedPenalty: 0,
        dodgeModifierAgainstFlame: 0,
        jamThreshold: null,
        reason: ""
      };
    }

    const weaponClass = String(weapon.system?.class ?? "").trim().toLowerCase();
    const weaponType = String(weapon.system?.weaponType ?? "").trim().toLowerCase();
    const trainingPrefix = getWeaponClassTrainingPrefix(weaponClass);
    const typeLabel = getWeaponTypeTrainingLabel(weaponType);
    let trained = true;
    let reason = "";

    if (weaponType === "grenade") {
      return {
        trained: true,
        untrainedPenalty: 0,
        dodgeModifierAgainstFlame: 0,
        jamThreshold: null,
        reason: ""
      };
    }

    if (isNaturalWeapon(weapon)) {
      return {
        trained: true,
        untrainedPenalty: 0,
        dodgeModifierAgainstFlame: 0,
        jamThreshold: null,
        reason: ""
      };
    }

    if (weaponClass === "melee") {
      if (["exotic", "exoticmelee"].includes(weaponType)) {
        trained = actorHasExoticWeaponTraining(this, weapon);
        reason = trained ? "" : `Missing Exotic Weapon Training for ${weapon.name}`;
      } else if (weaponType === "primitive") {
        trained = actorHasTalentNamed(this, "Melee Weapon Training (Primitive)");
        reason = trained ? "" : "Missing Melee Weapon Training (Primitive)";
      } else {
        trained = actorHasTalentNamed(this, "Melee Weapon Training (Universal)");
        reason = trained ? "" : "Missing Melee Weapon Training (Universal)";
      }
    } else if (["basic", "pistol", "heavy", "thrown"].includes(weaponClass)) {
      if (["exotic", "exoticmelee"].includes(weaponType)) {
        trained = actorHasExoticWeaponTraining(this, weapon);
        reason = trained ? "" : `Missing Exotic Weapon Training for ${weapon.name}`;
      } else if (weaponType === "flame") {
        trained = actorHasTalentNamed(this, "Flame Weapon Training (Universal)");
        reason = trained ? "" : "Missing Flame Weapon Training (Universal)";
      } else if (weaponType === "primitive") {
        trained = trainingPrefix
          ? actorHasTalentNamed(this, `${trainingPrefix} (Primitive)`)
          : true;
        reason = trained ? "" : `Missing ${trainingPrefix} (Primitive)`;
      } else {
        const specificTraining = trainingPrefix && typeLabel
          ? actorHasTalentNamed(this, `${trainingPrefix} (${typeLabel})`)
          : false;
        const universalTraining = trainingPrefix
          ? actorHasTalentNamed(this, `${trainingPrefix} (Universal)`)
          : true;
        trained = Boolean(specificTraining || universalTraining);
        reason = trained ? "" : `Missing ${trainingPrefix}${typeLabel ? ` (${typeLabel})` : " (Universal)"}`;
      }
    }

    const isRanged = !["melee"].includes(weaponClass);
    return {
      trained,
      untrainedPenalty: trained ? 0 : -20,
      dodgeModifierAgainstFlame: !trained && isFlameWeapon(weapon) ? 20 : 0,
      jamThreshold: !trained && isRanged ? 91 : null,
      reason
    };
  }

  async rollCharacteristic(characteristicKey, {
    modifier = 0,
    label = null,
    extra = [],
    successDegreeBonus = 0,
    createMessage = true
  } = {}) {
    const baseTarget = this.getCharacteristicValue(characteristicKey);
    const title = label ?? `${this.name}: ${getCharacteristicLabel(characteristicKey)}`;
    const proneWeaponSkillModifier = characteristicKey === "weaponSkill" ? this.getProneWeaponSkillModifier() : 0;

    return rollD100Test({
      actor: this,
      title,
      target: baseTarget,
      modifier: Number(modifier ?? 0) + proneWeaponSkillModifier,
      successDegreeBonus,
      createMessage,
      breakdown: [
        `${getCharacteristicLabel(characteristicKey)}: ${baseTarget}`,
        ...(proneWeaponSkillModifier ? [`Prone: ${proneWeaponSkillModifier}`] : [])
      ],
      extra
    });
  }

  async rollSkill(skillRef, { modifier = 0, label = null, extra = [], successDegreeBonus = 0 } = {}) {
    const skill = this._resolveOwnedItem(skillRef, "skill");
    if (!skill) {
      ui.notifications?.warn("Rogue Trader | Skill not found on actor.");
      return null;
    }

    const characteristicKey = skill.system.characteristic ?? "intelligence";
    const characteristicValue = this.getCharacteristicValue(characteristicKey);
    const trained = Boolean(skill.system.trained);
    const basic = Boolean(skill.system.basic);
    if (!trained && !basic) {
      ui.notifications?.warn(`Rogue Trader | ${skill.name} is an advanced skill and cannot be rolled untrained.`);
      return null;
    }

    const characteristicTarget = !trained && basic
      ? Math.floor(characteristicValue / 2)
      : characteristicValue;
    const advanceBonus = skill.system.advance20
      ? 20
      : (skill.system.advance10 ? 10 : 0);
    const itemBonus = Number(skill.system.bonus ?? 0);
    const itemDrivenModifier = this.getSkillItemModifier(skill.name);
    const totalModifier = Number(modifier ?? 0) + advanceBonus + itemBonus + itemDrivenModifier;
    const characteristicShort = SKILL_CHARACTERISTIC_SHORT[characteristicKey] ?? characteristicKey;
    const title = label ?? `${this.name}: ${skill.name} (${characteristicShort})`;
    const trainingState = trained ? "Trained" : "Basic Untrained";

    return rollD100Test({
      actor: this,
      title,
      target: characteristicTarget,
      modifier: totalModifier,
      successDegreeBonus,
      breakdown: [
        `${getCharacteristicLabel(characteristicKey)}: ${characteristicValue}`,
        `Skill State: ${trainingState}`,
        `Advances: ${advanceBonus >= 0 ? `+${advanceBonus}` : advanceBonus}`,
        `Skill Bonus: ${itemBonus >= 0 ? `+${itemBonus}` : itemBonus}`,
        `Item Modifiers: ${itemDrivenModifier >= 0 ? `+${itemDrivenModifier}` : itemDrivenModifier}`
      ],
      extra
    });
  }

  async rollPsychicTechnique(techniqueRef, { modifier = 0, extra = [] } = {}) {
    const technique = this._resolveOwnedItem(techniqueRef, "psychicTechnique");
    if (!technique) {
      ui.notifications?.warn("Rogue Trader | Psychic technique not found on actor.");
      return null;
    }

    const testType = technique.system.focusPowerTest ?? "no";
    if (testType === "no") {
      const roll = await (new Roll("1d100")).evaluate();
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: ${technique.name}</h3>
            <p><strong>Psychic Test:</strong> ${getPsychicTestLabel(testType)}</p>
            <p>No focus power test required.</p>
            <p>${extra.join(" | ")}</p>
          </div>
        `
      });

      return { roll, testRequired: false };
    }

    const characteristicKey = "willpower";
    const title = `${this.name}: ${technique.name}`;

    return rollD100Test({
      actor: this,
      title,
      target: this.getCharacteristicValue(characteristicKey),
      modifier,
      breakdown: [
        `${getCharacteristicLabel(characteristicKey)}: ${this.getCharacteristicValue(characteristicKey)}`,
        `Psychic Test: ${getPsychicTestLabel(testType)}`
      ],
      extra: [
        `Focus Time: ${technique.system.focusTime || "N/A"}`,
        `Range: ${technique.system.range || "-"}`,
        ...extra
      ]
    });
  }

  async rollFocusPower(techniqueRef, { modeIndex = 0, miscModifier = 0 } = {}) {
    const technique = this._resolveOwnedItem(techniqueRef, "psychicTechnique");
    if (!technique) {
      ui.notifications?.warn("Rogue Trader | Psychic technique not found on actor.");
      return null;
    }

    const mode = this.getPsychicModeData(modeIndex);
    const testType = technique.system.focusPowerTest ?? "no";
    const totalModifier = mode.modifier + Number(miscModifier ?? 0);
    const doublesPossible = mode.causesPhenomenaOnDoubles;
    const automaticPhenomena = mode.causesPhenomenaAutomatically;

    if (testType === "no") {
      const roll = await (new Roll("1d100")).evaluate();
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: ${technique.name}</h3>
            <p><strong>Focus Power Test:</strong> No Test</p>
            <p><strong>Mode:</strong> ${mode.label}</p>
            <p><strong>Psy Rating Used:</strong> ${mode.psyRatingUsed}</p>
          </div>
        `
      });
      return { roll, testRequired: false };
    }

    let result = null;

    if (testType === "psyniscience") {
      const psyniscienceSkill = this.items.find((item) => item.type === "skill" && item.name === "Psyniscience");
      if (!psyniscienceSkill) {
        ui.notifications?.warn("Rogue Trader | Psyniscience skill not found on actor.");
        return null;
      }

      result = await this.rollSkill(psyniscienceSkill, {
        label: `${this.name}: ${technique.name}`,
        modifier: totalModifier,
        extra: [
          `Focus Power Test: ${getPsychicTestLabel(testType)}`,
          `Psy Rating: ${mode.basePsyRating}`,
          `Mode: ${mode.label}`,
          `Psy Rating Used: ${mode.psyRatingUsed}`,
          `Psy Modifier: +${mode.modifier}`,
          `Misc Modifier: ${Number(miscModifier ?? 0) >= 0 ? `+${Number(miscModifier ?? 0)}` : Number(miscModifier ?? 0)}`,
          `Focus Time: ${technique.system.focusTime || "N/A"}`,
          `Range: ${technique.system.range || "-"}`,
          `Phenomena: ${automaticPhenomena ? `Automatic (+${mode.phenomenaModifier})` : (doublesPossible ? "On doubles" : "None")}`
        ]
      });
    } else {
      const willpower = this.getCharacteristicValue("willpower");
      result = await rollD100Test({
        actor: this,
        title: `${this.name}: ${technique.name}`,
        target: willpower,
        modifier: totalModifier,
        breakdown: [
          `Willpower: ${willpower}`,
          `Focus Power Test: ${getPsychicTestLabel(testType)}`,
          `Psy Rating: ${mode.basePsyRating}`,
          `Mode: ${mode.label}`,
          `Psy Rating Used: ${mode.psyRatingUsed}`,
          `Psy Modifier: +${mode.modifier}`,
          `Misc Modifier: ${Number(miscModifier ?? 0) >= 0 ? `+${Number(miscModifier ?? 0)}` : Number(miscModifier ?? 0)}`
        ],
        extra: [
          `Focus Time: ${technique.system.focusTime || "N/A"}`,
          `Range: ${technique.system.range || "-"}`,
          `Phenomena: ${automaticPhenomena ? `Automatic (+${mode.phenomenaModifier})` : (doublesPossible ? "On doubles" : "None")}`
        ]
      });
    }

    if (!result) return null;

    const rollTotal = Number(result?.rollTotal ?? 0);
    const digits = `${rollTotal}`.padStart(2, "0");
    const rolledDoubles = digits[0] === digits[1];
    const triggeredPhenomena = automaticPhenomena || (doublesPossible && rolledDoubles);

    if (triggeredPhenomena) {
      const phenomenaRoll = await (new Roll("1d100")).evaluate();
      const rawPhenomena = Number(phenomenaRoll.total ?? 0);
      const totalPhenomena = Math.min(100, rawPhenomena + Number(mode.phenomenaModifier ?? 0));
      const phenomenaEntry = getPsychicPhenomenaEntry(totalPhenomena);

      await phenomenaRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Psychic Phenomena</h3>
            <p><strong>Triggered:</strong> Yes</p>
            <p><strong>Source:</strong> ${automaticPhenomena ? `${mode.label} (Automatic)` : "Unfettered doubles"}</p>
            <p><strong>Roll:</strong> ${rawPhenomena}${mode.phenomenaModifier > 0 ? ` + ${mode.phenomenaModifier}` : ""} = ${totalPhenomena}</p>
            <p><strong>Result:</strong> ${phenomenaEntry?.name ?? "Unknown"}</p>
            <p>${phenomenaEntry?.effect ?? ""}</p>
          </div>
        `
      });

      if (totalPhenomena >= 75) {
        const perilsRoll = await (new Roll("1d100")).evaluate();
        const rawPerils = Number(perilsRoll.total ?? 0);
        const perilsTotal = rawPerils === 100 ? 100 : rawPerils;
        const perilsEntry = getPerilsOfTheWarpEntry(perilsTotal);

        await perilsRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: `
            <div class="roguetrader-roll-card">
              <h3>${this.name}: Perils of the Warp</h3>
              <p><strong>Roll:</strong> ${rawPerils}</p>
              <p><strong>Result:</strong> ${perilsEntry?.name ?? "Unknown"}</p>
              <p>${perilsEntry?.effect ?? ""}</p>
            </div>
          `
        });
      }
    }

    return {
      ...result,
      psyRatingUsed: mode.psyRatingUsed,
      triggeredPhenomena,
      phenomenaModifier: mode.phenomenaModifier
    };
  }

  _getFlameTemplateTargets({ sourceToken = null, direction = 0, distance = 0, angle = 30 } = {}) {
    if (!canvas?.tokens || !sourceToken) return [];

    const sourceCenter = getTokenCenter(sourceToken);
    const maxDistancePixels = getCanvasDistanceInPixels(distance);
    const halfAngle = Number(angle ?? 30) / 2;

    return canvas.tokens.placeables.filter((token) => {
      if (!token?.actor || token.id === sourceToken.id) return false;

      const targetCenter = getTokenCenter(token);
      const dx = targetCenter.x - sourceCenter.x;
      const dy = targetCenter.y - sourceCenter.y;
      const targetDistance = Math.hypot(dx, dy);
      if (targetDistance > maxDistancePixels || targetDistance <= 0) return false;

      const tokenDirection = getAngleDegreesBetweenPoints(sourceCenter, targetCenter);
      return getNormalizedAngleDifference(direction, tokenDirection) <= halfAngle;
    });
  }

  async _createFlameTemplate({ sourceToken = null, direction = 0, distance = 0, angle = 30 } = {}) {
    if (!canvas?.scene || !sourceToken) return null;

    const sourceCenter = getTokenCenter(sourceToken);
    const templateData = {
      t: "cone",
      user: game.user?.id,
      x: sourceCenter.x,
      y: sourceCenter.y,
      direction,
      angle,
      distance,
      borderColor: "#d0802a",
      fillColor: "#ffb347",
      flags: {
        roguetrader: {
          sourceActorUuid: this.uuid,
          temporaryAttackTemplate: true
        }
      }
    };

    const [created] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
    return created ?? null;
  }

  _getBlastTemplateTargets({ centerToken = null, distance = 0 } = {}) {
    if (!canvas?.tokens || !centerToken) return [];

    const center = getTokenCenter(centerToken);
    const effectiveDistance = getBlastTemplateDistance(distance);
    const maxDistancePixels = getCanvasDistanceInPixels(effectiveDistance);

    return canvas.tokens.placeables.filter((token) => {
      if (!token?.actor || token.id === centerToken.id) return false;
      const targetCenter = getTokenCenter(token);
      const dx = targetCenter.x - center.x;
      const dy = targetCenter.y - center.y;
      return Math.hypot(dx, dy) <= maxDistancePixels;
    });
  }

  async _createBlastTemplate({ centerToken = null, distance = 0 } = {}) {
    if (!canvas?.scene || !centerToken) return null;

    const center = getTokenCenter(centerToken);
    const effectiveDistance = getBlastTemplateDistance(distance);
    const templateData = {
      t: "circle",
      user: game.user?.id,
      x: center.x,
      y: center.y,
      distance: effectiveDistance,
      borderColor: "#d46a1f",
      fillColor: "#ff9f43",
      flags: {
        roguetrader: {
          sourceActorUuid: this.uuid,
          temporaryAttackTemplate: true,
          blastTemplate: true
        }
      }
    };

    const [created] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
    return created ?? null;
  }

  async _placeFlameTemplate({ sourceToken = null, distance = 0, angle = 30 } = {}) {
    if (!canvas?.scene || !canvas?.templates || !sourceToken) return null;

    const sourceCenter = getTokenCenter(sourceToken);
    const templateData = {
      t: "cone",
      user: game.user?.id,
      x: sourceCenter.x,
      y: sourceCenter.y,
      direction: 0,
      angle,
      distance,
      borderColor: "#d0802a",
      fillColor: "#ffb347",
      flags: {
        roguetrader: {
          sourceActorUuid: this.uuid,
          temporaryAttackTemplate: true
        }
      }
    };

    const templateDocument = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
    const preview = new CONFIG.MeasuredTemplate.objectClass(templateDocument);
    await preview.draw();
    canvas.templates.preview.addChild(preview);

    ui.notifications?.info("Rogue Trader | Move the mouse to aim the flamer cone, left-click to confirm, right-click to cancel.");

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        canvas.stage.off("pointermove", handleMove);
        canvas.stage.off("pointerdown", handleLeftDown);
        canvas.app.view.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleEscape);
        preview.destroy({ children: true });
      };

      const finish = async (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const handleMove = (event) => {
        const local = getPointerPositionOnCanvas(event);
        if (!local) return;

        const direction = getAngleDegreesBetweenPoints(sourceCenter, local);
        preview.document.updateSource({ direction });
        preview.refresh();
      };

      const handleLeftDown = async (event) => {
        if (event.button !== 0) return;
        event.stopPropagation?.();
        event.preventDefault?.();

        const local = getPointerPositionOnCanvas(event);
        if (local) {
          const direction = getAngleDegreesBetweenPoints(sourceCenter, local);
          preview.document.updateSource({ direction });
          preview.refresh();
        }

        const [created] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [preview.document.toObject()]);
        await finish(created ?? null);
      };

      const handleContextMenu = async (event) => {
        event.preventDefault();
        await finish(null);
      };

      const handleEscape = async (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        await finish(null);
      };

      canvas.stage.on("pointermove", handleMove);
      canvas.stage.on("pointerdown", handleLeftDown);
      canvas.app.view.addEventListener("contextmenu", handleContextMenu, { once: false });
      document.addEventListener("keydown", handleEscape, { once: false });
    });
  }

  async _placeBlastTemplate({ distance = 0, sourceActorUuid = "" } = {}) {
    if (!canvas?.scene || !canvas?.templates) return null;

    const templateData = {
      t: "circle",
      user: game.user?.id,
      x: 0,
      y: 0,
      distance: getBlastTemplateDistance(distance),
      borderColor: "#d46a1f",
      fillColor: "#ff9f43",
      flags: {
        roguetrader: {
          sourceActorUuid,
          temporaryAttackTemplate: true,
          blastTemplate: true
        }
      }
    };

    const templateDocument = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
    const preview = new CONFIG.MeasuredTemplate.objectClass(templateDocument);
    await preview.draw();
    canvas.templates.preview.addChild(preview);

    ui.notifications?.info("Rogue Trader | Move the mouse to place the blast, left-click to confirm, right-click to cancel.");

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        canvas.stage.off("pointermove", handleMove);
        canvas.stage.off("pointerdown", handleLeftDown);
        canvas.app.view.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleEscape);
        preview.destroy({ children: true });
      };

      const finish = async (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const updatePositionFromEvent = (event) => {
        const local = getPointerPositionOnCanvas(event);
        if (!local) return false;
        preview.document.updateSource({ x: local.x, y: local.y });
        preview.refresh();
        return true;
      };

      const handleMove = (event) => {
        updatePositionFromEvent(event);
      };

      const handleLeftDown = async (event) => {
        if (event.button !== 0) return;
        event.stopPropagation?.();
        event.preventDefault?.();

        const updated = updatePositionFromEvent(event);
        if (!updated) return;

        const [created] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [preview.document.toObject()]);
        await finish(created ?? null);
      };

      const handleContextMenu = async (event) => {
        event.preventDefault();
        await finish(null);
      };

      const handleEscape = async (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        await finish(null);
      };

      canvas.stage.on("pointermove", handleMove);
      canvas.stage.on("pointerdown", handleLeftDown);
      canvas.app.view.addEventListener("contextmenu", handleContextMenu, { once: false });
      document.addEventListener("keydown", handleEscape, { once: false });
    });
  }

  _buildFlameAttackFlavor(attackResolution) {
    const targetMarkup = (attackResolution.targets ?? []).map((target) => {
      const resolved = Boolean(target.resolved);
      const status = resolved
        ? target.resultLabel
        : "Pending";
      const controls = resolved
        ? ""
        : `
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-flame-resolution="dodge" data-rt-flame-target-uuid="${target.tokenUuid}">Dodge</button>
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-flame-resolution="none" data-rt-flame-target-uuid="${target.tokenUuid}">Take Hit</button>
          </div>
        `;

      return `
        <div class="roguetrader-attack-resolution">
          <p><strong>Target:</strong> ${target.name}</p>
          <p><strong>Status:</strong> ${status}</p>
          ${target.appliedDamage != null ? `<p><strong>After Soak:</strong> ${target.appliedDamage}</p>` : ""}
          ${controls}
        </div>
      `;
    }).join("");

    const deleteTemplateButton = attackResolution.templateUuid
      ? `
        <div class="roguetrader-attack-resolution-buttons">
          <button type="button" class="roguetrader-attack-resolution-button" data-rt-flame-delete-template="true">Delete Template</button>
        </div>
      `
      : "";

    return `
      <div class="roguetrader-roll-card">
        <h3>${this.name}: ${attackResolution.weaponName}</h3>
        <p><strong>Attack Type:</strong> Flame Template</p>
        <p><strong>Template:</strong> 30-degree cone, ${attackResolution.range} m</p>
        <p><strong>Primary Target:</strong> ${attackResolution.primaryTargetName}</p>
        <p><strong>Targets in Cone:</strong> ${attackResolution.targets.length || 0}</p>
        <p><strong>Damage:</strong> ${attackResolution.damageTotal} ${attackResolution.damageType || "-"}</p>
        <p><strong>Righteous Fury:</strong> ${attackResolution.righteousFury ? "Yes!" : "No"}</p>
        ${attackResolution.unstable ? `<p><strong>Unstable:</strong> ${attackResolution.unstableRoll} (${attackResolution.unstableMultiplier === 0.5 ? "Half Damage" : attackResolution.unstableMultiplier === 2 ? "Double Damage" : "Normal Damage"})</p>` : ""}
        ${deleteTemplateButton}
        ${attackResolution.targets.length ? targetMarkup : "<p>No targets were inside the flame template.</p>"}
      </div>
    `;
  }

  _buildBlastAttackFlavor(attackResolution) {
    const targetMarkup = (attackResolution.targets ?? []).map((target) => {
      const resolved = Boolean(target.resolved);
      const status = resolved ? target.resultLabel : "Pending";
      const controls = resolved
        ? ""
        : `
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-blast-resolution="dodge" data-rt-blast-target-uuid="${target.tokenUuid}">Dodge</button>
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-blast-resolution="none" data-rt-blast-target-uuid="${target.tokenUuid}">Take Hit</button>
          </div>
        `;

      return `
        <div class="roguetrader-attack-resolution">
          <p><strong>Target:</strong> ${target.name}</p>
          <p><strong>Status:</strong> ${status}</p>
          ${target.hitLocation ? `<p><strong>Hit Location:</strong> ${target.hitLocation}</p>` : ""}
          ${target.appliedDamage != null ? `<p><strong>After Soak:</strong> ${target.appliedDamage}</p>` : ""}
          ${controls}
        </div>
      `;
    }).join("");

    const deleteTemplateButton = attackResolution.templateUuid
      ? `
        <div class="roguetrader-attack-resolution-buttons">
          <button
            type="button"
            class="roguetrader-attack-resolution-button"
            data-rt-delete-template-uuid="${attackResolution.templateUuid}"
            data-rt-delete-template-actor-uuid="${this.uuid}"
          >Delete Template</button>
        </div>
      `
      : "";

    return `
      <div class="roguetrader-roll-card">
        <h3>${this.name}: ${attackResolution.weaponName} Blast</h3>
        <p><strong>Blast Radius:</strong> ${attackResolution.blastRadius} m</p>
        <p><strong>Center:</strong> ${attackResolution.centerName}</p>
        <p><strong>${attackResolution.scopeLabel ?? "Targets Affected"}:</strong> ${attackResolution.targets.length || 0}</p>
        ${deleteTemplateButton}
        ${attackResolution.targets.length ? targetMarkup : "<p>No additional targets were inside the blast template.</p>"}
      </div>
    `;
  }

  _buildSuppressiveFireFlavor(attackResolution) {
    const targetMarkup = (attackResolution.targets ?? []).map((target) => {
      const resolved = Boolean(target.resolved);
      const status = resolved ? target.resultLabel : "Pending";
      const controls = resolved
        ? ""
        : `
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-suppressive-resolution="dodge" data-rt-suppressive-target-uuid="${target.tokenUuid}">Dodge</button>
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-suppressive-resolution="none" data-rt-suppressive-target-uuid="${target.tokenUuid}">Take Hit</button>
          </div>
        `;

      return `
        <div class="roguetrader-attack-resolution">
          <p><strong>Target:</strong> ${target.name}</p>
          <p><strong>Status:</strong> ${status}</p>
          ${target.hitLocation ? `<p><strong>Hit Location:</strong> ${target.hitLocation}</p>` : ""}
          ${target.appliedDamage != null ? `<p><strong>After Soak:</strong> ${target.appliedDamage}</p>` : ""}
          ${controls}
        </div>
      `;
    }).join("");

    const deleteTemplateButton = attackResolution.templateUuid
      ? `
        <div class="roguetrader-attack-resolution-buttons">
          <button
            type="button"
            class="roguetrader-attack-resolution-button"
            data-rt-delete-template-uuid="${attackResolution.templateUuid}"
            data-rt-delete-template-actor-uuid="${this.uuid}"
          >Delete Template</button>
        </div>
      `
      : "";

    return `
      <div class="roguetrader-roll-card">
        <h3>${this.name}: ${attackResolution.weaponName}</h3>
        <p><strong>Attack Type:</strong> Suppressive Fire</p>
        <p><strong>Template:</strong> 45-degree cone, ${attackResolution.range} m</p>
        <p><strong>Attack Roll:</strong> ${attackResolution.rollTotal} (${attackResolution.degrees} DoS)</p>
        <p><strong>Targets in Area:</strong> ${attackResolution.availableTargets}</p>
        <p><strong>Random Targets Hit:</strong> ${attackResolution.targets.length}</p>
        ${deleteTemplateButton}
        ${attackResolution.targets.length ? targetMarkup : "<p>No targets were struck by the suppressive fire.</p>"}
      </div>
    `;
  }

  async _applySharedDamageResultToTarget(targetActor, attackResolution, location = "Body") {
    return targetActor.applyDamageToLocation({
      damage: Number(attackResolution.damageTotal ?? 0),
      penetration: Number(attackResolution.penetration ?? 0),
      location,
      damageType: String(attackResolution.damageType ?? ""),
      sourceName: attackResolution.weaponName,
      sourceWeapon: this.items.get(attackResolution.weaponId) ?? null,
      sourceRangeBand: String(attackResolution.rangeBandKey ?? "standard")
    });
  }

  async _resolveBlastAttack({
    weapon = null,
    centerToken = null,
    rangeBandKey = "standard",
    extraDice = 0
  } = {}) {
    if (!weapon || !centerToken || !isBlastWeapon(weapon)) return null;

    const blastRadius = getBlastRadius(weapon);
    if (blastRadius <= 0) return null;

    const template = await this._createBlastTemplate({
      centerToken,
      distance: blastRadius
    });
    const targets = this._getBlastTemplateTargets({
      centerToken,
      distance: blastRadius
    });

    const attackResolution = {
      attackerActorUuid: this.uuid,
      weaponId: weapon.id,
      weaponName: weapon.name,
      templateUuid: template?.uuid ?? null,
      blastRadius,
      centerName: centerToken.name ?? centerToken.actor?.name ?? "Target",
      scopeLabel: "Secondary Targets Affected",
      rangeBandKey: String(rangeBandKey ?? "standard"),
      extraDice: Number(extraDice ?? 0),
      targets: targets.map((token) => ({
        tokenUuid: token.document?.uuid ?? null,
        actorUuid: token.actor?.uuid ?? null,
        name: token.name ?? token.actor?.name ?? "Target",
        resolved: false,
        resultLabel: "",
        hitLocation: "",
        hitLocationRoll: null,
        appliedDamage: null
      }))
    };

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: this._buildBlastAttackFlavor(attackResolution),
      flags: {
        roguetrader: {
          blastAttackResolution: attackResolution
        }
      }
    });

    return {
      blastRadius,
      templateUuid: template?.uuid ?? null,
      targets: attackResolution.targets
    };
  }

  async _createBlastResolutionFromTemplate({
    weapon = null,
    templateDocument = null,
    centerName = "Target",
    rangeBandKey = "standard",
    extraDice = 0,
    scopeLabel = "Targets Affected"
  } = {}) {
    if (!weapon || !templateDocument || !isBlastWeapon(weapon)) return null;

    const blastRadius = getBlastRadius(weapon);
    const targets = this._getBlastTemplateTargets({
      centerToken: templateDocument,
      distance: blastRadius
    });

    const attackResolution = {
      attackerActorUuid: this.uuid,
      weaponId: weapon.id,
      weaponName: weapon.name,
      templateUuid: templateDocument.uuid ?? null,
      blastRadius,
      centerName,
      scopeLabel,
      rangeBandKey: String(rangeBandKey ?? "standard"),
      extraDice: Number(extraDice ?? 0),
      targets: targets.map((token) => ({
        tokenUuid: token.document?.uuid ?? null,
        actorUuid: token.actor?.uuid ?? null,
        name: token.name ?? token.actor?.name ?? "Target",
        resolved: false,
        resultLabel: "",
        hitLocation: "",
        hitLocationRoll: null,
        appliedDamage: null
      }))
    };

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: this._buildBlastAttackFlavor(attackResolution),
      flags: {
        roguetrader: {
          blastAttackResolution: attackResolution
        }
      }
    });

    return attackResolution;
  }

  async resolveBlastAttackResolutionMessage(message, targetTokenUuid, action = "none") {
    const attackResolution = foundry.utils.deepClone(message?.flags?.roguetrader?.blastAttackResolution ?? null);
    if (!attackResolution) return null;

    const targetEntry = attackResolution.targets.find((target) => target.tokenUuid === targetTokenUuid);
    if (!targetEntry || targetEntry.resolved) return null;

    const targetActor = await fromUuid(targetEntry.actorUuid);
    const targetToken = targetEntry.tokenUuid ? await fromUuid(targetEntry.tokenUuid) : null;
    const weapon = this.items.get(attackResolution.weaponId) ?? null;
    if (!targetActor || !targetToken || !weapon) {
      ui.notifications?.warn("Rogue Trader | Could not resolve the blast target context.");
      return null;
    }

    let reactionResult = {
      attempted: false,
      label: "Took Hit",
      negatedHits: 0
    };

    if (action === "dodge") {
      reactionResult = await targetActor._rollDodgeReaction(this, weapon, "blast", 1, 0);
    }

    if (Number(reactionResult.negatedHits ?? 0) > 0) {
      targetEntry.resolved = true;
      targetEntry.resultLabel = reactionResult.label;
      targetEntry.appliedDamage = 0;
    } else {
      const locationRoll = await (new Roll("1d100")).evaluate({ async: true });
      const hitLocation = getHitLocationLabelFromRoll(Number(locationRoll.total ?? 0));
      const damageResults = await this._rollAttackDamage({
        weapon,
        target: targetToken,
        hitLocations: [hitLocation.label],
        extraDice: Number(attackResolution.extraDice ?? 0),
        rangeBandKey: String(attackResolution.rangeBandKey ?? "standard")
      });

      targetEntry.resolved = true;
      targetEntry.resultLabel = reactionResult.attempted ? reactionResult.label : "Hit Applied";
      targetEntry.hitLocation = hitLocation.label;
      targetEntry.hitLocationRoll = Number(locationRoll.total ?? 0);
      targetEntry.appliedDamage = Number(damageResults?.[0]?.applied?.appliedDamage ?? 0);
    }

    await message.update({
      flavor: this._buildBlastAttackFlavor(attackResolution),
      "flags.roguetrader.blastAttackResolution": attackResolution
    });

    return {
      reactionResult,
      targetEntry
    };
  }

  async resolveSuppressiveFireResolutionMessage(message, targetTokenUuid, action = "none") {
    const attackResolution = foundry.utils.deepClone(message?.flags?.roguetrader?.suppressiveAttackResolution ?? null);
    if (!attackResolution) return null;

    const targetEntry = attackResolution.targets.find((target) => target.tokenUuid === targetTokenUuid);
    if (!targetEntry || targetEntry.resolved) return null;

    const targetActor = await fromUuid(targetEntry.actorUuid);
    const targetToken = targetEntry.tokenUuid ? await fromUuid(targetEntry.tokenUuid) : null;
    const weapon = this.items.get(attackResolution.weaponId) ?? null;
    if (!targetActor || !targetToken || !weapon) {
      ui.notifications?.warn("Rogue Trader | Could not resolve the suppressive fire target context.");
      return null;
    }

    let reactionResult = {
      attempted: false,
      label: "Took Hit",
      negatedHits: 0
    };

    if (action === "dodge") {
      reactionResult = await targetActor._rollDodgeReaction(this, weapon, "suppressiveFire", 1, 0);
    }

    if (Number(reactionResult.negatedHits ?? 0) > 0) {
      targetEntry.resolved = true;
      targetEntry.resultLabel = reactionResult.label;
      targetEntry.appliedDamage = 0;
    } else {
      const locationRoll = await (new Roll("1d100")).evaluate({ async: true });
      const hitLocation = getHitLocationLabelFromRoll(Number(locationRoll.total ?? 0));
      const damageResults = await this._rollAttackDamage({
        weapon,
        target: targetToken,
        hitLocations: [hitLocation.label],
        extraDice: 0,
        rangeBandKey: String(attackResolution.rangeBandKey ?? "standard"),
        maximalMode: Boolean(attackResolution.maximalMode)
      });

      targetEntry.resolved = true;
      targetEntry.resultLabel = reactionResult.attempted ? reactionResult.label : "Hit Applied";
      targetEntry.hitLocation = hitLocation.label;
      targetEntry.hitLocationRoll = Number(locationRoll.total ?? 0);
      targetEntry.appliedDamage = Number(damageResults?.[0]?.applied?.appliedDamage ?? 0);
    }

    await message.update({
      flavor: this._buildSuppressiveFireFlavor(attackResolution),
      "flags.roguetrader.suppressiveAttackResolution": attackResolution
    });

    return {
      reactionResult,
      targetEntry
    };
  }

  async _rollSuppressiveFireAttack(weapon, {
    aimKey = "none",
    rangeBandKey = "standard",
    modifier = 0,
    extra = [],
    fateReroll = false,
    replaceMessage = null,
    maximalMode = false
  } = {}) {
    const sourceToken = this.getActiveTokens?.()[0] ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | An active token is required to use suppressive fire.");
      return null;
    }

    const rof = parseRateOfFire(weapon.system.rof);
    if (rof.fullAuto <= 0) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} cannot make a Suppressive Fire attack.`);
      return null;
    }

    const usesAmmo = true;
    const ammoRequired = getAttackAmmoRequirement("suppressiveFire", rof) * (maximalMode ? 3 : 1);
    const { maxClip, currentClip, ammoInitialized } = getWeaponAmmoState(weapon);
    if (ammoRequired > 0 && currentClip < ammoRequired) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} does not have enough ammunition (${currentClip}/${ammoRequired} required).`);
      return null;
    }

    const range = Number(weapon.system?.range ?? 0) + (maximalMode ? 10 : 0);
    const placedTemplate = await this._placeFlameTemplate({
      sourceToken,
      distance: range,
      angle: 45
    });
    if (!placedTemplate) return null;

    const direction = Number(placedTemplate.direction ?? placedTemplate.document?.direction ?? 0);
    const coneTargets = this._getFlameTemplateTargets({
      sourceToken,
      direction,
      distance: range,
      angle: 45
    });

    const baseTarget = this.getCharacteristicValue("ballisticSkill");
    const twinLinkedAttackBonus = isTwinLinkedWeapon(weapon) ? 20 : 0;
    const weaponTraining = this.getWeaponTrainingData(weapon);
    const weaponMasterData = this.getWeaponMasterData(weapon);
    const finalModifier = ATTACK_TYPE_MODIFIERS.suppressiveFire
      + Number(modifier ?? 0)
      + twinLinkedAttackBonus
      + Number(weaponTraining.untrainedPenalty ?? 0)
      + Number(weaponMasterData.attackBonus ?? 0);

    const result = await rollD100Test({
      actor: this,
      title: `${this.name}: ${weapon.name}`,
      target: baseTarget,
      modifier: finalModifier,
      breakdown: [
        `Ballistic Skill: ${baseTarget}`,
        `Attack Type: ${ATTACK_TYPE_LABELS.suppressiveFire}`,
        ...(twinLinkedAttackBonus ? [`Twin-linked: +${twinLinkedAttackBonus}`] : []),
        ...(weaponMasterData.attackBonus ? [`Weapon Master (${weaponMasterData.label}): +${weaponMasterData.attackBonus}`] : []),
        ...(weaponTraining.untrainedPenalty ? [`Untrained Weapon Use: ${weaponTraining.untrainedPenalty}`] : []),
        ...(maximalMode ? ["Maximal Mode: Enabled"] : [])
      ],
      extra: [
        `Range: ${range} m`,
        `RoF: ${weapon.system.rof || "-"}`,
        `Ammo: ${currentClip}/${maxClip}`,
        `Ammo Cost: ${ammoRequired}`,
        `Targets in Area: ${coneTargets.length}`,
        ...(weaponTraining.reason ? [`Training: ${weaponTraining.reason}`] : []),
        ...extra
      ],
      fateReroll,
      replaceMessage,
      rollContextData: {
        attackContext: {
          weaponId: weapon.id,
          attackType: "suppressiveFire",
          aimKey,
          rangeBandKey,
          modifier: Number(modifier ?? 0),
          extra: foundry.utils.deepClone(extra ?? []),
          twoWeaponFighting: false,
          calledShotLocation: "body",
          braceHeavyWeapon: false,
          maximalMode: Boolean(maximalMode),
          fullAutoAdvance: false
        }
      }
    });

    if (!result) {
      await placedTemplate.delete().catch(() => {});
      return null;
    }

    const remainingClip = Math.max(0, currentClip - ammoRequired);
    if (!fateReroll && (ammoRequired > 0 || !ammoInitialized)) {
      await weapon.update({
        "system.currentClip": remainingClip,
        "flags.roguetrader.ammoInitialized": true
      });
    }

    const overheated = isOverheatsWeapon(weapon) && Number(result.rollTotal ?? 0) >= 91;
    const jamThreshold = Math.min(
      94,
      isUnreliableWeapon(weapon) ? 91 : 100,
      weaponTraining.jamThreshold != null ? Number(weaponTraining.jamThreshold) : 100
    );
    const jamCandidate = !overheated && Number(result.rollTotal ?? 0) >= jamThreshold;
    let jammed = false;
    let reliableJamRoll = null;

    if (jamCandidate) {
      if (isReliableWeapon(weapon)) {
        const roll = await (new Roll("1d10")).evaluate({ async: true });
        reliableJamRoll = Number(roll.total ?? 0);
        jammed = reliableJamRoll === 10;
        await roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: `
            <div class="roguetrader-roll-card">
              <h3>${this.name}: Reliable Check</h3>
              <p><strong>Weapon:</strong> ${weapon.name}</p>
              <p><strong>Trigger:</strong> Attack roll ${result.rollTotal} (${jamThreshold}-00)</p>
              <p><strong>Outcome:</strong> ${jammed ? "Weapon Jammed" : "Reliable quality prevented the jam"}</p>
            </div>
          `
        });
      } else {
        jammed = true;
      }
    }

    const resultExtra = [];
    if (jamCandidate) {
      resultExtra.push("Automatic Miss: Yes");
      if (isReliableWeapon(weapon)) {
        resultExtra.push(`Reliable Check: ${reliableJamRoll ?? "-"}${jammed ? " (Jammed)" : " (No Jam)"}`);
      }
      if (weaponTraining.jamThreshold != null) {
        resultExtra.push("Untrained Ranged Use: Counts as Unreliable");
      }
      if (isUnreliableWeapon(weapon)) {
        resultExtra.push("Unreliable: Jams on 91-00");
      }
      resultExtra.push(`Jammed: ${jammed ? "Yes" : "No"} (${jamThreshold}-00 on Suppressive Fire)`);
    }
    if (overheated) {
      resultExtra.push("Overheats: Yes (91+)");
    }
    resultExtra.push(`Ammo Spent: ${ammoRequired}`);
    resultExtra.push(`Ammo Remaining: ${remainingClip}/${maxClip}`);

    let attackResolution = null;
    if (result.success && !jamCandidate) {
      const hitCount = Math.max(0, 1 + Math.floor(Number(result.degrees ?? 0) / 2));
      const shuffledTargets = [...coneTargets].sort(() => Math.random() - 0.5);
      const selectedTargets = shuffledTargets.slice(0, Math.min(hitCount, shuffledTargets.length));
      resultExtra.push(`Targets Hit: ${selectedTargets.length}/${coneTargets.length}`);

      attackResolution = {
        attackerActorUuid: this.uuid,
        weaponId: weapon.id,
        weaponName: weapon.name,
        attackType: "suppressiveFire",
        range,
        rangeBandKey,
        maximalMode: Boolean(maximalMode),
        templateUuid: placedTemplate.uuid ?? null,
        rollTotal: Number(result.rollTotal ?? 0),
        degrees: Number(result.degrees ?? 0),
        availableTargets: coneTargets.length,
        targets: selectedTargets.map((token) => ({
          actorUuid: token.actor?.uuid ?? null,
          tokenUuid: token.document?.uuid ?? null,
          name: token.name ?? token.actor?.name ?? "Target",
          resolved: false,
          resultLabel: "",
          hitLocation: "",
          hitLocationRoll: null,
          appliedDamage: null
        }))
      };

      await result.message?.update({
        flavor: `${result.message.flavor}<p>${resultExtra.join(" | ")}</p>${this._buildSuppressiveFireFlavor(attackResolution)}`,
        "flags.roguetrader.suppressiveAttackResolution": attackResolution
      });
      resultExtra.length = 0;
    }

    if (resultExtra.length) {
      await result.message?.update({
        flavor: `${result.message.flavor}<p>${resultExtra.join(" | ")}</p>`
      });
    }

    for (const token of coneTargets) {
      if (!token?.actor?.resolvePinningTest) continue;
      await token.actor.resolvePinningTest({
        sourceActor: this,
        sourceName: weapon.name
      });
    }

    if (!fateReroll && isRechargeWeapon(weapon)) {
      await this._setWeaponRechargeCooldown(weapon);
    }

    const overheatResult = overheated
      ? await this._handleWeaponOverheat({
        weapon,
        weaponClass: String(weapon.system?.class ?? "").trim().toLowerCase(),
        rollTotal: result.rollTotal
      })
      : null;
    const jamResult = jammed
      ? await this._handleWeaponJam({
        weapon,
        attackType: "suppressiveFire",
        rollTotal: result.rollTotal,
        jamThreshold
      })
      : null;

    await this._playAutomatedAttackAnimation(weapon, coneTargets);

    return {
      ...result,
      jammed,
      jamResult,
      overheated,
      overheatResult,
      targets: coneTargets,
      attackResolution
    };
  }

  async _rollFlameAttack(weapon, { extra = [] } = {}) {
    const sourceToken = this.getActiveTokens?.()[0] ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | An active token is required to use a flamer.");
      return null;
    }

    const usesAmmo = true;
    const rof = parseRateOfFire(weapon.system.rof);
    const ammoRequired = getAttackAmmoRequirement("flame", rof);
    const { maxClip, currentClip, ammoInitialized } = getWeaponAmmoState(weapon);
    if (ammoRequired > 0 && currentClip < ammoRequired) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} does not have enough ammunition (${currentClip}/${ammoRequired} required).`);
      return null;
    }

    const range = Number(weapon.system?.range ?? 0);
    const placedTemplate = await this._placeFlameTemplate({
      sourceToken,
      distance: range,
      angle: 30
    });
    if (!placedTemplate) return null;

    const direction = Number(placedTemplate.direction ?? placedTemplate.document?.direction ?? 0);
    const coneTargets = this._getFlameTemplateTargets({
      sourceToken,
      direction,
      distance: range,
      angle: 30
    });

    const baseDamageResult = await rollWeaponDamageWithRighteousFury(weapon.system?.damage);
    const damageResult = await applyUnstableDamageAdjustment(baseDamageResult, { weapon });
    const weaponTraining = this.getWeaponTrainingData(weapon);
    const attackResolution = {
      attackerActorUuid: this.uuid,
      weaponId: weapon.id,
      weaponName: weapon.name,
      attackType: "flame",
      primaryTargetName: "Manual Template Placement",
      range,
      templateUuid: placedTemplate.uuid ?? null,
      penetration: Number(weapon.system?.penetration ?? 0),
      damageTotal: Number(damageResult.total ?? 0),
      damageType: String(damageResult.damageType ?? ""),
      righteousFury: Boolean(damageResult.righteousFury),
      unstable: Boolean(damageResult.unstable),
      unstableRoll: Number(damageResult.unstableRoll ?? 0),
      unstableMultiplier: Number(damageResult.unstableMultiplier ?? 1),
      flexible: isFlexibleWeapon(weapon),
      dodgeModifier: Number(weaponTraining.dodgeModifierAgainstFlame ?? 0),
      targets: coneTargets.map((token) => ({
        actorUuid: token.actor?.uuid ?? null,
        tokenUuid: token.document?.uuid ?? null,
        name: token.name ?? token.actor?.name ?? "Target",
        resolved: false,
        resultLabel: "",
        appliedDamage: null
      }))
    };

    const remainingClip = Math.max(0, currentClip - ammoRequired);
    if (ammoRequired > 0 || !ammoInitialized) {
      await weapon.update({
        "system.currentClip": remainingClip,
        "flags.roguetrader.ammoInitialized": true
      });
    }

    if (isRechargeWeapon(weapon)) {
      await this._setWeaponRechargeCooldown(weapon);
    }

    const message = await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: this._buildFlameAttackFlavor(attackResolution),
      flags: {
        roguetrader: {
          flameAttackResolution: attackResolution
        }
      }
    });

    await this._playAutomatedAttackAnimation(weapon, coneTargets);

    return {
      message,
      weapon,
      attackType: "flame",
      targets: coneTargets,
      damageResult,
      attackResolution,
      extra
    };
  }

  async _rollGrenadeAttack(weapon, {
    attackType = "standard",
    rangeBandKey = "standard",
    modifier = 0,
    extra = [],
    twoWeaponFighting = false,
    calledShotLocation = "body",
    braceHeavyWeapon = false,
    maximalMode = null,
    fateReroll = false,
    replaceMessage = null
  } = {}) {
    const sourceToken = this.getActiveTokens?.()[0] ?? null;
    if (!sourceToken) {
      ui.notifications?.warn("Rogue Trader | An active token is required to throw a grenade.");
      return null;
    }

    const blastRadius = getBlastRadius(weapon);
    if (blastRadius <= 0) {
      ui.notifications?.warn("Rogue Trader | Grenades require a Blast value.");
      return null;
    }

    const placedTemplate = await this._placeBlastTemplate({
      distance: blastRadius,
      sourceActorUuid: this.uuid
    });
    if (!placedTemplate) return null;

    const strengthBonus = this.getCharacteristicBonus("strength");
    const grenadeRange = strengthBonus * 3;
    const baseTarget = this.getCharacteristicValue("ballisticSkill");
    const attackModifier = ATTACK_TYPE_MODIFIERS[attackType] ?? 0;
    const sourceCenter = getTokenCenter(sourceToken);
    const placedCenter = getTokenCenter(placedTemplate);
    const throwDistance = getCanvasDistanceInMetersBetweenPoints(sourceCenter, placedCenter);
    const derivedRangeBand = getGrenadeRangeBandData(throwDistance, grenadeRange);
    const weaponMasterData = this.getWeaponMasterData(weapon);
    const finalModifier = attackModifier + Number(modifier ?? 0) + Number(derivedRangeBand.modifier ?? 0) + Number(weaponMasterData.attackBonus ?? 0);

    const effectivePenetration = Number(weapon.system?.penetration ?? 0) + (resolvedMaximalMode ? 2 : 0);
    const effectiveRange = Number(weapon.system?.range ?? 0) + (resolvedMaximalMode ? 10 : 0);

    const result = await rollD100Test({
      actor: this,
      title: `${this.name}: ${weapon.name}`,
      target: baseTarget,
      modifier: finalModifier,
      breakdown: [
        `Ballistic Skill: ${baseTarget}`,
        `Attack Type: ${ATTACK_TYPE_LABELS[attackType] ?? attackType}`,
        `Grenade Range: ${grenadeRange} m`,
        `Throw Distance: ${throwDistance.toFixed(1)} m`,
        `Range Band: ${derivedRangeBand.label}`,
        ...(weaponMasterData.attackBonus ? [`Weapon Master (${weaponMasterData.label}): +${weaponMasterData.attackBonus}`] : []),
        ...extra
      ],
      extra: [
        `Blast: ${blastRadius}`,
        "Grenades do not require weapon training"
      ],
      fateReroll,
      replaceMessage,
      rollContextData: {
        attackContext: {
          weaponId: weapon.id,
          attackType,
          aimKey: "none",
          rangeBandKey,
          modifier: Number(modifier ?? 0),
          extra: foundry.utils.deepClone(extra ?? []),
          twoWeaponFighting: Boolean(twoWeaponFighting),
          calledShotLocation: String(calledShotLocation ?? "body"),
          braceHeavyWeapon: Boolean(braceHeavyWeapon),
          maximalMode: Boolean(resolvedMaximalMode),
          fullAutoAdvance: false
        }
      }
    });

    if (!result) {
      await placedTemplate.delete().catch(() => {});
      return null;
    }

    const malfunction = Number(result.rollTotal ?? 0) >= 96;
    if (malfunction) {
      const malfunctionRoll = await (new Roll("1d10")).evaluate({ async: true });
      const malfunctionValue = Number(malfunctionRoll.total ?? 0);

      if (malfunctionValue === 10) {
        const sourceCenter = getTokenCenter(sourceToken);
        await placedTemplate.update({ x: sourceCenter.x, y: sourceCenter.y });
        await this._createBlastResolutionFromTemplate({
          weapon,
          templateDocument: placedTemplate,
          centerName: `${this.name} (Immediate Detonation)`,
          rangeBandKey: derivedRangeBand.key,
          extraDice: 0,
          scopeLabel: "Targets Affected"
        });
        await this._playAutomatedAttackAnimation(weapon, [sourceToken]);
      } else {
        await placedTemplate.delete().catch(() => {});
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: ${weapon.name} Malfunction</h3>
            <p><strong>Attack Roll:</strong> ${result.rollTotal} (96-00)</p>
            <p><strong>Malfunction Roll:</strong> ${malfunctionValue}</p>
            <p><strong>Outcome:</strong> ${malfunctionValue === 10 ? "Grenade detonates immediately on the attacker." : "Dud. The grenade fails to detonate."}</p>
          </div>
        `
      });

      return {
        ...result,
        malfunction: true,
        dud: malfunctionValue !== 10,
        selfDetonation: malfunctionValue === 10
      };
    }

    if (result.success) {
      await this._createBlastResolutionFromTemplate({
        weapon,
        templateDocument: placedTemplate,
        centerName: "Desired Location",
        rangeBandKey: derivedRangeBand.key,
        extraDice: 0,
        scopeLabel: "Targets Affected"
      });
      await this._playAutomatedAttackAnimation(weapon, []);

      return {
        ...result,
        scattered: false
      };
    }

    const directionRoll = await (new Roll("1d10")).evaluate({ async: true });
    const distanceRoll = await (new Roll("1d5")).evaluate({ async: true });
    const directionValue = Number(directionRoll.total ?? 1);
    const scatterDistance = Number(distanceRoll.total ?? 0);
    const scatterDirection = directionValue === 1
      ? { label: "NW", dx: -1, dy: -1 }
      : directionValue === 2
        ? { label: "N", dx: 0, dy: -1 }
        : directionValue === 3
          ? { label: "NE", dx: 1, dy: -1 }
          : directionValue === 4
            ? { label: "W", dx: -1, dy: 0 }
            : directionValue === 5
              ? { label: "E", dx: 1, dy: 0 }
              : directionValue <= 7
                ? { label: "SW", dx: -1, dy: 1 }
                : directionValue === 8
                  ? { label: "S", dx: 0, dy: 1 }
                  : { label: "SE", dx: 1, dy: 1 };
    const scatterOffset = getCanvasDistanceInPixels(scatterDistance);
    await placedTemplate.update({
      x: Number(placedTemplate.x ?? 0) + scatterDirection.dx * scatterOffset,
      y: Number(placedTemplate.y ?? 0) + scatterDirection.dy * scatterOffset
    });

    await this._createBlastResolutionFromTemplate({
      weapon,
      templateDocument: placedTemplate,
      centerName: `Scattered ${scatterDistance} m ${scatterDirection.label}`,
      rangeBandKey: derivedRangeBand.key,
      extraDice: 0,
      scopeLabel: "Targets Affected"
    });
    await this._playAutomatedAttackAnimation(weapon, []);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: ${weapon.name} Scatter</h3>
          <p><strong>Attack Roll:</strong> ${result.rollTotal}</p>
          <p><strong>Outcome:</strong> Missed the intended point.</p>
          <p><strong>Direction:</strong> ${directionValue} (${scatterDirection.label})</p>
          <p><strong>Distance:</strong> ${scatterDistance} m</p>
        </div>
      `
    });

    return {
      ...result,
      scattered: true,
      scatterDirection: scatterDirection.label,
      scatterDistance
    };
  }

  async _clearWeaponOverheatCooldown(weapon) {
    await weapon.update({
      "flags.roguetrader.-=overheatCooldown": null
    });
  }

  async _clearWeaponRechargeCooldown(weapon) {
    await weapon.update({
      "flags.roguetrader.-=rechargeCooldown": null
    });
  }

  async _setWeaponJammed(weapon) {
    await weapon.update({
      "flags.roguetrader.jammed": true
    });
  }

  async _clearWeaponJam(weapon) {
    await weapon.update({
      "flags.roguetrader.-=jammed": null
    });
  }

  async _setWeaponOverheatCooldown(weapon) {
    const combat = game.combat;
    if (combat?.id) {
      await weapon.update({
        "flags.roguetrader.overheatCooldown": {
          combatId: combat.id,
          availableRound: Number(combat.round ?? 0) + 2,
          pendingOutsideCombat: false
        }
      });
      return;
    }

    await weapon.update({
      "flags.roguetrader.overheatCooldown": {
        combatId: "",
        availableRound: 0,
        pendingOutsideCombat: true
      }
    });
  }

  async _setWeaponRechargeCooldown(weapon) {
    const combat = game.combat;
    if (combat?.id) {
      await weapon.update({
        "flags.roguetrader.rechargeCooldown": {
          combatId: combat.id,
          availableRound: Number(combat.round ?? 0) + 2,
          pendingOutsideCombat: false
        }
      });
      return;
    }

    await weapon.update({
      "flags.roguetrader.rechargeCooldown": {
        combatId: "",
        availableRound: 0,
        pendingOutsideCombat: true
      }
    });
  }

  async _ensureWeaponCanFire(weapon) {
    if (isWeaponJammed(weapon)) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} is jammed and must be cleared before it can be fired.`);
      return false;
    }

    const combat = game.combat;
    const cooldownChecks = [
      {
        state: getWeaponOverheatCooldownState(weapon),
        clear: () => this._clearWeaponOverheatCooldown(weapon),
        inCombatMessage: `Rogue Trader | ${weapon.name} is still cooling down from overheating.`,
        outOfCombatMessage: `Rogue Trader | ${weapon.name} is cooling down and cannot be fired again yet.`
      },
      {
        state: getWeaponRechargeCooldownState(weapon),
        clear: () => this._clearWeaponRechargeCooldown(weapon),
        inCombatMessage: `Rogue Trader | ${weapon.name} is recharging and cannot be fired this round.`,
        outOfCombatMessage: `Rogue Trader | ${weapon.name} is recharging and cannot be fired again yet.`
      }
    ];

    for (const check of cooldownChecks) {
      const cooldown = check.state;
      if (!cooldown) continue;

      if (combat?.id && cooldown.combatId === combat.id) {
        const currentRound = Number(combat.round ?? 0);
        if (currentRound < Number(cooldown.availableRound ?? 0)) {
          ui.notifications?.warn(check.inCombatMessage);
          return false;
        }

        await check.clear();
        continue;
      }

      if (!combat?.id && cooldown.pendingOutsideCombat) {
        await check.clear();
        ui.notifications?.warn(check.outOfCombatMessage);
        return false;
      }

      await check.clear();
    }

    return true;
  }

  async clearJammedWeapon(weaponRef) {
    const weapon = this._resolveOwnedItem(weaponRef, "weapon");
    if (!weapon) {
      ui.notifications?.warn("Rogue Trader | Weapon not found on actor.");
      return null;
    }

    if (!isWeaponJammed(weapon)) {
      ui.notifications?.info(`Rogue Trader | ${weapon.name} is not jammed.`);
      return null;
    }

    const ballisticSkill = this.getCharacteristicValue("ballisticSkill");

    const result = await rollD100Test({
      actor: this,
      title: `${this.name}: Clear Jam (${weapon.name})`,
      target: ballisticSkill,
      modifier: 0,
      breakdown: [
        `Ballistic Skill: ${ballisticSkill}`,
        "Action: Full Action",
        "Test: Clear Weapon Jam"
      ],
      extra: [
        "On success, the Jam is cleared.",
        "The weapon must then be reloaded and any ammunition in it is lost."
      ]
    });

    if (!result) return null;

    if (result.success) {
      await weapon.update({
        "system.currentClip": 0,
        "flags.roguetrader.ammoInitialized": true
      });
      await this._clearWeaponJam(weapon);
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: Clear Jam</h3>
          <p><strong>Weapon:</strong> ${weapon.name}</p>
          <p><strong>Result:</strong> ${result.success ? "Success" : "Failure"}</p>
          <p><strong>Status:</strong> ${result.success ? "Jam Cleared" : "Weapon Still Jammed"}</p>
          ${result.success ? "<p><strong>Ammo:</strong> Any ammunition in the weapon is lost. Reload required.</p>" : ""}
        </div>
      `
    });

    return {
      ...result,
      cleared: Boolean(result.success),
      weaponId: weapon.id
    };
  }

  async _handleWeaponJam({ weapon, attackType, rollTotal, jamThreshold }) {
    const attackMode = String(attackType ?? "").trim();
    const resolvedThreshold = Number(jamThreshold ?? (["semiAuto", "fullAuto"].includes(attackMode) ? 94 : 96));
    const jammed = Number(rollTotal ?? 0) >= resolvedThreshold;
    if (!jammed) return null;

    await this._setWeaponJammed(weapon);

    const message = await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: ${weapon.name} Jammed</h3>
          <p><strong>Trigger:</strong> Attack roll ${rollTotal} (${resolvedThreshold}-00)</p>
          <p><strong>Effect:</strong> Automatic miss. The weapon cannot be fired until the jam is cleared.</p>
          <p><strong>Clear Jam:</strong> Full Action, Ballistic Skill Test. On success, the weapon is cleared but all ammo in it is lost.</p>
          <div class="roguetrader-attack-resolution-buttons">
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-clear-jam="true">Clear Jam</button>
          </div>
        </div>
      `,
      flags: {
        roguetrader: {
          clearJam: {
            actorUuid: this.uuid,
            weaponId: weapon.id
          }
        }
      }
    });

    return {
      jammed: true,
      threshold: resolvedThreshold,
      messageId: message?.id ?? null
    };
  }

  async _handleWeaponOverheat({ weapon, weaponClass, rollTotal }) {
    const overheatTriggered = isOverheatsWeapon(weapon) && Number(rollTotal ?? 0) >= 91;
    if (!overheatTriggered) return null;

    const oneHanded = ["pistol", "thrown"].includes(String(weaponClass ?? "").trim().toLowerCase());
    const armLocation = oneHanded
      ? "Right Arm"
      : (Math.random() < 0.5 ? "Right Arm" : "Left Arm");

    const dropWeapon = await Dialog.confirm({
      title: `${weapon.name}: Overheats`,
      content: `
        <p><strong>${weapon.name}</strong> overheats on the attack roll of ${rollTotal}.</p>
        <p>You may drop the weapon as a Free Action to avoid the damage.</p>
        <p>Select <strong>Yes</strong> to drop the weapon. Select <strong>No</strong> to keep hold and take the damage.</p>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: true
    });

    let dropped = false;
    let damageResult = null;
    let applied = null;

    if (dropWeapon) {
      dropped = true;
      await weapon.update({ "system.equipped": false });
    } else {
      damageResult = await rollWeaponDamageWithRighteousFury(weapon.system?.damage);
      applied = await this.applyDamageToLocation({
        damage: damageResult.total,
        penetration: 0,
        location: armLocation,
        damageType: damageResult.damageType || "E",
        sourceName: `${weapon.name} Overheat`
      });
    }

    await this._setWeaponOverheatCooldown(weapon);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: ${weapon.name} Overheats</h3>
          <p><strong>Trigger:</strong> Attack roll ${rollTotal} (91+)</p>
          <p><strong>Cooldown:</strong> The weapon must cool down before it can be fired again.</p>
          <p><strong>Weapon Dropped:</strong> ${dropped ? "Yes" : "No"}</p>
          ${dropped ? "" : `
            <p><strong>Location:</strong> ${armLocation}</p>
            <p><strong>Damage:</strong> ${damageResult?.total ?? 0} ${damageResult?.damageType || "E"}</p>
            <p><strong>Roll:</strong> ${damageResult ? formatDamageRollBreakdown(damageResult) : "-"}</p>
            <p><strong>After Soak:</strong> ${applied?.appliedDamage ?? 0}</p>
          `}
        </div>
      `
    });

    return {
      triggered: true,
      dropped,
      armLocation,
      damageResult,
      applied
    };
  }

  async rollAttack(weaponRef, {
    attackType = "standard",
    aimKey = "none",
    rangeBandKey = "standard",
    modifier = 0,
    extra = [],
    fullAutoAdvance = false,
    twoWeaponFighting = false,
    calledShotLocation = "body",
    braceHeavyWeapon = false,
    maximalMode = null,
    fateReroll = false,
    replaceMessage = null
  } = {}) {
    const weapon = this._resolveOwnedItem(weaponRef, "weapon");
    if (!weapon) {
      ui.notifications?.warn("Rogue Trader | Weapon not found on actor.");
      return null;
    }

    const resolvedMaximalMode = (maximalMode == null ? Boolean(weapon.system?.maximalMode) : Boolean(maximalMode)) && isPlasmaWeapon(weapon);

    if (this.isRestrictedFromRangedAttack(weapon)) {
      ui.notifications?.warn("Rogue Trader | You cannot make that ranged attack while engaged in melee with a hostile target. Use a melee weapon or a pistol.");
      return null;
    }

    if (!fateReroll) {
      const canFire = await this._ensureWeaponCanFire(weapon);
      if (!canFire) return null;
    }

    if (isGrenadeWeapon(weapon)) {
      return this._rollGrenadeAttack(weapon, {
        attackType,
        rangeBandKey,
        modifier,
        extra,
        twoWeaponFighting,
        calledShotLocation,
        braceHeavyWeapon,
        fateReroll,
        replaceMessage
      });
    }

    if (attackType === "suppressiveFire") {
      return this._rollSuppressiveFireAttack(weapon, {
        aimKey,
        rangeBandKey,
        modifier,
        extra,
        fateReroll,
        replaceMessage,
        maximalMode: resolvedMaximalMode
      });
    }

    if (attackType === "flame" || isFlameWeapon(weapon)) {
      return this._rollFlameAttack(weapon, { extra });
    }

    const weaponClass = weapon.system.class ?? "basic";
    if (this.isFrenzied() && String(weaponClass).trim().toLowerCase() === "melee" && attackType !== "allOut") {
      attackType = "allOut";
    }
    const characteristicKey = weaponClass === "melee" ? "weaponSkill" : "ballisticSkill";
    const baseTarget = this.getCharacteristicValue(characteristicKey);
    const attackModifier = attackType === "charge"
      ? this.getChargeAttackModifier()
      : (ATTACK_TYPE_MODIFIERS[attackType] ?? 0);
    const accurateAimBonus = getAccurateAimBonus(weapon, aimKey);
    const defensiveAttackPenalty = isDefensiveWeapon(weapon) ? -10 : 0;
    const twinLinkedAttackBonus = isTwinLinkedWeapon(weapon) ? 20 : 0;
    const effectiveHeavyBracing = String(weaponClass).trim().toLowerCase() === "heavy"
      ? (Boolean(braceHeavyWeapon) || this.isHeavyWeaponBraced(weapon))
      : false;
    const unbracedHeavyPenalty = String(weaponClass).trim().toLowerCase() === "heavy" && !effectiveHeavyBracing ? -30 : 0;
    const weaponTraining = this.getWeaponTrainingData(weapon);
    const weaponMasterData = this.getWeaponMasterData(weapon);
    const attackerProneModifier = characteristicKey === "weaponSkill" ? this.getProneWeaponSkillModifier() : 0;
    const totalModifier = attackModifier + Number(modifier ?? 0) + accurateAimBonus + defensiveAttackPenalty + twinLinkedAttackBonus + unbracedHeavyPenalty + Number(weaponTraining.untrainedPenalty ?? 0) + attackerProneModifier + Number(weaponMasterData.attackBonus ?? 0);
    const title = `${this.name}: ${weapon.name}`;
    const rof = parseRateOfFire(weapon.system.rof);
    const targets = Array.from(game.user?.targets ?? []);
    const primaryTarget = targets[0] ?? null;

    if (!primaryTarget) {
      ui.notifications?.warn("Rogue Trader | You must target a token before making an attack.");
      return null;
    }

    if (attackType === "semiAuto" && rof.semiAuto <= 0) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} cannot make a Semi-Auto Burst.`);
      return null;
    }

    if (attackType === "fullAuto" && rof.fullAuto <= 0) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} cannot make a Full Auto Burst.`);
      return null;
    }

    if (String(weaponClass).trim().toLowerCase() === "heavy" && ["semiAuto", "fullAuto", "suppressiveFire"].includes(attackType) && !effectiveHeavyBracing) {
      ui.notifications?.warn("Rogue Trader | Heavy weapons must be braced to use Semi-Auto Burst, Full Auto Burst, or Suppressive Fire.");
      return null;
    }

    const targetSizeModifier = characteristicKey === "ballisticSkill" && primaryTarget?.actor
      ? primaryTarget.actor.getSizeAttackModifier()
      : { category: "", label: "", modifier: 0 };
    const targetProneMeleeModifier = characteristicKey === "weaponSkill" && primaryTarget?.actor?.isProne?.() ? 10 : 0;
    const targetProneRangedModifier = characteristicKey === "ballisticSkill"
      && primaryTarget?.actor?.isProne?.()
      && String(rangeBandKey ?? "standard") !== "pointBlank"
      ? -10
      : 0;

    let finalModifier = totalModifier
      + Number(targetSizeModifier.modifier ?? 0)
      + targetProneMeleeModifier
      + targetProneRangedModifier;
    if (attackType === "fullAuto" && fullAutoAdvance) {
      const normalizedClass = String(weaponClass).trim().toLowerCase();
      if (!["pistol", "basic"].includes(normalizedClass)) {
        ui.notifications?.warn("Rogue Trader | Only Pistol and Basic weapons may move while using Full Auto Burst.");
        return null;
      }

      finalModifier = finalModifier + 30;
    }

    const usesAmmo = !["melee", "thrown"].includes(String(weaponClass).trim().toLowerCase());
    const stormWeapon = isStormWeapon(weapon);
    const twinLinkedWeapon = isTwinLinkedWeapon(weapon);
    const ammoMultiplier = (stormWeapon ? 2 : 1) * (twinLinkedWeapon ? 2 : 1) * (resolvedMaximalMode ? 3 : 1);
    const ammoRequired = usesAmmo
      ? getAttackAmmoRequirement(attackType, rof) * ammoMultiplier
      : 0;
    const { maxClip, currentClip, ammoInitialized } = getWeaponAmmoState(weapon);

    if (usesAmmo && ammoRequired > 0 && currentClip < ammoRequired) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} does not have enough ammunition (${currentClip}/${ammoRequired} required).`);
      return null;
    }

    const effectivePenetration = Number(weapon.system?.penetration ?? 0) + (resolvedMaximalMode ? 2 : 0);
    const effectiveRange = Number(weapon.system?.range ?? 0) + (resolvedMaximalMode ? 10 : 0);

    const result = await rollD100Test({
      actor: this,
      title,
      target: baseTarget,
      modifier: finalModifier,
      breakdown: [
        `${getCharacteristicLabel(characteristicKey)}: ${baseTarget}`,
        `Attack Type: ${ATTACK_TYPE_LABELS[attackType] ?? attackType}${attackType === "charge" ? ` (${formatSignedModifier(attackModifier)})` : ""}`,
        `Weapon Class: ${weaponClass}`,
        `Target: ${primaryTarget.name}`,
        ...(targetSizeModifier.modifier ? [`Target Size: ${targetSizeModifier.label} (${formatSignedModifier(targetSizeModifier.modifier)})`] : []),
        ...(attackerProneModifier ? [`Prone (Attacker): ${formatSignedModifier(attackerProneModifier)}`] : []),
        ...(targetProneMeleeModifier ? [`Target Prone (Melee): ${formatSignedModifier(targetProneMeleeModifier)}`] : []),
        ...(targetProneRangedModifier ? [`Target Prone (Ranged): ${formatSignedModifier(targetProneRangedModifier)}`] : []),
        ...(accurateAimBonus ? [`Accurate + Aim: +${accurateAimBonus}`] : []),
        ...(weaponMasterData.attackBonus ? [`Weapon Master (${weaponMasterData.label}): +${weaponMasterData.attackBonus}`] : []),
        ...(String(weaponClass).trim().toLowerCase() === "heavy" ? [`Heavy Weapon Braced: ${effectiveHeavyBracing ? "Yes" : "No"}`] : []),
        ...(unbracedHeavyPenalty ? [`Unbraced Heavy Weapon: ${unbracedHeavyPenalty}`] : []),
        ...(defensiveAttackPenalty ? [`Defensive: ${defensiveAttackPenalty}`] : []),
        ...(twinLinkedAttackBonus ? [`Twin-linked: +${twinLinkedAttackBonus}`] : []),
        ...(weaponTraining.untrainedPenalty ? [`Untrained Weapon Use: ${weaponTraining.untrainedPenalty}`] : []),
        ...(twoWeaponFighting ? ["Two-Weapon Fighting: Enabled"] : []),
        ...(this.isFrenzied() && String(weaponClass).trim().toLowerCase() === "melee" ? ["Frenzied: All Out Attack required"] : []),
        ...(resolvedMaximalMode ? ["Maximal Mode: Enabled"] : []),
        ...(attackType === "calledShot" ? [`Called Shot Location: ${getCalledShotLocationLabel(calledShotLocation)}`] : []),
        ...(attackType === "fullAuto" && fullAutoAdvance ? [`Advance While Firing: Yes (+30 adjustment from base Full Auto modifier)`] : [])
      ],
      extra: [
        `Damage: ${weapon.system.damage || "-"}`,
        `Pen: ${effectivePenetration}`,
        `Range: ${weaponClass === "melee" ? "Melee" : `${effectiveRange} m`}`,
        `RoF: ${weaponClass === "melee" ? "Melee" : (weapon.system.rof || "-")}`,
        ...(weaponTraining.reason ? [`Training: ${weaponTraining.reason}`] : []),
        ...(usesAmmo ? [`Ammo: ${currentClip}/${maxClip}`, `Ammo Cost: ${ammoRequired}`] : []),
        ...(resolvedMaximalMode ? ["Maximal Mode Effects: +1d10 damage, +2 Pen, +10 m range, x3 ammo"] : []),
        ...extra
      ],
      fateReroll,
      replaceMessage,
      rollContextData: {
        attackContext: {
          weaponId: weapon.id,
          attackType,
          aimKey,
          rangeBandKey,
          modifier: Number(modifier ?? 0),
          extra: foundry.utils.deepClone(extra ?? []),
          twoWeaponFighting: Boolean(twoWeaponFighting),
          calledShotLocation: String(calledShotLocation ?? "body"),
          braceHeavyWeapon: Boolean(braceHeavyWeapon),
          maximalMode: Boolean(resolvedMaximalMode),
          fullAutoAdvance: Boolean(fullAutoAdvance)
        }
      }
    });

    if (!result) return null;

    const remainingClip = usesAmmo && ammoRequired > 0
      ? Math.max(0, currentClip - ammoRequired)
      : currentClip;

    if (!fateReroll && usesAmmo && (ammoRequired > 0 || !ammoInitialized)) {
      await weapon.update({
        "system.currentClip": remainingClip,
        "flags.roguetrader.ammoInitialized": true
      });
    }

    if (!fateReroll && isRechargeWeapon(weapon)) {
      await this._setWeaponRechargeCooldown(weapon);
    }

    const resultExtra = [];
    const hitLocation = attackType === "calledShot"
      ? { reversedRoll: null, label: getCalledShotLocationLabel(calledShotLocation) }
      : getHitLocationLabelFromRoll(result.rollTotal);
    const overheated = isOverheatsWeapon(weapon) && Number(result.rollTotal ?? 0) >= 91;
    const baseJamThreshold = ["semiAuto", "fullAuto"].includes(attackType) ? 94 : 96;
    const jamThreshold = Math.min(
      baseJamThreshold,
      isUnreliableWeapon(weapon) ? 91 : 100,
      weaponTraining.jamThreshold != null ? Number(weaponTraining.jamThreshold) : 100
    );
    const jamCandidate = !overheated && usesAmmo && Number(result.rollTotal ?? 0) >= jamThreshold;
    let jammed = false;
    let reliableJamRoll = null;

    if (jamCandidate) {
      if (isReliableWeapon(weapon)) {
        const roll = await (new Roll("1d10")).evaluate();
        reliableJamRoll = Number(roll.total ?? 0);
        jammed = reliableJamRoll === 10;
        await roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: `
            <div class="roguetrader-roll-card">
              <h3>${this.name}: Reliable Check</h3>
              <p><strong>Weapon:</strong> ${weapon.name}</p>
              <p><strong>Trigger:</strong> Attack roll ${result.rollTotal} (${jamThreshold}-00)</p>
              <p><strong>Outcome:</strong> ${jammed ? "Weapon Jammed" : "Reliable quality prevented the jam"}</p>
            </div>
          `
        });
      } else {
        jammed = true;
      }

      resultExtra.push(`Automatic Miss: Yes`);
      if (isReliableWeapon(weapon)) {
        resultExtra.push(`Reliable Check: ${reliableJamRoll ?? "-"}${jammed ? " (Jammed)" : " (No Jam)"}`);
      }
      if (weaponTraining.jamThreshold != null) {
        resultExtra.push("Untrained Ranged Use: Counts as Unreliable");
      }
      if (isUnreliableWeapon(weapon)) {
        resultExtra.push("Unreliable: Jams on 91-00");
      }
      if (jammed) {
        resultExtra.push(`Jammed: Yes (${jamThreshold}-00 on ${ATTACK_TYPE_LABELS[attackType] ?? attackType})`);
      } else {
        resultExtra.push(`Jammed: No (${jamThreshold}-00 on ${ATTACK_TYPE_LABELS[attackType] ?? attackType})`);
      }
    }
    if (overheated) {
      resultExtra.push("Overheats: Yes (91+)");
    }

    if (usesAmmo && ammoRequired > 0) {
      resultExtra.push(`Ammo Spent: ${ammoRequired}`);
      resultExtra.push(`Ammo Remaining: ${remainingClip}/${maxClip}`);
      if (stormWeapon) {
        resultExtra.push("Storm: Ammo consumption doubled");
      }
      if (twinLinkedWeapon) {
        resultExtra.push("Twin-linked: Ammo consumption doubled");
      }
    }
    if (isRechargeWeapon(weapon)) {
      resultExtra.push("Recharge: Must spend the following round recharging");
    }
    if (twinLinkedWeapon) {
      resultExtra.push("Twin-linked: Reload time doubled (manual for now)");
    }

    let hits = 0;
    let reactionResult = null;
    let damageResults = [];
    const accurateDamageDice = result.success && !jamCandidate
        ? getAccurateDamageDice(weapon, { attackType, aimKey, degrees: result.degrees })
        : 0;
    if (result.success && !jamCandidate) {
        let baseHits = 1;
        if (attackType === "semiAuto") {
          baseHits = Math.min(rof.semiAuto, 1 + Math.floor(Number(result.degrees ?? 0) / 2));
        } else if (attackType === "fullAuto") {
          baseHits = Math.min(rof.fullAuto, 1 + Number(result.degrees ?? 0));
        }
        if (twinLinkedWeapon && Number(result.degrees ?? 0) >= 2) {
          baseHits += 1;
        }
        hits = stormWeapon ? baseHits * 2 : baseHits;
        if (isScatterWeapon(weapon) && String(rangeBandKey ?? "standard") === "pointBlank") {
          hits += Math.max(0, Math.floor(Number(result.degrees ?? 0) / 2));
        }

        const hitLocations = hits > 1
          ? getMultipleHitLocations(hitLocation.label, hits)
          : [hitLocation.label];

        resultExtra.push(`Hit Location: ${hitLocation.label} (${getRollDigitsForHitLocation(result.rollTotal)} -> ${String(hitLocation.reversedRoll).padStart(2, "0")})`);
        resultExtra.push(`Hits: ${hits}`);
        if (twinLinkedWeapon && Number(result.degrees ?? 0) >= 2) {
          resultExtra.push("Twin-linked: +1 hit for 2+ DoS");
        }
        if (stormWeapon) {
          resultExtra.push(`Storm: Base hits doubled (${baseHits} -> ${hits})`);
        }
        if (isScatterWeapon(weapon) && String(rangeBandKey ?? "standard") === "pointBlank") {
          resultExtra.push("Scatter: +1 hit per 2 DoS at Point Blank");
        }
        if (hitLocations.length > 1) {
          resultExtra.push(`Same-Target Extra Hits: ${hitLocations.map((location, index) => `#${index + 1} ${location}`).join(", ")}`);
        }
        if (primaryTarget?.actor && result.message) {
          const attackResolution = {
            attackerActorUuid: this.uuid,
            targetActorUuid: primaryTarget.actor.uuid,
            targetTokenUuid: primaryTarget.document?.uuid ?? null,
            weaponId: weapon.id,
            weaponName: weapon.name,
            weaponClass: String(weapon.system?.class ?? "").trim().toLowerCase(),
            attackType,
            aimKey,
            rangeBandKey,
            hits,
            hitLocations,
            penetration: Number(weapon.system?.penetration ?? 0),
            damage: String(weapon.system?.damage ?? ""),
            accurateDamageDice,
            maximalMode: Boolean(resolvedMaximalMode),
            flexible: isFlexibleWeapon(weapon),
            dodgeModifier: Number(weaponTraining.dodgeModifierAgainstFlame ?? 0),
            resolved: false
          };
          await result.message.update({
            flavor: `${result.message.flavor}<p>${resultExtra.join(" | ")}</p>${this._buildPendingAttackResolutionMarkup(attackResolution)}`,
            "flags.roguetrader.attackResolution": attackResolution
          });
          resultExtra.length = 0;
        } else if (hits > 0) {
          damageResults = await this._rollAttackDamage({
            weapon,
            target: primaryTarget,
            hitLocations,
            extraDice: accurateDamageDice,
            rangeBandKey,
            maximalMode: resolvedMaximalMode
          });
          if (damageResults.length) {
            resultExtra.push(`Damage Rolls: ${damageResults.map((entry, index) => `#${index + 1} ${entry.total}`).join(", ")}`);
            if (damageResults.some((entry) => entry.righteousFury)) {
              resultExtra.push("Righteous Fury: Yes");
            }
          }
          if (isScatterWeapon(weapon) && String(rangeBandKey ?? "standard") === "pointBlank") {
            resultExtra.push("Scatter: Point Blank extra hits applied");
          }
          if (accurateDamageDice > 0) {
            resultExtra.push(`Accurate Extra Damage: +${accurateDamageDice}d10`);
          }
        } else {
          resultExtra.push("Attack Negated: Yes");
        }
    } else {
      resultExtra.push(`Hit Location (on success): ${hitLocation.label} (${getRollDigitsForHitLocation(result.rollTotal)} -> ${String(hitLocation.reversedRoll).padStart(2, "0")})`);
    }

    if (resultExtra.length) {
      await result.message?.update({
        flavor: `${result.message.flavor}<p>${resultExtra.join(" | ")}</p>`
      });
    }

    const overheatResult = overheated
      ? await this._handleWeaponOverheat({
        weapon,
        weaponClass,
        rollTotal: result.rollTotal
      })
      : null;
    const jamResult = jammed
      ? await this._handleWeaponJam({
        weapon,
        attackType,
        rollTotal: result.rollTotal,
        jamThreshold
      })
      : null;

    await this._playAutomatedAttackAnimation(weapon, targets);

    return {
      ...result,
      jammed,
      jamResult,
      overheated,
      overheatResult,
      hitLocation: result.success && !jamCandidate ? hitLocation : null,
      hits,
        damageResults,
        hitLocations: result.success && !jamCandidate
          ? (hits > 1 ? getMultipleHitLocations(hitLocation.label, hits) : [hitLocation.label])
          : [],
        reactionResult
    };
  }

  _buildPendingAttackResolutionMarkup(attackResolution) {
    const isMeleeAttack = String(attackResolution.weaponClass ?? "").trim().toLowerCase() === "melee";
    const attackTypeLabel = ATTACK_TYPE_LABELS[attackResolution.attackType] ?? attackResolution.attackType;
    const canParry = isMeleeAttack && !Boolean(attackResolution.flexible);
    const parryButton = canParry
      ? `<button type="button" class="roguetrader-attack-resolution-button" data-rt-attack-resolution="parry">Parry</button>`
      : "";
    const flexibleNote = isMeleeAttack && !canParry
      ? `<p><strong>Flexible:</strong> This attack cannot be parried.</p>`
      : "";

    return `
      <div class="roguetrader-attack-resolution" data-rt-attack-resolution-container="true">
        <p><strong>Defence Pending:</strong> ${attackResolution.weaponName} | ${attackTypeLabel} | ${attackResolution.hits} incoming hit${attackResolution.hits === 1 ? "" : "s"}</p>
        ${flexibleNote}
        <div class="roguetrader-attack-resolution-buttons">
          <button type="button" class="roguetrader-attack-resolution-button" data-rt-attack-resolution="dodge">Dodge</button>
          ${parryButton}
          <button type="button" class="roguetrader-attack-resolution-button" data-rt-attack-resolution="none">Take Hit</button>
        </div>
      </div>
    `;
  }

  async resolveAttackResolutionMessage(message, action = "none") {
    const attackResolution = foundry.utils.deepClone(message?.flags?.roguetrader?.attackResolution ?? null);
    if (!attackResolution) return null;
    if (attackResolution.resolved) {
      ui.notifications?.warn("Rogue Trader | That attack has already been resolved.");
      return null;
    }

    const targetActor = await fromUuid(attackResolution.targetActorUuid);
    const targetToken = attackResolution.targetTokenUuid ? await fromUuid(attackResolution.targetTokenUuid) : null;
    const weapon = this.items.get(attackResolution.weaponId) ?? null;
    if (!targetActor || !weapon) {
      ui.notifications?.warn("Rogue Trader | Could not resolve the pending attack context.");
      return null;
    }

    let reactionResult = {
      attempted: false,
      label: "No Reaction",
      negatedHits: 0
    };

    if (action === "dodge") {
      reactionResult = await targetActor._rollDodgeReaction(
        this,
        weapon,
        attackResolution.attackType,
        attackResolution.hits,
        Number(attackResolution.dodgeModifier ?? 0)
      );
    } else if (action === "parry" && String(attackResolution.weaponClass ?? "").trim().toLowerCase() === "melee" && !attackResolution.flexible) {
      reactionResult = await targetActor._rollParryReaction(this, weapon, attackResolution.attackType, attackResolution.hits);
    }

      const remainingHitLocations = attackResolution.hitLocations.slice(Number(reactionResult.negatedHits ?? 0));
      const damageResults = remainingHitLocations.length
        ? await this._rollAttackDamage({
          weapon,
          target: targetToken,
          hitLocations: remainingHitLocations,
          extraDice: Number(attackResolution.accurateDamageDice ?? 0),
          rangeBandKey: String(attackResolution.rangeBandKey ?? "standard"),
          maximalMode: Boolean(attackResolution.maximalMode)
        })
        : [];
      const blastResult = remainingHitLocations.length && isBlastWeapon(weapon) && targetToken
        ? await this._resolveBlastAttack({
          weapon,
          centerToken: targetToken,
          extraDice: Number(attackResolution.accurateDamageDice ?? 0),
          rangeBandKey: String(attackResolution.rangeBandKey ?? "standard"),
          maximalMode: Boolean(attackResolution.maximalMode)
        })
        : null;

    attackResolution.resolved = true;
    attackResolution.reactionResult = {
      attempted: Boolean(reactionResult.attempted),
      label: reactionResult.label,
      negatedHits: Number(reactionResult.negatedHits ?? 0)
    };
    attackResolution.remainingHits = remainingHitLocations.length;

    await message.update({
      flavor: `${message.flavor}
        <div class="roguetrader-attack-resolution-result">
          <p><strong>Defence:</strong> ${reactionResult.label}</p>
          <p><strong>Hits Negated:</strong> ${Number(reactionResult.negatedHits ?? 0)}</p>
          <p><strong>Hits Remaining:</strong> ${remainingHitLocations.length}</p>
          ${blastResult ? `<p><strong>Blast:</strong> ${blastResult.blastRadius} m radius, ${blastResult.targets.length} target(s) affected</p>` : ""}
          ${damageResults.length ? `<p><strong>Damage Rolls:</strong> ${damageResults.map((entry, index) => `#${index + 1} ${entry.total}`).join(", ")}</p>` : "<p><strong>Damage Rolls:</strong> None</p>"}
        </div>`.replace(/<div class="roguetrader-attack-resolution"[\s\S]*?<\/div>/, ""),
      "flags.roguetrader.attackResolution": attackResolution
    });

    return {
      reactionResult,
      remainingHitLocations,
      damageResults,
      blastResult
    };
  }

  async resolveFlameAttackResolutionMessage(message, targetTokenUuid, action = "none") {
    const attackResolution = foundry.utils.deepClone(message?.flags?.roguetrader?.flameAttackResolution ?? null);
    if (!attackResolution) return null;

    const targetEntry = attackResolution.targets.find((target) => target.tokenUuid === targetTokenUuid);
    if (!targetEntry) {
      ui.notifications?.warn("Rogue Trader | Could not find that flame target.");
      return null;
    }

    if (targetEntry.resolved) {
      ui.notifications?.warn("Rogue Trader | That target has already resolved the flame attack.");
      return null;
    }

    const targetActor = await fromUuid(targetEntry.actorUuid);
    const weapon = this.items.get(attackResolution.weaponId) ?? null;
    if (!targetActor || !weapon) {
      ui.notifications?.warn("Rogue Trader | Could not resolve the flame attack context.");
      return null;
    }

    let reactionResult = {
      attempted: false,
      label: "Took Hit",
      negatedHits: 0
    };

    if (action === "dodge") {
      reactionResult = await targetActor._rollDodgeReaction(
        this,
        weapon,
        "flame",
        1,
        Number(attackResolution.dodgeModifier ?? 0)
      );
    }

    if (Number(reactionResult.negatedHits ?? 0) > 0) {
      targetEntry.resolved = true;
      targetEntry.resultLabel = reactionResult.label;
      targetEntry.appliedDamage = 0;
    } else {
      const applied = await this._applySharedDamageResultToTarget(targetActor, attackResolution, "Body");
      targetEntry.resolved = true;
      targetEntry.resultLabel = reactionResult.attempted ? reactionResult.label : "Hit Applied";
      targetEntry.appliedDamage = Number(applied?.appliedDamage ?? 0);
      await targetActor.checkIgniteFromFlameHit({
        weapon,
        appliedDamage: targetEntry.appliedDamage,
        hitLanded: true
      });
    }

    await message.update({
      flavor: this._buildFlameAttackFlavor(attackResolution),
      "flags.roguetrader.flameAttackResolution": attackResolution
    });

    return {
      reactionResult,
      targetEntry
    };
  }

  async deleteFlameAttackTemplate(message) {
    const attackResolution = message?.flags?.roguetrader?.flameAttackResolution ?? null;
    const templateUuid = String(attackResolution?.templateUuid ?? "").trim();
    if (!templateUuid) return false;

    const templateDocument = await fromUuid(templateUuid);
    if (!templateDocument) return false;

    await templateDocument.delete();

    const updatedResolution = foundry.utils.deepClone(attackResolution);
    updatedResolution.templateUuid = null;
    await message.update({
      flavor: this._buildFlameAttackFlavor(updatedResolution),
      "flags.roguetrader.flameAttackResolution": updatedResolution
    });

    return true;
  }

  async _playAutomatedAttackAnimation(weapon, targets = []) {
    if (!game.modules.get("autoanimations")?.active) return;

    const sourceToken = this.getActiveTokens?.()[0] ?? null;
    if (!sourceToken) return;

    const targetArray = Array.from(targets ?? []).filter(Boolean);

    try {
      const aaApi = globalThis.AutomatedAnimations ?? game.modules.get("autoanimations")?.api;
      if (aaApi?.playAnimation) {
        await aaApi.playAnimation(sourceToken, weapon, { targets: targetArray });
        return;
      }

      if (aaApi?.PlayAnimation) {
        await aaApi.PlayAnimation(sourceToken, targetArray, weapon, {});
      }
    } catch (error) {
      console.warn("Rogue Trader | Automated Animations trigger failed.", error);
    }
  }

  async _rollAttackDamage({ weapon = null, target = null, hitLocations = [], extraDice = 0, rangeBandKey = "standard", maximalMode = false } = {}) {
    if (!weapon || !hitLocations.length) return [];

    const damageResults = [];
    const maximal = Boolean(maximalMode) && isPlasmaWeapon(weapon);
    const penetration = Number(weapon.system?.penetration ?? 0) + (maximal ? 2 : 0);
    const weaponClass = String(weapon.system?.class ?? "").trim().toLowerCase();
    const weaponMasterData = this.getWeaponMasterData(weapon);
    const strengthValue = this.getCharacteristicValue("strength");
    const strengthBonusMultiplier = this.getCharacteristicBonusMultiplier("strength");
    const baseStrengthBonus = Math.floor(strengthValue / 10);
    let meleeStrengthBonus = 0;
    let meleeStrengthBonusTitle = "";
    let meleeStrengthBonusDetail = "";
    if (weaponClass === "melee") {
      if (isPowerFistWeapon(weapon)) {
        meleeStrengthBonus = this.getCharacteristicBonus("strength") * 2;
        meleeStrengthBonusTitle = "Strength Bonus";
        meleeStrengthBonusDetail = `Power Fist +${meleeStrengthBonus} (${this.getCharacteristicBonus("strength")} x 2)`;
      } else if (isThunderHammerWeapon(weapon)) {
        const thunderHammerMultiplier = strengthBonusMultiplier > 1 ? strengthBonusMultiplier + 1 : 2;
        meleeStrengthBonus = baseStrengthBonus * thunderHammerMultiplier;
        meleeStrengthBonusTitle = "Strength Bonus";
        meleeStrengthBonusDetail = strengthBonusMultiplier > 1
          ? `Thunder Hammer +${meleeStrengthBonus} (SB ${baseStrengthBonus} x ${thunderHammerMultiplier}; Unnatural +1)`
          : `Thunder Hammer +${meleeStrengthBonus} (SB ${baseStrengthBonus} x 2)`;
      } else {
        meleeStrengthBonus = this.getCharacteristicBonus("strength");
        meleeStrengthBonusTitle = "Melee Strength Bonus";
        meleeStrengthBonusDetail = `+${meleeStrengthBonus}`;
      }
    }
    const weaponMasterDamageBonus = Number(weaponMasterData.damageBonus ?? 0);
    for (const location of hitLocations) {
      const baseDamageResult = await rollWeaponDamageWithRighteousFury(weapon.system?.damage, {
        extraDice: Number(extraDice ?? 0) + (maximal ? 1 : 0),
        flatBonus: meleeStrengthBonus + weaponMasterDamageBonus,
        tearing: isTearingWeapon(weapon)
      });
      const damageResult = await applyUnstableDamageAdjustment(baseDamageResult, { weapon });
      const applied = target?.actor
        ? await target.actor.applyDamageToLocation({
          damage: damageResult.total,
            penetration,
            location,
            damageType: damageResult.damageType,
            sourceName: weapon.name,
            sourceWeapon: weapon,
            sourceRangeBand: rangeBandKey
          })
          : null;
      if (target?.actor && applied) {
        await target.actor.checkShockingEffect({
          weapon,
          applied,
          location
        });
        await target.actor.checkToxicEffect({
          weapon,
          applied,
          location
        });
        if (isFlameWeapon(weapon) || isCleansingFireWeapon(weapon)) {
          await target.actor.checkIgniteFromFlameHit({
            weapon,
            appliedDamage: applied.appliedDamage,
            hitLanded: true
          });
        }
      }
      damageResults.push({
        ...damageResult,
        location,
        penetration,
        applied
      });
    }

    const speaker = ChatMessage.getSpeaker({ actor: this });
    const targetName = target?.name ?? "Target";
    const righteousTriggered = damageResults.some((entry) => entry.righteousFury);
    const rows = damageResults.map((entry, index) => `
      <div class="roguetrader-damage-entry">
        <p><strong>Hit ${index + 1}:</strong> ${entry.location}</p>
        <p><strong>Damage:</strong> ${entry.total} ${entry.damageType || "-"}</p>
        <p><strong>Roll:</strong> ${formatDamageRollBreakdown(entry)}</p>
        ${maximal ? `<p><strong>Maximal Mode:</strong> +1d10 damage, +2 Pen</p>` : ""}
        ${entry.unstable ? `<p><strong>Unstable:</strong> ${entry.unstableRoll} (${entry.unstableMultiplier === 0.5 ? "Half Damage" : entry.unstableMultiplier === 2 ? "Double Damage" : "Normal Damage"})</p>` : ""}
        <p><strong>After Soak:</strong> ${entry.applied ? entry.applied.appliedDamage : 0}</p>
      </div>
    `).join("");

    await ChatMessage.create({
      speaker,
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.name}: ${weapon.name} Damage</h3>
          <p><strong>Target:</strong> ${targetName}</p>
          <p><strong>Righteous Fury:</strong> ${righteousTriggered ? "Yes!" : "No"}</p>
          ${meleeStrengthBonus > 0 ? `<p><strong>${meleeStrengthBonusTitle}:</strong> ${meleeStrengthBonusDetail}</p>` : ""}
          ${weaponMasterDamageBonus > 0 ? `<p><strong>Weapon Master (${weaponMasterData.label}):</strong> +${weaponMasterDamageBonus} damage</p>` : ""}
          ${Number(extraDice ?? 0) > 0 ? `<p><strong>Accurate Extra Damage:</strong> +${Number(extraDice)}d10</p>` : ""}
          ${isTearingWeapon(weapon) ? "<p><strong>Tearing:</strong> +1 damage die, lowest discarded</p>" : ""}
          ${isUnstableWeapon(weapon) ? "<p><strong>Unstable:</strong> Roll 1d10 per hit (1 = half damage, 10 = double damage)</p>" : ""}
          <div class="roguetrader-damage-list">${rows}</div>
        </div>
      `
    });

    if (target?.actor && damageResults.length) {
      await target.actor.checkSnareEffect({
        weapon
      });
    }

    return damageResults;
  }

  _getCombatReactionState() {
    const state = this.flags?.roguetrader?.reactionState ?? {};
    const combat = game.combat;
    if (!combat?.id) return { active: false, spent: false, type: null };
    const sameCombat = state.combatId === combat.id && Number(state.round ?? -1) === Number(combat.round ?? -1);
    return sameCombat
      ? { active: true, spent: Boolean(state.spent), type: state.type ?? null }
      : { active: true, spent: false, type: null };
  }

  async _consumeReaction(type = "reaction") {
    const combat = game.combat;
    if (!combat?.id) return;
    await this.update({
      "flags.roguetrader.reactionState": {
        combatId: combat.id,
        round: Number(combat.round ?? 0),
        spent: true,
        type
      }
    });
  }

  async _promptDefensiveReaction({ attacker = null, weapon = null, attackType = "standard", hits = 1, targetToken = null } = {}) {
    const reactionState = this._getCombatReactionState();
    if (reactionState.active && reactionState.spent) {
      return {
        attempted: false,
        label: `No Reaction Available (${reactionState.type ?? "already used"})`,
        negatedHits: 0
      };
    }

    const weaponClass = String(weapon?.system?.class ?? "").trim().toLowerCase();
    const isMeleeAttack = weaponClass === "melee";
    const buttons = {
      none: {
        label: "No Reaction",
        callback: () => ({
          action: "none"
        })
      },
      dodge: {
        label: "Dodge",
        callback: () => ({
          action: "dodge"
        })
      }
    };

    if (isMeleeAttack) {
      buttons.parry = {
        label: "Parry",
        callback: () => ({
          action: "parry"
        })
      };
    }

    const choice = await new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.name}: Defensive Reaction`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p><strong>Attacker:</strong> ${attacker?.name ?? "Unknown"}</p>
            <p><strong>Weapon:</strong> ${weapon?.name ?? "Attack"}</p>
            <p><strong>Incoming Hits:</strong> ${hits}</p>
            <p><strong>Attack Type:</strong> ${ATTACK_TYPE_LABELS[attackType] ?? attackType}</p>
            <p><strong>Target:</strong> ${targetToken?.name ?? this.name}</p>
          </div>
        `,
        buttons,
        default: "none",
        close: () => finish({ action: "none" })
      }).render(true);
    });

    if (!choice || choice.action === "none") {
      return {
        attempted: false,
        label: "No Reaction",
        negatedHits: 0
      };
    }

    await this._consumeReaction(choice.action);

    if (choice.action === "dodge") {
      const dodgeResult = await this._rollDodgeReaction(attacker, weapon, attackType, hits);
      return dodgeResult;
    }

    if (choice.action === "parry") {
      const parryResult = await this._rollParryReaction(attacker, weapon, attackType, hits);
      return parryResult;
    }

    return {
      attempted: false,
      label: "No Reaction",
      negatedHits: 0
    };
  }

  async _rollDodgeReaction(attacker, weapon, attackType, hits, modifier = 0) {
    const dodgeSkill = this.items.find((item) =>
      item.type === "skill"
      && String(item.name ?? "").trim().toLowerCase() === "dodge"
    ) ?? null;
    const proneModifier = this.isProne() ? -20 : 0;
    const finalModifier = Number(modifier ?? 0) + proneModifier;

    let result = null;
    if (dodgeSkill) {
      result = await this.rollSkill(dodgeSkill, {
        label: `${this.name}: Dodge`,
        modifier: finalModifier,
        extra: [
          `Against: ${attacker?.name ?? "Unknown"}`,
          `Weapon: ${weapon?.name ?? "Attack"}`,
          `Incoming Hits: ${hits}`,
          ...(modifier ? [`Attack Modifier: ${modifier >= 0 ? `+${modifier}` : modifier}`] : []),
          ...(proneModifier ? [`Prone: ${proneModifier}`] : [])
        ]
      });
    } else {
      const agility = this.getCharacteristicValue("agility");
      const basicTarget = Math.floor(agility / 2);
      result = await rollD100Test({
        actor: this,
        title: `${this.name}: Dodge`,
        target: basicTarget,
        modifier: finalModifier,
        breakdown: [
          `Agility: ${agility}`,
          "Dodge: Basic Untrained (Half Agility)",
          ...(modifier ? [`Attack Modifier: ${modifier >= 0 ? `+${modifier}` : modifier}`] : []),
          ...(proneModifier ? [`Prone: ${proneModifier}`] : [])
        ],
        extra: [
          `Against: ${attacker?.name ?? "Unknown"}`,
          `Weapon: ${weapon?.name ?? "Attack"}`,
          `Incoming Hits: ${hits}`
        ]
      });
    }

    const negatedHits = result?.success ? Math.min(hits, 1 + Number(result.degrees ?? 0)) : 0;
    return {
      attempted: true,
      mode: "dodge",
      success: Boolean(result?.success),
      degrees: Number(result?.degrees ?? 0),
      negatedHits,
      label: result?.success
        ? `Dodge Success (${negatedHits} hit${negatedHits === 1 ? "" : "s"} negated)`
        : "Dodge Failed",
      result
    };
  }

  async _rollParryReaction(attacker, weapon, attackType, hits) {
    if (this.isFrenzied()) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Parry</h3>
            <p><strong>Outcome:</strong> Parry unavailable.</p>
            <p><strong>Reason:</strong> Frenzied characters cannot parry.</p>
          </div>
        `
      });

      return {
        success: false,
        label: "Parry Failed",
        parryWeapon: null,
        hitsNegated: 0
      };
    }

    const parryWeapon = this.getBestParryWeapon();
    if (!parryWeapon) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Parry</h3>
            <p><strong>Outcome:</strong> Parry unavailable.</p>
            <p><strong>Reason:</strong> No equipped melee weapon capable of parrying.</p>
          </div>
        `
      });

      return {
        success: false,
        label: "Parry Failed",
        parryWeapon: null,
        hitsNegated: 0
      };
    }
    const parryModifier = getParryWeaponModifier(parryWeapon);
    const parryBonusBreakdown = [
      ...(isBalancedWeapon(parryWeapon) ? ["Balanced: +10"] : []),
      ...(isUnbalancedWeapon(parryWeapon) ? ["Unbalanced: -10"] : []),
      ...(isDefensiveWeapon(parryWeapon) ? ["Defensive: +15"] : [])
    ];
    const result = await this.rollCharacteristic("weaponSkill", {
      label: `${this.name}: Parry`,
      modifier: parryModifier,
      extra: [
        `Against: ${attacker?.name ?? "Unknown"}`,
        `Weapon: ${weapon?.name ?? "Attack"}`,
        `Incoming Hits: ${hits}`,
        `Parrying Weapon: ${parryWeapon?.name ?? "None"}`,
        ...parryBonusBreakdown
      ]
    });

    let powerFieldResult = null;
    if (
      result?.success
      && parryWeapon
      && isPowerFieldWeapon(parryWeapon)
      && weapon
      && !isPowerFieldWeapon(weapon)
      && !isWarpWeapon(weapon)
      && !isNaturalWeapon(weapon)
    ) {
      const destructionRoll = await (new Roll("1d100")).evaluate({ async: true });
      const destroysWeapon = Number(destructionRoll.total ?? 0) <= 75;
      if (destroysWeapon) {
        if (weapon.actor) {
          await weapon.delete();
        }
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.name}: Power Field Clash</h3>
            <p><strong>Parrying Weapon:</strong> ${parryWeapon.name}</p>
            <p><strong>Attacker's Weapon:</strong> ${weapon.name}</p>
            <p><strong>Destruction Roll:</strong> ${Number(destructionRoll.total ?? 0)} ${destroysWeapon ? "(weapon destroyed)" : "(weapon survives)"}</p>
          </div>
        `
      });

      powerFieldResult = {
        attempted: true,
        destroysWeapon,
        rollTotal: Number(destructionRoll.total ?? 0),
        weaponName: weapon.name
      };
    }

    const negatedHits = result?.success ? Math.min(hits, 1) : 0;
    return {
      attempted: true,
      mode: "parry",
      success: Boolean(result?.success),
      degrees: Number(result?.degrees ?? 0),
      negatedHits,
      label: result?.success
        ? `Parry Success (1 hit negated)${powerFieldResult?.destroysWeapon ? " | Power Field destroyed weapon" : ""}`
        : "Parry Failed",
      powerFieldResult,
      result
    };
  }

  _resolveOwnedItem(itemRef, expectedType = null) {
    if (!itemRef) return null;

    const item = typeof itemRef === "string"
      ? this.items.get(itemRef)
      : itemRef;

    if (!item) return null;
    if (expectedType && item.type !== expectedType) return null;
    return item;
  }
}
