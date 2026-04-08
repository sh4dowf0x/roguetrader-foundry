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

const PSYCHIC_TEST_LABELS = {
  no: "No Test",
  willpower: "Willpower",
  opposedWillpower: "Opposed Willpower",
  psyniscience: "Psyniscience"
};

const ATTACK_TYPE_OPTIONS = {
  melee: [
    { key: "standard", label: "Standard Attack (+0)" },
    { key: "calledShot", label: "Called Shot (-20)" },
    { key: "charge", label: "Charge (+10)" },
    { key: "allOut", label: "All Out Attack (+20)" }
  ],
  ranged: [
    { key: "standard", label: "Standard Attack (+0)" },
    { key: "calledShot", label: "Called Shot (-20)" },
    { key: "semiAuto", label: "Semi-Auto Burst (+10)" },
    { key: "fullAuto", label: "Full Auto Burst (+20)" },
    { key: "suppressiveFire", label: "Suppressive Fire (-20)" }
  ],
  thrown: [
    { key: "standard", label: "Standard Attack (+0)" },
    { key: "calledShot", label: "Called Shot (-20)" }
  ]
};

function isFlameWeapon(weapon) {
  return Boolean(weapon?.system?.special?.flame)
    || String(weapon?.system?.weaponType ?? "").trim().toLowerCase() === "flame";
}

function isGrenadeWeapon(weapon) {
  return String(weapon?.system?.weaponType ?? "").trim().toLowerCase() === "grenade";
}

function isPlasmaWeapon(weapon) {
  return String(weapon?.system?.weaponType ?? "").trim().toLowerCase() === "plasma";
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

function getWeaponAmmoState(weapon) {
  const maxClip = Number(weapon?.system?.clip ?? 0);
  const storedCurrentClip = Number(weapon?.system?.currentClip ?? Number.NaN);
  const ammoInitialized = Boolean(weapon?.flags?.roguetrader?.ammoInitialized);
  let currentClip = Number.isFinite(storedCurrentClip) ? storedCurrentClip : maxClip;

  if (!ammoInitialized && maxClip > 0) {
    currentClip = maxClip;
  }

  currentClip = Math.max(0, Math.min(currentClip, maxClip));

  return { maxClip, currentClip };
}

function getTokenCenter(token) {
  if (token?.object?.center) return token.object.center;
  if (token?.center) return token.center;

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

function getCanvasDistanceInMetersBetweenPoints(from, to) {
  const dx = Number(to?.x ?? 0) - Number(from?.x ?? 0);
  const dy = Number(to?.y ?? 0) - Number(from?.y ?? 0);
  const pixelDistance = Math.hypot(dx, dy);
  const gridDistance = Number(canvas?.dimensions?.distance ?? 1) || 1;
  const gridSize = Number(canvas?.dimensions?.size ?? 100) || 100;
  return (pixelDistance / gridSize) * gridDistance;
}

function getStandardRangeBandKey(distanceMeters, weaponRangeMeters) {
  const distance = Math.max(0, Number(distanceMeters ?? 0));
  const range = Math.max(0, Number(weaponRangeMeters ?? 0));

  if (distance <= 3) return "pointBlank";
  if (distance <= (range / 2)) return "short";
  if (distance <= range) return "standard";
  if (distance <= (range * 2)) return "long";
  return "extreme";
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
  const gridSize = Number(canvas?.dimensions?.size ?? 100) || 100;
  const leftWidth = Number(leftToken?.w ?? leftToken?.object?.w ?? (Number(leftToken?.width ?? 1) * gridSize));
  const leftHeight = Number(leftToken?.h ?? leftToken?.object?.h ?? (Number(leftToken?.height ?? 1) * gridSize));
  const rightWidth = Number(rightToken?.w ?? rightToken?.object?.w ?? (Number(rightToken?.width ?? 1) * gridSize));
  const rightHeight = Number(rightToken?.h ?? rightToken?.object?.h ?? (Number(rightToken?.height ?? 1) * gridSize));

  const horizontalGap = Math.abs(leftCenter.x - rightCenter.x) - ((leftWidth + rightWidth) / 2);
  const verticalGap = Math.abs(leftCenter.y - rightCenter.y) - ((leftHeight + rightHeight) / 2);
  const tolerance = 2;

  return horizontalGap <= tolerance && verticalGap <= tolerance;
}

function actorHasTalentNamed(actor, talentName) {
  const target = String(talentName ?? "").trim().toLowerCase();
  if (!target) return false;

  return (actor?.items ?? []).some((item) =>
    item?.type === "talent"
    && String(item.name ?? "").trim().toLowerCase() === target
  );
}

function getTwoWeaponAttackSetup(actor, currentWeapon) {
  const equippedWeapons = actor?.getEquippedWeaponsInHandOrder?.() ?? [];
  if (equippedWeapons.length < 2) {
    return {
      available: false,
      reason: "Two weapons must be equipped."
    };
  }

  const currentIndex = equippedWeapons.findIndex((item) => item.id === currentWeapon?.id);
  if (currentIndex === -1) {
    return {
      available: false,
      reason: "The selected weapon is not currently equipped."
    };
  }

  if (!actorHasTalentNamed(actor, "Two-Weapon Wielder")) {
    return {
      available: false,
      reason: "Two-Weapon Wielder is required to attack with both weapons."
    };
  }

  const penalty = actorHasTalentNamed(actor, "Ambidextrous") ? -10 : -20;
  const otherIndex = currentIndex === 0 ? 1 : 0;
  const otherWeapon = equippedWeapons[otherIndex] ?? null;
  return {
    available: Boolean(otherWeapon),
    reason: otherWeapon ? "" : "A second equipped weapon could not be found.",
    currentHandLabel: currentIndex === 0 ? "Primary" : "Off-hand",
    otherHandLabel: otherIndex === 0 ? "Primary" : "Off-hand",
    currentWeapon: currentWeapon,
    otherWeapon: otherWeapon,
    penalty: penalty
  };
}

const AIM_OPTIONS = [
  { key: "none", label: "No Aim (+0)", modifier: 0 },
  { key: "half", label: "Half Aim (+10)", modifier: 10 },
  { key: "full", label: "Full Aim (+20)", modifier: 20 }
];

const RANGE_BAND_OPTIONS = [
  { key: "standard", label: "Standard Range (+0)", modifier: 0 },
  { key: "pointBlank", label: "Point Blank (+30)", modifier: 30 },
  { key: "short", label: "Short Range (+10)", modifier: 10 },
  { key: "long", label: "Long Range (-10)", modifier: -10 },
  { key: "extreme", label: "Extreme Range (-30)", modifier: -30 }
];

const CALLED_SHOT_LOCATION_OPTIONS = [
  { key: "head", label: "Head" },
  { key: "rightArm", label: "Right Arm" },
  { key: "leftArm", label: "Left Arm" },
  { key: "body", label: "Body" },
  { key: "rightLeg", label: "Right Leg" },
  { key: "leftLeg", label: "Left Leg" }
];

const DIFFICULTY_ORDER = [
  "hellish",
  "punishing",
  "arduous",
  "veryHard",
  "hard",
  "difficult",
  "challenging",
  "ordinary",
  "routine",
  "easy",
  "simple",
  "elementary",
  "trivial"
];

const DIFFICULTY_LEVELS = {
  trivial: { label: "Trivial (+60)", modifier: 60 },
  elementary: { label: "Elementary (+50)", modifier: 50 },
  simple: { label: "Simple (+40)", modifier: 40 },
  easy: { label: "Easy (+30)", modifier: 30 },
  routine: { label: "Routine (+20)", modifier: 20 },
  ordinary: { label: "Ordinary (+10)", modifier: 10 },
  challenging: { label: "Challenging (+0)", modifier: 0 },
  difficult: { label: "Difficult (-10)", modifier: -10 },
  hard: { label: "Hard (-20)", modifier: -20 },
  veryHard: { label: "Very Hard (-30)", modifier: -30 },
  arduous: { label: "Arduous (-40)", modifier: -40 },
  punishing: { label: "Punishing (-50)", modifier: -50 },
  hellish: { label: "Hellish (-60)", modifier: -60 }
};

const MAX_TEST_MODIFIER = 60;

export function getCharacteristicLabel(key) {
  return CHARACTERISTIC_LABELS[key] ?? key;
}

export function getPsychicTestLabel(key) {
  return PSYCHIC_TEST_LABELS[key] ?? key;
}

export function getDifficultyOptions(selected = "challenging") {
  return Object.entries(DIFFICULTY_LEVELS).map(([key, value]) => ({
    key,
    label: value.label,
    modifier: value.modifier,
    selected: key === selected
  }));
}

export function getAssistedDifficultyKey(difficultyKey) {
  const index = DIFFICULTY_ORDER.indexOf(difficultyKey);
  if (index === -1) return difficultyKey;
  return DIFFICULTY_ORDER[Math.min(index + 1, DIFFICULTY_ORDER.length - 1)];
}

export function calculateDegrees(target, rollTotal, success) {
  const margin = success ? target - rollTotal : rollTotal - target;
  return Math.max(0, Math.floor(margin / 10));
}

export function getOutcomeLabel(success, degrees) {
  if (success) {
    return degrees === 0 ? "Standard Success" : `${degrees} Degree${degrees === 1 ? "" : "s"} of Success`;
  }

  return degrees === 0 ? "Standard Failure" : `${degrees} Degree${degrees === 1 ? "" : "s"} of Failure`;
}

export async function promptCharacteristicTest(actor, characteristicKey) {
  const baseTarget = actor.getCharacteristicValue(characteristicKey);

  return promptRollDialog({
    actor,
    title: `${actor.name}: ${getCharacteristicLabel(characteristicKey)}`,
    testLabel: getCharacteristicLabel(characteristicKey),
    baseTarget,
    onRoll: ({ modifier, difficultyLabel, otherModifier, spentFate, assisted }) => actor.rollCharacteristic(characteristicKey, {
      modifier,
      successDegreeBonus: assisted ? 1 : 0,
      extra: [
        `Difficulty: ${difficultyLabel}`,
        `Other Modifier: ${otherModifier >= 0 ? `+${otherModifier}` : otherModifier}`,
        `Fate Spent: ${spentFate ? "Yes (+10)" : "No"}`,
        `Assisted: ${assisted ? "Yes" : "No"}`
      ]
    })
  });
}

export async function promptSkillTest(actor, skill) {
  const characteristicKey = skill.system.characteristic ?? "intelligence";
  const characteristicValue = actor.getCharacteristicValue(characteristicKey);
  const trained = Boolean(skill.system.trained);
  const basic = Boolean(skill.system.basic);
  const previewTarget = !trained && basic ? Math.floor(characteristicValue / 2) : characteristicValue;

  return promptRollDialog({
    actor,
    title: `${actor.name}: ${skill.name}`,
    testLabel: `${skill.name} (${getCharacteristicLabel(characteristicKey)})`,
    baseTarget: previewTarget,
    notes: [
      `Characteristic: ${getCharacteristicLabel(characteristicKey)} ${characteristicValue}`,
      `State: ${trained ? "Trained" : (basic ? "Basic Untrained" : "Advanced Untrained")}`
    ],
    onRoll: ({ modifier, difficultyLabel, otherModifier, spentFate, assisted }) => actor.rollSkill(skill, {
      modifier,
      successDegreeBonus: assisted ? 1 : 0,
      extra: [
        `Difficulty: ${difficultyLabel}`,
        `Other Modifier: ${otherModifier >= 0 ? `+${otherModifier}` : otherModifier}`,
        `Fate Spent: ${spentFate ? "Yes (+10)" : "No"}`,
        `Assisted: ${assisted ? "Yes" : "No"}`
      ]
    })
  });
}

export async function promptAttackTest(actor, weapon, promptOptions = {}) {
  const flameWeapon = isFlameWeapon(weapon);
  const grenadeWeapon = isGrenadeWeapon(weapon);
  const allowTwoWeaponWorkflow = promptOptions.allowTwoWeaponWorkflow !== false;
  const titleSuffix = String(promptOptions.titleSuffix ?? "");
  const promptNotes = Array.isArray(promptOptions.promptNotes) ? promptOptions.promptNotes : [];
  const defaultMiscModifier = Number(promptOptions.defaultMiscModifier ?? 0);
  const weaponClass = String(weapon.system.class ?? "basic").trim().toLowerCase();
  const activeToken = actor.getActiveTokens?.()[0] ?? null;
  const engagedHostiles = activeToken && weaponClass !== "melee" && weaponClass !== "pistol" && canvas?.tokens
    ? canvas.tokens.placeables.filter((token) =>
      token?.id !== activeToken.id
      && token?.actor
      && areTokensHostileToEachOther(activeToken, token)
      && areTokensAdjacent(activeToken, token)
    )
    : [];
  if (engagedHostiles.length) {
    ui.notifications?.warn("Rogue Trader | You cannot make that ranged attack while engaged in melee with a hostile target. Use a melee weapon or a pistol.");
    return null;
  }
  const targets = Array.from(game.user?.targets ?? []);
  const primaryTarget = targets[0] ?? null;
  const characteristicKey = weaponClass === "melee" ? "weaponSkill" : "ballisticSkill";
  const baseTarget = actor.getCharacteristicValue(characteristicKey);
  const { maxClip, currentClip } = getWeaponAmmoState(weapon);
  const rof = parseRateOfFire(weapon.system.rof);
  if (!flameWeapon && !grenadeWeapon && !targets.length && rof.fullAuto <= 0) {
    ui.notifications?.warn("Rogue Trader | You must target a token before making an attack.");
    return null;
  }
  const grenadeRange = grenadeWeapon ? (actor.getCharacteristicBonus?.("strength") ?? 0) * 3 : null;
  const showMaximalMode = isPlasmaWeapon(weapon);
  const defaultMaximalMode = showMaximalMode && Boolean(weapon.system?.maximalMode);
  const equippedWeapons = (actor.items ?? []).filter((item) =>
    item?.type === "weapon" && Boolean(item.system?.equipped)
  );
  const twoWeaponSetup = getTwoWeaponAttackSetup(actor, weapon);
  const defaultTwoWeaponFighting = Boolean(promptOptions.defaultTwoWeaponFighting ?? twoWeaponSetup.available);
  let attackTypeOptions = weaponClass === "melee"
    ? ATTACK_TYPE_OPTIONS.melee
    : weaponClass === "thrown"
      ? ATTACK_TYPE_OPTIONS.thrown
      : ATTACK_TYPE_OPTIONS.ranged;

  if (weaponClass !== "melee" && weaponClass !== "thrown") {
    attackTypeOptions = attackTypeOptions.filter((option) => {
      if (option.key === "semiAuto") return rof.semiAuto > 0;
      if (option.key === "fullAuto") return rof.fullAuto > 0;
      if (option.key === "suppressiveFire") return rof.fullAuto > 0;
      return true;
    });
  }
  attackTypeOptions = attackTypeOptions.map((option) => {
    if (option.key !== "charge") return option;
    return {
      ...option,
      label: actorHasTalentNamed(actor, "Berserk Charge") ? "Charge (+20)" : "Charge (+10)"
    };
  });
  const showCalledShotLocation = attackTypeOptions.some((option) => option.key === "calledShot");
  const showBraceHeavyWeapon = weaponClass === "heavy";
  const defaultBraceHeavyWeapon = Boolean(actor.isHeavyWeaponBraced?.(weapon));
  const showRangeBand = weaponClass !== "melee" && !grenadeWeapon;
  const showClip = weaponClass !== "melee" && weaponClass !== "thrown";
  const canAdvanceOnFullAuto = ["pistol", "basic"].includes(weaponClass);
  const baseWeaponRange = Number(weapon.system?.range ?? 0);
  const effectiveWeaponRange = baseWeaponRange + (defaultMaximalMode ? 10 : 0);
  const autoRangeDistance = showRangeBand && activeToken && primaryTarget
    ? getCanvasDistanceInMetersBetweenPoints(getTokenCenter(activeToken), getTokenCenter(primaryTarget))
    : null;
  const defaultRangeBandKey = showRangeBand && autoRangeDistance != null
    ? getStandardRangeBandKey(autoRangeDistance, effectiveWeaponRange)
    : "standard";
  const rangeBandOptions = RANGE_BAND_OPTIONS.map((option) => ({
    ...option,
    selected: option.key === defaultRangeBandKey
  }));

  const content = await renderTemplate("systems/roguetrader/templates/dialogs/attack.hbs", {
    title: `${actor.name}: ${weapon.name}${titleSuffix}`,
    weaponName: weapon.name,
    isFlameWeapon: flameWeapon,
    isGrenadeWeapon: grenadeWeapon,
    baseTarget,
    characteristicLabel: getCharacteristicLabel(characteristicKey),
    damage: weapon.system.damage || "-",
    penetration: Number(weapon.system.penetration ?? 0),
    range: weaponClass === "melee" ? "Melee" : `${grenadeRange ?? effectiveWeaponRange} m`,
    rof: weaponClass === "melee" ? "Melee" : (weapon.system.rof || "-"),
    clip: showClip ? `${currentClip}/${maxClip}` : "-",
    special: weapon.system.specialRules || weapon.system.notes || "-",
    showRangeBand,
    autoRangeBandLabel: showRangeBand
      ? (rangeBandOptions.find((option) => option.selected)?.label ?? "Standard Range (+0)")
      : "",
    autoRangeDistanceLabel: autoRangeDistance != null ? `${autoRangeDistance.toFixed(1)} m` : "",
    canAdvanceOnFullAuto,
    showMaximalMode,
    defaultMaximalMode,
    showTwoWeaponFighting: !flameWeapon && allowTwoWeaponWorkflow && twoWeaponSetup.available,
    defaultTwoWeaponFighting,
    defaultMiscModifier,
    promptNotes,
    showCalledShotLocation,
    calledShotLocationOptions: CALLED_SHOT_LOCATION_OPTIONS,
    showBraceHeavyWeapon,
    defaultBraceHeavyWeapon,
    attackTypeOptions,
    aimOptions: AIM_OPTIONS,
    rangeBandOptions
  });

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (value) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    const dialog = new Dialog({
      title: `${actor.name}: ${weapon.name}${titleSuffix}`,
      content,
      render: (html) => {
        const attackTypeSelect = html.find('[name="attackType"]');
        const calledShotRow = html.find('[data-called-shot-controls]');
        const syncCalledShotControls = () => {
          const attackType = String(attackTypeSelect.val() || "standard");
          calledShotRow.toggle(attackType === "calledShot");
        };

        syncCalledShotControls();
        attackTypeSelect.on("change", syncCalledShotControls);
      },
      buttons: {
        roll: {
          label: "Attack",
          callback: async (html) => {
            const executeAttackFromSelection = async ({
              attackType = "standard",
              aimKey = "none",
              rangeBandKey = "standard",
              miscModifier = 0,
              spendFate = false,
              fullAutoAdvance = false,
              twoWeaponFighting = false,
              calledShotLocation = "body",
              braceHeavyWeapon = false,
              maximalMode = false
            } = {}, {
              dualWieldPenaltyOverride = null,
              handLabelOverride = ""
            } = {}) => {
              const dualWieldPenalty = dualWieldPenaltyOverride != null
                ? Number(dualWieldPenaltyOverride)
                : Number(promptOptions.twoWeaponPenalty ?? 0);
              const handLabel = String(handLabelOverride || promptOptions.handLabel || "").trim();

              if (flameWeapon) {
                return actor.rollAttack?.(weapon, {
                  attackType: "flame",
                  extra: [
                    "Template Attack: 30-degree cone",
                    "Targets in cone may Dodge to avoid the hit",
                    ...(handLabel ? [`Hand: ${handLabel}`] : []),
                    ...(dualWieldPenalty ? [`Two-Weapon Attack Penalty: ${dualWieldPenalty}`] : [])
                  ],
                  modifier: dualWieldPenalty
                });
              }

              if (grenadeWeapon) {
                if (spendFate) {
                  const spent = await actor?.spendFate?.(1);
                  if (!spent) {
                    ui.notifications?.warn("Rogue Trader | No fate points remaining.");
                    return null;
                  }
                }

                const aimOption = AIM_OPTIONS.find((option) => option.key === aimKey) ?? AIM_OPTIONS[0];
                const additionalModifier = aimOption.modifier
                  + Number(miscModifier ?? 0)
                  + dualWieldPenalty
                  + (spendFate ? 10 : 0);

                return actor.rollAttack?.(weapon, {
                  attackType,
                  aimKey,
                  rangeBandKey: "standard",
                  twoWeaponFighting,
                  calledShotLocation,
                  braceHeavyWeapon,
                  maximalMode,
                  modifier: additionalModifier,
                  extra: [
                    `Aim: ${aimOption.label}`,
                    `Grenade Range: ${grenadeRange} m`,
                    `Two-Weapon Fighting: ${twoWeaponFighting ? "Yes" : "No"}`,
                    ...(handLabel ? [`Hand: ${handLabel}`] : []),
                    ...(dualWieldPenalty ? [`Two-Weapon Attack Penalty: ${dualWieldPenalty}`] : []),
                    ...(attackType === "calledShot" ? [`Called Shot Location: ${CALLED_SHOT_LOCATION_OPTIONS.find((option) => option.key === calledShotLocation)?.label ?? "Body"}`] : []),
                    ...(showBraceHeavyWeapon ? [`Brace Heavy Weapon: ${braceHeavyWeapon ? "Yes" : "No"}`] : []),
                    ...(showMaximalMode ? [`Maximal Mode: ${maximalMode ? "Yes" : "No"}`] : []),
                    `Other Modifier: ${Number(miscModifier ?? 0) >= 0 ? `+${Number(miscModifier ?? 0)}` : Number(miscModifier ?? 0)}`,
                    `Fate Spent: ${spendFate ? "Yes (+10)" : "No"}`,
                    "Range band is determined automatically from the placed blast point.",
                    "Place the blast template, then roll to see whether it lands true or scatters."
                  ]
                });
              }

              const aimOption = AIM_OPTIONS.find((option) => option.key === aimKey) ?? AIM_OPTIONS[0];
              const rangeBandOption = RANGE_BAND_OPTIONS.find((option) => option.key === rangeBandKey) ?? RANGE_BAND_OPTIONS[0];

              if (spendFate) {
                const spent = await actor?.spendFate?.(1);
                if (!spent) {
                  ui.notifications?.warn("Rogue Trader | No fate points remaining.");
                  return null;
                }
              }

              const additionalModifier = aimOption.modifier
                + (showRangeBand ? rangeBandOption.modifier : 0)
                + Number(miscModifier ?? 0)
                + dualWieldPenalty
                + (spendFate ? 10 : 0);

              return actor.rollAttack?.(weapon, {
                attackType,
                aimKey,
                rangeBandKey,
                fullAutoAdvance,
                twoWeaponFighting,
                calledShotLocation,
                braceHeavyWeapon,
                maximalMode,
                modifier: additionalModifier,
                extra: [
                  `Aim: ${aimOption.label}`,
                  ...(showRangeBand ? [`Range Band: ${rangeBandOption.label}`] : []),
                  `Two-Weapon Fighting: ${twoWeaponFighting ? "Yes" : "No"}`,
                  ...(handLabel ? [`Hand: ${handLabel}`] : []),
                  ...(dualWieldPenalty ? [`Two-Weapon Attack Penalty: ${dualWieldPenalty}`] : []),
                  ...(attackType === "calledShot" ? [`Called Shot Location: ${CALLED_SHOT_LOCATION_OPTIONS.find((option) => option.key === calledShotLocation)?.label ?? "Body"}`] : []),
                  ...(showBraceHeavyWeapon ? [`Brace Heavy Weapon: ${braceHeavyWeapon ? "Yes" : "No"}`] : []),
                  ...(showMaximalMode ? [`Maximal Mode: ${maximalMode ? "Yes" : "No"}`] : []),
                  `Other Modifier: ${Number(miscModifier ?? 0) >= 0 ? `+${Number(miscModifier ?? 0)}` : Number(miscModifier ?? 0)}`,
                  `Fate Spent: ${spendFate ? "Yes (+10)" : "No"}`,
                  ...(fullAutoAdvance ? ["Advance While Firing: Yes"] : [])
                ]
              });
            };

            const selection = {
              attackType: String(html.find('[name="attackType"]').val() || "standard"),
              aimKey: String(html.find('[name="aim"]').val() || "none"),
              rangeBandKey: String(html.find('[name="rangeBand"]').val() || "standard"),
              miscModifier: Number(html.find('[name="miscModifier"]').val() || 0),
              spendFate: html.find('[name="spendFate"]').is(":checked"),
              fullAutoAdvance: html.find('[name="fullAutoAdvance"]').is(":checked"),
              twoWeaponFighting: html.find('[name="twoWeaponFighting"]').is(":checked"),
              calledShotLocation: String(html.find('[name="calledShotLocation"]').val() || "body"),
              braceHeavyWeapon: html.find('[name="braceHeavyWeapon"]').is(":checked"),
              maximalMode: html.find('[name="maximalMode"]').is(":checked")
            };

            if (selection.twoWeaponFighting && allowTwoWeaponWorkflow) {
              if (!twoWeaponSetup.available) {
                ui.notifications?.warn(`Rogue Trader | ${twoWeaponSetup.reason}`);
                finish(null);
                return;
              }

              const firstResult = await executeAttackFromSelection(selection, {
                dualWieldPenaltyOverride: twoWeaponSetup.penalty,
                handLabelOverride: twoWeaponSetup.currentHandLabel
              });
              if (!firstResult) {
                finish(null);
                return;
              }

              const secondResult = await promptAttackTest(actor, twoWeaponSetup.otherWeapon, {
                allowTwoWeaponWorkflow: false,
                defaultMiscModifier: twoWeaponSetup.penalty,
                titleSuffix: ` (${twoWeaponSetup.otherHandLabel})`,
                handLabel: twoWeaponSetup.otherHandLabel,
                twoWeaponPenalty: twoWeaponSetup.penalty,
                promptNotes: [
                  `Two-Weapon Wielder: ${twoWeaponSetup.penalty === -10 ? "with Ambidextrous" : "standard penalty"}`,
                  `This ${twoWeaponSetup.otherHandLabel.toLowerCase()} attack takes ${twoWeaponSetup.penalty}.`
                ]
              });

              finish({
                firstResult,
                secondResult
              });
              return;
            }

            const result = await executeAttackFromSelection(selection);
            finish(result);
          }
        },
        cancel: {
          label: "Cancel",
          callback: () => finish(null)
        }
      },
      default: "roll",
      close: () => finish(null)
    });

    dialog.render(true);
  });
}

export async function promptFocusPowerTest(actor, technique) {
  const basePsyRating = actor.getPsyRating?.() ?? 0;
  const initialMode = actor.getPsychicModeData?.(0) ?? {
    label: "Fettered",
    psyRatingUsed: 0,
    modifier: 0,
    phenomenaModifier: 0
  };
  const content = await renderTemplate("systems/roguetrader/templates/dialogs/focus-power.hbs", {
    title: `${actor.name}: ${technique.name}`,
    techniqueName: technique.name,
    focusPowerTest: getPsychicTestLabel(technique.system.focusPowerTest ?? "no"),
    basePsyRating,
    modeLabel: initialMode.label,
    psyRatingUsed: initialMode.psyRatingUsed,
    psyModifier: initialMode.modifier,
    phenomenaModifier: initialMode.phenomenaModifier
  });

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (value) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    const dialog = new Dialog({
      title: `${actor.name}: ${technique.name}`,
      content,
      buttons: {
        roll: {
          label: "Roll Focus Power",
          callback: async (html) => {
            const modeIndex = Number(html.find('[name="psyMode"]').val() || 0);
            const miscModifier = Number(html.find('[name="miscModifier"]').val() || 0);
            const result = await actor.rollFocusPower?.(technique, { modeIndex, miscModifier });
            finish(result);
          }
        },
        cancel: {
          label: "Cancel",
          callback: () => finish(null)
        }
      },
      default: "roll",
      render: (dialogHtml) => {
        const updateDisplay = () => {
          const modeIndex = Number(dialogHtml.find('[name="psyMode"]').val() || 0);
          const modeData = actor.getPsychicModeData?.(modeIndex);
          if (!modeData) return;

          dialogHtml.find("[data-psy-mode-label]").text(modeData.label);
          dialogHtml.find("[data-psy-rating-used]").text(modeData.psyRatingUsed);
          dialogHtml.find("[data-psy-modifier]").text(`${modeData.modifier >= 0 ? "+" : ""}${modeData.modifier}`);
          dialogHtml.find("[data-phenomena-text]").text(
            modeData.causesPhenomenaAutomatically
              ? `Automatic (+${modeData.phenomenaModifier})`
              : (modeData.causesPhenomenaOnDoubles ? "On doubles" : "None")
          );
        };

        dialogHtml.find('[name="psyMode"]').on("input change", updateDisplay);
        updateDisplay();
      },
      close: () => finish(null)
    });

    dialog.render(true);
  });
}

export async function promptRollDialog({
  actor,
  title,
  testLabel,
  baseTarget,
  notes = [],
  onRoll
}) {
  const content = await renderTemplate("systems/roguetrader/templates/dialogs/roll.hbs", {
    title,
    testLabel,
    baseTarget,
    notes,
    difficultyOptions: getDifficultyOptions()
  });

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (value) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    const dialog = new Dialog({
      title,
      content,
      buttons: {
        roll: {
          label: "Roll Test",
          callback: async (html) => {
            const selectedDifficultyKey = html.find('[name="difficulty"]').val() || "challenging";
            const otherModifier = Number(html.find('[name="otherModifier"]').val() || 0);
            const spendFate = html.find('[name="spendFate"]').is(':checked');
            const assisted = html.find('[name="assisted"]').is(':checked');
            const effectiveDifficultyKey = assisted ? getAssistedDifficultyKey(selectedDifficultyKey) : selectedDifficultyKey;
            const difficulty = DIFFICULTY_LEVELS[effectiveDifficultyKey] ?? DIFFICULTY_LEVELS.challenging;

            if (spendFate) {
              const spent = await actor?.spendFate?.(1);
              if (!spent) {
                ui.notifications?.warn("Rogue Trader | No fate points remaining.");
                finish(null);
                return;
              }
            }

            const modifier = difficulty.modifier + otherModifier + (spendFate ? 10 : 0);
            const result = await onRoll({
              modifier,
              difficultyKey: effectiveDifficultyKey,
              difficultyLabel: assisted
                ? `${difficulty.label} (Assisted)`
                : difficulty.label,
              otherModifier,
              spentFate: spendFate,
              assisted
            });
            finish(result);
          }
        },
        cancel: {
          label: "Cancel",
          callback: () => finish(null)
        }
      },
      default: "roll",
      close: () => finish(null)
    });

    dialog.render(true);
  });
}

export async function rollD100Test({
  actor = null,
  title,
  target,
  modifier = 0,
  breakdown = [],
  extra = [],
  fateReroll = false,
  rerollCount = 0,
  replaceMessage = null,
  successDegreeBonus = 0,
  rollContextData = {},
  createMessage = true
} = {}) {
  const parsedTarget = Number(target ?? 0);
  const baseModifier = Number(modifier ?? 0);
  const fatigueModifier = Number(actor?.getFatigueTestModifier?.() ?? 0);
  const parsedModifier = baseModifier + fatigueModifier;
  const resolvedBreakdown = fatigueModifier !== 0
    ? [...breakdown, `Fatigue: ${fatigueModifier >= 0 ? `+${fatigueModifier}` : fatigueModifier}`]
    : breakdown;
  const clampedModifier = Math.max(-MAX_TEST_MODIFIER, Math.min(MAX_TEST_MODIFIER, parsedModifier));
  const modifierWasCapped = clampedModifier !== parsedModifier;
  const finalTarget = Math.max(0, Math.min(100, parsedTarget + clampedModifier));
  const roll = await (new Roll("1d100")).evaluate();
  const rollTotal = Number(roll.total ?? 0);
  const success = rollTotal <= finalTarget;
  const baseDegrees = calculateDegrees(finalTarget, rollTotal, success);
  const degrees = success ? baseDegrees + Number(successDegreeBonus ?? 0) : baseDegrees;
  const outcome = getOutcomeLabel(success, degrees);
  const rollContext = {
    actorUuid: actor?.uuid ?? null,
    title,
    target: parsedTarget,
    baseModifier,
    fatigueModifier,
    modifier: clampedModifier,
    originalModifier: parsedModifier,
    breakdown: resolvedBreakdown,
    extra: modifierWasCapped
      ? [...extra, `Modifier capped from ${parsedModifier > 0 ? "+" : ""}${parsedModifier} to ${clampedModifier > 0 ? "+" : ""}${clampedModifier}`]
      : extra,
    rerollCount,
    successDegreeBonus: Number(successDegreeBonus ?? 0),
    ...foundry.utils.deepClone(rollContextData ?? {})
  };
  const flavor = renderTestFlavor({
    title,
    target: parsedTarget,
    modifier: clampedModifier,
    finalTarget,
    success,
    degrees,
    outcome,
    breakdown: resolvedBreakdown,
    extra: modifierWasCapped
      ? [...extra, `Modifier capped from ${parsedModifier > 0 ? "+" : ""}${parsedModifier} to ${clampedModifier > 0 ? "+" : ""}${clampedModifier}`]
      : extra,
    fateReroll,
    rerollCount
  });

  let message = null;
  if (createMessage) {
    message = await roll.toMessage({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : null,
      flavor,
      flags: {
        roguetrader: {
          rollContext
        }
      }
    });
  }

  if (createMessage && replaceMessage) {
    await replaceMessage.delete();
  }

  return {
    message,
    roll,
    rollTotal,
    target: parsedTarget,
    modifier: clampedModifier,
    finalTarget,
    success,
    degrees,
    outcome
  };
}

export async function rerollChatMessageWithFate(message) {
  const rollContext = message?.flags?.roguetrader?.rollContext;
  if (!rollContext?.actorUuid) return null;

  const actor = await fromUuid(rollContext.actorUuid);
  if (!actor) {
    ui.notifications?.warn("Rogue Trader | Could not find the actor for this roll.");
    return null;
  }

  const spent = await actor.spendFate?.(1);
  if (!spent) {
    ui.notifications?.warn("Rogue Trader | No fate points remaining.");
    return null;
  }

  const attackContext = rollContext.attackContext ?? null;
  if (attackContext?.weaponId && actor?.rollAttack) {
    return actor.rollAttack(attackContext.weaponId, {
      attackType: attackContext.attackType ?? "standard",
      aimKey: attackContext.aimKey ?? "none",
      rangeBandKey: attackContext.rangeBandKey ?? "standard",
      modifier: Number(attackContext.modifier ?? 0),
      extra: [...(attackContext.extra ?? []), "Fate Reroll: Spent 1 Fate Point"],
      fullAutoAdvance: Boolean(attackContext.fullAutoAdvance),
      twoWeaponFighting: Boolean(attackContext.twoWeaponFighting),
      calledShotLocation: String(attackContext.calledShotLocation ?? "body"),
      braceHeavyWeapon: Boolean(attackContext.braceHeavyWeapon),
      maximalMode: Boolean(attackContext.maximalMode),
      fateReroll: true,
      replaceMessage: message
    });
  }

  const fearContext = rollContext.fearContext ?? null;
  if (fearContext?.fearRating && actor?.rollFearTest) {
    const sourceActor = fearContext.sourceActorUuid
      ? await fromUuid(fearContext.sourceActorUuid)
      : null;

    return actor.rollFearTest({
      fearRating: Number(fearContext.fearRating ?? 1),
      sourceActor,
      sourceName: fearContext.sourceName ?? sourceActor?.name ?? "",
      fateReroll: true,
      replaceMessage: message
    });
  }

  return rollD100Test({
    actor,
    title: rollContext.title,
    target: rollContext.target,
    modifier: Number(rollContext.baseModifier ?? rollContext.modifier ?? 0),
    breakdown: rollContext.breakdown ?? [],
    extra: [...(rollContext.extra ?? []), "Fate Reroll: Spent 1 Fate Point"],
    fateReroll: true,
    rerollCount: Number(rollContext.rerollCount ?? 0) + 1,
    replaceMessage: message,
    successDegreeBonus: Number(rollContext.successDegreeBonus ?? 0)
  });
}

function renderTestFlavor({
  title,
  target,
  modifier,
  finalTarget,
  success,
  degrees,
  outcome,
  breakdown,
  extra,
  fateReroll = false,
  rerollCount = 0
}) {
  const modifierLabel = modifier === 0 ? "+0" : `${modifier > 0 ? "+" : ""}${modifier}`;
  const breakdownMarkup = breakdown.length
    ? `<ul>${breakdown.map((entry) => `<li>${entry}</li>`).join("")}</ul>`
    : "";
  const extraMarkup = extra.length
    ? `<p>${extra.join(" | ")}</p>`
    : "";
  const fateMarkup = fateReroll
    ? `<p><strong>Fate:</strong> Rerolled${rerollCount > 1 ? ` (${rerollCount} times)` : ""}</p>`
    : (!success ? `<p class="roguetrader-roll-hint">Right-click to spend Fate for a reroll.</p>` : "");

  return `
    <div class="roguetrader-roll-card" data-fate-reroll="true">
      <h3>${title}</h3>
      <p><strong>Target:</strong> ${target} ${modifierLabel} = ${finalTarget}</p>
      <p><strong>Result:</strong> ${outcome}</p>
      ${fateMarkup}
      ${extraMarkup}
      ${breakdownMarkup}
    </div>
  `;
}
