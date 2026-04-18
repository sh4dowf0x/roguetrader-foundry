import { rollD100Test } from "./rolls.js";
import { resolveReferenceTableResult } from "./reference-tables.js";

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
const TORPEDO_TYPE_LABELS = {
  plasma: "Plasma",
  boarding: "Boarding",
  melta: "Melta",
  virus: "Virus",
  vortex: "Vortex"
};
const TORPEDO_GUIDANCE_LABELS = {
  standard: "Standard",
  guided: "Guided",
  seeking: "Seeking",
  shortBurn: "Short-Burn"
};
const TORPEDO_MOVEMENT_FLAG = "torpedoMovementLastProcessed";
const TORPEDO_HIT_SEQUENCE_FILE = "jb2a.explosion.08";
const TORPEDO_TOKEN_TEXTURE = "systems/roguetrader/assets/actor-tokens/torpedo-volley.png";
const TORPEDO_LAUNCH_SOUND = "systems/roguetrader/assets/sounds/torpedo-launch.mp3";

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
  if (rosterActor && (rosterActor.type === "character" || rosterActor.type === "npc")) return rosterActor;

  const assignedCharacter = game.user?.character;
  if (assignedCharacter && (assignedCharacter.type === "character" || assignedCharacter.type === "npc")) return assignedCharacter;

  const controlledToken = canvas?.tokens?.controlled?.find?.((token) => token?.actor && (token.actor.type === "character" || token.actor.type === "npc"));
  if (controlledToken?.actor) return controlledToken.actor;

  return null;
}

function getPrimaryShipToken(shipActor) {
  if (!shipActor) return null;
  return shipActor.getActiveTokens?.()?.[0] ?? null;
}

function getCurrentStarshipActionActor(shipActor = null) {
  const assignedCharacter = game.user?.character;
  if (assignedCharacter && (assignedCharacter.type === "character" || assignedCharacter.type === "npc")) return assignedCharacter;

  const controlledToken = canvas?.tokens?.controlled?.find?.((token) => token?.actor && (token.actor.type === "character" || token.actor.type === "npc"));
  if (controlledToken?.actor) return controlledToken.actor;

  return getActiveStarshipGunnerActor(shipActor);
}

function getActorBallisticSkillValue(actor) {
  if (!actor) return 0;
  return Math.max(0, Number(
    actor.getCharacteristicValue?.("ballisticSkill")
    ?? actor.system?.characteristics?.ballisticSkill?.value
    ?? 0
  ) || 0);
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

function getPixelDistanceFromUnits(distanceUnits) {
  const gridSize = Number(canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100) || 100;
  const gridDistance = Number(canvas?.grid?.distance ?? canvas?.dimensions?.distance ?? 1) || 1;
  return (Number(distanceUnits ?? 0) || 0) * (gridSize / gridDistance);
}

function getSegmentProximityData(startPoint, endPoint, point) {
  const ax = Number(startPoint?.x ?? 0);
  const ay = Number(startPoint?.y ?? 0);
  const bx = Number(endPoint?.x ?? 0);
  const by = Number(endPoint?.y ?? 0);
  const px = Number(point?.x ?? 0);
  const py = Number(point?.y ?? 0);
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = (dx * dx) + (dy * dy);
  if (lengthSquared <= 0) {
    const distancePixels = Math.hypot(px - ax, py - ay);
    return {
      distancePixels,
      distanceUnits: getPixelDistanceFromUnits(1) > 0 ? distancePixels / (getPixelDistanceFromUnits(1)) : distancePixels,
      projection: 0
    };
  }

  const t = Math.max(0, Math.min(1, (((px - ax) * dx) + ((py - ay) * dy)) / lengthSquared));
  const nearestX = ax + (dx * t);
  const nearestY = ay + (dy * t);
  const distancePixels = Math.hypot(px - nearestX, py - nearestY);
  const pixelsPerUnit = getPixelDistanceFromUnits(1) || 1;
  return {
    distancePixels,
    distanceUnits: distancePixels / pixelsPerUnit,
    projection: t
  };
}

function getTokenContactRadiusUnits(tokenLike) {
  const document = getTokenDocument(tokenLike);
  const gridDistance = Number(canvas?.grid?.distance ?? canvas?.dimensions?.distance ?? 1) || 1;
  const width = Number(document?.width ?? 1) || 1;
  const height = Number(document?.height ?? 1) || 1;
  return (Math.max(width, height) * gridDistance) / 2;
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

function getPersistentActor(actor) {
  if (!actor) return null;
  if (actor.isToken && actor.baseActor) return actor.baseActor;
  return actor;
}

function getShieldAttackerKey(shipActor) {
  const actor = getShieldStateActor(shipActor);
  return String(actor?.id ?? "");
}

async function updateShipActorDocument(shipActor, updateData = {}) {
  const actor = getShieldStateActor(shipActor);
  if (!actor) return null;
  if (game.user?.isGM || actor.isOwner) {
    return actor.update(updateData);
  }
  return game.roguetrader?.socket?.request?.("actorUpdate", {
    actorUuid: actor.uuid,
    updateData
  });
}

async function setShipActorFlag(shipActor, key, value, scope = "roguetrader") {
  const actor = getShieldStateActor(shipActor);
  if (!actor) return null;
  if (game.user?.isGM || actor.isOwner) {
    return actor.setFlag(scope, key, value);
  }
  return game.roguetrader?.socket?.request?.("actorSetFlag", {
    actorUuid: actor.uuid,
    scope,
    key,
    value
  });
}

async function callShipActorMethod(shipActor, method, ...args) {
  const actor = getShieldStateActor(shipActor);
  if (!actor || !method) return null;
  if (game.user?.isGM || actor.isOwner) {
    return actor[method]?.(...args);
  }
  return game.roguetrader?.socket?.request?.("actorMethod", {
    actorUuid: actor.uuid,
    method,
    args
  });
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

  await setShipActorFlag(shieldActor, STARSHIP_SHIELD_SHORT_FLAG, {
    combatId: currentTurn.combatId,
    round: currentTurn.round,
    turn: currentTurn.turn,
    attackers
  }, "roguetrader");
}

function getTorpedoGuidanceModifier(guidance) {
  const guidanceKey = String(guidance ?? "").trim().toLowerCase();
  return guidanceKey === "standard" ? 20 : 0;
}

function getTorpedoGuidanceLabel(guidance) {
  const guidanceKey = String(guidance ?? "").trim();
  return TORPEDO_GUIDANCE_LABELS[guidanceKey] ?? (guidanceKey || "Standard");
}

async function resolveTorpedoTurretDefence(targetShipActor, torpedoActor) {
  const turretRating = Math.max(0, Number(targetShipActor?.system?.turretRating ?? 0) || 0);
  const crewRating = Math.max(0, Number(targetShipActor?.system?.npcCrewRating ?? 0) || 0);
  const incomingSalvoStrength = Math.max(0, Number(torpedoActor?.system?.salvoStrength ?? 0) || 0);
  const shootingModifier = Number(targetShipActor?.getShipShootingModifier?.() ?? 0) || 0;

  if (turretRating < 1 || crewRating <= 0 || incomingSalvoStrength <= 0) {
    return {
      available: false,
      turretRating,
      crewRating,
      modifier: 0,
      result: null,
      hits: 0,
      shootingModifier
    };
  }

  const modifier = (turretRating * 5) + shootingModifier;
  const result = await rollD100Test({
    actor: targetShipActor,
    title: `${targetShipActor.name}: Turret Defence`,
    target: crewRating,
    modifier,
    createMessage: false,
    breakdown: [
      `Crew Rating: ${crewRating}`,
      `Turret Rating (${turretRating}): +${turretRating * 5}`,
      ...(shootingModifier ? [`Ship Shooting Modifier: ${shootingModifier >= 0 ? `+${shootingModifier}` : shootingModifier}`] : [])
    ],
    extra: [
      `Incoming Torpedo Salvo: ${torpedoActor?.name ?? "Torpedo"}`
    ]
  });

  const hits = result?.success
    ? Math.max(1, 1 + Math.floor((Math.max(0, Number(result.degrees ?? 0) || 0)) / 2))
    : 0;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: targetShipActor }),
    content: `
      <div class="roguetrader ship-turret-defence-card">
        <div class="ship-turret-defence-banner">Turret Defence</div>
        <h3>${targetShipActor.name}</h3>
        <p><strong>Incoming Salvo:</strong> ${incomingSalvoStrength}</p>
        <p><strong>Crew Rating:</strong> ${crewRating}</p>
        <p><strong>Turret Rating:</strong> ${turretRating}</p>
        <p><strong>Ship Shooting Modifier:</strong> ${shootingModifier >= 0 ? `+${shootingModifier}` : shootingModifier}</p>
        <p><strong>Test:</strong> ${result?.rollTotal ?? "?"} vs ${result?.finalTarget ?? "?"} (${result?.outcome ?? "Unknown"})</p>
        <p><strong>Torpedoes Shot Down:</strong> ${hits}</p>
      </div>
    `
  });

  return {
    available: true,
    turretRating,
    crewRating,
    modifier,
    result,
    hits,
    shootingModifier
  };
}

function getShipWeaponCriticalThreshold(critRating) {
  const text = String(critRating ?? "").trim();
  const match = text.match(/\d+/);
  if (!match) return null;
  return Math.max(1, Number(match[0]) || 0);
}

function doesTorpedoDamageRollTriggerCritical(damageRoll, critRating) {
  const threshold = getShipWeaponCriticalThreshold(critRating);
  if (!threshold || !damageRoll) {
    return {
      triggered: false,
      threshold: null,
      dieResults: []
    };
  }

  const dieResults = Array.from(damageRoll.dice ?? []).flatMap((die) =>
    Array.from(die.results ?? [])
      .filter((result) => result?.active !== false)
      .map((result) => Number(result.result ?? 0) || 0)
  );

  return {
    triggered: dieResults.some((value) => value >= threshold),
    threshold,
    dieResults
  };
}

async function rollTorpedoDamage(torpedoActor) {
  const formula = String(torpedoActor?.system?.damage ?? "0").trim() || "0";
  const torpedoType = String(torpedoActor?.system?.torpedoType ?? "").trim().toLowerCase();
  const initialRoll = await (new Roll(formula)).evaluate({ async: true });

  if (torpedoType !== "plasma") {
    return {
      roll: initialRoll,
      notes: []
    };
  }

  const notes = [];
  const rerollTerms = [];
  for (const term of initialRoll.terms) {
    if (!(term instanceof Die) || Number(term.faces ?? 0) !== 10) {
      rerollTerms.push(term.formula ?? String(term));
      continue;
    }

    const rebuiltResults = [];
    for (const result of term.results ?? []) {
      if (result?.active === false) continue;
      const firstResult = Number(result.result ?? 0) || 0;
      if (firstResult <= 3) {
        const secondResult = await (new Roll("1d10")).evaluate({ async: true });
        const rerolledValue = Number(secondResult.total ?? 0) || 0;
        notes.push(`${firstResult} -> ${rerolledValue}`);
        rebuiltResults.push(String(rerolledValue));
      } else {
        rebuiltResults.push(String(firstResult));
      }
    }

    rerollTerms.push(rebuiltResults.join(" + "));
  }

  if (!notes.length) {
    return {
      roll: initialRoll,
      notes
    };
  }

  const rerolledFormula = rerollTerms.join(" ");
  const finalRoll = await (new Roll(rerolledFormula)).evaluate({ async: true });
  return {
    roll: finalRoll,
    notes
  };
}

function getTorpedoTokenDocumentsForSourceShip(sourceShipActor) {
  if (!sourceShipActor || !canvas?.scene?.tokens) return [];
  return canvas.scene.tokens.contents.filter((tokenDocument) =>
    tokenDocument?.actor?.type === "torpedo"
    && Boolean(tokenDocument.actor?.system?.active)
    && Boolean(tokenDocument.actor?.system?.launched)
    && String(tokenDocument.actor?.system?.sourceShip ?? "") === String(sourceShipActor.uuid ?? "")
  );
}

async function deleteTorpedoActorAndToken(torpedoActor, tokenDocument = null) {
  const tokenDoc = tokenDocument ?? torpedoActor?.getActiveTokens?.()?.[0]?.document ?? null;
  const persistentTorpedoActor = getPersistentActor(torpedoActor);
  if (tokenDoc) {
    try {
      if (game.user?.isGM || tokenDoc.isOwner) {
        await tokenDoc.delete();
      } else {
        await game.roguetrader?.socket?.request?.("tokenDelete", {
          tokenUuid: tokenDoc.uuid
        });
      }
    } catch (error) {
      console.warn("Rogue Trader | Failed to delete torpedo token.", error);
    }
  }

  if (persistentTorpedoActor && !persistentTorpedoActor.deleted) {
    try {
      if (game.user?.isGM || persistentTorpedoActor.isOwner) {
        await persistentTorpedoActor.delete();
      } else {
        await game.roguetrader?.socket?.request?.("actorDelete", {
          actorUuid: persistentTorpedoActor.uuid
        });
      }
    } catch (error) {
      console.warn("Rogue Trader | Failed to delete torpedo actor.", error);
    }
  }
}

async function detonateAndRemoveTorpedo(torpedoActor, targetTokenLike) {
  const tokenDocument = torpedoActor?.getActiveTokens?.()?.[0]?.document ?? null;
  const result = await resolveTorpedoDetonation(torpedoActor, targetTokenLike);
  await deleteTorpedoActorAndToken(torpedoActor, tokenDocument);
  return result;
}

function findFirstShipContactAlongPath(startPoint, endPoint, { sourceShipUuid = "", sourceTokenUuid = "" } = {}) {
  if (!canvas?.tokens?.placeables) return null;

  const candidates = canvas.tokens.placeables
    .filter((token) =>
      token?.actor?.type === "ship"
      && String(token.document?.uuid ?? token.uuid ?? "") !== String(sourceTokenUuid ?? "")
      && String(token.actor?.uuid ?? "") !== String(sourceShipUuid ?? "")
    )
    .map((token) => {
      const proximity = getSegmentProximityData(startPoint, endPoint, getTokenCenter(token));
      const contactRadiusUnits = 1 + getTokenContactRadiusUnits(token);
      return {
        token,
        contactRadiusUnits,
        ...proximity
      };
    })
    .filter((entry) => entry.distanceUnits <= entry.contactRadiusUnits)
    .sort((left, right) => left.projection - right.projection);

  return candidates[0] ?? null;
}

async function resolveTorpedoDetonation(torpedoActor, targetTokenLike) {
  const targetToken = targetTokenLike?.object ?? targetTokenLike ?? null;
  const targetShipActor = targetToken?.actor ?? null;
  if (!torpedoActor || !targetShipActor || targetShipActor.type !== "ship") return null;

  const torpedoType = String(torpedoActor.system?.torpedoType ?? "").trim().toLowerCase();
  const torpedoLabel = TORPEDO_TYPE_LABELS[torpedoType] ?? (torpedoType || "Torpedo");
  const sourceShipActor = torpedoActor.system?.sourceShip ? fromUuidSync(String(torpedoActor.system.sourceShip)) : null;
  const guidance = String(torpedoActor.system?.guidance ?? "standard").trim();
  const guidanceModifier = getTorpedoGuidanceModifier(guidance);
  const salvoStrength = Math.max(0, Number(torpedoActor.system?.salvoStrength ?? 0) || 0);
  const storedBallisticSkill = Math.max(0, Number(torpedoActor.system?.firingBallisticSkill ?? 0) || 0);
  const firingActorUuid = String(torpedoActor.system?.firingActorUuid ?? "").trim();
  const firingActor = firingActorUuid ? fromUuidSync(firingActorUuid) : null;
  const firingActorName = String(torpedoActor.system?.firingActorName ?? "").trim() || firingActor?.name || sourceShipActor?.name || "Unknown Firer";
  const currentHullIntegrity = Math.max(0, Number(targetShipActor.system?.resources?.hullIntegrity?.value ?? 0) || 0);
  const currentCrew = Math.max(0, Number(targetShipActor.system?.crew?.value ?? 0) || 0);
  const currentMorale = Math.max(0, Number(targetShipActor.system?.resources?.morale?.value ?? 0) || 0);
  const turretDefence = await resolveTorpedoTurretDefence(targetShipActor, torpedoActor);
  const torpedoesShotDown = Math.min(salvoStrength, Math.max(0, Number(turretDefence?.hits ?? 0) || 0));
  const survivingSalvoStrength = Math.max(0, salvoStrength - torpedoesShotDown);

  const attackResult = survivingSalvoStrength > 0
    ? await rollD100Test({
      actor: firingActor ?? sourceShipActor ?? null,
      title: `${torpedoActor.name}: Torpedo Detonation`,
      target: storedBallisticSkill,
      modifier: guidanceModifier,
      breakdown: [
        `Firing Character Ballistic Skill: ${storedBallisticSkill}`,
        `Guidance (${getTorpedoGuidanceLabel(guidance)}): ${guidanceModifier >= 0 ? `+${guidanceModifier}` : guidanceModifier}`
      ],
      extra: [
        `Source Ship: ${String(torpedoActor.system?.sourceShipName ?? sourceShipActor?.name ?? "Unknown Ship")}`,
        `Launcher: ${String(torpedoActor.system?.launcher ?? "Torpedo Tube")}`,
        `Target: ${targetShipActor.name}`,
        `Incoming Salvo: ${salvoStrength}`,
        `Turret Defence: ${torpedoesShotDown} shot down`,
        `Surviving Torpedoes: ${survivingSalvoStrength}`
      ]
    })
    : null;

  let hits = 0;
  let totalHullIntegrityDamage = 0;
  let runningHullIntegrity = currentHullIntegrity;
  let runningCrew = currentCrew;
  let runningMorale = currentMorale;
  const targetArmor = Math.max(0, Number(targetShipActor.system?.armor ?? 0) || 0);
  const damageRolls = [];
  const criticalResults = [];
  const torpedoCriticalRolls = [];

  if (attackResult?.success) {
    hits = Math.min(survivingSalvoStrength || 0, 1 + Math.max(0, Number(attackResult.degrees ?? 0) || 0));

    for (let index = 0; index < hits; index += 1) {
      const torpedoDamage = await rollTorpedoDamage(torpedoActor);
      const damageRoll = torpedoDamage.roll;
      const damageTotal = Math.max(0, Number(damageRoll.total ?? 0) || 0);
      const torpedoCritical = doesTorpedoDamageRollTriggerCritical(damageRoll, torpedoActor.system?.critRating);
      let hullIntegrityDamage = Math.max(0, damageTotal - targetArmor);
      const hullBeforeHit = runningHullIntegrity;
      let torpedoCriticalRoll = null;

      if (torpedoCritical.triggered) {
        torpedoCriticalRoll = await (new Roll("1d5")).evaluate({ async: true });
        torpedoCriticalRolls.push({
          hitNumber: index + 1,
          threshold: torpedoCritical.threshold,
          dieResults: torpedoCritical.dieResults,
          total: Number(torpedoCriticalRoll.total ?? 0) || 0
        });
        if (hullIntegrityDamage <= 0) {
          hullIntegrityDamage = 1;
        }
      }

      if (hullIntegrityDamage > 0) {
        runningHullIntegrity = Math.max(0, runningHullIntegrity - hullIntegrityDamage);
        runningCrew = Math.max(0, runningCrew - hullIntegrityDamage);
        runningMorale = Math.max(0, runningMorale - hullIntegrityDamage);
        totalHullIntegrityDamage += hullIntegrityDamage;
      }

      damageRolls.push({
        formula: damageRoll.formula,
        total: damageTotal,
        armor: targetArmor,
        hullIntegrityDamage,
        hullIntegrityAfter: runningHullIntegrity,
        crewAfter: runningCrew,
        moraleAfter: runningMorale,
        plasmaRerolls: torpedoDamage.notes,
        criticalTriggered: torpedoCritical.triggered,
        criticalThreshold: torpedoCritical.threshold,
        criticalDieResults: torpedoCritical.dieResults,
        torpedoCriticalRoll: Number(torpedoCriticalRoll?.total ?? 0) || 0
      });

      if (torpedoCriticalRoll) {
        const criticalResult = await resolveStarshipCriticalHit(targetShipActor, sourceShipActor, {
          name: `${torpedoLabel} Torpedo`
        }, Number(torpedoCriticalRoll.total ?? 0) || 0, {
          sourceLabel: `${torpedoLabel} Torpedo (${firingActorName}) Hit ${index + 1}`
        });
        if (criticalResult) {
          criticalResults.push({
            ...criticalResult,
            hitNumber: index + 1
          });
        }
      }
    }

    if (totalHullIntegrityDamage > 0) {
      await updateShipActorDocument(targetShipActor, {
        "system.resources.hullIntegrity.value": runningHullIntegrity,
        "system.crew.value": runningCrew,
        "system.resources.morale.value": runningMorale
      });
      await callShipActorMethod(targetShipActor, "syncCrippledState", { announced: true, sourceName: `${torpedoLabel} Torpedo` });
    }
  }

  if (hits > 0 && targetToken && globalThis.Sequence) {
    try {
      await new globalThis.Sequence()
        .effect()
        .file(TORPEDO_HIT_SEQUENCE_FILE)
        .atLocation(targetToken)
        .scaleToObject(1.4)
        .opacity(0.95)
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play torpedo impact effect.", error);
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sourceShipActor ?? firingActor ?? targetShipActor }),
    content: `
      <div class="roguetrader ship-augury-results">
        <h3>${torpedoActor.name}: Detonation</h3>
        <p><strong>Target:</strong> ${targetShipActor.name}</p>
        <p><strong>Firer:</strong> ${firingActorName}</p>
        <p><strong>Guidance:</strong> ${getTorpedoGuidanceLabel(guidance)} (${guidanceModifier >= 0 ? `+${guidanceModifier}` : guidanceModifier})</p>
        <p><strong>Incoming Salvo:</strong> ${salvoStrength}</p>
        <p><strong>Turrets Shot Down:</strong> ${torpedoesShotDown}</p>
        <p><strong>Surviving Torpedoes:</strong> ${survivingSalvoStrength}</p>
        <p><strong>Attack:</strong> ${survivingSalvoStrength > 0 ? `${attackResult?.rollTotal ?? "?"} vs ${attackResult?.finalTarget ?? "?"} (${attackResult?.outcome ?? "Unknown"})` : "No attack; the salvo was destroyed by turret fire."}</p>
        <p><strong>Hits:</strong> ${hits}</p>
        <p><strong>Armour:</strong> ${targetArmor}</p>
        <p><strong>Hull Integrity Damage:</strong> ${totalHullIntegrityDamage}</p>
        <p><strong>Hull Integrity:</strong> ${currentHullIntegrity} -> ${runningHullIntegrity}</p>
        <p><strong>Crew:</strong> ${currentCrew} -> ${runningCrew}</p>
        <p><strong>Morale:</strong> ${currentMorale} -> ${runningMorale}</p>
        <p><strong>Critical Hit:</strong> ${criticalResults.length ? criticalResults.map((entry) => `Hit ${entry.hitNumber}: ${entry.effectiveRoll} - ${entry.criticalEntry?.name ?? "Critical Result"}`).join("; ") : "None"}</p>
        ${damageRolls.length ? `<ul>${damageRolls.map((roll, index) => `<li>Hit ${index + 1}: ${roll.formula} = ${roll.total} vs Armour ${roll.armor} -> ${roll.hullIntegrityDamage} HI${roll.plasmaRerolls?.length ? `, Plasma Rerolls: ${roll.plasmaRerolls.join("; ")}` : ""}${roll.criticalTriggered ? `, Torpedo Crit (${roll.criticalDieResults.join(", ")} vs ${roll.criticalThreshold}) -> 1d5 = ${roll.torpedoCriticalRoll}` : ""}</li>`).join("")}</ul>` : ""}
      </div>
    `
  });

  return {
    turretDefence,
    torpedoesShotDown,
    survivingSalvoStrength,
    attackResult,
    hits,
    totalHullIntegrityDamage,
    targetArmor,
    damageRolls,
    torpedoCriticalRolls,
    criticalResults
  };
}

async function moveTorpedoAndResolve(torpedoActor, tokenDocument) {
  if (!torpedoActor || !tokenDocument) return null;

  const currentRemainingRange = Math.max(0, Number(torpedoActor.system?.remainingRange ?? 0) || 0);
  if (currentRemainingRange <= 0) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: torpedoActor }),
      content: `<div class="roguetrader-roll-card"><h3>${torpedoActor.name}</h3><p>The torpedo salvo expends itself harmlessly in the void.</p></div>`
    });
    await deleteTorpedoActorAndToken(torpedoActor, tokenDocument);
    return { expired: true };
  }

  const speed = Math.max(0, Number(torpedoActor.system?.speed ?? 0) || 0);
  const travelUnits = Math.min(speed, currentRemainingRange);
  if (travelUnits <= 0) {
    await deleteTorpedoActorAndToken(torpedoActor, tokenDocument);
    return { expired: true };
  }

  const startCenter = getTokenCenter(tokenDocument);
  const bearing = normalizeDegrees(Number(torpedoActor.system?.bearing ?? tokenDocument.rotation ?? 0) || 0);
  const travelPixels = getPixelDistanceFromUnits(travelUnits);
  const bearingRadians = (bearing * Math.PI) / 180;
  const endCenter = {
    x: Number(startCenter.x ?? 0) + (Math.cos(bearingRadians) * travelPixels),
    y: Number(startCenter.y ?? 0) + (Math.sin(bearingRadians) * travelPixels)
  };
  const gridSize = Number(canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100) || 100;
  const impact = findFirstShipContactAlongPath(startCenter, endCenter, {
    sourceShipUuid: String(torpedoActor.system?.sourceShip ?? ""),
    sourceTokenUuid: String(torpedoActor.system?.sourceTokenUuid ?? "")
  });

  await tokenDocument.update({
    x: endCenter.x - (gridSize / 2),
    y: endCenter.y - (gridSize / 2)
  });
  await torpedoActor.update({
    "system.remainingRange": Math.max(0, currentRemainingRange - travelUnits)
  });

  if (impact?.token) {
    if (game.user?.isGM) {
      await detonateAndRemoveTorpedo(torpedoActor, impact.token);
    } else {
      await game.roguetrader?.socket?.request?.("torpedoDetonateAndCleanup", {
        torpedoActorUuid: torpedoActor.uuid,
        targetTokenUuid: impact.token.document?.uuid ?? impact.token.uuid
      });
    }
    return {
      detonated: true,
      targetToken: impact.token
    };
  }

  if (Math.max(0, currentRemainingRange - travelUnits) <= 0) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: torpedoActor }),
      content: `<div class="roguetrader-roll-card"><h3>${torpedoActor.name}</h3><p>The torpedo salvo reaches the limit of its burn and detonates harmlessly.</p></div>`
    });
    await deleteTorpedoActorAndToken(torpedoActor, tokenDocument);
    return { expired: true };
  }

  return {
    moved: true,
    travelUnits,
    remainingRange: Math.max(0, currentRemainingRange - travelUnits)
  };
}

async function processShipLaunchedTorpedoesTurnStart(sourceShipActor, combat = null) {
  if (!sourceShipActor || sourceShipActor.type !== "ship") return null;

  const combatId = String(combat?.id ?? "");
  const round = Number(combat?.round ?? 0) || 0;
  const turn = Number(combat?.turn ?? 0) || 0;
  const lastProcessed = sourceShipActor.getFlag?.("roguetrader", TORPEDO_MOVEMENT_FLAG) ?? {};
  if (
    String(lastProcessed.combatId ?? "") === combatId
    && Number(lastProcessed.round ?? -1) === round
    && Number(lastProcessed.turn ?? -1) === turn
  ) {
    return null;
  }

  const torpedoTokenDocuments = getTorpedoTokenDocumentsForSourceShip(sourceShipActor);
  for (const tokenDocument of torpedoTokenDocuments) {
    if (!tokenDocument?.actor) continue;
    await moveTorpedoAndResolve(tokenDocument.actor, tokenDocument);
  }

  await sourceShipActor.setFlag("roguetrader", TORPEDO_MOVEMENT_FLAG, {
    combatId,
    round,
    turn
  });

  return torpedoTokenDocuments.length;
}

async function launchTorpedoSalvo(shipActor, weapon, options = {}) {
  const sourceToken = options.sourceToken ?? getPrimaryShipToken(shipActor);
  if (!sourceToken?.document) {
    ui.notifications?.warn("Rogue Trader | Place the firing ship on the scene before launching torpedoes.");
    return null;
  }

  const torpedoType = String(weapon.system?.torpedoType ?? "").trim().toLowerCase();
  if (!torpedoType) {
    ui.notifications?.warn(`Rogue Trader | ${weapon.name} does not have a torpedo type selected.`);
    return null;
  }

  const torpedoLabel = TORPEDO_TYPE_LABELS[torpedoType] ?? torpedoType;
  const guidance = String(weapon.system?.torpedoGuidance ?? "standard").trim();
  const speed = Math.max(0, Number(weapon.system?.torpedoSpeed ?? 0) || 0);
  const range = Math.max(0, parseShipWeaponRange(weapon.system?.range));
  const salvoStrength = Math.max(0, getEffectiveShipWeaponStrength(shipActor, weapon));
  const facing = getShipFacingDegrees(sourceToken);
  const useNpcCrew = isNpcControlledShip(shipActor) && getNpcCrewRating(shipActor) > 0;
  const firingActor = useNpcCrew ? null : (options.gunnerActor ?? getCurrentStarshipActionActor(shipActor));
  if (!useNpcCrew && !firingActor) {
    ui.notifications?.warn("Rogue Trader | Select a character to fire the torpedo salvo.");
    return null;
  }

  const firingBallisticSkill = useNpcCrew ? getNpcCrewRating(shipActor) : getActorBallisticSkillValue(firingActor);
  const firingActorName = useNpcCrew ? `${shipActor.name} Crew` : String(firingActor?.name ?? "Unknown Firer");
  const sourceCenter = getTokenCenter(sourceToken);
  const travelPixels = getPixelDistanceFromUnits(speed);
  const facingRadians = (facing * Math.PI) / 180;
  const gridSize = Number(canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100) || 100;
  const startX = Number(sourceCenter.x ?? 0) - (gridSize / 2);
  const startY = Number(sourceCenter.y ?? 0) - (gridSize / 2);
  const destinationCenterX = Number(sourceCenter.x ?? 0) + (Math.cos(facingRadians) * travelPixels);
  const destinationCenterY = Number(sourceCenter.y ?? 0) + (Math.sin(facingRadians) * travelPixels);
  const destinationX = destinationCenterX - (gridSize / 2);
  const destinationY = destinationCenterY - (gridSize / 2);

  const torpedoActor = await Actor.create({
    name: `${shipActor.name}: ${torpedoLabel} Torpedo`,
    type: "torpedo",
    img: weapon.img || "icons/svg/missile.svg",
    prototypeToken: {
      texture: {
        src: TORPEDO_TOKEN_TEXTURE
      }
    },
    system: {
      torpedoType,
      guidance,
      sourceShip: shipActor.uuid,
      sourceShipName: shipActor.name,
      sourceTokenUuid: String(sourceToken.document?.uuid ?? sourceToken.uuid ?? ""),
      launcher: weapon.name,
      salvoStrength,
      firingActorUuid: useNpcCrew ? "" : String(firingActor?.uuid ?? ""),
      firingActorName,
      firingBallisticSkill,
      speed,
      damage: String(weapon.system?.damage ?? "").trim(),
      critRating: String(weapon.system?.critRating ?? "").trim(),
      range,
      remainingRange: Math.max(0, range - speed),
      bearing: facing,
      active: true,
      launched: true
    }
  });

  if (!torpedoActor) {
    ui.notifications?.warn("Rogue Trader | Failed to create the torpedo salvo actor.");
    return null;
  }

  const [createdToken] = await canvas.scene?.createEmbeddedDocuments?.("Token", [{
    name: torpedoActor.name,
    actorId: torpedoActor.id,
    img: TORPEDO_TOKEN_TEXTURE,
    texture: {
      src: TORPEDO_TOKEN_TEXTURE
    },
    x: startX,
    y: startY,
    width: 1,
    height: 1,
    rotation: Number(sourceToken.document?.rotation ?? 0) || 0,
    disposition: Number(sourceToken.document?.disposition ?? 0) || 0,
    displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
    actorLink: true
  }]) ?? [];

  if (createdToken) {
    await weapon.update({
      "system.torpedoLoaded": false,
      "system.torpedoLoading": false,
      "system.torpedoLoadingMode": ""
    });

    await createdToken.update({
      x: destinationX,
      y: destinationY
    });

    const impact = findFirstShipContactAlongPath(sourceCenter, { x: destinationCenterX, y: destinationCenterY }, {
      sourceShipUuid: shipActor.uuid,
      sourceTokenUuid: String(sourceToken.document?.uuid ?? sourceToken.uuid ?? "")
    });
    if (impact?.token) {
      if (game.user?.isGM) {
        await detonateAndRemoveTorpedo(torpedoActor, impact.token);
      } else {
        await game.roguetrader?.socket?.request?.("torpedoDetonateAndCleanup", {
          torpedoActorUuid: torpedoActor.uuid,
          targetTokenUuid: impact.token.document?.uuid ?? impact.token.uuid
        });
      }
      return {
        actor: null,
        tokenDocument: null,
        speed,
        range,
        torpedoType,
        detonated: true
      };
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: shipActor }),
    content: `
      <div class="roguetrader-roll-card">
        <h3>${shipActor.name}: Torpedo Launch</h3>
        <p><strong>Launcher:</strong> ${weapon.name}</p>
        <p><strong>Payload:</strong> ${torpedoLabel}</p>
        <p><strong>Guidance:</strong> ${getTorpedoGuidanceLabel(guidance)}</p>
        <p><strong>Firer:</strong> ${firingActorName}</p>
        <p><strong>Stored BS:</strong> ${firingBallisticSkill}</p>
        <p><strong>Salvo Strength:</strong> ${salvoStrength}</p>
        <p><strong>Speed:</strong> ${speed}</p>
        <p><strong>Range:</strong> ${range}</p>
      </div>
    `
  });

  try {
    await AudioHelper.play({
      src: TORPEDO_LAUNCH_SOUND,
      volume: 0.8,
      loop: false
    }, false);
  } catch (error) {
    console.warn("Rogue Trader | Failed to play torpedo launch sound.", error);
  }

  return {
    actor: torpedoActor,
    tokenDocument: createdToken ?? null,
    speed,
    range,
    torpedoType
  };
}

async function resolveStarshipCriticalHit(targetShipActor, shipActor, weapon, criticalDamage, options = {}) {
  const rawCriticalDamage = Math.max(0, Number(criticalDamage ?? 0) || 0);
  if (!rawCriticalDamage || !targetShipActor) return null;

  const effectiveRoll = Math.max(1, Math.min(11, rawCriticalDamage));
  const criticalEntry = resolveReferenceTableResult("starshipCriticalHits", effectiveRoll);
  if (!criticalEntry) return null;

  let catastrophicRoll = null;
  let catastrophicEntry = null;
  if (effectiveRoll >= 11) {
    catastrophicRoll = await (new Roll("1d10")).evaluate({ async: true });
    catastrophicEntry = resolveReferenceTableResult("starshipCatastrophicDamage", Number(catastrophicRoll.total ?? 0) || 0);
  }

  if (String(criticalEntry.name ?? "").trim().toLowerCase() === "sensors damaged") {
    await callShipActorMethod(targetShipActor, "applySensorsDamaged", {
      sourceName: `${weapon?.name ?? "Starship Weapon"} (${shipActor?.name ?? "Unknown Ship"})`,
      announced: false
    });
  }
  let thrustersResult = null;
  if (String(criticalEntry.name ?? "").trim().toLowerCase() === "thrusters damaged") {
    thrustersResult = await callShipActorMethod(targetShipActor, "applyThrustersDamaged", {
      sourceName: `${weapon?.name ?? "Starship Weapon"} (${shipActor?.name ?? "Unknown Ship"})`,
      announced: false
    });
  }
  let shipFireResult = null;
  if (String(criticalEntry.name ?? "").trim().toLowerCase() === "fire!") {
    shipFireResult = await callShipActorMethod(targetShipActor, "applyShipFire", {
      sourceName: `${weapon?.name ?? "Starship Weapon"} (${shipActor?.name ?? "Unknown Ship"})`,
      announced: false
    });
  }
  let enginesResult = null;
  if (String(criticalEntry.name ?? "").trim().toLowerCase() === "engines crippled") {
    enginesResult = await callShipActorMethod(targetShipActor, "applyEnginesCrippled", {
      sourceName: `${weapon?.name ?? "Starship Weapon"} (${shipActor?.name ?? "Unknown Ship"})`,
      announced: false
    });
  }

  const sourceLabel = String(options.sourceLabel ?? "").trim();
  const sourceBlock = sourceLabel
    ? `<p><strong>Source:</strong> ${sourceLabel}</p>`
    : "";
  const catastrophicBlock = catastrophicEntry
    ? `
      <div class="ship-critical-subresult">
        <h4>Catastrophic Result</h4>
        <p><strong>Roll:</strong> ${catastrophicRoll?.formula ?? "1d10"} = ${catastrophicRoll?.total ?? 0}</p>
        <p><strong>${catastrophicEntry.name}</strong></p>
        <p>${catastrophicEntry.description}</p>
      </div>
    `
    : "";
  const thrustersBlock = thrustersResult
    ? `
      <div class="ship-critical-subresult">
        <h4>Thrusters Result</h4>
        <p><strong>Roll:</strong> ${thrustersResult.roll?.formula ?? "1d10"} = ${thrustersResult.rollTotal}</p>
        <p><strong>Effect:</strong> ${thrustersResult.turningDisabled ? "Thrusters completely damaged; the ship cannot turn." : "Manoeuvrability reduced by -20."}</p>
      </div>
    `
    : "";
  const shipFireBlock = shipFireResult
    ? `
      <div class="ship-critical-subresult">
        <h4>Shipboard Fire</h4>
        <p><strong>Crew Damage:</strong> ${shipFireResult.crewRoll?.formula ?? "1d5"} = ${shipFireResult.crewDamage} (${shipFireResult.currentCrew} -> ${shipFireResult.newCrew})</p>
        <p><strong>Morale Damage:</strong> ${shipFireResult.moraleRoll?.formula ?? "1d10"} = ${shipFireResult.moraleDamage} (${shipFireResult.currentMorale} -> ${shipFireResult.newMorale})</p>
      </div>
    `
    : "";
  const enginesBlock = enginesResult
    ? `
      <div class="ship-critical-subresult">
        <h4>Engine Damage</h4>
        <p><strong>Roll:</strong> ${enginesResult.roll?.formula ?? "1d10"} = ${enginesResult.rollTotal}</p>
        <p><strong>Effect:</strong> ${enginesResult.speedReducedToOne ? "Drives totally wrecked; Speed reduced to 1." : "Speed reduced by half."}</p>
      </div>
    `
    : "";

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: shipActor ?? targetShipActor }),
    content: `
      <div class="roguetrader ship-critical-hit-card">
        <div class="ship-critical-hit-banner">Critical Hit!</div>
        <h3>${targetShipActor.name}</h3>
        <p><strong>Critical Damage:</strong> ${rawCriticalDamage}</p>
        <p><strong>Table Roll:</strong> ${effectiveRoll}</p>
        ${sourceBlock}
        <p><strong>${criticalEntry.name}</strong></p>
        <p>${criticalEntry.description}</p>
        ${thrustersBlock}
        ${shipFireBlock}
        ${enginesBlock}
        ${catastrophicBlock}
      </div>
    `
  });

  return {
    rawCriticalDamage,
    effectiveRoll,
    criticalEntry,
    thrustersResult,
    shipFireResult,
    enginesResult,
    catastrophicRoll,
    catastrophicEntry
  };
}

async function resolveMacrobatteryAttack(shipActor, weapon, targetToken, attackResult) {
  const targetShipActor = targetToken?.actor;
  if (!targetShipActor || targetShipActor.type !== "ship") return null;

  const shieldActor = getShieldStateActor(targetShipActor);
  const attackerKey = getShieldAttackerKey(shipActor);
  const currentTurn = getCurrentCombatTurnKey();
  const volleyStrength = getEffectiveShipWeaponStrength(shipActor, weapon);
  const rawHits = Math.min(volleyStrength || 0, 1 + Math.max(0, Number(attackResult?.degrees ?? 0) || 0));
  const targetShields = Math.max(0, Number(targetShipActor.getEffectiveShipShields?.() ?? targetShipActor.system?.shields ?? 0) || 0);
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
  const criticalDamage = currentHullIntegrity > 0
    ? Math.max(0, appliedDamage - currentHullIntegrity)
    : appliedDamage;
  const currentCrew = Math.max(0, Number(targetShipActor.system?.crew?.value ?? 0) || 0);
  const currentMorale = Math.max(0, Number(targetShipActor.system?.resources?.morale?.value ?? 0) || 0);
  const newCrew = Math.max(0, currentCrew - appliedDamage);
  const newMorale = Math.max(0, currentMorale - appliedDamage);
  let criticalResult = null;

  if (appliedDamage > 0) {
    await updateShipActorDocument(targetShipActor, {
      "system.resources.hullIntegrity.value": newHullIntegrity,
      "system.crew.value": newCrew,
      "system.resources.morale.value": newMorale
    });
    await callShipActorMethod(targetShipActor, "syncCrippledState", { announced: true, sourceName: `${shipActor.name}: ${weapon.name}` });
    if (criticalDamage > 0) {
      criticalResult = await resolveStarshipCriticalHit(targetShipActor, shipActor, weapon, criticalDamage, {
        sourceLabel: `${weapon.name} (${shipActor.name})`
      });
    }
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
        <p><strong>Critical Hit:</strong> ${criticalResult ? `${criticalResult.effectiveRoll} - ${criticalResult.criticalEntry?.name ?? "Critical Result"}` : "None"}</p>
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
    damageRolls,
    criticalResult
  };
}

async function resolveLanceAttack(shipActor, weapon, targetToken, attackResult) {
  const targetShipActor = targetToken?.actor;
  if (!targetShipActor || targetShipActor.type !== "ship") return null;

  const rawHits = Math.max(0, 1 + Math.floor((Math.max(0, Number(attackResult?.degrees ?? 0) || 0)) / 3));
  const targetShields = Math.max(0, Number(targetShipActor.getEffectiveShipShields?.() ?? targetShipActor.system?.shields ?? 0) || 0);
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
  const criticalHits = [];
  const criticalResults = [];

  for (let index = 0; index < remainingHits; index += 1) {
    const damageRoll = await (new Roll(String(weapon.system?.damage ?? "0"))).evaluate({ async: true });
    const damageTotal = Number(damageRoll.total ?? 0) || 0;
    const hullIntegrityBeforeHit = runningHullIntegrity;
    const criticalDamage = hullIntegrityBeforeHit > 0
      ? Math.max(0, damageTotal - hullIntegrityBeforeHit)
      : damageTotal;
    totalDamage += damageTotal;
    runningHullIntegrity = Math.max(0, runningHullIntegrity - damageTotal);
    runningCrew = Math.max(0, runningCrew - damageTotal);
    runningMorale = Math.max(0, runningMorale - damageTotal);
    damageRolls.push({
      formula: damageRoll.formula,
      total: damageTotal,
      criticalDamage,
      hullIntegrityAfter: runningHullIntegrity,
      crewAfter: runningCrew,
      moraleAfter: runningMorale
    });
    if (criticalDamage > 0) {
      criticalHits.push({
        criticalDamage,
        hitNumber: index + 1
      });
    }
  }

  const appliedDamage = totalDamage;
  if (appliedDamage > 0) {
    await updateShipActorDocument(targetShipActor, {
      "system.resources.hullIntegrity.value": runningHullIntegrity,
      "system.crew.value": runningCrew,
      "system.resources.morale.value": runningMorale
    });
    await callShipActorMethod(targetShipActor, "syncCrippledState", { announced: true, sourceName: `${shipActor.name}: ${weapon.name}` });
    for (const criticalHit of criticalHits) {
      const criticalResult = await resolveStarshipCriticalHit(targetShipActor, shipActor, weapon, criticalHit.criticalDamage, {
        sourceLabel: `${weapon.name} (${shipActor.name}) Hit ${criticalHit.hitNumber}`
      });
      if (criticalResult) {
        criticalResults.push({
          ...criticalResult,
          hitNumber: criticalHit.hitNumber
        });
      }
    }
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
        <p><strong>Critical Hit:</strong> ${criticalResults.length ? criticalResults.map((entry) => `Hit ${entry.hitNumber}: ${entry.effectiveRoll} - ${entry.criticalEntry?.name ?? "Critical Result"}`).join("; ") : "None"}</p>
        ${damageRolls.length ? `<ul>${damageRolls.map((roll, index) => `<li>Hit ${index + 1}: ${roll.formula} = ${roll.total} (HI ${roll.hullIntegrityAfter}, Crew ${roll.crewAfter}, Morale ${roll.moraleAfter}${roll.criticalDamage > 0 ? `, Crit ${roll.criticalDamage}` : ""})</li>`).join("")}</ul>` : ""}
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
    damageRolls,
    criticalHits,
    criticalResults
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

  const weaponClass = String(weapon.system?.weaponClass ?? "").trim().toLowerCase();
  if (weaponClass === "torpedo") {
    if (Boolean(weapon.system?.torpedoLoading)) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} is still loading.`);
      return null;
    }
    if (!Boolean(weapon.system?.torpedoLoaded ?? true)) {
      ui.notifications?.warn(`Rogue Trader | ${weapon.name} is not loaded.`);
      return null;
    }

    return launchTorpedoSalvo(shipActor, weapon, options);
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

  const shipShootingModifier = Number(shipActor.getShipShootingModifier?.() ?? 0) || 0;
  const result = useNpcCrew
    ? await rollD100Test({
      actor: null,
      title: `${shipActor.name}: Fire ${weapon.name}`,
      target: npcCrewRating,
      modifier: Number(rangeData?.modifier ?? 0) + shipShootingModifier,
      breakdown: [
        `NPC Crew Rating: ${npcCrewRating}`,
        ...(rangeData ? [`Range Modifier: ${rangeData.modifier >= 0 ? `+${rangeData.modifier}` : rangeData.modifier}`] : []),
        ...(shipShootingModifier ? [`Ship Shooting Modifier: ${shipShootingModifier >= 0 ? `+${shipShootingModifier}` : shipShootingModifier}`] : [])
      ],
      extra
    })
    : await gunnerActor.rollCharacteristic("ballisticSkill", {
      modifier: Number(rangeData?.modifier ?? 0) + shipShootingModifier,
      label: `${gunnerActor.name}: Fire ${weapon.name} (${shipActor.name})`,
      extra: [
        ...extra,
        ...(shipShootingModifier ? [`Ship Shooting Modifier: ${shipShootingModifier >= 0 ? `+${shipShootingModifier}` : shipShootingModifier}`] : [])
      ]
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
  resolveTorpedoDetonation,
  deleteTorpedoActorAndToken,
  detonateAndRemoveTorpedo,
  processShipLaunchedTorpedoesTurnStart,
  launchTorpedoSalvo,
  rollStarshipWeaponAttack
};
