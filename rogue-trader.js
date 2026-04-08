import { RogueTraderCharacterSheet } from "./module/character.js";
import { RogueTraderNPCSheet } from "./module/npc.js";
import { RogueTraderShipSheet } from "./module/ship.js";
import { RogueTraderShipComponentSheet } from "./module/ship-component.js";
import { RogueTraderShipWeaponSheet } from "./module/ship-weapon.js";
import { RogueTraderStarshipHullSheet } from "./module/starship-hull.js";
import {
  STARSHIP_BEARING_LABELS,
  STARSHIP_MOUNT_ARCS,
  getShipFacingDegrees,
  getRelativeBearing,
  getAllowedFiringArcsForMount,
  canMountFireAtBearing,
  canWeaponFireAtTarget,
  getActiveStarshipGunnerActor,
  getPrimaryShipToken,
  rollStarshipWeaponAttack
} from "./module/starship-combat.js";
import { RogueTraderActor } from "./module/documents/actor.js";
import { RogueTraderItem } from "./module/documents/item.js";
import { rerollChatMessageWithFate } from "./module/rolls.js";
import { RogueTraderSkillSheet, ROGUE_TRADER_SKILLS, getRogueTraderSkillDefinition, buildSkillItemData, listRogueTraderSkills } from "./module/skill.js";
import { RogueTraderTalentSheet, ROGUE_TRADER_TALENTS, getRogueTraderTalentDefinition, buildTalentItemData, listRogueTraderTalents } from "./module/talent.js";
import { ROGUE_TRADER_REFERENCE_TABLES, ROGUE_TRADER_MENTAL_DISORDERS, ROGUE_TRADER_CRITICAL_INJURIES, getReferenceTableDefinition, listReferenceTables, resolveReferenceTableResult, buildReferenceTableItemData, getMentalDisorderDefinition, listMentalDisorders, buildMentalDisorderItemData, getCriticalInjuryDefinition, listCriticalInjuries, buildCriticalInjuryItemData } from "./module/reference-tables.js";
import { RogueTraderPsychicTechniqueSheet } from "./module/psychic-technique.js";
import { RogueTraderNavigatorPowerSheet } from "./module/navigator-power.js";
import { RogueTraderWeaponSheet } from "./module/weapon.js";
import { RogueTraderArmorSheet } from "./module/armor.js";
import { RogueTraderGearSheet } from "./module/gear.js";
import { RogueTraderConsumableSheet } from "./module/consumable.js";
import { RogueTraderToolSheet } from "./module/tool.js";
import { RogueTraderCyberneticSheet } from "./module/cybernetic.js";
import {
  RogueTraderConsequenceSheet,
  isConsequenceType,
  resolveTraitModifierFormula
} from "./module/consequence.js";

const ROGUETRADER_STATUS_EFFECTS = [
  {
    id: "on-fire",
    name: "On Fire",
    img: "icons/svg/fire.svg",
    statuses: ["on-fire"]
  },
  {
    id: "stunned",
    name: "Stunned",
    img: "icons/svg/daze.svg",
    statuses: ["stunned"]
  },
  {
    id: "snared",
    name: "Snared",
    img: "icons/svg/net.svg",
    statuses: ["snared"]
  },
  {
    id: "fear",
    name: "Fear",
    img: "icons/svg/terror.svg",
    statuses: ["fear"]
  },
  {
    id: "pinned",
    name: "Pinned",
    img: "icons/svg/anchor.svg",
    statuses: ["pinned"]
  },
  {
    id: "braced",
    name: "Braced",
    img: "icons/svg/anchor.svg",
    statuses: ["braced"]
  },
  {
    id: "fatigued",
    name: "Fatigued",
    img: "icons/svg/daze.svg",
    statuses: ["fatigued"]
  },
  {
    id: "prone",
    name: "Prone",
    img: "icons/svg/falling.svg",
    statuses: ["prone"]
  },
  {
    id: "frenzied",
    name: "Frenzied",
    img: "icons/svg/blood.svg",
    statuses: ["frenzied"]
  },
  {
    id: "crippled",
    name: "Crippled",
    img: "modules/game-icons-net/whitetransparent/ship-wreck.svg",
    statuses: ["crippled"]
  },
  {
    id: "sensors-damaged",
    name: "Sensors Damaged",
    img: "icons/svg/blind.svg",
    statuses: ["sensors-damaged"]
  },
  {
    id: "thrusters-damaged",
    name: "Thrusters Damaged",
    img: "modules/game-icons-net/whitetransparent/boat-propeller.svg",
    statuses: ["thrusters-damaged"]
  },
  {
    id: "ship-fire",
    name: "Fire!",
    img: "icons/svg/fire.svg",
    statuses: ["ship-fire"]
  }
];
const ON_FIRE_SEQUENCE_NAME_PREFIX = "roguetrader-on-fire";
const ON_FIRE_SEQUENCE_FILE = "jb2a.flames.orange.03.1x1";
const SNARED_SEQUENCE_NAME_PREFIX = "roguetrader-snared";
const SNARED_SEQUENCE_FILE = "modules/JB2A_DnD5e/Library/Generic/Energy/ShieldEldritchWebAbove01_01_Dark_Purple_400x400.webm";
const FEAR_SEQUENCE_NAME_PREFIX = "roguetrader-fear";
const FEAR_SEQUENCE_FILE = "jb2a.markers.fear.dark_purple.02";
const PINNED_SEQUENCE_NAME_PREFIX = "roguetrader-pinned";
const PINNED_SEQUENCE_FILE = "modules/JB2A_DnD5e/Library/Generic/Marker/MarkerStun_02_Regular_Purple_400x400.webm";
const FRENZIED_SEQUENCE_NAME_PREFIX = "roguetrader-frenzied";
const FRENZIED_SEQUENCE_FILE = "jb2a.markers.runes02.dark_orange.02";
const CRIPPLED_SEQUENCE_NAME_PREFIX = "roguetrader-crippled";
const CRIPPLED_SEQUENCE_FILE = "jb2a.static_electricity.03.blue";
const SHIP_FIRE_SEQUENCE_NAME_PREFIX = "roguetrader-ship-fire";
const SHIP_FIRE_SEQUENCE_FILE = "jb2a.flames.orange.01";
const DEAD_VISUAL_ALPHA = 0.6;
const DEAD_VISUAL_TINT = "#7a2a2a";

async function createWeaponAttackMacro(item, slot) {
  if (!item || item.type !== "weapon") return false;
  if (!item.parent?.isOwner) {
    ui.notifications?.warn("Rogue Trader | You can only create attack macros for weapons you own.");
    return false;
  }

  const command = `
const item = await fromUuid("${item.uuid}");
if (!item?.parent?.rollAttack) {
  ui.notifications?.warn("Rogue Trader | Could not find that weapon attack.");
  return;
}
await item.parent.rollAttack(item.id);
`.trim();

  let macro = game.macros?.find((existing) =>
    existing?.name === item.name
    && existing?.command === command
  );

  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: {
        roguetrader: {
          weaponMacro: true,
          itemUuid: item.uuid
        }
      }
    });
  }

  await game.user?.assignHotbarMacro(macro, slot);
  return false;
}

function mergeStatusEffects(existingEffects = [], overrideEffects = []) {
  const normalized = Array.isArray(existingEffects) ? [...existingEffects] : [];

  for (const override of overrideEffects) {
    const overrideStatuses = new Set(Array.isArray(override?.statuses) ? override.statuses : []);
    const matchIndex = normalized.findIndex((effect) => {
      if (!effect) return false;
      if (String(effect.id ?? "") === String(override.id ?? "")) return true;
      const existingStatuses = Array.isArray(effect.statuses) ? effect.statuses : [];
      return existingStatuses.some((status) => overrideStatuses.has(status));
    });

    if (matchIndex >= 0) {
      normalized.splice(matchIndex, 1, override);
    } else {
      normalized.push(override);
    }
  }

  return normalized;
}

function getOnFireSequenceName(token) {
  return `${ON_FIRE_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getSnaredSequenceName(token) {
  return `${SNARED_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getFearSequenceName(token) {
  return `${FEAR_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getPinnedSequenceName(token) {
  return `${PINNED_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getFrenziedSequenceName(token) {
  return `${FRENZIED_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getCrippledSequenceName(token) {
  return `${CRIPPLED_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getShipFireSequenceName(token) {
  return `${SHIP_FIRE_SEQUENCE_NAME_PREFIX}-${token.document?.uuid ?? token.id}`;
}

function getActorCanvasTokens(actor) {
  if (!actor || !canvas?.tokens?.placeables) return [];
  return canvas.tokens.placeables.filter((token) => token?.actor?.uuid === actor.uuid);
}

function getCombatantPrimaryToken(combatant) {
  return combatant?.token?.object ?? combatant?.token ?? combatant?.actor?.getActiveTokens?.()?.[0] ?? null;
}

function areCombatantsHostile(leftCombatant, rightCombatant) {
  const leftToken = getCombatantPrimaryToken(leftCombatant);
  const rightToken = getCombatantPrimaryToken(rightCombatant);
  const leftDisposition = Number(leftToken?.document?.disposition ?? leftToken?.disposition ?? 0);
  const rightDisposition = Number(rightToken?.document?.disposition ?? rightToken?.disposition ?? 0);
  if (leftDisposition === 0 || rightDisposition === 0) return false;
  return leftDisposition !== rightDisposition;
}

async function promptFearTargets(sourceCombatant, sourceActor) {
  const combat = game.combat;
  if (!combat) return [];

  const candidates = combat.combatants.filter((combatant) =>
    combatant?.id !== sourceCombatant.id
    && combatant?.actor
  );

  if (!candidates.length) return [];

  const markup = candidates.map((combatant) => {
    const checked = areCombatantsHostile(sourceCombatant, combatant) ? "checked" : "";
    return `
      <label class="roguetrader-fear-target">
        <input type="checkbox" name="fearTarget" value="${combatant.id}" ${checked} />
        <span>${foundry.utils.escapeHTML(combatant.name ?? combatant.actor?.name ?? "Unknown")}</span>
      </label>
    `;
  }).join("");

  return new Promise((resolve) => {
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      resolve(value);
    };

    new Dialog({
      title: `${sourceActor.name}: Fear Targets`,
      content: `
        <form class="roguetrader-fear-target-form">
          <p>Select which combatants must test against this creature's Fear.</p>
          <div class="roguetrader-fear-target-list">
            ${markup}
          </div>
        </form>
      `,
      buttons: {
        roll: {
          label: "Resolve Fear",
          callback: (html) => {
            const selected = html.find('[name="fearTarget"]:checked').map((_, element) => String(element.value)).get();
            finish(candidates.filter((combatant) => selected.includes(combatant.id)));
          }
        },
        cancel: {
          label: "Cancel",
          callback: () => finish([])
        }
      },
      default: "roll",
      close: () => finish([])
    }).render(true);
  });
}

async function resolveCombatTrackerFear(combatantId) {
  const combat = game.combat;
  const combatant = combat?.combatants?.get(combatantId);
  const actor = combatant?.actor;
  if (!combatant || !actor?.getFearRating || !actor?.rollFearTest) {
    ui.notifications?.warn("Rogue Trader | Could not find that fear source.");
    return;
  }

  const fearRating = actor.getFearRating();
  if (fearRating <= 0) {
    ui.notifications?.warn("Rogue Trader | That combatant does not appear to have a Fear trait.");
    return;
  }

  const targets = await promptFearTargets(combatant, actor);
  if (!targets.length) return;

  for (const targetCombatant of targets) {
    if (!targetCombatant?.actor) continue;
    await createFearTestPrompt(targetCombatant.actor, {
      fearRating,
      sourceActor: actor,
      sourceName: actor.name
    });
  }
}

function renderFearPromptMarkup({
  actorName,
  sourceLabel,
  fearRating,
  fearLabel,
  fearModifier
}) {
  return `
    <div class="roguetrader-roll-card roguetrader-fear-card roguetrader-fear-card-prompt">
      <h3>${actorName}: Fear Test</h3>
      <p><strong>Source:</strong> ${sourceLabel}</p>
      <p><strong>Fear Rating:</strong> Fear (${fearRating}) - ${fearLabel}</p>
      <p><strong>Willpower Modifier:</strong> ${fearModifier >= 0 ? `+${fearModifier}` : fearModifier}</p>
      <div class="roguetrader-attack-resolution" data-rt-fear-container="true">
        <p>Roll to resist the effects of fear.</p>
        <div class="roguetrader-attack-resolution-actions">
          <button type="button" class="roguetrader-attack-resolution-button" data-rt-fear-action="test">Fear Test</button>
        </div>
      </div>
    </div>
  `;
}

function renderFearResolutionMarkup({
  actorName,
  sourceLabel,
  resolution,
  accepted = false
}) {
  const result = resolution?.result ?? null;
  const initialResult = resolution?.initialResult ?? null;
  const success = Boolean(resolution?.success);
  const immune = Boolean(resolution?.immune);
  const rerolled = Boolean(resolution?.rerolled);
  const canRerollWithFate = !immune && !success && !accepted;

  return `
    <div class="roguetrader-roll-card roguetrader-fear-card roguetrader-fear-card-resolution">
      <h3>${actorName}: Fear Resolution</h3>
      <p><strong>Source:</strong> ${sourceLabel}</p>
      <p><strong>Fear Rating:</strong> Fear (${resolution?.fearRating ?? 1}) - ${resolution?.fearLabel ?? "Disturbing"}</p>
      ${immune ? "<p><strong>Outcome:</strong> Immune to Fear.</p>" : ""}
      ${!immune ? `<p><strong>Fear Test:</strong> ${initialResult?.rollTotal ?? "?"} vs ${initialResult?.finalTarget ?? "?"} (${initialResult?.outcome ?? "Unknown"})</p>` : ""}
      ${rerolled ? `<p><strong>Unshakeable Faith Reroll:</strong> ${result?.rollTotal ?? "?"} vs ${result?.finalTarget ?? "?"} (${result?.outcome ?? "Unknown"})</p>` : ""}
      ${!immune ? `<p><strong>Final Outcome:</strong> ${success ? "Passed" : "Failed"}</p>` : ""}
      ${rerolled ? "<p><strong>Unshakeable Faith:</strong> Free reroll used.</p>" : ""}
      ${!immune && !success ? `<p><strong>Degrees of Failure:</strong> ${result?.degrees ?? 0}</p>` : ""}
      ${!immune && !success ? `<p><strong>Shock Roll:</strong> ${resolution?.shockRoll?.total ?? "?"} ${resolution?.shockModifier ? `+ ${resolution.shockModifier}` : ""} = ${resolution?.shockTotal ?? 0}</p>` : ""}
      ${!immune && !success ? `<p><strong>Shock Result:</strong> ${resolution?.shockEntry?.name ?? "Unknown"}</p>` : ""}
      ${!immune && !success && resolution?.shockEntry?.description ? `<p>${resolution.shockEntry.description}</p>` : ""}
      ${accepted ? "<p><strong>Accepted:</strong> Results acknowledged. Effect automation can now be applied.</p>" : ""}
      ${canRerollWithFate ? `<p class="roguetrader-roll-hint">You may spend Fate to reroll before accepting the result.</p>` : ""}
      ${!accepted ? `
        <div class="roguetrader-attack-resolution" data-rt-fear-container="true">
          <div class="roguetrader-attack-resolution-actions">
            ${canRerollWithFate ? `<button type="button" class="roguetrader-attack-resolution-button" data-rt-fear-action="reroll">Spend Fate to Reroll</button>` : ""}
            <button type="button" class="roguetrader-attack-resolution-button" data-rt-fear-action="accept">Accept Results</button>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

async function createFearTestPrompt(targetActor, { fearRating, sourceActor = null, sourceName = "" } = {}) {
  const rating = Math.max(1, Math.min(4, Number(fearRating ?? 1) || 1));
  const labelMap = {
    1: { label: "Disturbing", modifier: 0 },
    2: { label: "Frightening", modifier: -10 },
    3: { label: "Horrifying", modifier: -20 },
    4: { label: "Terrifying", modifier: -30 }
  };
  const fearData = labelMap[rating] ?? labelMap[1];
  const sourceLabel = sourceName || sourceActor?.name || "Fear Source";

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: targetActor }),
    flavor: renderFearPromptMarkup({
      actorName: targetActor.name,
      sourceLabel,
      fearRating: rating,
      fearLabel: fearData.label,
      fearModifier: fearData.modifier
    }),
    flags: {
      roguetrader: {
        fearResolution: {
          actorUuid: targetActor.uuid,
          sourceActorUuid: sourceActor?.uuid ?? null,
          sourceName: sourceLabel,
          fearRating: rating,
          fearLabel: fearData.label,
          fearModifier: fearData.modifier,
          status: "pending",
          accepted: false,
          resolution: null
        }
      }
    }
  });
}

function serializeFearResolution(resolution) {
  if (!resolution) return null;

  return {
    immune: Boolean(resolution.immune),
    success: Boolean(resolution.success),
    fearRating: Number(resolution.fearRating ?? 1),
    fearLabel: String(resolution.fearLabel ?? ""),
    fearModifier: Number(resolution.fearModifier ?? 0),
    resistanceModifier: Number(resolution.resistanceModifier ?? 0),
    totalModifier: Number(resolution.totalModifier ?? 0),
    sourceLabel: String(resolution.sourceLabel ?? ""),
    rerolled: Boolean(resolution.rerolled),
    shockModifier: Number(resolution.shockModifier ?? 0),
    shockTotal: Number(resolution.shockTotal ?? 0),
    initialResult: resolution.initialResult ? {
      rollTotal: Number(resolution.initialResult.rollTotal ?? 0),
      finalTarget: Number(resolution.initialResult.finalTarget ?? 0),
      outcome: String(resolution.initialResult.outcome ?? ""),
      degrees: Number(resolution.initialResult.degrees ?? 0),
      success: Boolean(resolution.initialResult.success)
    } : null,
    result: resolution.result ? {
      rollTotal: Number(resolution.result.rollTotal ?? 0),
      finalTarget: Number(resolution.result.finalTarget ?? 0),
      outcome: String(resolution.result.outcome ?? ""),
      degrees: Number(resolution.result.degrees ?? 0),
      success: Boolean(resolution.result.success)
    } : null,
    shockRoll: resolution.shockRoll ? {
      total: Number(resolution.shockRoll.total ?? 0)
    } : null,
    shockEntry: resolution.shockEntry ? {
      name: String(resolution.shockEntry.name ?? ""),
      description: String(resolution.shockEntry.description ?? "")
    } : null
  };
}

function getDeadStatusIds() {
  return new Set(["dead", CONFIG.specialStatusEffects?.DEFEATED ?? "defeated"]);
}

function actorHasDeadStatus(actor) {
  if (!actor) return false;
  const deadStatusIds = getDeadStatusIds();
  return Array.from(deadStatusIds).some((statusId) =>
    actor.statuses?.has?.(statusId)
    || actor._getStatusEffectByStatusId?.(statusId)
  );
}

async function applyDeadTokenVisual(actor) {
  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const tokenDocument = token?.document;
    if (!tokenDocument) continue;

    const alreadyApplied = Boolean(tokenDocument.getFlag("roguetrader", "deadVisualApplied"));
    const updates = {
      alpha: DEAD_VISUAL_ALPHA,
      "texture.tint": DEAD_VISUAL_TINT,
      "flags.roguetrader.deadVisualApplied": true
    };

    if (!alreadyApplied) {
      updates["flags.roguetrader.deadVisualOriginalAlpha"] = Number(tokenDocument.alpha ?? 1);
      updates["flags.roguetrader.deadVisualOriginalTint"] = String(tokenDocument.texture?.tint ?? "");
    }

    try {
      await tokenDocument.update(updates);
    } catch (error) {
      console.warn("Rogue Trader | Failed to apply dead token visual.", error);
    }
  }
}

async function clearDeadTokenVisual(actor) {
  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const tokenDocument = token?.document;
    if (!tokenDocument) continue;

    const originalAlpha = Number(tokenDocument.getFlag("roguetrader", "deadVisualOriginalAlpha"));
    const originalTint = String(tokenDocument.getFlag("roguetrader", "deadVisualOriginalTint") ?? "");

    try {
      await tokenDocument.update({
        alpha: Number.isFinite(originalAlpha) ? originalAlpha : 1,
        "texture.tint": originalTint || null,
        "flags.roguetrader.deadVisualApplied": false
      });
    } catch (error) {
      console.warn("Rogue Trader | Failed to clear dead token visual.", error);
    }
  }
}

async function playOnFireSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active || !globalThis.Sequence) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token?.document) continue;
    const existingName = getOnFireSequenceName(token);

    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
      await new globalThis.Sequence()
        .effect()
        .file(ON_FIRE_SEQUENCE_FILE)
        .attachTo(token)
        .scaleToObject(1.15)
        .opacity(0.95)
        .name(existingName)
        .persist()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play On Fire Sequencer effect.", error);
    }
  }
}

async function stopOnFireSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const existingName = getOnFireSequenceName(token);
    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop On Fire Sequencer effect.", error);
    }
  }
}

async function playSnaredSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active || !globalThis.Sequence) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token?.document) continue;
    const existingName = getSnaredSequenceName(token);

    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
      await new globalThis.Sequence()
        .effect()
        .file(SNARED_SEQUENCE_FILE)
        .attachTo(token)
        .scaleToObject(1.2)
        .opacity(0.95)
        .name(existingName)
        .persist()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play Snared Sequencer effect.", error);
    }
  }
}

async function stopSnaredSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const existingName = getSnaredSequenceName(token);
    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop Snared Sequencer effect.", error);
    }
  }
}

async function playFearSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active || !globalThis.Sequence) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token?.document) continue;
    const existingName = getFearSequenceName(token);

    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
      await new globalThis.Sequence()
        .effect()
        .file(FEAR_SEQUENCE_FILE)
        .attachTo(token)
        .scaleToObject(1.1)
        .opacity(0.95)
        .name(existingName)
        .persist()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play Fear Sequencer effect.", error);
    }
  }
}

async function stopFearSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const existingName = getFearSequenceName(token);
    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop Fear Sequencer effect.", error);
    }
  }
}

async function playPinnedSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active || !globalThis.Sequence) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token?.document) continue;
    const existingName = getPinnedSequenceName(token);

    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
      await new globalThis.Sequence()
        .effect()
        .file(PINNED_SEQUENCE_FILE)
        .attachTo(token)
        .scaleToObject(1.0)
        .opacity(0.95)
        .name(existingName)
        .persist()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play Pinned Sequencer effect.", error);
    }
  }
}

async function stopPinnedSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const existingName = getPinnedSequenceName(token);
    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop Pinned Sequencer effect.", error);
    }
  }
}

async function playFrenziedSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active || !globalThis.Sequence) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token?.document) continue;
    const existingName = getFrenziedSequenceName(token);

    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
      await new globalThis.Sequence()
        .effect()
        .file(FRENZIED_SEQUENCE_FILE)
        .attachTo(token)
        .scaleToObject(1.1)
        .opacity(0.9)
        .name(existingName)
        .persist()
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play Frenzied Sequencer effect.", error);
    }
  }
}

async function stopFrenziedSequencerEffect(actor) {
  if (!game.modules.get("sequencer")?.active) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const existingName = getFrenziedSequenceName(token);
    try {
      await globalThis.Sequencer?.EffectManager?.endEffects({ name: existingName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop Frenzied Sequencer effect.", error);
    }
  }
}

async function playCrippledSequencerEffect(actor) {
  if (!globalThis.Sequencer) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token) continue;

    const sequenceName = getCrippledSequenceName(token);
    if (Sequencer.EffectManager?.getEffects?.({ name: sequenceName }).length) continue;

    try {
      await new Sequence()
        .effect()
        .name(sequenceName)
        .file(CRIPPLED_SEQUENCE_FILE)
        .attachTo(token)
        .persist()
        .scaleToObject(1.2)
        .opacity(0.9)
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play crippled Sequencer effect.", error);
    }
  }
}

async function stopCrippledSequencerEffect(actor) {
  if (!globalThis.Sequencer) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const sequenceName = getCrippledSequenceName(token);
    try {
      await Sequencer.EffectManager?.endEffects?.({ name: sequenceName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop crippled Sequencer effect.", error);
    }
  }
}

async function playShipFireSequencerEffect(actor) {
  if (!globalThis.Sequencer) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    if (!token) continue;

    const sequenceName = getShipFireSequenceName(token);
    if (Sequencer.EffectManager?.getEffects?.({ name: sequenceName }).length) continue;

    try {
      await new Sequence()
        .effect()
        .name(sequenceName)
        .file(SHIP_FIRE_SEQUENCE_FILE)
        .attachTo(token)
        .persist()
        .scaleToObject(1.35)
        .opacity(0.92)
        .play();
    } catch (error) {
      console.warn("Rogue Trader | Failed to play ship fire Sequencer effect.", error);
    }
  }
}

async function stopShipFireSequencerEffect(actor) {
  if (!globalThis.Sequencer) return;

  const tokens = getActorCanvasTokens(actor);
  for (const token of tokens) {
    const sequenceName = getShipFireSequenceName(token);
    try {
      await Sequencer.EffectManager?.endEffects?.({ name: sequenceName, object: token });
    } catch (error) {
      console.warn("Rogue Trader | Failed to stop ship fire Sequencer effect.", error);
    }
  }
}

Hooks.once("init", () => {
  console.log("Rogue Trader | Initializing system");

  CONFIG.Actor.documentClass = RogueTraderActor;
  CONFIG.Item.documentClass = RogueTraderItem;
  CONFIG.Combat.initiative = {
    formula: "1d10 + @initiativeBonus",
    decimals: 0
  };
  CONFIG.statusEffects = mergeStatusEffects(CONFIG.statusEffects ?? [], ROGUETRADER_STATUS_EFFECTS);

  game.roguetrader = {
    config: {
      actorTypes: ["character", "npc", "ship"],
      itemTypes: ["skill", "weapon", "armor", "gear", "consumable", "tool", "cybernetic", "talent", "psychicTechnique", "navigatorPower", "psychicPower", "shipComponent", "essentialComponent", "supplementalComponent", "shipWeapon", "starshipHull", "mutation", "malignancy", "mentalDisorder", "criticalInjury"],
      statusEffects: ROGUETRADER_STATUS_EFFECTS
    },
    skills: {
      registry: ROGUE_TRADER_SKILLS,
      get: getRogueTraderSkillDefinition,
      buildItemData: buildSkillItemData,
      list: listRogueTraderSkills
    },
    talents: {
      registry: ROGUE_TRADER_TALENTS,
      get: getRogueTraderTalentDefinition,
      buildItemData: buildTalentItemData,
      list: listRogueTraderTalents
    },
    references: {
      tables: ROGUE_TRADER_REFERENCE_TABLES,
      mentalDisorders: ROGUE_TRADER_MENTAL_DISORDERS,
      criticalInjuries: ROGUE_TRADER_CRITICAL_INJURIES,
      getTable: getReferenceTableDefinition,
      listTables: listReferenceTables,
      resolve: resolveReferenceTableResult,
      buildItemData: buildReferenceTableItemData,
      getMentalDisorder: getMentalDisorderDefinition,
      listMentalDisorders,
      buildMentalDisorderItemData,
      getCriticalInjury: getCriticalInjuryDefinition,
      listCriticalInjuries,
      buildCriticalInjuryItemData
    },
    starshipCombat: {
      bearings: STARSHIP_BEARING_LABELS,
      mountArcs: STARSHIP_MOUNT_ARCS,
      getShipFacingDegrees,
      getRelativeBearing,
      getAllowedFiringArcsForMount,
      canMountFireAtBearing,
      canWeaponFireAtTarget,
      getActiveStarshipGunnerActor,
      getPrimaryShipToken,
      fireWeapon: rollStarshipWeaponAttack
    },
    rolls: {
      characteristic: (actor, characteristicKey, options = {}) => actor?.rollCharacteristic?.(characteristicKey, options),
      skill: (actor, skillRef, options = {}) => actor?.rollSkill?.(skillRef, options),
      psychic: (actor, techniqueRef, options = {}) => actor?.rollPsychicTechnique?.(techniqueRef, options),
      attack: (actor, weaponRef, options = {}) => actor?.rollAttack?.(weaponRef, options)
    },
    macros: {
      createWeaponAttackMacro
    }
  };

  RogueTraderCharacterSheet.register();
  RogueTraderNPCSheet.register();
  RogueTraderShipSheet.register();
  RogueTraderSkillSheet.register();
  RogueTraderTalentSheet.register();
  RogueTraderPsychicTechniqueSheet.register();
  RogueTraderNavigatorPowerSheet.register();
  RogueTraderWeaponSheet.register();
  RogueTraderShipComponentSheet.register();
  RogueTraderShipWeaponSheet.register();
  RogueTraderStarshipHullSheet.register();
  RogueTraderArmorSheet.register();
  RogueTraderGearSheet.register();
  RogueTraderConsumableSheet.register();
  RogueTraderToolSheet.register();
  RogueTraderCyberneticSheet.register();
  RogueTraderConsequenceSheet.register();
});

Hooks.once("ready", () => {
  console.log("Rogue Trader | System ready");

  for (const actor of game.actors?.contents ?? []) {
    if (actor?.ensureNaturalWeaponsState) {
      void actor.ensureNaturalWeaponsState();
    }
    if (actor?.ensureHulkingArmorState) {
      void actor.ensureHulkingArmorState();
    }
    if (actor?.syncFatigueStates) {
      void actor.syncFatigueStates();
    }
    if (actor?.syncCrippledState) {
      void actor.syncCrippledState({ announced: false });
    }
  }

  for (const token of canvas?.tokens?.placeables ?? []) {
    const actor = token.actor;
    if (actor?.isOnFire?.()) {
      void playOnFireSequencerEffect(actor);
    }
    if (actor?.isSnared?.()) {
      void playSnaredSequencerEffect(actor);
    }
    if (actor?.isAfraid?.()) {
      void playFearSequencerEffect(actor);
    }
    if (actor?.isPinned?.()) {
      void playPinnedSequencerEffect(actor);
    }
    if (actor?.isFrenzied?.()) {
      void playFrenziedSequencerEffect(actor);
    }
    if (actor?.isCrippled?.()) {
      void playCrippledSequencerEffect(actor);
    }
    if (actor?.isShipOnFire?.()) {
      void playShipFireSequencerEffect(actor);
    }
    if (actorHasDeadStatus(actor)) {
      void applyDeadTokenVisual(actor);
    }
  }
});

Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data?.type !== "Item" || !data?.roguetraderWeaponMacro) return true;

  void (async () => {
    const item = await Item.implementation.fromDropData(data);
    if (!item || item.type !== "weapon") return;
    await createWeaponAttackMacro(item, slot);
  })();

  return false;
});

Hooks.on("updateCombat", async (combat, changed) => {
  if (!game.user?.isGM) return;
  if (!foundry.utils.hasProperty(changed, "turn") && !foundry.utils.hasProperty(changed, "round")) return;

  const combatant = combat?.combatant;
  const actor = combatant?.actor;
  if (!actor) return;
  if (actor.handleRegenerationTurnStart) await actor.handleRegenerationTurnStart(combat);
  if (actor.handleOnFireTurnStart) await actor.handleOnFireTurnStart(combat);
  if (actor.handleStunnedTurnStart) await actor.handleStunnedTurnStart(combat);
  if (actor.handleSnaredTurnStart) await actor.handleSnaredTurnStart(combat);
  if (actor.handlePinnedTurnStart) await actor.handlePinnedTurnStart(combat);
});

Hooks.on("renderCombatTracker", (app, html) => {
  const root = html?.[0] ?? html;
  if (!root?.querySelectorAll) return;

  root.querySelectorAll(".roguetrader-combat-fear").forEach((element) => element.remove());

  root.querySelectorAll("li.combatant").forEach((element) => {
    const combatantId = String(element.dataset.combatantId ?? "");
    const combatant = game.combat?.combatants?.get(combatantId);
    const actor = combatant?.actor;
    if (!combatant || !actor?.getFearRating || actor.getFearRating() <= 0) return;

    const button = document.createElement("a");
    button.className = "combatant-control roguetrader-combat-fear";
    button.dataset.tooltip = "Resolve Fear";
    button.title = "Resolve Fear";
    button.innerHTML = `<i class="fas fa-ghost"></i><span>Fear</span>`;

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!game.user?.isGM) {
        ui.notifications?.warn("Rogue Trader | Only the GM can trigger combat-tracker Fear tests.");
        return;
      }

      await resolveCombatTrackerFear(combatantId);
    });

    const controls = element.querySelector(".combatant-controls");
    if (controls) {
      controls.prepend(button);
      return;
    }

    const fallbackTarget = element.querySelector(".token-name")
      ?? element.querySelector(".combatant-name")
      ?? element.querySelector("h4")
      ?? element.querySelector(".token-initiative");

    if (fallbackTarget) {
      fallbackTarget.append(button);
      return;
    }

    element.prepend(button);
  });
});

Hooks.on("renderChatMessage", (message, html) => {
  if (html.find(".roguetrader-roll-card[data-fate-reroll='true']").length) {
    new ContextMenu(html, ".roguetrader-roll-card[data-fate-reroll='true']", [
      {
        name: "Spend Fate to Reroll",
        icon: '<i class="fas fa-redo"></i>',
        callback: async () => {
          await rerollChatMessageWithFate(message);
        }
      }
    ]);
  }

  html.find("[data-rt-fear-action]").on("click", async (event) => {
    event.preventDefault();

    const action = String(event.currentTarget?.dataset?.rtFearAction ?? "test");
    const fearResolution = message?.flags?.roguetrader?.fearResolution ?? null;
    const actorUuid = String(fearResolution?.actorUuid ?? "");
    if (!fearResolution || !actorUuid) {
      ui.notifications?.warn("Rogue Trader | That Fear prompt is no longer valid.");
      return;
    }

    const actor = await fromUuid(actorUuid);
    const sourceActor = fearResolution?.sourceActorUuid ? await fromUuid(fearResolution.sourceActorUuid) : null;
    if (!actor?.resolveFearTest) {
      ui.notifications?.warn("Rogue Trader | Could not find that actor.");
      return;
    }

    if (!(game.user?.isGM || actor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the actor's owner or the GM can resolve this Fear test.");
      return;
    }

    html.find("[data-rt-fear-action]").prop("disabled", true);

    if (action === "test" || action === "reroll") {
      if (action === "reroll") {
        const spent = await actor.spendFate?.(1);
        if (!spent) {
          ui.notifications?.warn("Rogue Trader | No fate points remaining.");
          html.find("[data-rt-fear-action]").prop("disabled", false);
          return;
        }
      }

      const resolution = await actor.resolveFearTest({
        fearRating: Number(fearResolution.fearRating ?? 1),
        sourceActor,
        sourceName: fearResolution.sourceName ?? sourceActor?.name ?? "",
        fateReroll: action === "reroll"
      });
      const storedResolution = serializeFearResolution(resolution);

      await message.update({
        flavor: renderFearResolutionMarkup({
          actorName: actor.name,
          sourceLabel: fearResolution.sourceName ?? sourceActor?.name ?? "Fear Source",
          resolution: storedResolution,
          accepted: false
        }),
        flags: {
          roguetrader: {
            ...(message.flags?.roguetrader ?? {}),
            fearResolution: {
              ...fearResolution,
              status: "resolved",
              accepted: false,
              resolution: storedResolution
            }
          }
        }
      });
      return;
    }

    if (action === "accept") {
      const resolution = fearResolution?.resolution ?? null;
      await message.update({
        flavor: renderFearResolutionMarkup({
          actorName: actor.name,
          sourceLabel: fearResolution.sourceName ?? sourceActor?.name ?? "Fear Source",
          resolution,
          accepted: true
        }),
        flags: {
          roguetrader: {
            ...(message.flags?.roguetrader ?? {}),
            fearResolution: {
              ...fearResolution,
              accepted: true
            }
          }
        }
      });
    }
  });

  html.find("[data-rt-attack-resolution]").on("click", async (event) => {
    event.preventDefault();

    const action = String(event.currentTarget?.dataset?.rtAttackResolution ?? "none");
    const attackResolution = message?.flags?.roguetrader?.attackResolution;
    if (!attackResolution || attackResolution.resolved) {
      ui.notifications?.warn("Rogue Trader | That attack has already been resolved.");
      return;
    }

    const targetActor = await fromUuid(attackResolution.targetActorUuid);
    if (!targetActor) {
      ui.notifications?.warn("Rogue Trader | Could not find the defending actor.");
      return;
    }

    if (!(game.user?.isGM || targetActor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the defending actor's owner or the GM can resolve this defence.");
      return;
    }

    const attackerActor = await fromUuid(attackResolution.attackerActorUuid);
    if (!attackerActor?.resolveAttackResolutionMessage) {
      ui.notifications?.warn("Rogue Trader | Could not find the attacking actor.");
      return;
    }

    html.find("[data-rt-attack-resolution]").prop("disabled", true);
    await attackerActor.resolveAttackResolutionMessage(message, action);
  });

  html.find("[data-rt-flame-resolution]").on("click", async (event) => {
    event.preventDefault();

    const action = String(event.currentTarget?.dataset?.rtFlameResolution ?? "none");
    const targetTokenUuid = String(event.currentTarget?.dataset?.rtFlameTargetUuid ?? "");
    const attackResolution = message?.flags?.roguetrader?.flameAttackResolution;
    if (!attackResolution || !targetTokenUuid) {
      ui.notifications?.warn("Rogue Trader | Could not find the pending flame attack.");
      return;
    }

    const targetEntry = (attackResolution.targets ?? []).find((target) => target.tokenUuid === targetTokenUuid);
    if (!targetEntry) {
      ui.notifications?.warn("Rogue Trader | Could not find that flame target.");
      return;
    }

    if (targetEntry.resolved) {
      ui.notifications?.warn("Rogue Trader | That flame target has already been resolved.");
      return;
    }

    const targetActor = await fromUuid(targetEntry.actorUuid);
    if (!targetActor) {
      ui.notifications?.warn("Rogue Trader | Could not find the defending actor.");
      return;
    }

    if (!(game.user?.isGM || targetActor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the defending actor's owner or the GM can resolve this defence.");
      return;
    }

    const attackerActor = await fromUuid(attackResolution.attackerActorUuid);
    if (!attackerActor?.resolveFlameAttackResolutionMessage) {
      ui.notifications?.warn("Rogue Trader | Could not find the attacking actor.");
      return;
    }

    html.find(`[data-rt-flame-target-uuid="${targetTokenUuid}"]`).prop("disabled", true);
    await attackerActor.resolveFlameAttackResolutionMessage(message, targetTokenUuid, action);
  });

  html.find("[data-rt-flame-delete-template]").on("click", async (event) => {
    event.preventDefault();

    const attackResolution = message?.flags?.roguetrader?.flameAttackResolution;
    if (!attackResolution?.templateUuid) {
      ui.notifications?.warn("Rogue Trader | No flame template is associated with this attack.");
      return;
    }

    const attackerActor = await fromUuid(attackResolution.attackerActorUuid);
    if (!attackerActor?.deleteFlameAttackTemplate) {
      ui.notifications?.warn("Rogue Trader | Could not find the attacking actor.");
      return;
    }

    if (!(game.user?.isGM || attackerActor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the attacker or the GM can delete this template.");
      return;
    }

    html.find("[data-rt-flame-delete-template]").prop("disabled", true);
    await attackerActor.deleteFlameAttackTemplate(message);
  });

  html.find("[data-rt-blast-resolution]").on("click", async (event) => {
    event.preventDefault();

    const action = String(event.currentTarget?.dataset?.rtBlastResolution ?? "none");
    const targetTokenUuid = String(event.currentTarget?.dataset?.rtBlastTargetUuid ?? "");
    if (!targetTokenUuid) return;

    const attackResolution = message?.flags?.roguetrader?.blastAttackResolution;
    const targetEntry = attackResolution?.targets?.find?.((target) => target.tokenUuid === targetTokenUuid);
    if (!targetEntry) return;

    const targetActor = await fromUuid(targetEntry.actorUuid);
    if (!targetActor) {
      ui.notifications?.warn("Rogue Trader | Could not find the defending actor.");
      return;
    }

    if (!(game.user?.isGM || targetActor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the defending actor's owner or the GM can resolve this defence.");
      return;
    }

    const attackerActor = await fromUuid(attackResolution.attackerActorUuid);
    if (!attackerActor?.resolveBlastAttackResolutionMessage) {
      ui.notifications?.warn("Rogue Trader | Could not find the attacking actor.");
      return;
    }

    html.find(`[data-rt-blast-target-uuid="${targetTokenUuid}"]`).prop("disabled", true);
    await attackerActor.resolveBlastAttackResolutionMessage(message, targetTokenUuid, action);
  });

  html.find("[data-rt-suppressive-resolution]").on("click", async (event) => {
    event.preventDefault();

    const action = String(event.currentTarget?.dataset?.rtSuppressiveResolution ?? "none");
    const targetTokenUuid = String(event.currentTarget?.dataset?.rtSuppressiveTargetUuid ?? "");
    if (!targetTokenUuid) return;

    const attackResolution = message?.flags?.roguetrader?.suppressiveAttackResolution;
    const targetEntry = attackResolution?.targets?.find?.((target) => target.tokenUuid === targetTokenUuid);
    if (!targetEntry) return;

    const targetActor = await fromUuid(targetEntry.actorUuid);
    if (!targetActor) {
      ui.notifications?.warn("Rogue Trader | Could not find the defending actor.");
      return;
    }

    if (!(game.user?.isGM || targetActor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the defending actor's owner or the GM can resolve this defence.");
      return;
    }

    const attackerActor = await fromUuid(attackResolution.attackerActorUuid);
    if (!attackerActor?.resolveSuppressiveFireResolutionMessage) {
      ui.notifications?.warn("Rogue Trader | Could not find the attacking actor.");
      return;
    }

    html.find(`[data-rt-suppressive-target-uuid="${targetTokenUuid}"]`).prop("disabled", true);
    await attackerActor.resolveSuppressiveFireResolutionMessage(message, targetTokenUuid, action);
  });

  html.find("[data-rt-delete-template-uuid]").on("click", async (event) => {
    event.preventDefault();

    const templateUuid = String(event.currentTarget?.dataset?.rtDeleteTemplateUuid ?? "");
    const actorUuid = String(event.currentTarget?.dataset?.rtDeleteTemplateActorUuid ?? "");
    if (!templateUuid || !actorUuid) return;

    const actor = await fromUuid(actorUuid);
    if (!actor) {
      ui.notifications?.warn("Rogue Trader | Could not find the actor for that template.");
      return;
    }

    if (!(game.user?.isGM || actor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the attacker or the GM can delete this template.");
      return;
    }

    const templateDocument = await fromUuid(templateUuid);
    if (!templateDocument) {
      ui.notifications?.warn("Rogue Trader | That template no longer exists.");
      return;
    }

    html.find(`[data-rt-delete-template-uuid="${templateUuid}"]`).prop("disabled", true);
    await templateDocument.delete();
  });

  html.find("[data-rt-onfire-extinguish]").on("click", async (event) => {
    event.preventDefault();

    const actorUuid = String(event.currentTarget?.dataset?.rtOnfireActorUuid ?? "");
    if (!actorUuid) return;

    const actor = await fromUuid(actorUuid);
    if (!actor?.attemptExtinguishFire) {
      ui.notifications?.warn("Rogue Trader | Could not find that actor.");
      return;
    }

    if (!(game.user?.isGM || actor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the actor's owner or the GM can resolve this.");
      return;
    }

    html.find(`[data-rt-onfire-actor-uuid="${actorUuid}"]`).prop("disabled", true);
    await actor.attemptExtinguishFire();
  });

  html.find("[data-rt-clear-jam]").on("click", async (event) => {
    event.preventDefault();

    const clearJam = message?.flags?.roguetrader?.clearJam ?? null;
    const actorUuid = String(clearJam?.actorUuid ?? "");
    const weaponId = String(clearJam?.weaponId ?? "");
    if (!actorUuid || !weaponId) return;

    const actor = await fromUuid(actorUuid);
    if (!actor?.clearJammedWeapon) {
      ui.notifications?.warn("Rogue Trader | Could not find the actor for that jammed weapon.");
      return;
    }

    if (!(game.user?.isGM || actor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the actor's owner or the GM can clear this jam.");
      return;
    }

    html.find("[data-rt-clear-jam]").prop("disabled", true);
    await actor.clearJammedWeapon(weaponId);
  });

  html.find("[data-rt-clear-stunned-fate]").on("click", async (event) => {
    event.preventDefault();

    const actorUuid = String(event.currentTarget?.dataset?.rtStunnedActorUuid ?? "");
    if (!actorUuid) return;

    const actor = await fromUuid(actorUuid);
    if (!actor?.spendFateToClearStunned) {
      ui.notifications?.warn("Rogue Trader | Could not find that actor.");
      return;
    }

    if (!(game.user?.isGM || actor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the actor's owner or the GM can resolve this.");
      return;
    }

    html.find(`[data-rt-stunned-actor-uuid="${actorUuid}"]`).prop("disabled", true);
    await actor.spendFateToClearStunned();
  });

  html.find("[data-rt-escape-snare]").on("click", async (event) => {
    event.preventDefault();

    const actorUuid = String(event.currentTarget?.dataset?.rtSnaredActorUuid ?? "");
    const method = String(event.currentTarget?.dataset?.rtEscapeSnare ?? "agility");
    if (!actorUuid) return;

    const actor = await fromUuid(actorUuid);
    if (!actor?.attemptEscapeSnare) {
      ui.notifications?.warn("Rogue Trader | Could not find that actor.");
      return;
    }

    if (!(game.user?.isGM || actor.isOwner)) {
      ui.notifications?.warn("Rogue Trader | Only the actor's owner or the GM can resolve this.");
      return;
    }

    html.find(`[data-rt-snared-actor-uuid="${actorUuid}"]`).prop("disabled", true);
    await actor.attemptEscapeSnare(method);
  });
});

Hooks.on("createItem", async (item, options, userId) => {
  if (!item.actor) return;
  if (game.user?.id !== userId) return;

  if (item.actor.ensureNaturalWeaponsState && (item.type === "talent" || isConsequenceType(item.type))) {
    await item.actor.ensureNaturalWeaponsState();
  }
  if (item.actor.ensureHulkingArmorState && item.type === "armor") {
    await item.actor.ensureHulkingArmorState();
  }

  if (!isConsequenceType(item.type)) return;

  await resolveItemModifierFormulas(item);
});

Hooks.on("preDeleteItem", (item) => {
  if (!item.actor) return;
  if (!item.flags?.roguetrader?.protectedNaturalWeapon) return;
  if (!item.actor.hasTrait?.("natural weapons")) return;

  ui.notifications?.warn("Rogue Trader | Natural Weapons are part of the creature and cannot be removed while it still has the trait.");
  return false;
});

Hooks.on("preDeleteItem", (item) => {
  if (!item.actor) return;
  if (!item.flags?.roguetrader?.protectedHulkingSizeTrait) return;
  if (!item.actor.hasEquippedHulkingArmor?.()) return;

  ui.notifications?.warn("Rogue Trader | Size (Hulking) is being provided by equipped armour and cannot be removed while that armour remains equipped.");
  return false;
});

Hooks.on("createActiveEffect", async (effect, options, userId) => {
  if (game.user?.id !== userId) return;
  if (effect.parent?.documentName !== "Actor") return;
  const statuses = Array.from(effect.statuses ?? []);
  const deadStatusIds = getDeadStatusIds();
  if (statuses.includes("on-fire")) {
    await effect.parent.update({
      "system.conditions.onFire.active": true
    });
    await playOnFireSequencerEffect(effect.parent);
  }
  if (statuses.includes("stunned")) {
    await effect.parent.update({
      "system.conditions.stunned.active": true
    });
  }
  if (statuses.includes("snared")) {
    await effect.parent.update({
      "system.conditions.snared.active": true
    });
    await playSnaredSequencerEffect(effect.parent);
  }
  if (statuses.includes("fear")) {
    await effect.parent.update({
      "system.conditions.fear.active": true
    });
    await playFearSequencerEffect(effect.parent);
  }
  if (statuses.includes("pinned")) {
    await effect.parent.update({
      "system.conditions.pinned.active": true
    });
    await playPinnedSequencerEffect(effect.parent);
  }
  if (statuses.includes("braced")) {
    await effect.parent.update({
      "system.conditions.braced.active": true
    });
  }
    if (statuses.includes("fatigued")) {
      await effect.parent.update({
        "system.conditions.fatigued.active": true
      });
    }
    if (statuses.includes("prone")) {
      await effect.parent.update({
        "system.conditions.prone.active": true
      });
    }
  if (statuses.includes("frenzied")) {
      await effect.parent.update({
        "system.conditions.frenzied.active": true
      });
      await effect.parent.clearFear?.({ announced: false });
      await effect.parent.clearPinned?.({ announced: false });
      await effect.parent.clearStunned?.({ announced: false });
      await effect.parent.syncFatigueStates?.({ announced: false });
      await playFrenziedSequencerEffect(effect.parent);
    }
  if (statuses.includes("crippled")) {
    await effect.parent.update({
      "system.conditions.crippled.active": true
    });
    await playCrippledSequencerEffect(effect.parent);
  }
  if (statuses.includes("sensors-damaged")) {
    await effect.parent.update({
      "system.conditions.sensorsDamaged.active": true
    });
  }
  if (statuses.includes("thrusters-damaged")) {
    await effect.parent.update({
      "system.conditions.thrustersDamaged.active": true
    });
  }
  if (statuses.includes("ship-fire")) {
    await effect.parent.update({
      "system.conditions.shipFire.active": true
    });
    await playShipFireSequencerEffect(effect.parent);
  }
  if (statuses.some((status) => deadStatusIds.has(status))) {
    await applyDeadTokenVisual(effect.parent);
  }
});

Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
  if (game.user?.id !== userId) return;
  if (effect.parent?.documentName !== "Actor") return;
  const statuses = Array.from(effect.statuses ?? []);
  const deadStatusIds = getDeadStatusIds();
  if (statuses.includes("on-fire")) {
    await effect.parent.update({
      "system.conditions.onFire.active": false,
      "system.conditions.onFire.source": "",
      "system.conditions.onFire.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });
    await stopOnFireSequencerEffect(effect.parent);
  }
  if (statuses.includes("stunned")) {
    await effect.parent.update({
      "system.conditions.stunned.active": false,
      "system.conditions.stunned.source": "",
      "system.conditions.stunned.roundsRemaining": 0,
      "system.conditions.stunned.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });
  }
  if (statuses.includes("snared")) {
    await effect.parent.update({
      "system.conditions.snared.active": false,
      "system.conditions.snared.source": "",
      "system.conditions.snared.lastProcessed": {
        "combatId": "",
        "round": 0,
        "turn": 0
      }
    });
    await stopSnaredSequencerEffect(effect.parent);
  }
  if (statuses.includes("fear")) {
    await effect.parent.update({
      "system.conditions.fear.active": false,
      "system.conditions.fear.source": ""
    });
    await stopFearSequencerEffect(effect.parent);
  }
  if (statuses.includes("pinned")) {
    await effect.parent.update({
      "system.conditions.pinned.active": false,
      "system.conditions.pinned.source": "",
      "system.conditions.pinned.lastProcessed": {
        combatId: "",
        round: 0,
        turn: 0
      }
    });
    await stopPinnedSequencerEffect(effect.parent);
  }
  if (statuses.includes("braced")) {
    await effect.parent.update({
      "system.conditions.braced.active": false,
      "system.conditions.braced.source": ""
    });
  }
    if (statuses.includes("fatigued")) {
      await effect.parent.update({
        "system.conditions.fatigued.active": false,
        "system.conditions.fatigued.source": ""
      });
    }
    if (statuses.includes("prone")) {
      await effect.parent.update({
        "system.conditions.prone.active": false,
        "system.conditions.prone.source": ""
      });
    }
    if (statuses.includes("frenzied")) {
      await effect.parent.update({
        "system.conditions.frenzied.active": false,
        "system.conditions.frenzied.source": ""
      });
      await effect.parent.syncFatigueStates?.({ announced: false });
      await stopFrenziedSequencerEffect(effect.parent);
    }
  if (statuses.includes("crippled")) {
    await effect.parent.update({
      "system.conditions.crippled.active": false,
      "system.conditions.crippled.source": ""
    });
    await stopCrippledSequencerEffect(effect.parent);
  }
  if (statuses.includes("sensors-damaged")) {
    await effect.parent.update({
      "system.conditions.sensorsDamaged.active": false,
      "system.conditions.sensorsDamaged.source": ""
    });
  }
  if (statuses.includes("thrusters-damaged")) {
    await effect.parent.update({
      "system.conditions.thrustersDamaged.active": false,
      "system.conditions.thrustersDamaged.source": "",
      "system.conditions.thrustersDamaged.rollTotal": 0,
      "system.conditions.thrustersDamaged.turningDisabled": false,
      "system.conditions.thrustersDamaged.maneuverPenalty": 0
    });
  }
  if (statuses.includes("ship-fire")) {
    await effect.parent.update({
      "system.conditions.shipFire.active": false,
      "system.conditions.shipFire.source": ""
    });
    await stopShipFireSequencerEffect(effect.parent);
  }
  if (statuses.some((status) => deadStatusIds.has(status)) && !actorHasDeadStatus(effect.parent)) {
    await clearDeadTokenVisual(effect.parent);
  }
});

Hooks.on("updateActor", async (actor, changed, options, userId) => {
  if (game.user?.id !== userId) return;
  if (foundry.utils.hasProperty(changed, "system.resources.fatigue")) {
    if (actor?.syncFatigueStates) {
      await actor.syncFatigueStates({ announced: true });
    }
  }
  if (foundry.utils.hasProperty(changed, "system.resources.hullIntegrity.value")) {
    if (actor?.syncCrippledState) {
      await actor.syncCrippledState({ announced: true });
    }
  }
});

Hooks.on("updateItem", async (item, changed, options, userId) => {
  if (!item.actor) return;
  if (game.user?.id !== userId) return;

  if (item.actor.ensureNaturalWeaponsState && (item.type === "talent" || item.flags?.roguetrader?.generatedNaturalWeapon)) {
    await item.actor.ensureNaturalWeaponsState();
  }
  if (item.actor.ensureHulkingArmorState && (item.type === "armor" || item.flags?.roguetrader?.generatedHulkingSizeTrait)) {
    await item.actor.ensureHulkingArmorState();
  }

  if (!isConsequenceType(item.type)) return;
  if (options?.roguetraderSkipModifierResolution) return;
  const changedModifierFormula = foundry.utils.hasProperty(changed, "system.modifierFormula");
  if (!changedModifierFormula) return;

  await resolveItemModifierFormulas(item, { forceModifier: changedModifierFormula });
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (!item.actor) return;
  if (game.user?.id !== userId) return;
  if (item.actor.ensureNaturalWeaponsState && item.type === "talent") {
    await item.actor.ensureNaturalWeaponsState();
  }
  if (item.actor.ensureHulkingArmorState && (item.type === "armor" || item.flags?.roguetrader?.generatedHulkingSizeTrait)) {
    await item.actor.ensureHulkingArmorState();
  }
});

async function resolveItemModifierFormulas(item, { forceModifier = false } = {}) {
  const updates = {};

  const legacyCharacteristicFormula = String(item.system?.characteristicModifierFormula ?? "").trim();
  const legacySkillFormula = String(item.system?.skillModifierFormula ?? "").trim();
  const legacyFormula = [legacyCharacteristicFormula, legacySkillFormula].filter(Boolean).join(", ");
  const modifierFormula = String(item.system?.modifierFormula ?? "").trim() || legacyFormula;
  const modifierAlreadyResolved = Boolean(item.flags?.roguetrader?.modifierFormulaResolved);
  if (forceModifier || (modifierFormula && !modifierAlreadyResolved)) {
    if (!modifierFormula) {
      updates["system.resolvedModifiers"] = "";
      updates["flags.roguetrader.modifierFormulaResolved"] = false;
    } else {
      const { resolvedText, rolls } = await resolveTraitModifierFormula(modifierFormula);
      updates["system.modifierFormula"] = modifierFormula;
      updates["system.resolvedModifiers"] = resolvedText || modifierFormula;
      updates["flags.roguetrader.modifierFormulaResolved"] = true;
      await postResolvedModifierRolls(item, rolls);
    }
  }

  if (!Object.keys(updates).length) return;
  await item.update(updates, { roguetraderSkipModifierResolution: true });
}

async function postResolvedModifierRolls(item, rolls) {
  for (const rollData of rolls) {
    await rollData.roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: item.actor }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${item.actor.name}: ${item.name}</h3>
          <p><strong>Resolved Modifier:</strong> ${rollData.label} ${rollData.operator}${rollData.total}</p>
          <p><strong>Formula:</strong> ${rollData.label} ${rollData.operator}${rollData.expression}</p>
        </div>
      `
    });
  }
}
