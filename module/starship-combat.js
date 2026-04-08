import { rollD100Test } from "./rolls.js";

const STARSHIP_BEARING_LABELS = {
  fore: "Fore",
  port: "Port",
  starboard: "Starboard",
  aft: "Aft"
};

const STARSHIP_MOUNT_ARCS = {
  dorsal: ["fore", "port", "starboard"],
  port: ["port"],
  starboard: ["starboard"],
  keel: ["fore", "port", "starboard", "aft"],
  any: ["fore", "port", "starboard", "aft"]
};

const BROADSIDE_PROW_HULL_CLASSES = new Set([
  "lightcruiser",
  "cruiser",
  "grandcruiser",
  "battlecruiser",
  "battleship"
]);
const STARSHIP_SHIELD_SHORT_FLAG = "starshipShieldShort";

function normalizeDegrees(value) {
  let degrees = Number(value ?? 0) || 0;
  while (degrees < 0) degrees += 360;
  while (degrees >= 360) degrees -= 360;
  return degrees;
}

function getTokenDocument(tokenLike) {
  return tokenLike?.document ?? tokenLike ?? null;
}

function getTokenCenter(tokenLike) {
  const token = tokenLike?.object ?? tokenLike ?? null;
  if (token?.center) return token.center;

  const document = getTokenDocument(tokenLike);
  if (!document || !canvas?.grid) return { x: 0, y: 0 };

  const gridSize = Number(canvas.grid.size ?? 100) || 100;
  const width = Number(document.width ?? 1) || 1;
  const height = Number(document.height ?? 1) || 1;
  return {
    x: Number(document.x ?? 0) + (width * gridSize) / 2,
    y: Number(document.y ?? 0) + (height * gridSize) / 2
  };
}

function getShipFacingDegrees(tokenLike, { bowOffset = 0 } = {}) {
  const document = getTokenDocument(tokenLike);
  const rotation = Number(document?.rotation ?? tokenLike?.rotation ?? 0) || 0;
  // Ship art is authored bow-up, while our angle math treats east/right as 0 degrees.
  // Converting from token rotation to bearing therefore needs a -90 degree offset.
  return normalizeDegrees(rotation - 90 + bowOffset);
}

function getTargetAngleDegrees(sourceTokenLike, targetTokenLike) {
  const source = getTokenCenter(sourceTokenLike);
  const target = getTokenCenter(targetTokenLike);
  const radians = Math.atan2(target.y - source.y, target.x - source.x);
  return normalizeDegrees((radians * 180) / Math.PI);
}

function getRelativeBearing(sourceTokenLike, targetTokenLike, options = {}) {
  const facing = getShipFacingDegrees(sourceTokenLike, options);
  const targetAngle = getTargetAngleDegrees(sourceTokenLike, targetTokenLike);
  const relativeAngle = normalizeDegrees(targetAngle - facing);

  let bearing = "fore";
  if (relativeAngle >= 45 && relativeAngle < 135) {
    bearing = "starboard";
  } else if (relativeAngle >= 135 && relativeAngle < 225) {
    bearing = "aft";
  } else if (relativeAngle >= 225 && relativeAngle < 315) {
    bearing = "port";
  }

  return {
    facing,
    targetAngle,
    relativeAngle,
    bearing,
    bearingLabel: STARSHIP_BEARING_LABELS[bearing] ?? "Fore"
  };
}

function normalizeHullClassKey(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "");
}

function getAllowedFiringArcsForMount(mountLocation, options = {}) {
  const key = String(mountLocation ?? "").trim().toLowerCase();
  if (key === "prow") {
    const hullClassKey = normalizeHullClassKey(options.hullClass);
    if (BROADSIDE_PROW_HULL_CLASSES.has(hullClassKey)) {
      return ["fore", "port", "starboard"];
    }
    return ["fore"];
  }
  return [...(STARSHIP_MOUNT_ARCS[key] ?? [])];
}

function canMountFireAtBearing(mountLocation, bearing, options = {}) {
  const allowed = getAllowedFiringArcsForMount(mountLocation, options);
  return allowed.includes(String(bearing ?? "").trim().toLowerCase());
}

function canWeaponFireAtTarget(sourceTokenLike, targetTokenLike, mountLocation, options = {}) {
  const relative = getRelativeBearing(sourceTokenLike, targetTokenLike, options);
  const allowedBearings = getAllowedFiringArcsForMount(mountLocation, options);
  return {
    ...relative,
    mountLocation: String(mountLocation ?? "").trim().toLowerCase(),
    hullClass: String(options.hullClass ?? "").trim(),
    allowedBearings,
    allowedBearingLabels: allowedBearings.map((entry) => STARSHIP_BEARING_LABELS[entry] ?? entry),
    canFire: allowedBearings.includes(relative.bearing)
  };
}

function getActiveStarshipGunnerActor(shipActor = null) {
  const rosterActorUuid = String(shipActor?.system?.roster?.masterGunner?.actorUuid ?? "").trim();
  const rosterActor = rosterActorUuid ? fromUuidSync(rosterActorUuid) : null;
  if (rosterActor && rosterActor.type !== "ship") return rosterActor;

  const assignedCharacter = game.user?.character;
  if (assignedCharacter && assignedCharacter.type !== "ship") return assignedCharacter;

  const controlledToken = canvas?.tokens?.controlled?.find?.((token) => token?.actor && token.actor.type !== "ship");
  if (controlledToken?.actor) return controlledToken.actor;

  return null;
}

function getPrimaryShipToken(shipActor) {
  if (!shipActor) return null;
  return shipActor.getActiveTokens?.()?.[0] ?? null;
}

function parseShipWeaponStrength(strengthValue) {
  const match = String(strengthValue ?? "").match(/-?\d+/);
  return match ? Math.max(0, Number(match[0]) || 0) : 0;
}

function getEffectiveShipWeaponStrength(shipActor, weapon) {
  const derived = shipActor?.getEffectiveShipWeaponStrength?.(weapon) ?? null;
  if (derived && Number.isFinite(Number(derived.effectiveValue))) {
    return Math.max(0, Number(derived.effectiveValue) || 0);
  }
  return parseShipWeaponStrength(weapon?.system?.strength);
}

function getDistanceUnitsBetweenTokens(leftTokenLike, rightTokenLike) {
  const left = getTokenCenter(leftTokenLike);
  const right = getTokenCenter(rightTokenLike);
  const dx = Number(right.x ?? 0) - Number(left.x ?? 0);
  const dy = Number(right.y ?? 0) - Number(left.y ?? 0);
  const pixelDistance = Math.hypot(dx, dy);
  const gridSize = Number(canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100) || 100;
  const gridDistance = Number(canvas?.grid?.distance ?? canvas?.dimensions?.distance ?? 1) || 1;
  return (pixelDistance / gridSize) * gridDistance;
}

function parseShipWeaponRange(rangeValue) {
  const match = String(rangeValue ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? (Number(match[0]) || 0) : 0;
}

function getStarshipRangeData(sourceTokenLike, targetTokenLike, weaponRangeValue) {
  const listedRange = Math.max(0, parseShipWeaponRange(weaponRangeValue));
  const distance = getDistanceUnitsBetweenTokens(sourceTokenLike, targetTokenLike);
  const maxRange = listedRange * 2;

  let modifier = 0;
  let band = "standard";
  let inRange = true;

  if (listedRange > 0) {
    if (distance <= (listedRange / 2)) {
      modifier = 10;
      band = "short";
    } else if (distance > listedRange && distance <= maxRange) {
      modifier = -10;
      band = "long";
    } else if (distance > maxRange) {
      inRange = false;
      band = "outOfRange";
    }
  }

  return {
    listedRange,
    maxRange,
    distance,
    modifier,
    band,
    inRange
  };
}

function getNpcCrewRating(shipActor) {
  return Math.max(0, Number(shipActor?.system?.npcCrewRating ?? 0) || 0);
}

function isNpcControlledShip(shipActor) {
  return String(shipActor?.system?.controlMode ?? "player").trim().toLowerCase() === "npc";
}

function getCurrentCombatTurnKey() {
  const combat = game.combat;
  if (!combat) return null;
  return {
    combatId: String(combat.id ?? ""),
    round: Number(combat.round ?? 0) || 0,
    turn: Number(combat.turn ?? 0) || 0
  };
}

function getShieldStateActor(shipActor) {
  if (!shipActor) return null;
  if (shipActor.isToken && shipActor.baseActor) return shipActor.baseActor;
  return shipActor;
}

function getShieldAttackerKey(shipActor) {
  const actor = getShieldStateActor(shipActor);
  return String(actor?.id ?? "");
}

function isShieldShortedForAttacker(targetShipActor, attackerShipActor) {
  const currentTurn = getCurrentCombatTurnKey();
  if (!currentTurn || !targetShipActor || !attackerShipActor) return false;

  const shieldActor = getShieldStateActor(targetShipActor);
  const shieldState = shieldActor?.getFlag?.("roguetrader", STARSHIP_SHIELD_SHORT_FLAG) ?? null;
  if (!shieldState) return false;
  if (String(shieldState.combatId ?? "") !== currentTurn.combatId) return false;
  if (Number(shieldState.round ?? -1) !== currentTurn.round) return false;
  if (Number(shieldState.turn ?? -1) !== currentTurn.turn) return false;

  const attackers = shieldState.attackers ?? {};
  return Boolean(attackers[getShieldAttackerKey(attackerShipActor)]);
}

async function markShieldsShortedForAttacker(targetShipActor, attackerShipActor) {
  const currentTurn = getCurrentCombatTurnKey();
  const attackerKey = getShieldAttackerKey(attackerShipActor);
  if (!currentTurn || !targetShipActor || !attackerKey) return;

  const shieldActor = getShieldStateActor(targetShipActor);
  if (!shieldActor) return;

  const existing = shieldActor.getFlag?.("roguetrader", STARSHIP_SHIELD_SHORT_FLAG) ?? {};
  const sameTurn = String(existing.combatId ?? "") === currentTurn.combatId
    && Number(existing.round ?? -1) === currentTurn.round
    && Number(existing.turn ?? -1) === currentTurn.turn;

  const attackers = sameTurn ? foundry.utils.deepClone(existing.attackers ?? {}) : {};
  attackers[attackerKey] = true;

  await shieldActor.setFlag("roguetrader", STARSHIP_SHIELD_SHORT_FLAG, {
    combatId: currentTurn.combatId,
    round: currentTurn.round,
    turn: currentTurn.turn,
    attackers
  });
}

async function resolveMacrobatteryAttack(shipActor, weapon, targetToken, attackResult) {
  const targetShipActor = targetToken?.actor;
  if (!targetShipActor || targetShipActor.type !== "ship") return null;

  const shieldActor = getShieldStateActor(targetShipActor);
  const attackerKey = getShieldAttackerKey(shipActor);
  const currentTurn = getCurrentCombatTurnKey();
  const volleyStrength = getEffectiveShipWeaponStrength(shipActor, weapon);
  const rawHits = Math.min(volleyStrength || 0, 1 + Math.max(0, Number(attackResult?.degrees ?? 0) || 0));
  const targetShields = Math.max(0, Number(targetShipActor.system?.shields ?? 0) || 0);
  const shieldsShorted = isShieldShortedForAttacker(targetShipActor, shipActor);
  const absorbedHits = shieldsShorted ? 0 : Math.min(rawHits, targetShields);
  const remainingHits = Math.max(0, rawHits - absorbedHits);

  if (absorbedHits > 0) {
    await markShieldsShortedForAttacker(targetShipActor, shipActor);
  }

  let totalDamage = 0;
  const damageRolls = [];
  for (let index = 0; index < remainingHits; index += 1) {
    const damageRoll = await (new Roll(String(weapon.system?.damage ?? "0"))).evaluate({ async: true });
    const damageTotal = Number(damageRoll.total ?? 0) || 0;
    totalDamage += damageTotal;
    damageRolls.push({
      formula: damageRoll.formula,
      total: damageTotal
    });
  }

  const armor = Math.max(0, Number(targetShipActor.system?.armor ?? 0) || 0);
  const appliedDamage = Math.max(0, totalDamage - armor);
  const currentHullIntegrity = Math.max(0, Number(targetShipActor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
  const newHullIntegrity = Math.max(0, currentHullIntegrity - appliedDamage);
  const currentCrew = Math.max(0, Number(targetShipActor.system?.crew?.value ?? 0) || 0);
  const currentMorale = Math.max(0, Number(targetShipActor.system?.resources?.morale?.value ?? 0) || 0);
  const newCrew = Math.max(0, currentCrew - appliedDamage);
  const newMorale = Math.max(0, currentMorale - appliedDamage);

  if (appliedDamage > 0) {
    await targetShipActor.update({
      "system.resources.hullIntegrity.value": newHullIntegrity,
      "system.crew.value": newCrew,
      "system.resources.morale.value": newMorale
    });
    await targetShipActor.syncCrippledState?.({ announced: true, sourceName: `${shipActor.name}: ${weapon.name}` });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: shipActor }),
    content: `
      <div class="roguetrader ship-augury-results">
        <h3>${shipActor.name}: ${weapon.name} Hits ${targetShipActor.name}</h3>
        <p><strong>Volley Strength:</strong> ${volleyStrength}</p>
        <p><strong>Raw Hits:</strong> ${rawHits}</p>
        <p><strong>Void Shields:</strong> ${shieldsShorted ? "Shorted against this attacker" : targetShields}</p>
        <p><strong>Hits Absorbed:</strong> ${absorbedHits}</p>
        <p><strong>Hits Through:</strong> ${remainingHits}</p>
        <p><strong>Damage Total:</strong> ${totalDamage}</p>
        <p><strong>Armour:</strong> ${armor}</p>
        <p><strong>Hull Integrity Damage:</strong> ${appliedDamage}</p>
        <p><strong>Hull Integrity:</strong> ${currentHullIntegrity} -> ${newHullIntegrity}</p>
        <p><strong>Crew:</strong> ${currentCrew} -> ${newCrew}</p>
        <p><strong>Morale:</strong> ${currentMorale} -> ${newMorale}</p>
        ${damageRolls.length ? `<ul>${damageRolls.map((roll, index) => `<li>Hit ${index + 1}: ${roll.formula} = ${roll.total}</li>`).join("")}</ul>` : ""}
      </div>
    `
  });

  return {
    volleyStrength,
    rawHits,
    targetShields,
    shieldsShorted,
    absorbedHits,
    remainingHits,
    totalDamage,
    armor,
    appliedDamage,
    currentHullIntegrity,
    newHullIntegrity,
    currentCrew,
    newCrew,
    currentMorale,
    newMorale,
    damageRolls
  };
}

async function resolveLanceAttack(shipActor, weapon, targetToken, attackResult) {
  const targetShipActor = targetToken?.actor;
  if (!targetShipActor || targetShipActor.type !== "ship") return null;

  const rawHits = Math.max(0, 1 + Math.floor((Math.max(0, Number(attackResult?.degrees ?? 0) || 0)) / 3));
  const targetShields = Math.max(0, Number(targetShipActor.system?.shields ?? 0) || 0);
  const shieldsShorted = isShieldShortedForAttacker(targetShipActor, shipActor);
  const absorbedHits = shieldsShorted ? 0 : Math.min(rawHits, targetShields);
  const remainingHits = Math.max(0, rawHits - absorbedHits);

  if (absorbedHits > 0) {
    await markShieldsShortedForAttacker(targetShipActor, shipActor);
  }

  const currentHullIntegrity = Math.max(0, Number(targetShipActor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
  const currentCrew = Math.max(0, Number(targetShipActor.system?.crew?.value ?? 0) || 0);
  const currentMorale = Math.max(0, Number(targetShipActor.system?.resources?.morale?.value ?? 0) || 0);
  let runningHullIntegrity = currentHullIntegrity;
  let runningCrew = currentCrew;
  let runningMorale = currentMorale;
  let totalDamage = 0;
  const damageRolls = [];

  for (let index = 0; index < remainingHits; index += 1) {
    const damageRoll = await (new Roll(String(weapon.system?.damage ?? "0"))).evaluate({ async: true });
    const damageTotal = Number(damageRoll.total ?? 0) || 0;
    totalDamage += damageTotal;
    runningHullIntegrity = Math.max(0, runningHullIntegrity - damageTotal);
    runningCrew = Math.max(0, runningCrew - damageTotal);
    runningMorale = Math.max(0, runningMorale - damageTotal);
    damageRolls.push({
      formula: damageRoll.formula,
      total: damageTotal,
      hullIntegrityAfter: runningHullIntegrity,
      crewAfter: runningCrew,
      moraleAfter: runningMorale
    });
  }

  const appliedDamage = totalDamage;
  if (appliedDamage > 0) {
    await targetShipActor.update({
      "system.resources.hullIntegrity.value": runningHullIntegrity,
      "system.crew.value": runningCrew,
      "system.resources.morale.value": runningMorale
    });
    await targetShipActor.syncCrippledState?.({ announced: true, sourceName: `${shipActor.name}: ${weapon.name}` });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: shipActor }),
    content: `
      <div class="roguetrader ship-augury-results">
        <h3>${shipActor.name}: ${weapon.name} Strikes ${targetShipActor.name}</h3>
        <p><strong>Raw Hits:</strong> ${rawHits}</p>
        <p><strong>Void Shields:</strong> ${shieldsShorted ? "Shorted against this attacker" : targetShields}</p>
        <p><strong>Hits Absorbed:</strong> ${absorbedHits}</p>
        <p><strong>Hits Through:</strong> ${remainingHits}</p>
        <p><strong>Armour:</strong> Ignored by Lance</p>
        <p><strong>Hull Integrity Damage:</strong> ${appliedDamage}</p>
        <p><strong>Hull Integrity:</strong> ${currentHullIntegrity} -> ${runningHullIntegrity}</p>
        <p><strong>Crew:</strong> ${currentCrew} -> ${runningCrew}</p>
        <p><strong>Morale:</strong> ${currentMorale} -> ${runningMorale}</p>
        ${damageRolls.length ? `<ul>${damageRolls.map((roll, index) => `<li>Hit ${index + 1}: ${roll.formula} = ${roll.total} (HI ${roll.hullIntegrityAfter}, Crew ${roll.crewAfter}, Morale ${roll.moraleAfter})</li>`).join("")}</ul>` : ""}
      </div>
    `
  });

  return {
    rawHits,
    targetShields,
    shieldsShorted,
    absorbedHits,
    remainingHits,
    totalDamage,
    appliedDamage,
    currentHullIntegrity,
    newHullIntegrity: runningHullIntegrity,
    currentCrew,
    newCrew: runningCrew,
    currentMorale,
    newMorale: runningMorale,
    damageRolls
  };
}

async function rollStarshipWeaponAttack(shipActor, weaponRef, options = {}) {
  if (!shipActor || shipActor.type !== "ship") {
    ui.notifications?.warn("Rogue Trader | Starship weapon fire requires a ship actor.");
    return null;
  }

  const weapon = typeof weaponRef === "string" ? shipActor.items.get(weaponRef) : weaponRef;
  if (!weapon || weapon.type !== "shipWeapon") {
    ui.notifications?.warn("Rogue Trader | Could not find that ship weapon.");
    return null;
  }

  const npcCrewRating = getNpcCrewRating(shipActor);
  const useNpcCrew = isNpcControlledShip(shipActor) && npcCrewRating > 0;
  const gunnerActor = useNpcCrew ? null : (options.gunnerActor ?? getActiveStarshipGunnerActor(shipActor));
  if (!useNpcCrew && !gunnerActor?.rollCharacteristic) {
    ui.notifications?.warn("Rogue Trader | Select or assign a character to act as the gunner first.");
    return null;
  }

  const sourceToken = options.sourceToken ?? getPrimaryShipToken(shipActor);
  const targetedTokens = Array.from(game.user?.targets ?? []);
  const targetToken = options.targetToken ?? targetedTokens[0] ?? null;
  const mountLocation = String(weapon.system?.location ?? "").trim().toLowerCase();
  const rangeData = sourceToken && targetToken
    ? getStarshipRangeData(sourceToken, targetToken, weapon.system?.range)
    : null;

  let arcResult = null;
  if (sourceToken && targetToken && mountLocation) {
    arcResult = canWeaponFireAtTarget(sourceToken, targetToken, mountLocation, {
      hullClass: shipActor.system?.class ?? "",
      bowOffset: Number(options.bowOffset ?? 0) || 0
    });

    if (!arcResult.canFire) {
      ui.notifications?.warn(
        `Rogue Trader | Target is in the ${arcResult.bearingLabel.toLowerCase()} arc; ${weapon.name} cannot fire there from its ${mountLocation} mount.`
      );
      return null;
    }
  }

  if (rangeData && !rangeData.inRange) {
    ui.notifications?.warn(
      `Rogue Trader | Target is out of range for ${weapon.name}. Maximum range is ${rangeData.maxRange.toFixed(1)} VU.`
    );
    return null;
  }

  const extra = [
    `Ship: ${shipActor.name}`,
    `Weapon: ${weapon.name}`,
    `Mount: ${mountLocation ? (STARSHIP_BEARING_LABELS[mountLocation] ?? mountLocation) : "Unspecified"}`
  ];

  if (targetToken?.name) {
    extra.push(`Target: ${targetToken.name}`);
  }
  if (arcResult) {
    extra.push(`Relative Bearing: ${arcResult.bearingLabel}`);
    extra.push(`Allowed Arcs: ${arcResult.allowedBearingLabels.join(", ")}`);
  }
  if (rangeData) {
    const rangeBandLabel = rangeData.band === "short"
      ? "Short Range"
      : rangeData.band === "long"
        ? "Long Range"
        : "Standard Range";
    extra.push(`Range: ${rangeData.distance.toFixed(1)} / ${rangeData.listedRange.toFixed(1)} VU (${rangeBandLabel})`);
  }

  const result = useNpcCrew
    ? await rollD100Test({
      actor: null,
      title: `${shipActor.name}: Fire ${weapon.name}`,
      target: npcCrewRating,
      modifier: Number(rangeData?.modifier ?? 0),
      breakdown: [
        `NPC Crew Rating: ${npcCrewRating}`,
        ...(rangeData ? [`Range Modifier: ${rangeData.modifier >= 0 ? `+${rangeData.modifier}` : rangeData.modifier}`] : [])
      ],
      extra
    })
    : await gunnerActor.rollCharacteristic("ballisticSkill", {
      modifier: Number(rangeData?.modifier ?? 0),
      label: `${gunnerActor.name}: Fire ${weapon.name} (${shipActor.name})`,
      extra
    });

  if (result?.success && shipActor?._playAutomatedAttackAnimation) {
    try {
      const targets = targetToken ? [targetToken] : [];
      await shipActor._playAutomatedAttackAnimation(weapon, targets);
    } catch (error) {
      console.warn("Rogue Trader | Starship weapon animation trigger failed.", error);
    }
  }

  if (result?.success && targetToken?.actor?.type === "ship") {
    const weaponClass = String(weapon.system?.weaponClass ?? "").trim().toLowerCase();
    try {
      if (weaponClass === "macrobattery") {
        await resolveMacrobatteryAttack(shipActor, weapon, targetToken, result);
      } else if (weaponClass === "lance") {
        await resolveLanceAttack(shipActor, weapon, targetToken, result);
      }
    } catch (error) {
      console.warn(`Rogue Trader | ${weaponClass || "Starship"} attack resolution failed.`, error);
    }
  }

  return result;
}

export {
  STARSHIP_BEARING_LABELS,
  STARSHIP_MOUNT_ARCS,
  BROADSIDE_PROW_HULL_CLASSES,
  normalizeDegrees,
  normalizeHullClassKey,
  getTokenCenter,
  getShipFacingDegrees,
  getTargetAngleDegrees,
  getRelativeBearing,
  getAllowedFiringArcsForMount,
  canMountFireAtBearing,
  canWeaponFireAtTarget,
  getActiveStarshipGunnerActor,
  getPrimaryShipToken,
  getDistanceUnitsBetweenTokens,
  parseShipWeaponRange,
  getStarshipRangeData,
  parseShipWeaponStrength,
  getCurrentCombatTurnKey,
  isShieldShortedForAttacker,
  markShieldsShortedForAttacker,
  resolveMacrobatteryAttack,
  resolveLanceAttack,
  rollStarshipWeaponAttack
};
