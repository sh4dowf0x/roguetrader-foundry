import { buildSkillItemData, getRogueTraderSkillDefinition, listRogueTraderSkills } from "./skill.js";
import { buildTalentItemData, getRogueTraderTalentDefinition, listRogueTraderTalents } from "./talent.js";
import { buildReferenceTableItemData, resolveReferenceTableResult } from "./reference-tables.js";

const STARTING_CHARACTERISTIC_ROLL_FORMULA = "2d10 + 25";

const CHARACTERISTIC_DEFINITIONS = [
  { key: "weaponSkill", label: "Weapon Skill", short: "WS" },
  { key: "ballisticSkill", label: "Ballistic Skill", short: "BS" },
  { key: "strength", label: "Strength", short: "S" },
  { key: "toughness", label: "Toughness", short: "T" },
  { key: "agility", label: "Agility", short: "Ag" },
  { key: "intelligence", label: "Intelligence", short: "Int" },
  { key: "perception", label: "Perception", short: "Per" },
  { key: "willpower", label: "Will Power", short: "WP" },
  { key: "fellowship", label: "Fellowship", short: "Fel" }
];

const ORIGIN_PATH_TABS = [
  { key: "homeWorld", label: "Home World" },
  { key: "birthright", label: "Birthright" },
  { key: "lureOfTheVoid", label: "Lure of the Void" },
  { key: "trialsAndTravails", label: "Trials & Travails" },
  { key: "motivation", label: "Motivation" }
];

function isOriginTabCompleted(tabKey, states) {
  switch (tabKey) {
    case "homeWorld":
      return Boolean(states.homeWorld?.confirmed);
    case "birthright":
      return Boolean(states.birthright?.confirmed);
    case "lureOfTheVoid":
      return Boolean(states.lureOfTheVoid?.confirmed);
    case "trialsAndTravails":
      return Boolean(states.trialsAndTravails?.confirmed);
    case "motivation":
      return Boolean(states.motivation?.confirmed);
    default:
      return false;
  }
}

function formatSignedValue(value) {
  const number = Number(value ?? 0);
  return number >= 0 ? `+${number}` : `${number}`;
}

function formatResourceLabelFromPath(path) {
  if (path?.includes("fate")) return "Fate";
  if (path?.includes("profitFactor")) return "Profit Factor";
  if (path?.includes("corruption")) return "Corruption";
  if (path?.includes("insanity")) return "Insanity";
  return path?.split(".").at(-1) ?? "Resource";
}

function summarizeChoiceOption(option) {
  const summary = [];

  if (option.type === "mutationRoll") {
    summary.push(`Roll ${option.formula ?? "1d100"} on the Mutations table and record the result`);
  }

  if (option.type === "referenceTableRoll" && option.tableLabel) {
    summary.push(`Roll ${option.formula ?? "1d100"} on the ${option.tableLabel} table and record the result`);
  }

  if (option.type === "characteristicBonus" && option.characteristicKey) {
    const characteristic = CHARACTERISTIC_DEFINITIONS.find((entry) => entry.key === option.characteristicKey)?.label ?? option.characteristicKey;
    summary.push(`${formatSignedValue(option.amount)} ${characteristic}`);
  }

  for (const [characteristicKey, amount] of Object.entries(option.modifiers ?? {})) {
    const characteristic = CHARACTERISTIC_DEFINITIONS.find((entry) => entry.key === characteristicKey)?.label ?? characteristicKey;
    summary.push(`${formatSignedValue(amount)} ${characteristic}`);
  }

  for (const [path, amount] of Object.entries(option.updates ?? {})) {
    summary.push(`${formatSignedValue(amount)} ${formatResourceLabelFromPath(path)}`);
  }

  for (const item of option.items ?? []) {
    summary.push(`Gain ${item.name}`);
  }

  for (const skill of option.skills ?? []) {
    const skillLabel = skill.name ?? getRogueTraderSkillDefinition(skill.skillId)?.fullName ?? skill.skillId;
    summary.push(`Gain ${skillLabel}`);
  }

  if (option.type === "skillAdvance" && option.skill) {
    const skillLabel = option.skill.name ?? getRogueTraderSkillDefinition(option.skill.skillId)?.fullName ?? option.skill.skillId;
    summary.push(`Gain or improve ${skillLabel}`);
  }

  for (const rollEffect of option.rolls ?? []) {
    summary.push(`Gain ${rollEffect.formula} ${rollEffect.resourceLabel ?? formatResourceLabelFromPath(rollEffect.resourcePath)}`);
  }

  for (const conditional of option.conditionalItems ?? []) {
    const characteristic = CHARACTERISTIC_DEFINITIONS.find((entry) => entry.key === conditional.characteristicKey)?.short ?? conditional.characteristicKey;
    summary.push(`If ${characteristic} 40+, gain ${conditional.item?.name ?? "conditional benefit"}`);
  }

  for (const effect of option.effects ?? []) {
    summary.push(...summarizeChoiceOption(effect));
  }

  if (Array.isArray(option.lore) && option.lore.length) {
    summary.unshift(option.lore[0]);
  }

  if (!summary.length && option.benefit) {
    summary.push(option.benefit);
  }

  return summary;
}

const CONCRETE_SKILL_OPTIONS = listRogueTraderSkills()
  .filter((skill) => skill.groupName || !skill.groupKey)
  .sort((a, b) => a.fullName.localeCompare(b.fullName));

const COMMON_LORE_OPTIONS = CONCRETE_SKILL_OPTIONS.filter((skill) => skill.baseId === "common-lore");
const FORBIDDEN_LORE_OPTIONS = CONCRETE_SKILL_OPTIONS.filter((skill) => skill.baseId === "forbidden-lore");
const WEAPON_TRAINING_OPTIONS = listRogueTraderTalents()
  .filter((talent) => talent.name.includes("Weapon Training") && talent.groupName)
  .sort((a, b) => a.fullName.localeCompare(b.fullName));
const PEER_TALENT_OPTIONS = listRogueTraderTalents()
  .filter((talent) => talent.name === "Peer" && talent.groupName)
  .sort((a, b) => a.fullName.localeCompare(b.fullName));
const HATRED_TALENT_OPTIONS = listRogueTraderTalents()
  .filter((talent) => talent.name === "Hatred" && talent.groupName)
  .sort((a, b) => a.fullName.localeCompare(b.fullName));
const TALENTED_SKILL_OPTIONS = CONCRETE_SKILL_OPTIONS.sort((a, b) => a.fullName.localeCompare(b.fullName));

const HOME_WORLD_DEFINITIONS = {
  deathWorld: {
    key: "deathWorld",
    label: "Death World",
    lore: [
      "Death worlds are teeming with threats to survival, and those who thrive on such planets are unlike anyone else. Peril and violence have always been part of your life, and you are stronger because of it.",
      "Upon death worlds, the plants, beasts, and sometimes even the environment itself take aggressive and destructive forms inimical to human life. An upbringing in such a harsh environment breeds hardy and resilient survivors.",
      "Death worlders are pragmatic and fatalistic. If they make it off-world, they tend to view distant worlds with jaded eyes, convinced they have already seen the worst the galaxy has to offer."
    ],
    positives: [
      "+5 Strength",
      "+5 Toughness",
      "Gain the Survival skill as a trained skill",
      "Gain Melee Weapon Training (Primitive)",
      "+10 bonus to tests to resist Pinning and Shock",
      "Choose one: Jaded or Resistance (Poisons)",
      "Starting Wounds: double Toughness Bonus + 1d5+2",
      "Starting Fate: 2 on 1-5, 3 on 6-10"
    ],
    negatives: [
      "-5 Willpower",
      "-5 Fellowship",
      "-10 penalty to Interaction skill tests in formal surroundings"
    ],
    modifiers: {
      strength: 5,
      toughness: 5,
      willpower: -5,
      fellowship: -5
    },
    startingSkills: [
      {
        skillId: "survival",
        trained: true
      }
    ],
    grantedItems: [
      {
        name: "Melee Weapon Training (Primitive)",
        talentId: "melee-weapon-training/primitive",
        category: "talent",
        benefit: "Gain proficiency with primitive melee weapons.",
        description: "Death worlders are adept at using weapons commonly found in or fashioned from their environment."
      },
      {
        name: "Paranoid",
        category: "trait",
        benefit: "Suffer a -10 penalty to Interaction skill tests in formal surroundings.",
        description: "The inherently dangerous conditions of a death world encourage distrust and doubt."
      },
      {
        name: "Survivor",
        category: "trait",
        benefit: "Gain a +10 bonus to tests to resist Pinning and Shock.",
        description: "Simply reaching adulthood is an achievement for death worlders."
      }
    ],
    specialChoices: [
      {
        key: "jaded",
        name: "Jaded",
        talentId: "jaded",
        category: "talent",
        benefit: "You are accustomed to death, violence, and horrific experiences."
      },
      {
        key: "resistancePoisons",
        name: "Resistance (Poisons)",
        talentId: "resistance/poisons",
        category: "talent",
        benefit: "Gain resistance against the effects of poisons and toxins."
      }
    ],
    startingWounds: {
      formulaLabel: "(TB x 2) + (1d5 + 2)",
      extraRollFormula: "1d5 + 2"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 5, value: 2 },
        { max: 10, value: 3 }
      ]
    }
  },
  frontierWorld: {
    key: "frontierWorld",
    label: "Frontier World",
    lore: [
      "Frontier worlds lie far from centres of Imperial power, often rough, barely defended settlements where life is harsh, justice comes quickly, and survival depends on grit, toughness, and self-reliance.",
      "Such worlds are frequently exposed to xenos raiders, pirates, outlaws, and every kind of peril the Imperium would rather keep at arm's length. Their people learn to endure with little help and few luxuries.",
      "Frontier worlders are blunt, durable, suspicious of outsiders, and unusually accustomed to dealing with xenos and abhumans, making them excellent scouts, foragers, and stubborn survivors."
    ],
    positives: [
      "+5 Strength",
      "-5 Intelligence",
      "Gain Survival and Wrangling as trained skills",
      "Tough as Grox-Hide: +1 starting Wound (already included in formula)",
      "Tenacious Survivalist: may re-roll Initiative rolls",
      "Xenos Interaction: immune to Fear (1) and Fear (2) caused by xenos",
      "Starting Wounds: double Toughness Bonus + 1d5+2",
      "Starting Fate: 2 on 1-5, 3 on 6-10"
    ],
    negatives: [
      "Leery of Outsiders: -10 on Fellowship tests with people you have not previously met",
      "Xenos Interaction: -5 on Interaction tests with members of the Imperial Cult"
    ],
    modifiers: {
      strength: 5,
      intelligence: -5
    },
    startingSkills: [
      {
        skillId: "survival",
        trained: true
      },
      {
        skillId: "wrangling",
        trained: true
      }
    ],
    grantedItems: [
      {
        name: "Tough as Grox-Hide",
        category: "trait",
        benefit: "You begin with one additional Wound, already included in your starting Wounds calculation.",
        description: "Hard living on the frontier breeds a body and temper as rugged as grox-hide leather."
      },
      {
        name: "Leery of Outsiders",
        category: "trait",
        benefit: "Suffer a -10 penalty on Fellowship Tests when dealing with someone you have not previously met.",
        description: "Frontier worlders are deeply suspicious of strangers and have little patience for outsider interference."
      },
      {
        name: "Tenacious Survivalist",
        category: "trait",
        benefit: "You may re-roll any Initiative roll you make, but must accept the second result.",
        description: "Life on the frontier teaches quick reactions and constant wariness in the face of danger."
      },
      {
        name: "Xenos Interaction",
        category: "trait",
        benefit: "You are immune to Fear caused by xenos with Fear (1) or Fear (2). Fear (3+) affects you normally, and you suffer a -5 penalty to Interaction Tests when dealing with members of the Imperial Cult.",
        description: "Regular dealings with xenos and outsiders have left you unusually untroubled by them, though that tolerance often puts you at odds with the Ecclesiarchy."
      }
    ],
    specialChoices: [],
    startingWounds: {
      formulaLabel: "(TB x 2) + (1d5 + 2)",
      extraRollFormula: "1d5 + 2"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 5, value: 2 },
        { max: 10, value: 3 }
      ]
    }
  },
  voidBorn: {
    key: "voidBorn",
    label: "Void Born",
    lore: [
      "You were not born upon one of the Emperor's worlds, but within the depths of space aboard a vast ship or station. Raised among voidfarers and psykers, the strange terrors of the warp and the mysteries of the void are familiar ground to you.",
      "Generations spent in low gravity, radiation, ancient machinery, and the shadow of warp travel leave their mark on the void born. Many seem pallid, drawn, or subtly uncanny, and most world-born people find them unsettling.",
      "Void born characters are outsiders among dirt-dwellers, but they come into their own when expertise with ships, the warp, and the dangers of space is required. They make natural Void-masters and Astropaths."
    ],
    positives: [
      "-5 Strength",
      "+5 Willpower",
      "Gain Speak Language (Ship Dialect) as a trained skill",
      "Charmed: when spending a Fate Point, on a natural 9 it is not lost",
      "Shipwise: Navigation (Stellar) and Pilot (Spacecraft) are untrained Basic skills",
      "Void Accustomed: immune to space travel sickness and low/zero gravity is not Difficult Terrain",
      "Starting Wounds: double Toughness Bonus + 1d5",
      "Starting Fate: 3 on 1-5, 4 on 6-10"
    ],
    negatives: [
      "-5 penalty on Fellowship tests made to interact with non-void born humans",
      "Ill-omened: more likely to attract negative attention and distrust from others"
    ],
    modifiers: {
      strength: -5,
      willpower: 5
    },
    startingSkills: [
      {
        skillId: "speak-language/ship-dialect",
        trained: true
      }
    ],
    grantedItems: [
      {
        name: "Charmed",
        category: "trait",
        benefit: "When you spend a Fate Point, roll 1d10. On a natural 9, the Fate Point is not lost.",
        description: "The void born are touched by the fickle powers of the warp, making them preternaturally lucky."
      },
      {
        name: "Ill-omened",
        category: "trait",
        benefit: "Suffer a -5 penalty on Fellowship tests made to interact with non-void born humans.",
        description: "Whether because of their strange looks, clannish ways, or unwholesome air, the void born are shunned and mistrusted by most."
      },
      {
        name: "Shipwise",
        category: "trait",
        benefit: "Navigation (Stellar) and Pilot (Spacecraft) are untrained Basic skills for you.",
        description: "Birthed in the depths of a voidfaring craft, the void born have a natural affinity for such vehicles."
      },
      {
        name: "Void Accustomed",
        category: "trait",
        benefit: "You are immune to space travel sickness, and zero- or low-gravity environments are not Difficult Terrain.",
        description: "Due to their strange and unnatural childhood, the void born are used to the vagaries of changing gravity."
      }
    ],
    specialChoices: [],
    startingWounds: {
      formulaLabel: "(TB x 2) + 1d5",
      extraRollFormula: "1d5"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 5, value: 3 },
        { max: 10, value: 4 }
      ]
    }
  },
  forgeWorld: {
    key: "forgeWorld",
    label: "Forge World",
    lore: [
      "You were born in the shadow of the Omnissiah, surrounded by the wonders and terrors of sacred machinery. From birth, you were weighed, measured, codified, and tested so that your masters might find your place in the great pattern.",
      "Forge worlds and Mechanicus domains are realms of ceaseless industry, arcane knowledge, and harsh precision. To their masters, human lives are measured like any other resource, and weakness is simply a flaw to be corrected or discarded.",
      "Forge world characters emerge into wider Imperial society with a disciplined and practical mindset, but often with little patience for those who fear, misuse, or misunderstand sacred technology and the doctrines of the Omnissiah."
    ],
    positives: [
      "-5 Weapon Skill",
      "+5 Intelligence",
      "Common Lore (Tech) and Common Lore (Machine Cult) are untrained Basic skills",
      "Gain Technical Knock",
      "Choose one characteristic to increase by +3",
      "Starting Wounds: double Toughness Bonus + 1d5+1",
      "Starting Fate: 2 on 1-5, 3 on 6-9, 4 on 10"
    ],
    negatives: [
      "-10 on tests involving knowledge of the Imperial Creed",
      "-5 on Fellowship tests with members of the Ecclesiarchy in formal settings"
    ],
    modifiers: {
      weaponSkill: -5,
      intelligence: 5
    },
    startingSkills: [
      {
        skillId: "common-lore/tech",
        basic: true
      },
      {
        skillId: "common-lore/machine-cult",
        basic: true
      }
    ],
    grantedItems: [
      {
        name: "Technical Knock",
        talentId: "technical-knock",
        category: "talent",
        benefit: "You know the basic rites of tech-propitiation and can coax sacred machinery back into function.",
        description: "Even the lowliest forge world citizen is taught to properly venerate machine spirits and perform the rites of the Omnissiah."
      },
      {
        name: "Stranger to the Cult",
        category: "trait",
        benefit: "You suffer a -10 penalty on tests involving knowledge of the Imperial Creed and a -5 penalty on Fellowship tests with Ecclesiarchy members in formal settings.",
        description: "Forge world born citizens view the Imperial Creed through the lens of Cult Mechanicus doctrine and often fail to show proper deference to the Ecclesiarchy."
      }
    ],
    specialChoices: CHARACTERISTIC_DEFINITIONS.map((definition) => ({
      key: `fitForPurpose-${definition.key}`,
      name: `+3 ${definition.label}`,
      type: "characteristicBonus",
      characteristicKey: definition.key,
      amount: 3,
      benefit: `Increase ${definition.label} by +3.`
    })),
    startingWounds: {
      formulaLabel: "(TB x 2) + (1d5 + 1)",
      extraRollFormula: "1d5 + 1"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 5, value: 2 },
        { max: 9, value: 3 },
        { max: 10, value: 4 }
      ]
    }
  },
  hiveWorld: {
    key: "hiveWorld",
    label: "Hive World",
    lore: [
      "The great hives are not like the lesser cities of other worlds in the Imperium, and you are not like the common men and women who live there. Technology has surrounded you all your life, and rarity elsewhere is almost bemusing.",
      "Hive worlds are continent-spanning sprawls of manufactories, habs, spires, and underhives, home to teeming billions. Life there is dense, harsh, and relentless, but it breeds opportunists who are quick on the draw and quicker with their wits.",
      "Hive world characters are resourceful, inquisitive, and alert to danger. They are more likely to rely on fast-talking and tech-devices than blunt confrontation, and many dream of escaping the crushing life of the hive for power, freedom, or wealth."
    ],
    positives: [
      "-5 Toughness",
      "+5 Fellowship",
      "Speak Language (Hive Dialect) is an untrained Basic skill",
      "Accustomed to Crowds: crowds do not count as Difficult Terrain",
      "Caves of Steel: Tech-Use is an untrained Basic skill",
      "Wary: +1 to Initiative rolls",
      "Starting Wounds: double Toughness Bonus + 1d5+1",
      "Starting Fate: 2 on 1-5, 3 on 6-8, 4 on 9-10"
    ],
    negatives: [
      "Hivebound: -10 to Survival tests",
      "Hivebound: -5 to Intelligence tests while outside a proper hab"
    ],
    modifiers: {
      toughness: -5,
      fellowship: 5
    },
    startingSkills: [
      {
        skillId: "speak-language/hive-dialect",
        basic: true
      },
      {
        skillId: "tech-use",
        basic: true
      }
    ],
    grantedItems: [
      {
        name: "Accustomed to Crowds",
        category: "trait",
        benefit: "Crowds do not count as Difficult Terrain, and you take no penalty to the Agility test to keep your feet when Running or Charging through a dense crowd.",
        description: "Hivers grow up surrounded by crowds and are used to weaving through even the densest mobs with ease."
      },
      {
        name: "Hivebound",
        category: "trait",
        benefit: "You suffer a -10 penalty to Survival tests and a -5 penalty to Intelligence tests while outside a proper hab.",
        description: "Hivers seldom endure the horrors of the open sky or the indignity of the great outdoors."
      },
      {
        name: "Wary",
        category: "trait",
        benefit: "Gain a +1 bonus to Initiative rolls.",
        description: "Hivers are constantly alert for the first hint of trouble, be it a gang shoot-out, hab riot, or hivequake."
      }
    ],
    specialChoices: [],
    startingWounds: {
      formulaLabel: "(TB x 2) + (1d5 + 1)",
      extraRollFormula: "1d5 + 1"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 5, value: 2 },
        { max: 8, value: 3 },
        { max: 10, value: 4 }
      ]
    }
  },
  imperialWorld: {
    key: "imperialWorld",
    label: "Imperial World",
    lore: [
      "You hail from one of the countless worlds of the Imperium, united by devotion to the immortal God-Emperor of Mankind. Soldier, fanatic, thief, mercenary, or noble, whatever your former calling, you now step into the void as an Explorer.",
      "Imperial worlds are impossibly varied, from agri-worlds and mining planets to cardinal worlds ruled by the Ecclesiarchy and remote frontier planets clinging to survival beneath the shadow of fear, superstition, and duty.",
      "Imperial world characters have grown up amid the dogma, rituals, and harsh expectations of Imperial life. They tend to possess broad knowledge of the Imperium and its faith, but their upbringing also teaches them that ignorance of darker truths is often a blessing."
    ],
    positives: [
      "+3 Willpower",
      "Common Lore (Imperial Creed), Common Lore (Imperium), and Common Lore (War) are untrained Basic skills",
      "Literacy and Speak Language (High Gothic) are untrained Basic skills",
      "Starting Wounds: double Toughness Bonus + 1d5",
      "Starting Fate: 3 on 1-8, 4 on 9-10"
    ],
    negatives: [
      "Blessed Ignorance: -5 penalty on Forbidden Lore tests"
    ],
    modifiers: {
      willpower: 3
    },
    startingSkills: [
      {
        skillId: "common-lore/imperial-creed",
        basic: true
      },
      {
        skillId: "common-lore/imperium",
        basic: true
      },
      {
        skillId: "common-lore/war",
        basic: true
      },
      {
        skillId: "literacy",
        basic: true
      },
      {
        skillId: "speak-language/high-gothic",
        basic: true
      }
    ],
    grantedItems: [
      {
        name: "Blessed Ignorance",
        category: "trait",
        benefit: "You suffer a -5 penalty on Forbidden Lore tests.",
        description: "Imperial citizens are taught that horror, pain, and death are the just rewards of curiosity into the darker mysteries of the universe."
      },
      {
        name: "Hagiography",
        category: "trait",
        benefit: "You possess broad familiarity with the saints, wars, and history of the Imperium.",
        description: "Widespread scriptures grant Imperial citizens a comparatively wide knowledge of the Imperium of Man."
      },
      {
        name: "Liturgical Familiarity",
        category: "trait",
        benefit: "You are accustomed to the language and teachings of the Ecclesiarchy.",
        description: "Surrounded by zeal and faith, Imperial citizens are familiar with liturgy, scripture, and formal worship."
      }
    ],
    specialChoices: [],
    startingWounds: {
      formulaLabel: "(TB x 2) + 1d5",
      extraRollFormula: "1d5"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 8, value: 3 },
        { max: 10, value: 4 }
      ]
    }
  },
  nobleBorn: {
    key: "nobleBorn",
    label: "Noble Born",
    lore: [
      "Some things can be taught and others acquired by force or trade, but the only thing that truly matters to the high nobility is the worth of one's blood. Noble houses span worlds and stars alike in webs of kinship, marriage, and power.",
      "The products of generations of refinement, tutoring, and political intrigue, noble scions are educated in history, commerce, etiquette, favour, insult, and the subtle arts of power. Many are as ruthless as they are charming.",
      "Noble born characters enter the wider void already accustomed to wealth, privilege, and the high circles of Imperial society. Whether honourable or decadent, they know how to wield status, lineage, and connections to their advantage."
    ],
    positives: [
      "-5 Willpower",
      "+5 Fellowship",
      "Literacy, Speak Language (High Gothic), and Speak Language (Low Gothic) are untrained Basic skills",
      "Etiquette: +10 on Interaction tests with high authority and in formal situations",
      "Legacy of Wealth: +1 starting Profit Factor",
      "Gain Peer (Nobility), plus choose one additional Peer",
      "Starting Wounds: double Toughness Bonus + 1d5",
      "Starting Fate: 2 on 1-3, 3 on 4-9, 4 on 10"
    ],
    negatives: [
      "Vendetta: you begin play with powerful enemies tied to your bloodline and station"
    ],
    modifiers: {
      willpower: -5,
      fellowship: 5
    },
    startingSkills: [
      {
        skillId: "literacy",
        basic: true
      },
      {
        skillId: "speak-language/high-gothic",
        basic: true
      },
      {
        skillId: "speak-language/low-gothic",
        basic: true
      }
    ],
    grantedItems: [
      {
        name: "Etiquette",
        category: "trait",
        benefit: "Gain a +10 bonus on Interaction skill tests when dealing with high authority and in formal situations.",
        description: "Nobles are schooled in how to comport themselves in all manner of formal situations."
      },
      {
        name: "Legacy of Wealth",
        category: "trait",
        benefit: "Adds +1 to the group's starting Profit Factor.",
        description: "To be born an Imperial noble is to inherit a legacy of staggering wealth."
      },
      {
        name: "Peer (Nobility)",
        talentId: "peer/nobility",
        category: "talent",
        benefit: "You possess status and favourable connections among the nobility.",
        description: "A noble born character begins play with the Peer (Nobility) talent."
      },
      {
        name: "Vendetta",
        category: "trait",
        benefit: "You begin play with powerful enemies tied to your family or station.",
        description: "Every noble house has sworn enemies and rivals eager to inconvenience, harm, or destroy it."
      }
    ],
    specialChoices: [
      "Academics",
      "Adeptus Mechanicus",
      "Administratum",
      "Astropaths",
      "Ecclesiarchy",
      "Government",
      "Mercantile",
      "Military",
      "Underworld"
    ].map((peer) => ({
      key: `peer-${peer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: `Peer (${peer})`,
      talentId: `peer/${peer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      category: "talent",
      benefit: `You possess status and connections among ${peer}.`
    })),
    profitFactorBonus: 1,
    startingWounds: {
      formulaLabel: "(TB x 2) + 1d5",
      extraRollFormula: "1d5"
    },
    startingFate: {
      rollFormula: "1d10",
      thresholds: [
        { max: 3, value: 2 },
        { max: 9, value: 3 },
        { max: 10, value: 4 }
      ]
    }
  }
};

const BIRTHRIGHT_DEFINITIONS = {
  scavenger: {
    key: "scavenger",
    label: "Scavenger",
    lore: [
      "You became an adult amidst the yearning and poverty of the least of the God-Emperor's flock, surviving among underhivers, renegades, bonepickers, and other outcast castes on the fringes of Imperial society.",
      "Everything you owned was scavenged, reclaimed, looted, or taken from rivals and corpses alike. Life was lived on a knife-edge, where starvation crouched on one side and death or worse waited on the other.",
      "That brutal upbringing has hardened and honed you, but it has also left its scars on your soul."
    ],
    positives: [
      "Choose Unremarkable or Resistance (Fear)",
      "Choose +3 Willpower or +3 Agility"
    ],
    negatives: [
      "Choose 1d5 Corruption Points or 1d5 Insanity Points"
    ],
    modifiers: {},
    choices: [
      {
        key: "survivalEdge",
        label: "Survival Edge",
        options: [
          {
            key: "unremarkable",
            name: "Unremarkable",
            type: "item",
            item: {
              name: "Unremarkable",
              talentId: "unremarkable",
              category: "talent",
              benefit: "You are adept at blending into the background and avoiding notice."
            }
          },
          {
            key: "resistanceFear",
            name: "Resistance (Fear)",
            type: "item",
            item: {
              name: "Resistance (Fear)",
              talentId: "resistance/fear",
              category: "talent",
              benefit: "Gain resistance against the effects of fear."
            }
          }
        ]
      },
      {
        key: "bonusCharacteristic",
        label: "Characteristic Bonus",
        options: [
          {
            key: "agility",
            name: "+3 Agility",
            type: "characteristicBonus",
            characteristicKey: "agility",
            amount: 3
          },
          {
            key: "willpower",
            name: "+3 Willpower",
            type: "characteristicBonus",
            characteristicKey: "willpower",
            amount: 3
          }
        ]
      },
      {
        key: "scar",
        label: "Scar",
        options: [
          {
            key: "corruption",
            name: "1d5 Corruption",
            type: "resourceRoll",
            formula: "1d5",
            resourcePath: "system.corruption.points",
            resourceLabel: "Corruption Points"
          },
          {
            key: "insanity",
            name: "1d5 Insanity",
            type: "resourceRoll",
            formula: "1d5",
            resourcePath: "system.insanity.points",
            resourceLabel: "Insanity Points"
          }
        ]
      },
      {
        key: "magisterialMutation",
        label: "Magisterial House: Initial Mutation",
        options: [
          {
            key: "magisterial-strangely-jointed-limbs",
            name: "Strangely Jointed Limbs",
            type: "item",
            requiresPath: "magisterial-house",
            item: buildReferenceTableItemData("navigatorMutations", 1, {
              type: "mutation",
              sourceTable: "navigatorMutations"
            })
          },
          {
            key: "magisterial-elongated-form",
            name: "Elongated Form",
            type: "item",
            requiresPath: "magisterial-house",
            item: buildReferenceTableItemData("navigatorMutations", 16, {
              type: "mutation",
              sourceTable: "navigatorMutations"
            })
          },
          {
            key: "magisterial-pale-and-hairless-flesh",
            name: "Pale and Hairless Flesh",
            type: "item",
            requiresPath: "magisterial-house",
            item: buildReferenceTableItemData("navigatorMutations", 31, {
              type: "mutation",
              sourceTable: "navigatorMutations"
            })
          },
          {
            key: "magisterial-eyes-as-dark-as-the-void",
            name: "Eyes as Dark as the Void",
            type: "item",
            requiresPath: "magisterial-house",
            item: buildReferenceTableItemData("navigatorMutations", 46, {
              type: "mutation",
              sourceTable: "navigatorMutations"
            })
          }
        ]
      }
    ]
  },
  scapegrace: {
    key: "scapegrace",
    label: "Scapegrace",
    lore: [
      "You spent your youth living by your wits among entertainers, gangers, reclaimators, and other ne'er-do-wells on the grey fringes of Imperial society.",
      "You learned early that the law only applies to those caught by the enforcers, and that survival is best treated as a game whose prizes are pleasure, ease, and one more day alive.",
      "Those lessons have stayed with you into adulthood, sharpening your instincts and teaching you to seize comfort while you can."
    ],
    positives: [
      "Gain Sleight of Hand as a trained Basic skill",
      "Choose +3 Intelligence or +3 Perception"
    ],
    negatives: [
      "Choose 1d5 Corruption Points or 1d5 Insanity Points"
    ],
    modifiers: {},
    startingSkills: [
      {
        skillId: "sleight-of-hand",
        basic: true,
        trained: true
      }
    ],
    choices: [
      {
        key: "bonusCharacteristic",
        label: "Characteristic Bonus",
        options: [
          {
            key: "intelligence",
            name: "+3 Intelligence",
            type: "characteristicBonus",
            characteristicKey: "intelligence",
            amount: 3
          },
          {
            key: "perception",
            name: "+3 Perception",
            type: "characteristicBonus",
            characteristicKey: "perception",
            amount: 3
          }
        ]
      },
      {
        key: "scar",
        label: "Scar",
        options: [
          {
            key: "corruption",
            name: "1d5 Corruption",
            type: "resourceRoll",
            formula: "1d5",
            resourcePath: "system.corruption.points",
            resourceLabel: "Corruption Points"
          },
          {
            key: "insanity",
            name: "1d5 Insanity",
            type: "resourceRoll",
            formula: "1d5",
            resourcePath: "system.insanity.points",
            resourceLabel: "Insanity Points"
          }
        ]
      }
    ]
  },
  stubjack: {
    key: "stubjack",
    label: "Stubjack",
    lore: [
      "You were born to violence. Weapons, death, and hard bargains have been part of your life for as long as you can remember.",
      "A regimented military life never suited you; fighting for coin as a mercenary promised a better purse and a better chance of keeping your own skin intact.",
      "You've seen battle, death, and all manner of ugliness in between, and that brutal experience has shaped both your skill and your scars."
    ],
    positives: [
      "Gain Quick Draw",
      "Gain Intimidate as a trained Basic skill",
      "Choose +5 Weapon Skill or +5 Ballistic Skill"
    ],
    negatives: [
      "-5 Fellowship",
      "Gain 1d5 Insanity Points"
    ],
    modifiers: {
      fellowship: -5
    },
    startingSkills: [
      {
        skillId: "intimidate",
        basic: true,
        trained: true
      }
    ],
    grantedItems: [
      {
        name: "Quick Draw",
        talentId: "quick-draw",
        category: "talent",
        benefit: "You can draw weapons with practiced speed."
      }
    ],
    autoEffects: [
      {
        type: "resourceRoll",
        formula: "1d5",
        resourcePath: "system.insanity.points",
        resourceLabel: "Insanity Points"
      }
    ],
    choices: [
      {
        key: "combatAptitude",
        label: "Combat Aptitude",
        options: [
          {
            key: "weaponSkill",
            name: "+5 Weapon Skill",
            type: "characteristicBonus",
            characteristicKey: "weaponSkill",
            amount: 5
          },
          {
            key: "ballisticSkill",
            name: "+5 Ballistic Skill",
            type: "characteristicBonus",
            characteristicKey: "ballisticSkill",
            amount: 5
          }
        ]
      }
    ]
  },
  childOfTheCreed: {
    key: "childOfTheCreed",
    label: "Child of the Creed",
    lore: [
      "You were raised beneath the stern gaze of the God-Emperor and sheltered by the Ministorum from much of the hardship and uncertainty others endure.",
      "Scripture, ritual, lessons, and priestly exhortations filled your youth so thoroughly that they still rise unbidden in your thoughts, as though your teachers stand at your shoulder still.",
      "All Imperial citizens hear the holy words of the Emperor, but you heard more than most long before you reached adulthood."
    ],
    positives: [
      "Gain Unshakeable Faith",
      "Choose +3 Willpower or +3 Fellowship"
    ],
    negatives: [
      "-3 Weapon Skill"
    ],
    modifiers: {
      weaponSkill: -3
    },
    grantedItems: [
      {
        name: "Unshakeable Faith",
        talentId: "unshakeable-faith",
        category: "talent",
        benefit: "Your faith steels you against doubt and spiritual corruption."
      }
    ],
    choices: [
      {
        key: "devoutAptitude",
        label: "Faithful Aptitude",
        options: [
          {
            key: "willpower",
            name: "+3 Willpower",
            type: "characteristicBonus",
            characteristicKey: "willpower",
            amount: 3
          },
          {
            key: "fellowship",
            name: "+3 Fellowship",
            type: "characteristicBonus",
            characteristicKey: "fellowship",
            amount: 3
          }
        ]
      }
    ]
  },
  savant: {
    key: "savant",
    label: "Savant",
    lore: [
      "The murmuring of savants, the clatter of lexmachinery, and the scent of ink and dust have filled your life for as long as you can remember.",
      "You were apprenticed young, drilled in the art of learning, and steeped in the rituals of knowledge, meetings, and endless careful study.",
      "The sheer immensity of the galaxy's knowledge can never be mastered, but you find comfort in learning and in the certainty that there is always more to know."
    ],
    positives: [
      "Choose Logic as a trained Basic skill or Peer (Academic)",
      "Choose +3 Intelligence or +3 Fellowship"
    ],
    negatives: [
      "-3 Toughness"
    ],
    modifiers: {
      toughness: -3
    },
    choices: [
      {
        key: "scholarlyEdge",
        label: "Scholarly Edge",
        options: [
          {
            key: "logic",
            name: "Logic (trained Basic)",
            type: "skill",
            skill: {
              skillId: "logic",
              basic: true,
              trained: true
            }
          },
          {
            key: "peerAcademic",
            name: "Peer (Academic)",
            type: "item",
            item: {
              name: "Peer (Academic)",
              talentId: "peer/academics",
              category: "talent",
              benefit: "You possess status and favourable connections among academics."
            }
          }
        ]
      },
      {
        key: "bonusCharacteristic",
        label: "Characteristic Bonus",
        options: [
          {
            key: "intelligence",
            name: "+3 Intelligence",
            type: "characteristicBonus",
            characteristicKey: "intelligence",
            amount: 3
          },
          {
            key: "fellowship",
            name: "+3 Fellowship",
            type: "characteristicBonus",
            characteristicKey: "fellowship",
            amount: 3
          }
        ]
      }
    ]
  },
  vaunted: {
    key: "vaunted",
    label: "Vaunted",
    lore: [
      "You came of age amid wealth and privilege, high above the common masses, surrounded by proud scions, idle lords, and watchful retainers.",
      "Every indulgence of the wealthy elite was laid before you: decadence, entanglements, rare drugs, feuds, conspiracies, and carefully hidden violence.",
      "That upbringing sharpened your poise and sense of entitlement alike, but it also dulled some practical instincts and left darker stains behind."
    ],
    positives: [
      "Gain Decadence",
      "Choose +3 Agility or +3 Fellowship"
    ],
    negatives: [
      "-3 Perception",
      "Gain 1d5 Corruption Points"
    ],
    modifiers: {
      perception: -3
    },
    grantedItems: [
      {
        name: "Decadence",
        talentId: "decadence",
        category: "talent",
        benefit: "You are accustomed to indulgence, excess, and the refinements of the wealthy."
      }
    ],
    autoEffects: [
      {
        type: "resourceRoll",
        formula: "1d5",
        resourcePath: "system.corruption.points",
        resourceLabel: "Corruption Points"
      }
    ],
    choices: [
      {
        key: "socialGrace",
        label: "Refined Aptitude",
        options: [
          {
            key: "agility",
            name: "+3 Agility",
            type: "characteristicBonus",
            characteristicKey: "agility",
            amount: 3
          },
          {
            key: "fellowship",
            name: "+3 Fellowship",
            type: "characteristicBonus",
            characteristicKey: "fellowship",
            amount: 3
          }
        ]
      }
    ]
  },
  inServiceToTheThrone: {
    key: "inServiceToTheThrone",
    label: "In Service to the Throne",
    lore: [
      "The Imperium is built upon the toil of untold trillions, and your life was spent as one more servant of the Emperor's endless design.",
      "Whether you served by choice or by force, your years were given over to conquest, administration, war, and the grinding machinery of Imperial duty.",
      "That service pulled you far from the life you might have known and shaped you into someone harder, broader in knowledge, and more bound to the Imperium's great purpose."
    ],
    positives: [
      "Choose one service path",
      "Options grant broad Imperial knowledge, trained skills, and command aptitude"
    ],
    negatives: [
      "Born to Lead reduces Toughness"
    ],
    modifiers: {},
    choices: [
      {
        key: "servicePath",
        label: "Service Path",
        options: [
          {
            key: "tithed",
            name: "Tithed",
            type: "composite",
            description: "Gain one Common Lore as a trained skill, choose any two listed service skills or talents, and gain +3 Willpower or +3 Ballistic Skill.",
            nestedChoices: true
          },
          {
            key: "born-to-lead",
            name: "Born to Lead",
            type: "composite",
            modifiers: {
              toughness: -3
            },
            skills: [
              {
                skillId: "command",
                trained: true
              },
              {
                skillId: "literacy",
                trained: true
              }
            ],
            description: "Gain Command and Literacy as trained skills, choose one Scholastic Lore as a trained skill, and gain +3 Intelligence or +3 Fellowship while suffering -3 Toughness."
          }
        ]
      },
      {
        key: "tithedLore",
        label: "Tithed: Common Lore",
        options: [
          "Adeptus Astra Telepathica",
          "Administratum",
          "Imperial Creed",
          "Imperial Guard",
          "Imperial Navy",
          "Imperium",
          "War"
        ].map((name) => {
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return {
            key: `tithed-common-lore-${slug}`,
            name: `Common Lore (${name})`,
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: `common-lore/${slug}`,
              trained: true
            }
          };
        })
      },
      {
        key: "tithedServiceOne",
        label: "Tithed: Service Choice 1",
        options: [
          {
            key: "tithed-drive-ground-vehicle-1",
            name: "Drive (Ground Vehicle)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "drive/ground-vehicle",
              trained: true
            }
          },
          {
            key: "tithed-drive-skimmer-hover-1",
            name: "Drive (Skimmer/Hover)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "drive/skimmer-hover",
              trained: true
            }
          },
          {
            key: "tithed-drive-walker-1",
            name: "Drive (Walker)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "drive/walker",
              trained: true
            }
          },
          {
            key: "tithed-literacy-1",
            name: "Literacy",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "literacy",
              trained: true
            }
          },
          {
            key: "tithed-medicae-1",
            name: "Medicae",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "medicae",
              trained: true
            }
          },
          {
            key: "tithed-navigation-surface-1",
            name: "Navigation (Surface)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "navigation/surface",
              trained: true
            }
          },
          {
            key: "tithed-survival-1",
            name: "Survival",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "survival",
              trained: true
            }
          },
          {
            key: "tithed-tech-use-1",
            name: "Tech-Use",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "tech-use",
              trained: true
            }
          },
          {
            key: "tithed-basic-weapon-training-las-1",
            name: "Basic Weapon Training (Las)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Basic Weapon Training (Las)",
              talentId: "basic-weapon-training/las",
              category: "talent",
              benefit: "Use Las basic weapons without the untrained penalty."
            }
          },
          {
            key: "tithed-basic-weapon-training-sp-1",
            name: "Basic Weapon Training (SP)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Basic Weapon Training (SP)",
              talentId: "basic-weapon-training/sp",
              category: "talent",
              benefit: "Use SP basic weapons without the untrained penalty."
            }
          },
          {
            key: "tithed-pistol-weapon-training-las-1",
            name: "Pistol Weapon Training (Las)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Pistol Weapon Training (Las)",
              talentId: "pistol-weapon-training/las",
              category: "talent",
              benefit: "Use Las pistols without the untrained penalty."
            }
          },
          {
            key: "tithed-pistol-weapon-training-sp-1",
            name: "Pistol Weapon Training (SP)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Pistol Weapon Training (SP)",
              talentId: "pistol-weapon-training/sp",
              category: "talent",
              benefit: "Use SP pistols without the untrained penalty."
            }
          }
        ]
      },
      {
        key: "tithedServiceTwo",
        label: "Tithed: Service Choice 2",
        options: [
          {
            key: "tithed-drive-ground-vehicle-2",
            name: "Drive (Ground Vehicle)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "drive/ground-vehicle",
              trained: true
            }
          },
          {
            key: "tithed-drive-skimmer-hover-2",
            name: "Drive (Skimmer/Hover)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "drive/skimmer-hover",
              trained: true
            }
          },
          {
            key: "tithed-drive-walker-2",
            name: "Drive (Walker)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "drive/walker",
              trained: true
            }
          },
          {
            key: "tithed-literacy-2",
            name: "Literacy",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "literacy",
              trained: true
            }
          },
          {
            key: "tithed-medicae-2",
            name: "Medicae",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "medicae",
              trained: true
            }
          },
          {
            key: "tithed-navigation-surface-2",
            name: "Navigation (Surface)",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "navigation/surface",
              trained: true
            }
          },
          {
            key: "tithed-survival-2",
            name: "Survival",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "survival",
              trained: true
            }
          },
          {
            key: "tithed-tech-use-2",
            name: "Tech-Use",
            type: "skill",
            requiresPath: "tithed",
            skill: {
              skillId: "tech-use",
              trained: true
            }
          },
          {
            key: "tithed-basic-weapon-training-las-2",
            name: "Basic Weapon Training (Las)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Basic Weapon Training (Las)",
              talentId: "basic-weapon-training/las",
              category: "talent",
              benefit: "Use Las basic weapons without the untrained penalty."
            }
          },
          {
            key: "tithed-basic-weapon-training-sp-2",
            name: "Basic Weapon Training (SP)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Basic Weapon Training (SP)",
              talentId: "basic-weapon-training/sp",
              category: "talent",
              benefit: "Use SP basic weapons without the untrained penalty."
            }
          },
          {
            key: "tithed-pistol-weapon-training-las-2",
            name: "Pistol Weapon Training (Las)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Pistol Weapon Training (Las)",
              talentId: "pistol-weapon-training/las",
              category: "talent",
              benefit: "Use Las pistols without the untrained penalty."
            }
          },
          {
            key: "tithed-pistol-weapon-training-sp-2",
            name: "Pistol Weapon Training (SP)",
            type: "item",
            requiresPath: "tithed",
            item: {
              name: "Pistol Weapon Training (SP)",
              talentId: "pistol-weapon-training/sp",
              category: "talent",
              benefit: "Use SP pistols without the untrained penalty."
            }
          }
        ]
      },
      {
        key: "tithedAptitude",
        label: "Tithed: Characteristic Bonus",
        options: [
          {
            key: "tithed-willpower",
            name: "+3 Willpower",
            type: "characteristicBonus",
            requiresPath: "tithed",
            characteristicKey: "willpower",
            amount: 3
          },
          {
            key: "tithed-ballistic-skill",
            name: "+3 Ballistic Skill",
            type: "characteristicBonus",
            requiresPath: "tithed",
            characteristicKey: "ballisticSkill",
            amount: 3
          }
        ]
      },
      {
        key: "bornToLeadLore",
        label: "Born to Lead: Scholastic Lore",
        options: [
          {
            key: "born-to-lead-bureaucracy",
            name: "Scholastic Lore (Bureaucracy)",
            type: "skill",
            requiresPath: "born-to-lead",
            skill: {
              skillId: "scholastic-lore/bureaucracy",
              trained: true
            }
          },
          {
            key: "born-to-lead-imperial-creed",
            name: "Scholastic Lore (Imperial Creed)",
            type: "skill",
            requiresPath: "born-to-lead",
            skill: {
              skillId: "scholastic-lore/imperial-creed",
              trained: true
            }
          },
          {
            key: "born-to-lead-judgement",
            name: "Scholastic Lore (Judgement)",
            type: "skill",
            requiresPath: "born-to-lead",
            skill: {
              skillId: "scholastic-lore/judgement",
              trained: true
            }
          },
          {
            key: "born-to-lead-tactica-imperialis",
            name: "Scholastic Lore (Tactica Imperialis)",
            type: "skill",
            requiresPath: "born-to-lead",
            skill: {
              skillId: "scholastic-lore/tactica-imperialis",
              trained: true
            }
          }
        ]
      },
      {
        key: "bornToLeadAptitude",
        label: "Born to Lead: Characteristic Bonus",
        options: [
          {
            key: "born-to-lead-intelligence",
            name: "+3 Intelligence",
            type: "characteristicBonus",
            requiresPath: "born-to-lead",
            characteristicKey: "intelligence",
            amount: 3
          },
          {
            key: "born-to-lead-fellowship",
            name: "+3 Fellowship",
            type: "characteristicBonus",
            requiresPath: "born-to-lead",
            characteristicKey: "fellowship",
            amount: 3
          }
        ]
      }
    ]
  }
};

const LURE_OF_THE_VOID_DEFINITIONS = {
  tainted: {
    key: "tainted",
    label: "Tainted",
    lore: [
      "You are vile in the eyes of the holy, condemned for your bloodline, form, demeanour, or suspect beliefs. Few look closely before passing judgement, fearing contagion, corruption, and the wrath of the God-Emperor's servants.",
      "Yet even under that weight of scorn, your soul burns for greatness. What others would deny you, you intend to seize by force of will, cunning, or vengeance.",
      "You now seek a place in the void where the mark laid upon you can be turned into strength rather than a sentence."
    ],
    positives: [
      "Choose one tainted path",
      "Options grant mutation, resilience, influence among the damned, or hardened will"
    ],
    negatives: [
      "Several options impose Fate loss, Insanity, or social penalties"
    ],
    modifiers: {},
    choices: [
      {
        key: "taintedPath",
        label: "Tainted Path",
        options: [
          {
            key: "mutant",
            name: "Mutant",
            type: "mutationRoll",
            formula: "1d100"
          },
          {
            key: "insane-fellowship",
            name: "Insane: -3 Fellowship",
            type: "composite",
            modifiers: {
              fellowship: -3,
              toughness: 3
            },
            items: [
              {
                name: "Peer (The Insane)",
                talentId: "peer/the-insane",
                category: "talent",
                benefit: "You possess status and recognition among the insane and the broken."
              }
            ],
            rolls: [
              {
                formula: "2d10",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ]
          },
          {
            key: "insane-fate",
            name: "Insane: -1 Fate Point",
            type: "composite",
            modifiers: {
              toughness: 3
            },
            updates: {
              "system.resources.fate.value": -1,
              "system.resources.fate.max": -1
            },
            items: [
              {
                name: "Peer (The Insane)",
                talentId: "peer/the-insane",
                category: "talent",
                benefit: "You possess status and recognition among the insane and the broken."
              }
            ],
            rolls: [
              {
                formula: "2d10",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ]
          },
          {
            key: "deviant-philosophy",
            name: "Deviant Philosophy",
            type: "composite",
            modifiers: {
              willpower: 3
            },
            items: [
              {
                name: "Enemy (Ecclesiarchy)",
                talentId: "enemy/ecclesiarchy",
                category: "talent",
                benefit: "You are especially despised by the Ecclesiarchy."
              }
            ]
          }
        ]
      }
    ]
  },
  criminal: {
    key: "criminal",
    label: "Criminal",
    lore: [
      "Imperial justice grinds slowly but mercilessly, and the underworld offers only the most dangerous kinds of sanctuary. Whether declared guilty by law or cast out by criminals you once served, your old life could no longer hold you.",
      "Smugglers' routes, hidden bolt-holes, and the shadow economies behind Imperial society became your refuge.",
      "Now the void is not merely an opportunity, but a necessity: a place to run, hide, or rise again."
    ],
    positives: [
      "Choose one criminal background",
      "Options grant underworld ties, heightened awareness, or a replacement bionic"
    ],
    negatives: [
      "Many choices bring official enemies, criminal enemies, or social penalties"
    ],
    modifiers: {},
    choices: [
      {
        key: "criminalPath",
        label: "Criminal Path",
        options: [
          {
            key: "wanted-fugitive",
            name: "Wanted Fugitive",
            type: "composite",
            items: [
              {
                name: "Enemy (Adeptus Arbites)",
                talentId: "enemy/adeptus-arbites",
                category: "talent",
                benefit: "You are especially despised by the Adeptus Arbites."
              },
              {
                name: "Peer (Underworld)",
                talentId: "peer/underworld",
                category: "talent",
                benefit: "You possess status and favourable connections within the underworld."
              }
            ]
          },
          {
            key: "crime-baron",
            name: "Hunted by a Crime Baron",
            type: "composite",
            modifiers: {
              perception: 3
            },
            items: [
              {
                name: "Enemy (Underworld)",
                talentId: "enemy/underworld",
                category: "talent",
                benefit: "You are especially despised by figures in the underworld."
              }
            ]
          },
          {
            key: "judged-and-found-wanting",
            name: "Judged and Found Wanting",
            type: "composite",
            modifiers: {
              fellowship: -5
            },
            items: [
              {
                name: "Poor-Craftsmanship Bionic Limb or Implant",
                category: "trait",
                benefit: "Gain one poor-Craftsmanship bionic limb or implant.",
                description: "The scars of Imperial justice remain with you in the form of a crude replacement limb or implant. You may later upgrade it with xp."
              }
            ]
          }
        ]
      }
    ]
  },
  renegade: {
    key: "renegade",
    label: "Renegade",
    lore: [
      "The Imperium survives by narrowness of thought and walls of faith and obedience, but your mind or your actions would not remain confined.",
      "Perhaps you were a rebellious thinker, a heretic in the eyes of priests, or a revolutionary who fought against the injustices of your home world.",
      "Whatever the reason, you learned that your choices had reduced you to two roads: escape or death."
    ],
    positives: [
      "Choose one renegade path",
      "Options grant concealment, resistance, forbidden insight, or sharpened intellect"
    ],
    negatives: [
      "Choices can bring Arbites or Ecclesiarchy enemies, Corruption, or Insanity"
    ],
    modifiers: {},
    choices: [
      {
        key: "renegadePath",
        label: "Renegade Path",
        options: [
          {
            key: "recidivist",
            name: "Recidivist",
            type: "composite",
            items: [
              {
                name: "Enemy (Adeptus Arbites)",
                talentId: "enemy/adeptus-arbites",
                category: "talent",
                benefit: "You are especially despised by the Adeptus Arbites."
              },
              {
                name: "Resistance (Interrogation)",
                talentId: "resistance/interrogation",
                category: "talent",
                benefit: "Gain a +10 bonus to resist interrogation."
              }
            ],
            skills: [
              {
                skillId: "concealment",
                basic: true,
                trained: true
              }
            ]
          },
          {
            key: "free-thinker-intelligence",
            name: "Free-thinker (+3 Intelligence)",
            type: "composite",
            modifiers: {
              intelligence: 3,
              willpower: -3
            },
            items: [
              {
                name: "Enemy (Ecclesiarchy)",
                talentId: "enemy/ecclesiarchy",
                category: "talent",
                benefit: "You are especially despised by the Ecclesiarchy."
              }
            ]
          },
          {
            key: "free-thinker-perception",
            name: "Free-thinker (+3 Perception)",
            type: "composite",
            modifiers: {
              perception: 3,
              willpower: -3
            },
            items: [
              {
                name: "Enemy (Ecclesiarchy)",
                talentId: "enemy/ecclesiarchy",
                category: "talent",
                benefit: "You are especially despised by the Ecclesiarchy."
              }
            ]
          },
          {
            key: "dark-visionary-corruption",
            name: "Dark Visionary (1d5+1 Corruption)",
            type: "composite",
            items: [
              {
                name: "Dark Soul",
                talentId: "dark-soul",
                category: "talent",
                benefit: "You are unusually resilient to the taint of darkness."
              },
              {
                name: "Forbidden Lore (Choose One)",
                category: "trait",
                benefit: "Gain one Forbidden Lore as a trained Basic skill.",
                description: "Choose one Forbidden Lore skill to mark as trained. This placeholder exists until that exact lore is selected."
              }
            ],
            rolls: [
              {
                formula: "1d5 + 1",
                resourcePath: "system.corruption.points",
                resourceLabel: "Corruption Points"
              }
            ]
          },
          {
            key: "dark-visionary-insanity",
            name: "Dark Visionary (1d5+1 Insanity)",
            type: "composite",
            items: [
              {
                name: "Dark Soul",
                talentId: "dark-soul",
                category: "talent",
                benefit: "You are unusually resilient to the taint of darkness."
              },
              {
                name: "Forbidden Lore (Choose One)",
                category: "trait",
                benefit: "Gain one Forbidden Lore as a trained Basic skill.",
                description: "Choose one Forbidden Lore skill to mark as trained. This placeholder exists until that exact lore is selected."
              }
            ],
            rolls: [
              {
                formula: "1d5 + 1",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ]
          }
        ]
      }
    ]
  },
  crusade: {
    key: "crusade",
    label: "Crusade",
    lore: [
      "The Imperium is forever at war, and countless men and women answer the clarion call to march in the name of the Golden Throne.",
      "Some are forged into elite warriors by long campaigns, others pursue hated foes across the stars, and still others seek only the next worthy test of arms in the Emperor's service.",
      "Whether trained in massed war, driven by vengeance, or honed into a living weapon, your path into the void was shaped by crusade."
    ],
    positives: [
      "Choose one crusade path",
      "Options grant martial training, hatred of the enemy, or hard-won discipline"
    ],
    negatives: [
      "Several options inflict Insanity or reduce Fellowship"
    ],
    modifiers: {},
    choices: [
      {
        key: "crusadePath",
        label: "Crusade Path",
        options: [
          ...["Eldar", "Orks", "Kroot", "Chaos"].map((target) => ({
            key: `call-to-war-${target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name: `Call to War (${target})`,
            type: "composite",
            modifiers: {
              ballisticSkill: 5
            },
            items: [
              {
                name: "Peer (Military)",
                talentId: "peer/military",
                category: "talent",
                benefit: "You possess status and favourable connections within military institutions."
              },
              {
                name: `Hatred (${target})`,
                category: "talent",
                benefit: `Gain +10 Weapon Skill in melee against ${target}.`,
                description: `Long campaigning against ${target} taught you their weaknesses and left you with a deep abiding hatred of them.`
              }
            ],
            rolls: [
              {
                formula: "1d10",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ]
          })),
          ...["Eldar", "Orks", "Kroot", "Chaos"].flatMap((target) => ([
            {
              key: `chasing-enemy-intelligence-${target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              name: `Chasing the Enemy (+3 Intelligence, ${target})`,
              type: "composite",
              modifiers: {
                intelligence: 3
              },
              items: [
                {
                  name: `Hatred (${target})`,
                  category: "talent",
                  benefit: `Gain +10 Weapon Skill in melee against ${target}.`,
                  description: `Your endless pursuit of ${target} has sharpened both your understanding of them and your hatred.`
                }
              ]
            },
            {
              key: `chasing-enemy-willpower-${target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              name: `Chasing the Enemy (+3 Willpower, ${target})`,
              type: "composite",
              modifiers: {
                willpower: 3
              },
              items: [
                {
                  name: `Hatred (${target})`,
                  category: "talent",
                  benefit: `Gain +10 Weapon Skill in melee against ${target}.`,
                  description: `Your endless pursuit of ${target} has hardened your resolve and consumed you with hatred.`
                }
              ]
            }
          ])),
          {
            key: "warrior-toughness",
            name: "Warrior (+5 WS, +5 Toughness, -5 Fellowship)",
            type: "composite",
            modifiers: {
              weaponSkill: 5,
              toughness: 5,
              fellowship: -5
            },
            items: [
              {
                name: "Meditation",
                talentId: "meditation",
                category: "talent",
                benefit: "After 10 uninterrupted minutes and a successful Willpower test, remove 1 Fatigue."
              }
            ]
          },
          {
            key: "warrior-agility",
            name: "Warrior (+5 WS, +5 Agility, -5 Fellowship)",
            type: "composite",
            modifiers: {
              weaponSkill: 5,
              agility: 5,
              fellowship: -5
            },
            items: [
              {
                name: "Meditation",
                talentId: "meditation",
                category: "talent",
                benefit: "After 10 uninterrupted minutes and a successful Willpower test, remove 1 Fatigue."
              }
            ]
          }
        ]
      }
    ]
  },
  dutyBound: {
    key: "dutyBound",
    label: "Duty Bound",
    lore: [
      "You believe duty is not a prison but a calling, arising from the soul and binding the worthy to service, hardship, and purpose.",
      "Whether you serve the Throne, humanity as a whole, or the honour of your dynasty, your life is shaped by obligations larger than yourself.",
      "It is that sense of duty that has carried you toward the long roads and harsher labours that lie among the stars."
    ],
    positives: [
      "Choose one sworn duty",
      "Options grant discipline, perception or intellect, or influence over your dynasty's fortunes"
    ],
    negatives: [
      "Choices may penalize dealings with outsiders, reduce Profit Factor, or weaken Toughness"
    ],
    modifiers: {},
    choices: [
      {
        key: "dutyPath",
        label: "Sworn Duty",
        options: [
          {
            key: "duty-throne",
            name: "Duty to the Throne",
            type: "composite",
            modifiers: {
              willpower: 3
            },
            conditionalItems: [
              {
                characteristicKey: "willpower",
                min: 40,
                item: {
                  name: "Armour of Contempt",
                  talentId: "armour-of-contempt",
                  category: "talent",
                  benefit: "Your hatred of impurity hardens you against corruption."
                }
              }
            ],
            items: [
              {
                name: "Duty to the Throne",
                category: "trait",
                benefit: "Suffer a -10 penalty to Interaction skill tests when dealing with sources outside of the Imperium.",
                description: "Your loyalty to the Imperium makes it harder for you to deal comfortably with aliens, traitors, and other outsiders."
              }
            ]
          },
          {
            key: "duty-humanity-intelligence",
            name: "Duty to Humanity (+3 Intelligence)",
            type: "composite",
            modifiers: {
              intelligence: 3
            },
            updates: {
              "system.acquisitions.profitFactor": -1
            }
          },
          {
            key: "duty-humanity-perception",
            name: "Duty to Humanity (+3 Perception)",
            type: "composite",
            modifiers: {
              perception: 3
            },
            updates: {
              "system.acquisitions.profitFactor": -1
            }
          },
          {
            key: "duty-dynasty",
            name: "Duty to Your Dynasty",
            type: "composite",
            modifiers: {
              toughness: -3
            },
            updates: {
              "system.acquisitions.profitFactor": 1
            },
            items: [
              {
                name: "Rival (Rogue Trader Family)",
                category: "trait",
                benefit: "A rival Rogue Trader family opposes you and your bloodline.",
                description: "Your obligations to your dynasty are entangled with rivalry, jealousy, and the ambitions of other Rogue Trader houses."
              }
            ]
          }
        ]
      }
    ]
  },
  zealot: {
    key: "zealot",
    label: "Zealot",
    lore: [
      "Your faith is no hollow ritual. Whether born into you or forged in revelation and battle, it is certainty, not mere belief.",
      "That conviction has driven you far beyond the life that otherwise would have been yours, onto a pilgrim's road among the stars.",
      "You mean to carry the God-Emperor's will to the needy and the unbelieving alike, protecting the righteous and punishing the enemies of mankind."
    ],
    positives: [
      "Choose one expression of zeal",
      "Options grant stronger will, greater social force, or favour among the faithful"
    ],
    negatives: [
      "Choices may hurt Charm, Fellowship, Toughness, or burden you with Insanity"
    ],
    modifiers: {},
    choices: [
      {
        key: "zealotPath",
        label: "Expression of Zeal",
        options: [
          {
            key: "blessed-scars",
            name: "Blessed Scars",
            type: "composite",
            items: [
              {
                name: "Blessed Scars",
                category: "trait",
                benefit: "Gain +10 to Intimidate tests and -10 to Charm tests.",
                description: "Your body bears scars of faith and suffering that inspire dread more readily than warmth."
              },
              {
                name: "Poor-Craftsmanship Bionic",
                category: "trait",
                benefit: "Gain one poor-Craftsmanship bionic.",
                description: "Your zeal has already exacted a physical price, leaving you marked with a crude replacement."
              }
            ]
          },
          {
            key: "unnerving-clarity-fellowship",
            name: "Unnerving Clarity (-5 Fellowship)",
            type: "composite",
            modifiers: {
              willpower: 5,
              fellowship: -5
            }
          },
          {
            key: "unnerving-clarity-insanity",
            name: "Unnerving Clarity (1d10 Insanity)",
            type: "composite",
            modifiers: {
              willpower: 5
            },
            rolls: [
              {
                formula: "1d10",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ]
          },
          {
            key: "favoured-faithful",
            name: "Favoured of the Faithful",
            type: "composite",
            modifiers: {
              fellowship: 5,
              toughness: -5
            },
            items: [
              {
                name: "Peer (Ecclesiarchy)",
                talentId: "peer/ecclesiarchy",
                category: "talent",
                benefit: "You possess status and favourable connections within the Ecclesiarchy."
              }
            ]
          }
        ]
      }
    ]
  },
  chosenByDestiny: {
    key: "chosenByDestiny",
    label: "Chosen by Destiny",
    lore: [
      "For as long as you can remember, you have been certain a grand destiny awaits you. Time and again, the course of events has seemed to bend just enough to keep you moving toward it.",
      "Perhaps you seek forbidden truth, perhaps your fate lies upon alien worlds, or perhaps you know in your heart you are meant to eclipse all others of your bloodline.",
      "Whatever form that certainty takes, it has pushed you beyond ordinary horizons and out toward the void."
    ],
    positives: [
      "Choose one destined path",
      "Options grant foresight, social leverage with xenos, or a greater store of Fate"
    ],
    negatives: [
      "Choices may cause Insanity, weaken Willpower, or leave you vulnerable around alien influence"
    ],
    modifiers: {},
    choices: [
      {
        key: "destinyPath",
        label: "Destined Path",
        options: [
          {
            key: "seeker-truth-academics",
            name: "Seeker of Truth (Enemy: Academics)",
            type: "composite",
            modifiers: {
              willpower: -3
            },
            items: [
              {
                name: "Foresight",
                talentId: "foresight",
                category: "talent",
                benefit: "Careful analysis lets you identify the best path to success."
              },
              {
                name: "Enemy (Academics)",
                talentId: "enemy/academics",
                category: "talent",
                benefit: "You are especially despised by academic authorities."
              }
            ]
          },
          {
            key: "seeker-truth-ecclesiarchy",
            name: "Seeker of Truth (Enemy: Ecclesiarchy)",
            type: "composite",
            modifiers: {
              willpower: -3
            },
            items: [
              {
                name: "Foresight",
                talentId: "foresight",
                category: "talent",
                benefit: "Careful analysis lets you identify the best path to success."
              },
              {
                name: "Enemy (Ecclesiarchy)",
                talentId: "enemy/ecclesiarchy",
                category: "talent",
                benefit: "You are especially despised by the Ecclesiarchy."
              }
            ]
          },
          {
            key: "xenophile",
            name: "Xenophile",
            type: "composite",
            items: [
              {
                name: "Xenophile",
                category: "trait",
                benefit: "Gain +10 to Fellowship tests when dealing with alien races or cultures, but suffer a -5 penalty to Willpower tests involving alien artefacts and alien psychic powers.",
                description: "Your curiosity and attraction toward xenos cultures make you unusually effective with them, but also more vulnerable to their pull."
              }
            ]
          },
          {
            key: "fated-for-greatness",
            name: "Fated for Greatness",
            type: "composite",
            updates: {
              "system.resources.fate.value": 1,
              "system.resources.fate.max": 1
            },
            rolls: [
              {
                formula: "1d10 + 1",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ]
          }
        ]
      }
    ]
  }
};

const TRIALS_AND_TRAVAILS_DEFINITIONS = {
  handOfWar: {
    key: "handOfWar",
    label: "The Hand of War",
    lore: [
      "You were caught up in a brutal campaign of starship loss, blasted cities, and merciless battle. The war that shaped your life still follows you in memory and habit.",
      "Only those who have fought and bled beside you feel wholly trustworthy now, and your hatred for the foe that defined your past runs deep.",
      "You pursue what you want with urgency, because you know better than most how close death always stands."
    ],
    positives: [
      "Choose one Weapon Training Talent or Leap Up",
      "Choose Hatred against the foe that defined your war"
    ],
    negatives: [
      "You suffer -10 Fellowship when dealing with your sworn enemy and may react violently to them"
    ],
    grantedItems: [
      {
        name: "The Face of the Enemy",
        category: "trait",
        benefit: "Suffer -10 to Fellowship tests when dealing with your sworn enemy, and you may react violently if provoked.",
        description: "You will never willingly have dealings with your sworn enemy except under the direst circumstances."
      }
    ],
    choices: [
      {
        key: "ashesOfWar",
        label: "The Ashes of War",
        options: [
          ...WEAPON_TRAINING_OPTIONS.map((talent) => ({
            key: `training-${talent.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
            name: talent.fullName,
            type: "item",
            item: {
              name: talent.fullName,
              talentId: talent.id,
              category: "talent",
              benefit: talent.benefit
            }
          })),
          {
            key: "leap-up",
            name: "Leap Up",
            type: "item",
            item: {
              name: "Leap Up",
              talentId: "leap-up",
              category: "talent",
              benefit: "Stand up as a Free Action."
            }
          }
        ]
      },
      {
        key: "warHatred",
        label: "Hatred",
        options: [
          "Orks",
          "Eldar",
          "Mutants",
          "Chaos Worshippers",
          "Imperial Guard",
          "Imperial Navy",
          "Void Pirates"
        ].map((target) => ({
          key: `hatred-${target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name: `Hatred (${target})`,
          type: "item",
          item: {
            name: `Hatred (${target})`,
            category: "talent",
            benefit: `Gain +10 Weapon Skill in melee against ${target}.`,
            description: `The war that defined your past has left you with an enduring hatred of ${target}.`
          }
        }))
      }
    ]
  },
  pressGanged: {
    key: "pressGanged",
    label: "Press-Ganged",
    lore: [
      "At some point, your talents or bloodline became someone else's property. Whether by chain, threat, debt, or blackmail, you were forced into service you did not choose.",
      "You escaped, but the memory of bondage still bites deep, and you have sworn never again to be made into another's pawn.",
      "What you learned in that shadowed captivity remains useful, even if the circumstances that taught it were hateful."
    ],
    positives: [
      "Choose any one skill and gain or improve it",
      "Choose a Common Lore skill and gain or improve it"
    ],
    negatives: [
      "You react badly to imprisonment or threats to your freedom"
    ],
    grantedItems: [
      {
        name: "Jealous Freedom",
        category: "trait",
        benefit: "You react violently to the prospect of imprisonment or the loss of your freedom.",
        description: "Having endured captivity once, you have no intention of doing so again."
      }
    ],
    choices: [
      {
        key: "unwillingAccompliceSkill",
        label: "Unwilling Accomplice: Any Skill",
        options: CONCRETE_SKILL_OPTIONS.map((skill) => ({
          key: `skill-${skill.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
          name: skill.fullName,
          type: "skillAdvance",
          skill: {
            skillId: skill.id,
            increaseOneLevel: true
          }
        }))
      },
      {
        key: "unwillingAccompliceLore",
        label: "Additional Common Lore",
        options: COMMON_LORE_OPTIONS.map((skill) => ({
          key: `common-lore-${skill.id.split("/").at(-1)}`,
          name: skill.fullName,
          type: "skillAdvance",
          skill: {
            skillId: skill.id,
            increaseOneLevel: true
          }
        }))
      }
    ]
  },
  calamity: {
    key: "calamity",
    label: "Calamity",
    lore: [
      "You survived famine, plague, sabotage, or another disaster severe enough to strip away civility and expose what people become in extremis.",
      "You learned hard lessons about hunger, desperation, and the real value of supplies, discipline, and readiness.",
      "The experience left you more resilient, but also more cautious and less willing to gamble away your present security."
    ],
    positives: [
      "Gain Light Sleeper",
      "Choose Hardy or Nerves of Steel"
    ],
    negatives: [
      "Your group's starting Profit Factor is reduced by 1"
    ],
    grantedItems: [
      {
        name: "Light Sleeper",
        talentId: "light-sleeper",
        category: "talent",
        benefit: "You remain alert even in sleep."
      }
    ],
    autoEffects: [
      {
        type: "composite",
        updates: {
          "system.acquisitions.profitFactor": -1
        },
        items: [
          {
            name: "Echo of Hard Times",
            category: "trait",
            benefit: "Reduce the group's starting Profit Factor by 1.",
            description: "Past privation has left you cautious and deeply aware of present needs."
          }
        ]
      }
    ],
    choices: [
      {
        key: "inuredToAdversity",
        label: "Inured to Adversity",
        options: [
          {
            key: "hardy",
            name: "Hardy",
            type: "item",
            item: {
              name: "Hardy",
              talentId: "hardy",
              category: "talent",
              benefit: "Heal as if Lightly Wounded."
            }
          },
          {
            key: "nerves-of-steel",
            name: "Nerves of Steel",
            type: "item",
            item: {
              name: "Nerves of Steel",
              talentId: "nerves-of-steel",
              category: "talent",
              benefit: "Re-roll failed Willpower tests against Pinning."
            }
          }
        ]
      }
    ]
  },
  shipLorn: {
    key: "shipLorn",
    label: "Ship-Lorn",
    lore: [
      "You endured the nightmare of losing your ship, your crew, or the safe boundaries of voidfaring life, surviving when many think you should not have.",
      "That kind of survival demands terrible self-reliance and resolve, but it leaves a mark other voidfarers distrust.",
      "Still, every sunrise seen from the deck of a ship is proof that doom failed to claim you."
    ],
    positives: [
      "Choose Survival (gain or improve it) or Dark Soul",
      "When spending Fate to recover Wounds, you may re-roll but must keep the second result"
    ],
    negatives: [
      "-1 starting Fate Point",
      "-5 Fellowship with void born, Rogue Traders, and voidfarers who know your reputation"
    ],
    autoEffects: [
      {
        type: "composite",
        updates: {
          "system.resources.fate.value": -1,
          "system.resources.fate.max": -1
        },
        items: [
          {
            name: "Against All Odds",
            category: "trait",
            benefit: "When you spend a Fate Point to recover Wounds, you may re-roll the dice but must accept the second result.",
            description: "Your refusal to die has become part of your very nature."
          },
          {
            name: "Ill-starred",
            category: "trait",
            benefit: "Suffer -5 Fellowship when dealing with void born, Rogue Traders, and other voidfarers who know your background.",
            description: "Your survival has marked you as ill-omened among those who brave the void."
          }
        ]
      }
    ],
    choices: [
      {
        key: "againstAllOdds",
        label: "Against All Odds",
        options: [
          {
            key: "survival",
            name: "Survival (gain or improve)",
            type: "skillAdvance",
            skill: {
              skillId: "survival",
              increaseOneLevel: true
            }
          },
          {
            key: "dark-soul",
            name: "Dark Soul",
            type: "item",
            item: {
              name: "Dark Soul",
              talentId: "dark-soul",
              category: "talent",
              benefit: "Take only half the normal penalty on Malignancy tests."
            }
          }
        ]
      }
    ]
  },
  darkVoyage: {
    key: "darkVoyage",
    label: "Dark Voyage",
    lore: [
      "You have seen the truths behind voidfarers' darkest stories: bleeding bulkheads, the dead walking, the warp pressing too close, and horrors that should have remained legend.",
      "Whether you now fear those experiences or are drawn to them, they changed the way you see the darkness beneath reality.",
      "The abyss did not take you, but it left a mark on your mind."
    ],
    positives: [
      "Choose one Forbidden Lore and gain or improve it, or take Resistance (Fear)"
    ],
    negatives: [
      "Gain 1d5 Insanity Points"
    ],
    autoEffects: [
      {
        type: "resourceRoll",
        formula: "1d5",
        resourcePath: "system.insanity.points",
        resourceLabel: "Insanity Points",
        name: "Marked by Darkness"
      }
    ],
    choices: [
      {
        key: "thingsManWasNotMeantToKnow",
        label: "Things Man Was Not Meant to Know",
        options: [
          ...FORBIDDEN_LORE_OPTIONS.map((skill) => ({
            key: `forbidden-lore-${skill.id.split("/").at(-1)}`,
            name: skill.fullName,
            type: "skillAdvance",
            skill: {
              skillId: skill.id,
              increaseOneLevel: true
            }
          })),
          {
            key: "resistance-fear",
            name: "Resistance (Fear)",
            type: "item",
            item: {
              name: "Resistance (Fear)",
              talentId: "resistance/fear",
              category: "talent",
              benefit: "Gain +10 to resist Fear."
            }
          }
        ]
      }
    ]
  },
  darkness: {
    key: "darkness",
    label: "Darkness",
    lore: [
      "The galaxy is a dark and unforgiving place, and some are chosen by things terrible enough to leave their mark upon the soul.",
      "Some pry too deeply into forbidden texts, some survive a brush with the warp, and a rare few carry within them secrets that could destroy them if ever revealed.",
      "Whatever the source, your encounter with darkness left you changed, burdened, and marked by knowledge or power that should never have been yours."
    ],
    positives: [
      "Choose one dark path",
      "Options grant forbidden lore, resilience against the warp, or a powerful characteristic increase"
    ],
    negatives: [
      "Choices bring Enemy, Corruption, or Insanity"
    ],
    modifiers: {},
    choices: [
      {
        key: "darknessPath",
        label: "Dark Path",
        options: [
          {
            key: "forbidden-knowledge",
            name: "Forbidden Knowledge",
            type: "composite",
            items: [
              {
                name: "Paranoia",
                talentId: "paranoia",
                category: "talent",
                benefit: "Gain +2 Initiative and a constant watchfulness against danger."
              }
            ],
            description: "Gain one Common Lore and one Forbidden Lore as trained skills, plus Paranoia and an Enemy talent tied to the source of your knowledge."
          },
          {
            key: "warp-incursion",
            name: "Warp Incursion",
            type: "composite",
            items: [
              {
                name: "Resistance (Psychic Powers)",
                talentId: "resistance/psychic-powers",
                category: "talent",
                benefit: "Gain +10 to resist Psychic Powers."
              },
              {
                name: "Light Sleeper",
                talentId: "light-sleeper",
                category: "talent",
                benefit: "You remain alert even in sleep."
              }
            ],
            rolls: [
              {
                formula: "1d5",
                resourcePath: "system.corruption.points",
                resourceLabel: "Corruption Points"
              }
            ]
          },
          {
            key: "dark-secret",
            name: "Dark Secret",
            type: "composite",
            items: [
              {
                name: "Dark Secret",
                category: "trait",
                benefit: "You carry a terrible secret that could destroy you if revealed.",
                description: "Something dreadful happened to you or still resides within you. Work with the GM to determine the exact nature of this secret and the rare, dangerous circumstances required to remove it."
              }
            ],
            rolls: [
              {
                formula: "1d5",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              }
            ],
            description: "Gain +6 to any one Characteristic, but also gain 1d5 Insanity Points and a dark secret that hangs over your life."
          }
        ]
      },
      {
        key: "forbiddenKnowledgeCommonLore",
        label: "Forbidden Knowledge: Common Lore",
        options: COMMON_LORE_OPTIONS.map((skill) => ({
          key: `darkness-common-lore-${skill.id.split("/").at(-1)}`,
          name: skill.fullName,
          type: "skill",
          requiresPath: "forbidden-knowledge",
          skill: {
            skillId: skill.id,
            trained: true
          }
        }))
      },
      {
        key: "forbiddenKnowledgeForbiddenLore",
        label: "Forbidden Knowledge: Forbidden Lore",
        options: FORBIDDEN_LORE_OPTIONS.map((skill) => ({
          key: `darkness-forbidden-lore-${skill.id.split("/").at(-1)}`,
          name: skill.fullName,
          type: "skill",
          requiresPath: "forbidden-knowledge",
          skill: {
            skillId: skill.id,
            trained: true
          }
        }))
      },
      {
        key: "forbiddenKnowledgeEnemy",
        label: "Forbidden Knowledge: Enemy",
        options: [
          "Adeptus Mechanicus",
          "Administratum",
          "Ecclesiarchy",
          "The Inquisition",
          "Imperial Guard",
          "Imperial Navy",
          "Rogue Trader Dynasty",
          "Underworld",
          "Other (GM Choice)"
        ].map((group) => ({
          key: `darkness-enemy-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name: `Enemy (${group})`,
          type: "item",
          requiresPath: "forbidden-knowledge",
          item: {
            name: `Enemy (${group})`,
            category: "talent",
            benefit: `You are especially despised by ${group}.`,
            description: `The group from whom you took forbidden knowledge would stop at nothing to see it purged from you.`
          }
        }))
      },
      {
        key: "darkSecretCharacteristic",
        label: "Dark Secret: Characteristic Bonus",
        options: [
          { key: "weaponSkill", name: "+6 Weapon Skill", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "weaponSkill", amount: 6 },
          { key: "ballisticSkill", name: "+6 Ballistic Skill", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "ballisticSkill", amount: 6 },
          { key: "strength", name: "+6 Strength", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "strength", amount: 6 },
          { key: "toughness", name: "+6 Toughness", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "toughness", amount: 6 },
          { key: "agility", name: "+6 Agility", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "agility", amount: 6 },
          { key: "intelligence", name: "+6 Intelligence", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "intelligence", amount: 6 },
          { key: "perception", name: "+6 Perception", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "perception", amount: 6 },
          { key: "willpower", name: "+6 Willpower", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "willpower", amount: 6 },
          { key: "fellowship", name: "+6 Fellowship", type: "characteristicBonus", requiresPath: "dark-secret", characteristicKey: "fellowship", amount: 6 }
        ]
      }
    ]
  },
  highVendetta: {
    key: "highVendetta",
    label: "High Vendetta",
    lore: [
      "You learned the hard way that honour, loyalty, and alliance are not abstractions but lifelines in the cold darkness of the void.",
      "A murderous feud consumed part of your life and sent allies to their graves, teaching you the cost of insult and the price of vengeance.",
      "Whether your side triumphed or merely survived, you emerged changed, wary, and unwilling to let affronts pass unanswered."
    ],
    positives: [
      "Choose Die Hard or Paranoia",
      "Gain or improve Inquiry"
    ],
    negatives: [
      "You are quick to answer serious insults with threat or violence"
    ],
    startingSkills: [
      {
        skillId: "inquiry",
        increaseOneLevel: true
      }
    ],
    grantedItems: [
      {
        name: "Brook No Insult",
        category: "trait",
        benefit: "You will not allow serious offences to your honour, person, or allies to pass unchallenged.",
        description: "Threat is met with threat and violence with violence unless you master yourself."
      }
    ],
    choices: [
      {
        key: "bloodWillHaveBlood",
        label: "Blood Will Have Blood",
        options: [
          {
            key: "die-hard",
            name: "Die Hard",
            type: "item",
            item: {
              name: "Die Hard",
              talentId: "die-hard",
              category: "talent",
              benefit: "Roll twice to avoid death from blood loss."
            }
          },
          {
            key: "paranoia",
            name: "Paranoia",
            type: "item",
            item: {
              name: "Paranoia",
              talentId: "paranoia",
              category: "talent",
              benefit: "Gain +2 Initiative and constant wariness."
            }
          }
        ]
      }
    ]
  }
};

const MOTIVATION_DEFINITIONS = {
  endurance: {
    key: "endurance",
    label: "Endurance",
    lore: [
      "You seek to endure and, through endurance, become stronger. Hardship, risk, pain, and setbacks are not merely obstacles to you, but the very means by which greatness is forged.",
      "The storm strips away the weak and tempers the worthy, or so the faithful say, and you have taken that lesson to heart.",
      "You do not fear the test. You welcome it, because only by surviving can you prove what you are meant to become."
    ],
    positives: [
      "+1 Wound"
    ],
    negatives: [],
    autoEffects: [
      {
        type: "composite",
        updates: {
          "system.resources.wounds.value": 1,
          "system.resources.wounds.max": 1
        }
      }
    ],
    choices: []
  },
  fortune: {
    key: "fortune",
    label: "Fortune",
    lore: [
      "You seek wealth beyond measure, because with wealth comes freedom, influence, and the ability to compel others to your will.",
      "Whether your ambitions are noble or corrupt matters less than this single truth: great undertakings begin with coin, and coin opens doors that faith and steel alone cannot.",
      "You chase wealth not only for what it buys, but for the life and power it makes possible."
    ],
    positives: [
      "+1 Fate Point"
    ],
    negatives: [],
    autoEffects: [
      {
        type: "composite",
        updates: {
          "system.resources.fate.value": 1,
          "system.resources.fate.max": 1
        }
      }
    ],
    choices: []
  },
  vengeance: {
    key: "vengeance",
    label: "Vengeance",
    lore: [
      "Vengeance burns within you and shapes every step you take. Every plan, every alliance, every risk is weighed against one question: does it bring you closer to retribution?",
      "You live with the memory of wrongs done to you and to yours, and that memory refuses to fade into anything gentler than hatred.",
      "What becomes of you after revenge is achieved matters less than achieving it at all."
    ],
    positives: [
      "Gain Hatred (choose one)"
    ],
    negatives: [],
    choices: [
      {
        key: "vengeanceHatred",
        label: "Hatred",
        options: HATRED_TALENT_OPTIONS.map((talent) => ({
          key: `hatred-${talent.id.split("/").at(-1)}`,
          name: talent.fullName,
          type: "item",
          item: {
            name: talent.fullName,
            talentId: talent.id,
            category: "talent",
            benefit: talent.benefit
          }
        }))
      }
    ]
  },
  renown: {
    key: "renown",
    label: "Renown",
    lore: [
      "You refuse to be one more nameless soul swallowed by the Imperium's immensity. You mean for your name to live on in glory, spoken long after your death.",
      "To reach such heights, you mean to gather worthy followers, secure powerful allies, and perform deeds so grand they cannot be forgotten.",
      "You do not merely want success. You want greatness that echoes across generations."
    ],
    positives: [
      "Choose Air of Authority or Peer (choose one)"
    ],
    negatives: [],
    choices: [
      {
        key: "renownPath",
        label: "Path to Renown",
        options: [
          {
            key: "air-of-authority",
            name: "Air of Authority",
            type: "item",
            item: {
              name: "Air of Authority",
              talentId: "air-of-authority",
              category: "talent",
              benefit: "A successful Command test can affect far more targets."
            }
          },
          ...PEER_TALENT_OPTIONS.map((talent) => ({
            key: `peer-${talent.id.split("/").at(-1)}`,
            name: talent.fullName,
            type: "item",
            item: {
              name: talent.fullName,
              talentId: talent.id,
              category: "talent",
              benefit: talent.benefit
            }
          }))
        ]
      }
    ]
  },
  pride: {
    key: "pride",
    label: "Pride",
    lore: [
      "Above all else, you want respect. Praise from allies, grudging esteem from foes, and clear acknowledgement of your worth matter deeply to you.",
      "You cannot abide insult to your honour, legacy, or ability. Doubt is answered with proof, and contempt with challenge.",
      "Your pride drives you to prove yourself constantly, and to ensure others recognize the quality you already know yourself to possess."
    ],
    positives: [
      "Choose an Heirloom Item or +3 Toughness"
    ],
    negatives: [],
    choices: [
      {
        key: "pridePath",
        label: "Expression of Pride",
        options: [
            {
              key: "heirloom-item",
              name: "Heirloom Item",
              type: "referenceTableRoll",
              tableKey: "heirloomItems",
              tableLabel: "Heirloom Items",
              formula: "1d100",
              category: "gear"
            },
          {
            key: "toughness",
            name: "+3 Toughness",
            type: "characteristicBonus",
            characteristicKey: "toughness",
            amount: 3
          }
        ]
      }
    ]
  },
  exhilaration: {
    key: "exhilaration",
    label: "Exhilaration",
    lore: [
      "The mundane offers you little joy. Only the unknown, the rush of danger, and the promise of a fresh sensation truly stir your spirit.",
      "New horizons, battle, and undiscovered pleasures draw you onward, while all else is merely a means to the next thrill.",
      "Yet in the quiet moments, you cannot help but wonder what will remain once you have seen and tasted everything worth having."
    ],
    positives: [
      "Choose one path of exhilaration",
      "Options grant exploration lore, martial zeal, or decadent resilience"
    ],
    negatives: [
      "Some options reduce Fellowship or Willpower and may inflict Corruption"
    ],
    modifiers: {},
    choices: [
      {
        key: "exhilarationPath",
        label: "Path of Exhilaration",
        options: [
          {
            key: "new-horizons",
            name: "New Horizons",
            type: "composite",
            description: "Gain Common Lore (Koronus Expanse) and either Scholastic Lore (Astromancy) or Trade (Explorator) as trained skills."
          },
          {
            key: "thrill-of-war",
            name: "The Thrill of War",
            type: "composite",
            modifiers: {
              fellowship: -3
            },
            skills: [
              {
                skillId: "scholastic-lore/tactica-imperialis",
                trained: true
              }
            ],
            items: [
              {
                name: "Nerves of Steel",
                talentId: "nerves-of-steel",
                category: "talent",
                benefit: "You can steel yourself against shock and terror, acting when others freeze."
              },
              {
                name: "Quick Draw",
                talentId: "quick-draw",
                category: "talent",
                benefit: "You can draw weapons with practiced speed."
              }
            ],
            description: "Gain Scholastic Lore (Tactica Imperialis), Nerves of Steel, and Quick Draw. Also gain +3 Weapon Skill or +3 Ballistic Skill, but suffer -3 Fellowship."
          },
          {
            key: "no-joy-unexplored",
            name: "No Joy Unexplored",
            type: "composite",
            modifiers: {
              willpower: -3
            },
            skills: [
              {
                skillId: "carouse",
                trained: true
              }
            ],
            items: [
              {
                name: "Decadence",
                talentId: "decadence",
                category: "talent",
                benefit: "You are accustomed to indulgence, excess, and the refinements of the wealthy."
              }
            ],
            rolls: [
              {
                formula: "1d5",
                resourcePath: "system.corruption.points",
                resourceLabel: "Corruption Points"
              }
            ],
            description: "Gain Decadence, Carouse as a trained skill, and either +3 Toughness or +3 Fellowship. Gain 1d5 Corruption and suffer -3 Willpower."
          }
        ]
      },
      {
        key: "newHorizonsLore",
        label: "New Horizons: Additional Skill",
        options: [
          {
            key: "new-horizons-astromancy",
            name: "Scholastic Lore (Astromancy)",
            type: "skill",
            requiresPath: "new-horizons",
            skill: {
              skillId: "scholastic-lore/astromancy",
              trained: true
            }
          },
          {
            key: "new-horizons-trade-explorator",
            name: "Trade (Explorator)",
            type: "skill",
            requiresPath: "new-horizons",
            skill: {
              skillId: "trade/explorator",
              trained: true
            }
          }
        ]
      },
      {
        key: "thrillOfWarCharacteristic",
        label: "The Thrill of War: Characteristic Bonus",
        options: [
          {
            key: "thrill-of-war-weapon-skill",
            name: "+3 Weapon Skill",
            type: "characteristicBonus",
            requiresPath: "thrill-of-war",
            characteristicKey: "weaponSkill",
            amount: 3
          },
          {
            key: "thrill-of-war-ballistic-skill",
            name: "+3 Ballistic Skill",
            type: "characteristicBonus",
            requiresPath: "thrill-of-war",
            characteristicKey: "ballisticSkill",
            amount: 3
          }
        ]
      },
      {
        key: "noJoyUnexploredCharacteristic",
        label: "No Joy Unexplored: Characteristic Bonus",
        options: [
          {
            key: "no-joy-unexplored-toughness",
            name: "+3 Toughness",
            type: "characteristicBonus",
            requiresPath: "no-joy-unexplored",
            characteristicKey: "toughness",
            amount: 3
          },
          {
            key: "no-joy-unexplored-fellowship",
            name: "+3 Fellowship",
            type: "characteristicBonus",
            requiresPath: "no-joy-unexplored",
            characteristicKey: "fellowship",
            amount: 3
          }
        ]
      }
    ]
  },
  devotion: {
    key: "devotion",
    label: "Devotion",
    lore: [
      "You venture into the unknown not for yourself, but for something greater. Faith, loyalty, honour, duty, or conviction give you the strength to endure when others falter.",
      "Where others seek wealth, glory, or self-advancement, you cleave to a purpose beyond yourself and will not be turned aside while that purpose remains.",
      "Others may fail to understand such devotion, but you know better. In belief, duty, or loyalty, you have found a strength they cannot comprehend."
    ],
    positives: [
      "Choose one path of devotion",
      "Options grant faith, discipline, or shipboard loyalty"
    ],
    negatives: [
      "Devotion binds you to ideals others may not share"
    ],
    modifiers: {},
    choices: [
      {
        key: "devotionPath",
        label: "Path of Devotion",
        options: [
          {
            key: "creed",
            name: "Creed",
            type: "composite",
            skills: [
              {
                skillId: "charm",
                trained: true
              },
              {
                skillId: "common-lore/imperial-creed",
                trained: true
              }
            ],
            items: [
              {
                name: "Inspire Wrath",
                talentId: "inspire-wrath",
                category: "talent",
                benefit: "Rouse zeal and battle-fury in those who follow your example."
              }
            ]
          },
          {
            key: "duty",
            name: "Duty",
            type: "composite",
            modifiers: {
              willpower: 3
            },
            description: "Gain either Armour of Contempt or Unshakeable Faith, and gain +3 Willpower."
          },
          {
            key: "loyalty",
            name: "Loyalty",
            type: "composite",
            skills: [
              {
                skillId: "trade/voidfarer",
                trained: true
              }
            ],
            items: [
              {
                name: "Loyalty to the Ship",
                category: "trait",
                benefit: "Gain a +5 bonus to Willpower and Fellowship tests while aboard the ship you live on.",
                description: "The ship is home, the crew is family, and the captain is your liege. Familiar deck plating and trusted shipmates strengthen your spirit."
              }
            ]
          }
        ]
      },
      {
        key: "dutyTalent",
        label: "Duty: Talent",
        options: [
          {
            key: "duty-armour-of-contempt",
            name: "Armour of Contempt",
            type: "item",
            requiresPath: "duty",
            item: {
              name: "Armour of Contempt",
              talentId: "armour-of-contempt",
              category: "talent",
              benefit: "Your hatred of impurity hardens you against corruption."
            }
          },
          {
            key: "duty-unshakeable-faith",
            name: "Unshakeable Faith",
            type: "item",
            requiresPath: "duty",
            item: {
              name: "Unshakeable Faith",
              talentId: "unshakeable-faith",
              category: "talent",
              benefit: "Your faith steels you against doubt and spiritual corruption."
            }
          }
        ]
      }
    ]
  },
  prestige: {
    key: "prestige",
    label: "Prestige",
    lore: [
      "You see the Imperium as a ladder and have dedicated yourself to climbing it. Rank, office, influence, and command are the prizes you value most.",
      "Wealth, reputation, and allies matter to you chiefly because they help you take the next step upward.",
      "Others may be content where they stand. You are not, and you fully intend to rise above them."
    ],
    positives: [
      "Choose Talented (choose one skill) or Peer (choose one)"
    ],
    negatives: [],
    choices: [
      {
        key: "prestigePath",
        label: "Path to Prestige",
        options: [
          ...TALENTED_SKILL_OPTIONS.map((skill) => ({
            key: `talented-${skill.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
            name: `Talented (${skill.fullName})`,
            type: "item",
            item: {
              name: `Talented (${skill.fullName})`,
              category: "talent",
              benefit: `Gain +10 to tests with ${skill.fullName}.`,
              description: `You have a natural affinity for ${skill.fullName}, gaining a +10 bonus to tests made using that skill.`
            }
          })),
          ...PEER_TALENT_OPTIONS.map((talent) => ({
            key: `peer-${talent.id.split("/").at(-1)}`,
            name: talent.fullName,
            type: "item",
            item: {
              name: talent.fullName,
              talentId: talent.id,
              category: "talent",
              benefit: talent.benefit
            }
          }))
        ]
      }
    ]
  }
};

const CAREER_DEFINITIONS = {
  rogueTrader: {
    key: "rogueTrader",
    label: "Rogue Trader",
    overview: [
      "The bearer of a sacred Warrant that empowers him to journey beyond the boundaries of the Imperium to trade, explore, and make war in the God-Emperor's name, a Rogue Trader is a unique figure in the grim darkness of the Imperium.",
      "A Rogue Trader is a power unto himself in the dark voids, master of all he surveys as far as his force of arms and sharpness of wits can press the claim, whether as diplomat, void-lord, plunderer, or commander.",
      "Though surrounded by allies and retainers, the Rogue Trader must judge when to trust others and when to rely on his own will, arms, and authority, for rivals and opportunity are never far apart."
    ],
    startingSkillsInfo: [
      "Command (Fel)",
      "Commerce (Fel)",
      "Charm (Fel)",
      "Common Lore (Imperium) (Int)",
      "Evaluate (Int)",
      "Literacy (Int)",
      "Scholastic Lore (Astromancy) (Int)",
      "Speak Language (High Gothic) (Int)",
      "Speak Language (Low Gothic) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one sidearm: best-Craftsmanship laspistol, good-Craftsmanship hand cannon, or common-Craftsmanship plasma pistol",
      "Choose one melee weapon: best-Craftsmanship sword with a mono edge or common-Craftsmanship power sword",
      "Fixed gear: micro-bead, void suit, set of fine clothing, xeno-pelt cloak",
      "Choose one armour set: best-Craftsmanship enforcer light carapace or storm trooper carapace"
    ],
    specialAbilityInfo: [
      "Exceptional Leader: As a free action once per round, the Rogue Trader may grant an ally that he can see and who can hear him +10 to any one test.",
      "Current implementation records this special ability on the actor and applies the published starting skills, talents, and gear package."
    ],
    startingSkills: [
      { skillId: "command", trained: true },
      { skillId: "commerce", trained: true },
      { skillId: "charm", trained: true },
      { skillId: "common-lore/imperium", trained: true },
      { skillId: "evaluate", trained: true },
      { skillId: "literacy", trained: true },
      { skillId: "scholastic-lore/astromancy", trained: true },
      { skillId: "speak-language/high-gothic", trained: true },
      { skillId: "speak-language/low-gothic", trained: true }
    ],
    grantedItems: [
      {
        name: "Air of Authority",
        talentId: "air-of-authority",
        category: "talent"
      },
      {
        name: "Exceptional Leader",
        type: "talent",
        category: "specialAbility",
        benefit: "Once per round as a Free Action, grant a visible ally who can hear you +10 to one test.",
        description: "As a free action once per round, the Rogue Trader may grant an ally that he can see and who can hear him +10 to any one test."
      },
      {
        name: "Pistol Weapon Training (Universal)",
        talentId: "pistol-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Melee Weapon Training (Universal)",
        talentId: "melee-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for shipboard or field coordination.",
        description: "Starting gear for a Rogue Trader career."
      },
      {
        name: "Void Suit",
        type: "gear",
        shortDescription: "Vacuum-rated protective suit for emergency survival in hostile environments.",
        description: "Starting gear for a Rogue Trader career."
      },
      {
        name: "Fine Clothing",
        type: "gear",
        craftsmanship: "good",
        shortDescription: "A refined set of clothing suited to status, diplomacy, and display.",
        description: "Starting gear for a Rogue Trader career."
      },
      {
        name: "Xeno-pelt Cloak",
        type: "gear",
        shortDescription: "A prestigious cloak cut from alien hide and worn as a mark of daring status.",
        description: "Starting gear for a Rogue Trader career."
      }
    ],
    choices: [
      {
        key: "sidearm",
        label: "Starting Sidearm",
        options: [
          {
            key: "laspistol",
            name: "Best-Craftsmanship Laspistol",
            type: "item",
            item: {
              name: "Laspistol",
              type: "weapon",
              craftsmanship: "best",
              class: "pistol",
              weaponType: "las",
              benefit: "Best-Craftsmanship laspistol.",
              description: "Starting sidearm for the Rogue Trader career."
            }
          },
          {
            key: "hand-cannon",
            name: "Good-Craftsmanship Hand Cannon",
            type: "item",
            item: {
              name: "Hand Cannon",
              type: "weapon",
              craftsmanship: "good",
              class: "pistol",
              weaponType: "sp",
              benefit: "Good-Craftsmanship hand cannon.",
              description: "Starting sidearm for the Rogue Trader career."
            }
          },
          {
            key: "plasma-pistol",
            name: "Common-Craftsmanship Plasma Pistol",
            type: "item",
            item: {
              name: "Plasma Pistol",
              type: "weapon",
              craftsmanship: "common",
              class: "pistol",
              weaponType: "plasma",
              benefit: "Common-Craftsmanship plasma pistol.",
              description: "Starting sidearm for the Rogue Trader career."
            }
          }
        ]
      },
      {
        key: "meleeWeapon",
        label: "Starting Melee Weapon",
        options: [
          {
            key: "mono-sword",
            name: "Best-Craftsmanship Sword (Mono Edge)",
            type: "item",
            item: {
              name: "Sword",
              type: "weapon",
              source: {
                name: "Sword"
              },
              craftsmanship: "best",
              class: "melee",
              weaponType: "primitive",
              special: "Mono upgrade; Primitive quality removed.",
              benefit: "Best-Craftsmanship sword fitted with a mono edge.",
              description: "Starting melee weapon for the Rogue Trader career."
            }
          },
          {
            key: "power-sword",
            name: "Common-Craftsmanship Power Sword",
            type: "item",
            item: {
              name: "Power Sword (Mordian)",
              type: "weapon",
              source: {
                name: "Power Sword (Mordian)"
              },
              craftsmanship: "common",
              class: "melee",
              benefit: "Common-Craftsmanship power sword.",
              description: "Starting melee weapon for the Rogue Trader career."
            }
          }
        ]
      },
      {
        key: "armour",
        label: "Starting Armour",
        options: [
          {
            key: "enforcer-light-carapace",
            name: "Best-Craftsmanship Enforcer Light Carapace",
            type: "item",
            item: {
              name: "Enforcer Light Carapace",
              type: "armor",
              craftsmanship: "best",
              armorType: "carapace",
              benefit: "Best-Craftsmanship enforcer light carapace.",
              description: "Starting armour for the Rogue Trader career."
            }
          },
          {
            key: "storm-trooper-carapace",
            name: "Storm Trooper Carapace",
            type: "item",
            item: {
              name: "Storm Trooper Carapace",
              type: "armor",
              craftsmanship: "common",
              armorType: "carapace",
              benefit: "Storm trooper carapace armour.",
              description: "Starting armour for the Rogue Trader career."
            }
          }
        ]
      }
    ]
  },
  archMilitant: {
    key: "archMilitant",
    label: "Arch-Militant",
    overview: [
      "The 41st Millennium is an age of total war, and from among the countless soldiers, killers, survivors, and hunters rise those for whom battle is not merely endured but mastered. Such warriors are called Arch-militants.",
      "Many are veterans of the Imperial Guard, survivors of death worlds, catastrophes, and campaigns that annihilated everyone around them. Again and again they emerge from slaughter where others fall, reforged into killers without peer.",
      "An Arch-militant is expert in every form of combat, able to sense danger, master almost any weapon, and extricate allies from seemingly hopeless situations through skill, professionalism, and sheer bloody-minded luck."
    ],
    startingSkillsInfo: [
      "Common Lore (War) (Int)",
      "Dodge (Ag)",
      "Intimidate (S)",
      "Scholastic Lore (Tactica Imperialis) (Int)",
      "Secret Tongue (Military) (Int)",
      "Speak Language (Low Gothic) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one ranged package: good-Craftsmanship hellgun, best-Craftsmanship long-las, or two bolt pistols",
      "Gain one good-Craftsmanship knife upgraded with a mono edge",
      "Fixed gear: micro-bead, void suit, enforcer light carapace armour, bolt shell keepsake, medikit, manacles",
      "Choose one extra package: data-slate full of wanted bounties, arms coffer, or 3 doses of stimm"
    ],
    specialAbilityInfo: [
      "Weapon Master: Choose one class of weapon. Gain +10 to hit, +2 damage, and +2 Initiative when using that class in combat.",
      "Choose one Weapon Master category during character creation; the granted talent is applied with its specific class."
    ],
    startingSkills: [
      { skillId: "common-lore/war", trained: true },
      { skillId: "dodge", trained: true },
      { skillId: "intimidate", trained: true },
      { skillId: "scholastic-lore/tactica-imperialis", trained: true },
      { skillId: "secret-tongue/military", trained: true },
      { skillId: "speak-language/low-gothic", trained: true }
    ],
    grantedItems: [
      {
        name: "Basic Weapon Training (Universal)",
        talentId: "basic-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Pistol Weapon Training (Universal)",
        talentId: "pistol-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Melee Weapon Training (Universal)",
        talentId: "melee-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Thrown Weapon Training (Universal)",
        talentId: "thrown-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Sound Constitution",
        talentId: "sound-constitution",
        category: "talent"
      },
      {
        name: "Knife",
        type: "weapon",
        source: {
          name: "Knife"
        },
        craftsmanship: "good",
        class: "melee",
        weaponType: "primitive",
        special: "Mono upgrade; Primitive quality removed.",
        benefit: "Gain one good-Craftsmanship knife fitted with a mono edge.",
        description: "The Arch-Militant begins with a good-Craftsmanship knife modified with a mono edge rather than a generic primitive melee placeholder."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for field coordination.",
        description: "Starting gear for the Arch-Militant career."
      },
      {
        name: "Void Suit",
        type: "gear",
        shortDescription: "Vacuum-rated protective suit for hostile environments and emergency survival.",
        description: "Starting gear for the Arch-Militant career."
      },
      {
        name: "Enforcer Light Carapace Armour",
        type: "armor",
        craftsmanship: "common",
        armorType: "carapace",
        benefit: "Enforcer light carapace armour.",
        description: "Starting armour for the Arch-Militant career."
      },
      {
        name: "Bolt Shell Keepsake",
        type: "gear",
        shortDescription: "A token shell casing or round kept as a reminder of war and survival.",
        description: "Starting gear for the Arch-Militant career."
      },
      {
        name: "Medikit",
        type: "tool",
        shortDescription: "Field medical kit for emergency treatment.",
        description: "Starting gear for the Arch-Militant career."
      },
      {
        name: "Manacles",
        type: "gear",
        shortDescription: "Restraints for taking prisoners, bounties, or dangerous captives alive.",
        description: "Starting gear for the Arch-Militant career."
      }
    ],
    choices: [
      {
        key: "weaponMaster",
        label: "Weapon Master",
        options: [
          {
            key: "basic",
            name: "Weapon Master (Basic)",
            type: "item",
            item: {
              name: "Weapon Master (Basic)",
              type: "talent",
              category: "specialAbility",
              benefit: "Gain +10 to hit, +2 damage, and +2 Initiative with Basic weapons.",
              description: "The Arch-Militant has mastered Basic weapons. He gains +10 to hit, +2 damage, and +2 Initiative when using Basic weapons in combat."
            }
          },
          {
            key: "melee",
            name: "Weapon Master (Melee)",
            type: "item",
            item: {
              name: "Weapon Master (Melee)",
              type: "talent",
              category: "specialAbility",
              benefit: "Gain +10 to hit, +2 damage, and +2 Initiative with Melee weapons.",
              description: "The Arch-Militant has mastered Melee weapons. He gains +10 to hit, +2 damage, and +2 Initiative when using Melee weapons in combat."
            }
          },
          {
            key: "pistol",
            name: "Weapon Master (Pistol)",
            type: "item",
            item: {
              name: "Weapon Master (Pistol)",
              type: "talent",
              category: "specialAbility",
              benefit: "Gain +10 to hit, +2 damage, and +2 Initiative with Pistol weapons.",
              description: "The Arch-Militant has mastered Pistol weapons. He gains +10 to hit, +2 damage, and +2 Initiative when using Pistol weapons in combat."
            }
          },
          {
            key: "thrown",
            name: "Weapon Master (Thrown)",
            type: "item",
            item: {
              name: "Weapon Master (Thrown)",
              type: "talent",
              category: "specialAbility",
              benefit: "Gain +10 to hit, +2 damage, and +2 Initiative with Thrown weapons.",
              description: "The Arch-Militant has mastered Thrown weapons. He gains +10 to hit, +2 damage, and +2 Initiative when using Thrown weapons in combat."
            }
          },
          {
            key: "heavy",
            name: "Weapon Master (Heavy)",
            type: "item",
            item: {
              name: "Weapon Master (Heavy)",
              type: "talent",
              category: "specialAbility",
              benefit: "Gain +10 to hit, +2 damage, and +2 Initiative with Heavy weapons.",
              description: "The Arch-Militant has mastered Heavy weapons. He gains +10 to hit, +2 damage, and +2 Initiative when using Heavy weapons in combat."
            }
          }
        ]
      },
      {
        key: "rangedPackage",
        label: "Starting Ranged Package",
        options: [
          {
            key: "hellgun",
            name: "Good-Craftsmanship Hellgun",
            type: "item",
            item: {
              name: "Hellgun",
              type: "weapon",
              craftsmanship: "good",
              class: "basic",
              weaponType: "las",
              benefit: "Good-Craftsmanship hellgun.",
              description: "Starting ranged weapon for the Arch-Militant career."
            }
          },
          {
            key: "long-las",
            name: "Best-Craftsmanship Long-las",
            type: "item",
            item: {
              name: "Long-las",
              type: "weapon",
              craftsmanship: "best",
              class: "basic",
              weaponType: "las",
              benefit: "Best-Craftsmanship long-las.",
              description: "Starting ranged weapon for the Arch-Militant career."
            }
          },
          {
            key: "two-bolt-pistols",
            name: "Two Bolt Pistols",
            type: "composite",
            items: [
              {
                name: "Bolt Pistol",
                type: "weapon",
                allowDuplicates: true,
                craftsmanship: "common",
                class: "pistol",
                weaponType: "bolt",
                benefit: "One bolt pistol from the Arch-Militant's matched pair.",
                description: "Starting ranged package for the Arch-Militant career."
              },
              {
                name: "Bolt Pistol",
                type: "weapon",
                allowDuplicates: true,
                craftsmanship: "common",
                class: "pistol",
                weaponType: "bolt",
                benefit: "One bolt pistol from the Arch-Militant's matched pair.",
                description: "Starting ranged package for the Arch-Militant career."
              }
            ]
          }
        ]
      },
      {
        key: "extraPackage",
        label: "Extra Equipment Package",
        options: [
          {
            key: "wanted-bounties",
            name: "Data-slate Full of Wanted Bounties",
            type: "item",
            item: {
              name: "Data-slate Full of Wanted Bounties",
              type: "gear",
              craftsmanship: "common",
              benefit: "A data-slate loaded with bounty leads and target records.",
              description: "Optional starting gear for the Arch-Militant career."
            }
          },
          {
            key: "arms-coffer",
            name: "Arms Coffer",
            type: "item",
            item: {
              name: "Arms Coffer",
              type: "gear",
              craftsmanship: "common",
              benefit: "A secure coffer for ammunition, arms, and specialist wargear.",
              description: "Optional starting gear for the Arch-Militant career."
            }
          },
          {
            key: "stimm",
            name: "3 Doses of Stimm",
            type: "item",
            item: {
              name: "Stimm (3 doses)",
              type: "consumable",
              craftsmanship: "common",
              benefit: "Three doses of stimm.",
              description: "Optional starting gear for the Arch-Militant career."
            }
          }
        ]
      }
    ]
  },
  astropathTranscendent: {
    key: "astropathTranscendent",
    label: "Astropath Transcendent",
    overview: [
      "The Astropath Transcendent is a rare individual: a psyker soul-bound to the Emperor, able to cast thought across the gulfs of space while bearing the scars and sanctity of the ritual that remade him.",
      "Created through the terrible Rite of Soul Binding and trained in the Adeptus Astra Telepathica, such individuals become the living communications network of the Imperium, singing thoughts across interstellar distances.",
      "Those who endure life on the fringes of known space become respected and feared specialists, valued by Rogue Traders as indispensable members of the inner circle and often the only lifeline between scattered ships and distant worlds."
    ],
    startingSkillsInfo: [
      "Awareness (Per)",
      "Common Lore (Adeptus Astra Telepathica) (Int)",
      "Forbidden Lore (Psykers) (Int)",
      "Invocation (WP)",
      "Psyniscience (Per)",
      "Scholastic Lore (Cryptology) (Int)",
      "Speak Language (High Gothic) (Int)",
      "Speak Language (Low Gothic) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one sidearm: best-Craftsmanship laspistol or best-Craftsmanship stub automatic",
      "Choose one melee weapon: best-Craftsmanship mono-sword or common-Craftsmanship shock staff",
      "Fixed gear: guard flak armour, charm, void suit, micro-bead, psy-focus"
    ],
    specialAbilityInfo: [
      "Soul-Bound to the Emperor: Gain +20 Willpower when resisting Possession, in opposed Willpower tests against daemons, and against daemonic talents, powers, or effects. Roll an extra d10 on Perils of the Warp and discard one die for a more favourable result.",
      "Psychic Powers: Begin with access to the Telepathic Discipline, Astral Telepathy, and two additional Telepathic techniques. Begin with Psy Rating 2.",
      "See Without Eyes: Functionally perceive as if sighted, ignore effects that target vision, but cannot perceive Untouchables.",
      "Current implementation records these special abilities, Astral Telepathy, and Telepathic technique placeholders on the actor."
    ],
    startingSkills: [
      { skillId: "awareness", trained: true },
      { skillId: "common-lore/adeptus-astra-telepathica", trained: true },
      { skillId: "forbidden-lore/psykers", trained: true },
      { skillId: "invocation", trained: true },
      { skillId: "psyniscience", trained: true },
      { skillId: "scholastic-lore/cryptology", trained: true },
      { skillId: "speak-language/high-gothic", trained: true },
      { skillId: "speak-language/low-gothic", trained: true }
    ],
    grantedItems: [
      {
        name: "Pistol Weapon Training (Universal)",
        talentId: "pistol-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Heightened Senses (Sound)",
        talentId: "heightened-senses/sound",
        category: "talent"
      },
      {
        name: "Psy Rating 2",
        type: "talent",
        category: "talent",
        benefit: "You begin with Psy Rating 2.",
        description: "The Explorer is a psyker, and his power in game terms is rated on a scale of 1 to 10. Increasing a character's Psy Rating represents unlocking more of his psychic potential and becoming more powerful. This character begins play with Psy Rating 2."
      },
      {
        name: "Soul-Bound to the Emperor",
        type: "talent",
        category: "specialAbility",
        benefit: "+20 Willpower against Possession and daemonic effects; extra Perils die and discard one.",
        description: "An Astropath Transcendent is soul-bound to the Emperor during a complex ritual on Terra. He gains +20 to his Willpower when resisting Possession, in any opposed Willpower Test against a daemon, or whenever making a Willpower Test to resist any Talent, Psychic Power, special ability, or other effect originating from a daemon. An Astropath Transcendent rolls an additional d10 when rolling on the Perils of the Warp table and may discard any one d10 for a more favourable result."
      },
      {
        name: "See Without Eyes",
        type: "talent",
        category: "specialAbility",
        benefit: "Functionally see normally without physical sight; ignore vision-targeting effects, but cannot perceive Untouchables.",
        description: "An Astropath Transcendent is blind yet at the same time has a strange ability to perceive without using his physical senses. He is functionally treated as if he can see normally, including colours and being limited by walls. However, he is not affected by effects that target vision, such as blind grenades and cameleoline. He is completely incapable of seeing Untouchables."
      },
      {
        name: "Astral Telepathy",
        type: "talent",
        category: "specialAbility",
        benefit: "Begin play with the Astral Telepathy technique.",
        description: "An Astropath Transcendent begins play with access to techniques from the Telepathic Discipline and begins with the technique Astral Telepathy."
      },
      {
        name: "Telepathic Technique Choice 1",
        type: "talent",
        category: "specialAbility",
        benefit: "Choose one additional Telepathic Discipline technique.",
        description: "Astropath Transcendent characters may select two additional techniques from the Telepathic Discipline. Record the first selected technique here."
      },
      {
        name: "Telepathic Technique Choice 2",
        type: "talent",
        category: "specialAbility",
        benefit: "Choose one additional Telepathic Discipline technique.",
        description: "Astropath Transcendent characters may select two additional techniques from the Telepathic Discipline. Record the second selected technique here."
      },
      {
        name: "Guard Flak Armour",
        type: "armor",
        craftsmanship: "common",
        armorType: "flak",
        benefit: "Guard flak armour.",
        description: "Starting armour for the Astropath Transcendent career."
      },
      {
        name: "Charm",
        type: "gear",
        shortDescription: "A ward, token, or devotional charm carried for protection and focus.",
        description: "Starting gear for the Astropath Transcendent career."
      },
      {
        name: "Void Suit",
        type: "gear",
        shortDescription: "Vacuum-rated protective suit for hostile environments and emergency survival.",
        description: "Starting gear for the Astropath Transcendent career."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for fleet or field coordination.",
        description: "Starting gear for the Astropath Transcendent career."
      },
      {
        name: "Psy-focus",
        type: "gear",
        shortDescription: "A focus for psychic concentration, ritual use, and disciplined invocation.",
        description: "Starting gear for the Astropath Transcendent career."
      }
    ],
    choices: [
      {
        key: "sidearm",
        label: "Starting Sidearm",
        options: [
          {
            key: "laspistol",
            name: "Best-Craftsmanship Laspistol",
            type: "item",
            item: {
              name: "Laspistol",
              type: "weapon",
              craftsmanship: "best",
              class: "pistol",
              weaponType: "las",
              benefit: "Best-Craftsmanship laspistol.",
              description: "Starting sidearm for the Astropath Transcendent career."
            }
          },
          {
            key: "stub-automatic",
            name: "Best-Craftsmanship Stub Automatic",
            type: "item",
            item: {
              name: "Stub Automatic",
              type: "weapon",
              craftsmanship: "best",
              class: "pistol",
              weaponType: "sp",
              benefit: "Best-Craftsmanship stub automatic.",
              description: "Starting sidearm for the Astropath Transcendent career."
            }
          }
        ]
      },
      {
        key: "meleeWeapon",
        label: "Starting Melee Weapon",
        options: [
          {
            key: "mono-sword",
            name: "Best-Craftsmanship Mono-sword",
            type: "item",
            item: {
              name: "Mono-sword",
              type: "weapon",
              craftsmanship: "best",
              class: "melee",
              weaponType: "primitive",
              benefit: "Best-Craftsmanship mono-sword.",
              description: "Starting melee weapon for the Astropath Transcendent career."
            }
          },
          {
            key: "shock-staff",
            name: "Common-Craftsmanship Shock Staff",
            type: "item",
            item: {
              name: "Shock Staff",
              type: "weapon",
              source: {
                name: "Shock Staff"
              },
              craftsmanship: "common",
              class: "melee",
              weaponType: "shock",
              benefit: "Common-Craftsmanship shock staff.",
              description: "Starting melee weapon for the Astropath Transcendent career."
            }
          }
        ]
      }
    ]
  },
  explorator: {
    key: "explorator",
    label: "Explorator",
    overview: [
      "Part adventurer, part warrior, and part emissary of the Machine Cult of Mars, the Explorator is a Tech-priest sent into the unknown to unearth knowledge, secrets, and relics for the glory of the Omnissiah.",
      "Explorators range far beyond Forge Worlds, serving aboard Mechanicus stations, exploration ships, and Rogue Trader vessels in pursuit of archeotech, lost data, unknown phenomena, and the buried achievements of mankind's Dark Age of Technology.",
      "Though valued for their arcane expertise, they stand on the front line of perils few can comprehend, risking corruption, madness, and heresy in the endless Quest for Knowledge."
    ],
    startingSkillsInfo: [
      "Common Lore (Machine Cult) (Int)",
      "Common Lore (Tech) (Int)",
      "Forbidden Lore (Archeotech) (Int)",
      "Forbidden Lore (Adeptus Mechanicus) (Int)",
      "Literacy (Int)",
      "Logic (Int)",
      "Speak Language (Explorator Binary) (Int)",
      "Speak Language (Low Gothic) (Int)",
      "Speak Language (Techna-lingua) (Int)",
      "Tech-Use (Int)",
      "Trade (Technomat) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one ranged weapon: boltgun, best-Craftsmanship lasgun, or good-Craftsmanship hellgun",
      "Choose one melee weapon: best-Craftsmanship shock staff or good-Craftsmanship power axe",
      "Fixed gear: enforcer light carapace, multikey, void suit, injector, sacred unguents, micro-bead, combi-tool, data-slate",
      "Also begins play owning and controlling one servo-skull familiar"
    ],
    specialAbilityInfo: [
      "Explorator Implants: Begin with the Mechanicus Implants Trait and may select up to two additional common-Craftsmanship bionic implants at character creation.",
      "An Explorator may spend 200 xp per step to improve one chosen implant's Craftsmanship by one level, up to best, during character creation.",
      "Current implementation records the extra implant choices as placeholders on the actor."
    ],
    startingSkills: [
      { skillId: "common-lore/machine-cult", trained: true },
      { skillId: "common-lore/tech", trained: true },
      { skillId: "forbidden-lore/archeotech", trained: true },
      { skillId: "forbidden-lore/adeptus-mechanicus", trained: true },
      { skillId: "literacy", trained: true },
      { skillId: "logic", trained: true },
      { skillId: "speak-language/explorator-binary", trained: true },
      { skillId: "speak-language/low-gothic", trained: true },
      { skillId: "speak-language/techna-lingua", trained: true },
      { skillId: "tech-use", trained: true },
      { skillId: "trade/technomat", trained: true }
    ],
    grantedItems: [
      {
        name: "Mechanicus Implants",
        type: "talent",
        category: "trait",
        benefit: "You possess the sacred augmetics and interfaces of the Cult Mechanicus.",
        description: "Starting Trait: Mechanicus Implants. The character is an ordained adept of the Machine Cult and bears the augmetic systems, electro-grafts, and sacred interfaces expected of the priesthood of Mars."
      },
      {
        name: "Explorator Implants",
        type: "talent",
        category: "specialAbility",
        benefit: "Choose up to two common-Craftsmanship bionic implants and optionally improve one with xp during character creation.",
        description: "The Explorator begins play with the Mechanicus Implants Trait and may select up to two additional common-Craftsmanship bionic implants. He may spend 200 xp to increase the Craftsmanship of one of his bionic implants by one level during character creation, up to best-Craftsmanship."
      },
      {
        name: "Additional Bionic Implant (Choice 1)",
        type: "cybernetic",
        craftsmanship: "common",
        shortDescription: "Record the first additional common-Craftsmanship bionic implant chosen at character creation.",
        description: "Explorator special ability placeholder for the first additional bionic implant."
      },
      {
        name: "Additional Bionic Implant (Choice 2)",
        type: "cybernetic",
        craftsmanship: "common",
        shortDescription: "Record the second additional common-Craftsmanship bionic implant chosen at character creation.",
        description: "Explorator special ability placeholder for the second additional bionic implant."
      },
      {
        name: "Basic Weapon Training (Universal)",
        talentId: "basic-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Melee Weapon Training (Universal)",
        talentId: "melee-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Logis Implant",
        talentId: "logis-implant",
        category: "talent"
      },
      {
        name: "Enforcer Light Carapace Armour",
        type: "armor",
        craftsmanship: "common",
        armorType: "carapace",
        benefit: "Enforcer light carapace armour.",
        description: "Starting armour for the Explorator career."
      },
      {
        name: "Multikey",
        type: "tool",
        shortDescription: "A sacred keying tool for bypassing and interfacing with locks and machine systems.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Void Suit",
        type: "gear",
        shortDescription: "Vacuum-rated protective suit for hostile environments and emergency survival.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Injector",
        type: "tool",
        shortDescription: "A Mechanicus field injector for precise delivery of chemicals, treatments, or sacred compounds.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Sacred Unguents",
        type: "gear",
        shortDescription: "Blessed oils and maintenance compounds for rites of appeasement and repair.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for fleet or field coordination.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Combi-tool",
        type: "tool",
        shortDescription: "Compact multi-purpose Mechanicus tool for technical rites and field repairs.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Data-slate",
        type: "gear",
        shortDescription: "Portable data slate for records, schematics, and recovered lore.",
        description: "Starting gear for the Explorator career."
      },
      {
        name: "Servo-skull Familiar",
        type: "gear",
        shortDescription: "A servo-skull familiar under the Explorator's ownership and control.",
        description: "The Explorator begins play owning and controlling one servo-skull familiar."
      }
    ],
    choices: [
      {
        key: "rangedWeapon",
        label: "Starting Ranged Weapon",
        options: [
          {
            key: "boltgun",
            name: "Boltgun",
            type: "item",
            item: {
              name: "Boltgun",
              type: "weapon",
              craftsmanship: "common",
              class: "basic",
              weaponType: "bolt",
              benefit: "Boltgun.",
              description: "Starting ranged weapon for the Explorator career."
            }
          },
          {
            key: "lasgun",
            name: "Best-Craftsmanship Lasgun",
            type: "item",
            item: {
              name: "Lasgun",
              type: "weapon",
              craftsmanship: "best",
              class: "basic",
              weaponType: "las",
              benefit: "Best-Craftsmanship lasgun.",
              description: "Starting ranged weapon for the Explorator career."
            }
          },
          {
            key: "hellgun",
            name: "Good-Craftsmanship Hellgun",
            type: "item",
            item: {
              name: "Hellgun",
              type: "weapon",
              craftsmanship: "good",
              class: "basic",
              weaponType: "las",
              benefit: "Good-Craftsmanship hellgun.",
              description: "Starting ranged weapon for the Explorator career."
            }
          }
        ]
      },
      {
        key: "meleeWeapon",
        label: "Starting Melee Weapon",
        options: [
          {
            key: "shock-staff",
            name: "Best-Craftsmanship Shock Staff",
            type: "item",
            item: {
              name: "Shock Staff",
              type: "weapon",
              source: {
                name: "Shock Staff"
              },
              craftsmanship: "best",
              class: "melee",
              weaponType: "shock",
              benefit: "Best-Craftsmanship shock staff.",
              description: "Starting melee weapon for the Explorator career."
            }
          },
          {
            key: "power-axe",
            name: "Good-Craftsmanship Power Axe",
            type: "item",
            item: {
              name: "Power Axe",
              type: "weapon",
              source: {
                name: "Power Axe"
              },
              craftsmanship: "good",
              class: "melee",
              weaponType: "power",
              benefit: "Good-Craftsmanship power axe.",
              description: "Starting melee weapon for the Explorator career."
            }
          }
        ]
      }
    ]
  },
  missionary: {
    key: "missionary",
    label: "Missionary",
    overview: [
      "The Missionary is a walking temple of the Ecclesiarchy, part holy warrior, part politician, and when needed judge, jury, and executioner, sent to carry the Imperial Truth beyond the Imperium's borders.",
      "Serving alongside Rogue Traders, Missionaries seek out lost human worlds and bend their faiths toward the Imperial Creed through rhetoric, cunning, force, or grim judgment when corruption and false worship run too deep.",
      "They are valued not only as converters of the lost but as spiritual figureheads, confessors, and steadfast counsellors who steel souls against the horrors that lurk beyond the Emperor's light."
    ],
    startingSkillsInfo: [
      "Common Lore (Imperial Creed) (Int)",
      "Common Lore (Imperium) (Int)",
      "Forbidden Lore (Heresy) (Int)",
      "Medicae (Int)",
      "Scholastic Lore (Imperial Creed) (Int)",
      "Speak Language (High Gothic) (Int)",
      "Speak Language (Low Gothic) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one melee weapon: good-Craftsmanship chainsword or best-Craftsmanship staff",
      "Choose one ranged weapon: good-Craftsmanship flamer or best-Craftsmanship lasgun",
      "Fixed gear: best-Craftsmanship guard flak armour, Ecclesiarchal robes, aquila pendant, sepulchre, censer and incense, micro-bead"
    ],
    specialAbilityInfo: [
      "Pure Faith: The Missionary begins play with the Pure Faith Talent.",
      "Current implementation applies and records Pure Faith as part of the career package."
    ],
    startingSkills: [
      { skillId: "common-lore/imperial-creed", trained: true },
      { skillId: "common-lore/imperium", trained: true },
      { skillId: "forbidden-lore/heresy", trained: true },
      { skillId: "medicae", trained: true },
      { skillId: "scholastic-lore/imperial-creed", trained: true },
      { skillId: "speak-language/high-gothic", trained: true },
      { skillId: "speak-language/low-gothic", trained: true }
    ],
    grantedItems: [
      {
        name: "Basic Weapon Training (Universal)",
        talentId: "basic-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Melee Weapon Training (Universal)",
        talentId: "melee-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Pure Faith",
        talentId: "pure-faith",
        category: "talent"
      },
      {
        name: "Unshakeable Faith",
        talentId: "unshakeable-faith",
        category: "talent"
      },
      {
        name: "Guard Flak Armour",
        type: "armor",
        craftsmanship: "best",
        armorType: "flak",
        benefit: "Best-Craftsmanship guard flak armour.",
        description: "Starting armour for the Missionary career."
      },
      {
        name: "Ecclesiarchal Robes",
        type: "gear",
        shortDescription: "Robes and vestments marking the bearer as a servant of the Ministorum.",
        description: "Starting gear for the Missionary career."
      },
      {
        name: "Aquila Pendant",
        type: "gear",
        shortDescription: "A devotional symbol of the God-Emperor worn as badge and blessing.",
        description: "Starting gear for the Missionary career."
      },
      {
        name: "Sepulchre",
        type: "gear",
        shortDescription: "A reliquary or devotional container used in rites of remembrance and sanctity.",
        description: "Starting gear for the Missionary career."
      },
      {
        name: "Censer and Incense",
        type: "gear",
        shortDescription: "Sacred incense and censer for liturgy, blessing, and holy presence.",
        description: "Starting gear for the Missionary career."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for fleet or field coordination.",
        description: "Starting gear for the Missionary career."
      }
    ],
    choices: [
      {
        key: "meleeWeapon",
        label: "Starting Melee Weapon",
        options: [
          {
            key: "chainsword",
            name: "Good-Craftsmanship Chainsword",
            type: "item",
            item: {
              name: "Chainsword",
              type: "weapon",
              source: {
                name: "Chainsword"
              },
              craftsmanship: "good",
              class: "melee",
              weaponType: "chain",
              benefit: "Good-Craftsmanship chainsword.",
              description: "Starting melee weapon for the Missionary career."
            }
          },
          {
            key: "staff",
            name: "Best-Craftsmanship Staff",
            type: "item",
            item: {
              name: "Staff",
              type: "weapon",
              craftsmanship: "best",
              class: "melee",
              weaponType: "primitive",
              benefit: "Best-Craftsmanship staff.",
              description: "Starting melee weapon for the Missionary career."
            }
          }
        ]
      },
      {
        key: "rangedWeapon",
        label: "Starting Ranged Weapon",
        options: [
          {
            key: "flamer",
            name: "Good-Craftsmanship Flamer",
            type: "item",
            item: {
              name: "Flamer",
              type: "weapon",
              craftsmanship: "good",
              class: "basic",
              weaponType: "flame",
              benefit: "Good-Craftsmanship flamer.",
              description: "Starting ranged weapon for the Missionary career."
            }
          },
          {
            key: "lasgun",
            name: "Best-Craftsmanship Lasgun",
            type: "item",
            item: {
              name: "Lasgun",
              type: "weapon",
              craftsmanship: "best",
              class: "basic",
              weaponType: "las",
              benefit: "Best-Craftsmanship lasgun.",
              description: "Starting ranged weapon for the Missionary career."
            }
          }
        ]
      }
    ]
  },
  navigator: {
    key: "navigator",
    label: "Navigator",
    overview: [
      "Without the Navigator gene and the ancient bloodlines that bear it, the Imperium could not meaningfully span the stars. Navigators alone can guide vessels safely across the vast gulfs of the warp at interstellar scale.",
      "Each Navigator is a scion of the Navis Nobilite, gifted and burdened by the Warp Eye that lets him pierce the veil between the Materium and the Immaterium and steer by the light of the Astronomican.",
      "Some revel in the luxury and peril of their station, others serve through debt, disgrace, or bloodline politics, but every Rogue Trader knows that to lose a Navigator beyond the fringes is to invite disaster."
    ],
    startingSkillsInfo: [
      "Common Lore (Navis Nobilite) (Int)",
      "Forbidden Lore (Navigators) (Int)",
      "Forbidden Lore (Warp) (Int)",
      "Literacy (Int)",
      "Navigation (Stellar) (Int)",
      "Navigation (Warp) (Int)",
      "Psyniscience (Per)",
      "Scholastic Lore (Astromancy) (Int)",
      "Speak Language (High Gothic) (Int)",
      "Speak Language (Low Gothic) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one sidearm: best-Craftsmanship hellpistol or good-Craftsmanship hand cannon",
      "Fixed gear: best-Craftsmanship navigator staff, best-Craftsmanship xeno-mesh armour, Emperor's tarot deck, silk headscarf, Nobilite robes, charm, micro-bead"
    ],
    specialAbilityInfo: [
      "Warp Eye: Begin with the Lidless Stare Navigator power and either select one additional power or improve an existing power.",
      "The Boons of Lineage: A Navigator hails from a Nomadic, Magisterial, Shrouded, or Renegade House lineage, each with distinct advantages and quirks.",
      "Navigator Mutations: The Navigator begins play with Navigator Mutations determined by the nature of his lineage.",
      "Current implementation records the Warp Eye and lineage placeholders on the actor."
    ],
    startingSkills: [
      { skillId: "common-lore/navis-nobilite", trained: true },
      { skillId: "forbidden-lore/navigators", trained: true },
      { skillId: "forbidden-lore/the-warp", trained: true },
      { skillId: "literacy", trained: true },
      { skillId: "navigation/stellar", trained: true },
      { skillId: "navigation/warp", trained: true },
      { skillId: "psyniscience", trained: true },
      { skillId: "scholastic-lore/astromancy", trained: true },
      { skillId: "speak-language/high-gothic", trained: true },
      { skillId: "speak-language/low-gothic", trained: true }
    ],
    grantedItems: [
      {
        name: "Navigator",
        talentId: "navigator",
        category: "talent",
        rating: "1"
      },
      {
        name: "Warp Eye",
        type: "talent",
        category: "specialAbility",
        benefit: "Begin with Lidless Stare and one additional Navigator Power choice or improvement.",
        description: "All Navigators begin with the Lidless Stare Navigator power and may either select one additional power or improve an existing power. As the Navigator develops, he may select more powers or improve existing powers by selecting the Navigator Power advance."
      },
      {
        name: "The Lidless Stare",
        type: "navigatorPower",
        source: {
          pack: "roguetrader.character-creation-options",
          name: "The Lidless Stare",
          type: "navigatorPower"
        }
      },
      {
        name: "Navigator Power Choice",
        type: "talent",
        category: "specialAbility",
        benefit: "Select one additional Navigator power or improve an existing power.",
        description: "At character creation, the Navigator may either select one additional power or improve an existing power."
      },
      {
        name: "Pistol Weapon Training (Universal)",
        talentId: "pistol-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Navigator Staff",
        type: "weapon",
        craftsmanship: "best",
        class: "melee",
        weaponType: "primitive",
        benefit: "Best-Craftsmanship navigator staff.",
        description: "Starting melee implement for the Navigator career."
      },
      {
        name: "Xeno-mesh Armour",
        type: "armor",
        craftsmanship: "best",
        armorType: "mesh",
        benefit: "Best-Craftsmanship xeno-mesh armour.",
        description: "Starting armour for the Navigator career."
      },
      {
        name: "Emperor's Tarot Deck",
        type: "gear",
        shortDescription: "A deck of the Emperor's Tarot used for contemplation, portents, and ritual focus.",
        description: "Starting gear for the Navigator career."
      },
      {
        name: "Silk Headscarf",
        type: "gear",
        shortDescription: "A fine silk headscarf suited to rank, ritual, or shielding the gaze.",
        description: "Starting gear for the Navigator career."
      },
      {
        name: "Nobilite Robes",
        type: "gear",
        shortDescription: "Robes of the Navis Nobilite displaying lineage, status, and tradition.",
        description: "Starting gear for the Navigator career."
      },
      {
        name: "Charm",
        type: "gear",
        shortDescription: "A ward or token carried for luck, ritual meaning, or personal protection.",
        description: "Starting gear for the Navigator career."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for fleet or field coordination.",
        description: "Starting gear for the Navigator career."
      }
    ],
    choices: [
      {
        key: "sidearm",
        label: "Starting Sidearm",
        options: [
          {
            key: "hellpistol",
            name: "Best-Craftsmanship Hellpistol",
            type: "item",
            item: {
              name: "Hellpistol",
              type: "weapon",
              craftsmanship: "best",
              class: "pistol",
              weaponType: "las",
              benefit: "Best-Craftsmanship hellpistol.",
              description: "Starting sidearm for the Navigator career."
            }
          },
          {
            key: "hand-cannon",
            name: "Good-Craftsmanship Hand Cannon",
            type: "item",
            item: {
              name: "Hand Cannon",
              type: "weapon",
              craftsmanship: "good",
              class: "pistol",
              weaponType: "sp",
              benefit: "Good-Craftsmanship hand cannon.",
              description: "Starting sidearm for the Navigator career."
            }
          }
        ]
      },
      {
        key: "lineage",
        label: "House Lineage",
        options: [
          {
              key: "nomadic-house",
              name: "Nomadic House",
              type: "composite",
              lore: [
                "Nomadic Houses have abandoned fixed worlds and instead preserve their bloodlines aboard wandering fleets, raising Navigators who are born between the stars and shaped by constant exposure to both the void and the warp.",
                "Their long familiarity with the hidden routes of realspace and Immaterium grants them unusual poise in navigation, but also leaves them aloof and uncomfortable among planetary societies."
              ],
              items: [
                {
                  name: "Navigator Lineage: Nomadic House",
                  type: "talent",
                  category: "specialAbility",
                  benefit: "You hail from a Nomadic House of the Navis Nobilite.",
                  description: "Great Nomadic Houses relinquish terrestrial holdings and preserve their bloodlines upon vast wandering fleets. Their Navigators are raised between the stars and possess an instinctive feel for the void and the warp."
                },
                {
                  name: "Talented (Navigation (Warp))",
                  type: "talent",
                  category: "talent",
                  benefit: "Gain +10 to tests with Navigation (Warp).",
                  description: "Lore of the Wanderer: generations of travel through distant and uncharted stars have given you an ingrained affinity for warp passage."
                },
                {
                  name: "A Taste for the Warp",
                  type: "talent",
                  category: "specialAbility",
                  benefit: "Spend a Fate Point to automatically succeed when using a Navigator power; if Degrees of Success matter, succeed by 1d5 Degrees of Success, with 5 counting as 0.",
                  description: "Living in constant contact with the veil between realspace and the warp, you can read it like few others. By spending a Fate Point, you automatically succeed when using a Navigator power. If Degrees of Success are relevant, roll 1d5 Degrees of Success, with 5 counting as 0 Degrees of Success."
                },
                {
                  name: "Scorn of Dirt Dwellers",
                  type: "talent",
                  category: "trait",
                  benefit: "While on a planetary body, suffer -10 to Fellowship tests and Fellowship-based skills when dealing with locals.",
                  description: "Those who have roamed the void for so long are uncomfortable in the cultures of dirt dwellers and usually cannot wait to return to space."
                }
              ],
              effects: [
                {
                  type: "referenceTableRoll",
                  name: "Initial Navigator Mutation",
                  tableKey: "navigatorMutations",
                  tableLabel: "Navigator Mutations",
                  formula: "1d100",
                  category: "trait"
                }
              ],
              benefit: "Gain Talented (Navigation (Warp)), A Taste for the Warp, Scorn of Dirt Dwellers, and one rolled Navigator Mutation."
            },
          {
            key: "magisterial-house",
            name: "Magisterial House",
            type: "composite",
            lore: [
              "Magisterial Houses are the oldest and greatest of the Navigator bloodlines, maintaining mighty palaces on Terra and ancient traditions that have preserved their strength and purity for millennia.",
              "Their scions are masters of the traditional Navigator arts, more disciplined in the use of the warp eye and better able to resist the mutations that afflict lesser lines."
            ],
            items: [
              {
                name: "Navigator Lineage: Magisterial House",
                type: "talent",
                category: "specialAbility",
                benefit: "You hail from a Magisterial House of the Navis Nobilite.",
                description: "The most powerful and ancient Navigator dynasties guard their bloodlines fiercely. To be of a Magisterial House is to stand secure in the purity of your lineage and the immense prestige of your name."
              },
              {
                name: "Warp Focus",
                type: "talent",
                category: "specialAbility",
                benefit: "Once per game session, force one opponent who successfully resists The Lidless Stare to re-roll that successful test.",
                description: "The warp eye is the core of a Navigator's power. Once per game session, you may force a single opponent to re-roll a successful test made to resist the effects of The Lidless Stare Navigator Power."
              },
              {
                name: "Pure Genes",
                type: "talent",
                category: "trait",
                benefit: "Whenever you must test for mutation, the test is Routine (+20) rather than Ordinary (+10).",
                description: "The Navigators of a Magisterial House are less likely to suffer mutation thanks to the purity and careful preservation of their bloodline."
              },
              {
                name: "Exalted Lineage",
                type: "talent",
                category: "trait",
                benefit: "Gain +10 to Interaction Skill Tests when dealing with members of the Imperial nobility.",
                description: "The blood of the most ancient and powerful navigator houses carries immense prestige among the nobility of the Imperium."
              }
            ],
            benefit: "Gain Warp Focus, Pure Genes, Exalted Lineage, and choose one initial Navigator Mutation from the Magisterial list."
          },
          {
            key: "shrouded-house",
            name: "Shrouded House",
            type: "composite",
            lore: [
              "Shrouded Houses are fallen Navigator lines, diminished by loss, scandal, or exile and forced to rebuild their fortunes upon the margins of the Imperium.",
              "Their scions are shrewd, opportunistic, and self-reliant, sharpening their talents through hardship in ways many more comfortable houses never learn."
            ],
            updates: {
              "system.acquisitions.profitFactor": -1
            },
            items: [
              {
                name: "Navigator Lineage: Shrouded House",
                type: "talent",
                category: "specialAbility",
                benefit: "You hail from a Shrouded House of the Navis Nobilite.",
                description: "Shrouded Houses cling to the fringes of former greatness, building power through cunning, opportunism, and a fierce desire to reclaim lost status."
              },
              {
                name: "Destitute",
                type: "talent",
                category: "trait",
                benefit: "Your presence reduces the group's starting Profit Factor by 1.",
                description: "The fortunes of your House are so low that you bring little with you and are initially a drain on the resources of your fellows."
              },
              {
                name: "Mercantile Opportunists",
                type: "talent",
                category: "trait",
                benefit: "Gain +10 to tests with Barter, Charm, and Carouse.",
                description: "Raised in a volatile atmosphere where profit and advancement outweighed all other concerns, you learned the hard arts of bargaining, opportunism, and social leverage."
              },
              {
                name: "Gaze into the Abyss",
                type: "navigatorPower",
                source: {
                  pack: "roguetrader.character-creation-options",
                  name: "Gaze into the Abyss",
                  type: "navigatorPower"
                }
              },
              {
                name: "A Gaze to Pierce the Soul",
                type: "talent",
                category: "specialAbility",
                benefit: "Begin play with Gaze into the Abyss. You may raise it above Master to Paragon, gaining a +30 bonus to all tests with this power.",
                description: "A Shrouded House Navigator has a keen understanding of how others relate to the warp. Begin play with Gaze into the Abyss as a bonus power, and you may improve it from Master to Paragon for the usual cost to reach Master."
              }
            ],
            effects: [
              {
                type: "referenceTableRoll",
                name: "Initial Navigator Mutation",
                tableKey: "navigatorMutations",
                tableLabel: "Navigator Mutations",
                formula: "1d100",
                category: "trait"
              }
            ],
            benefit: "Reduce starting Profit Factor by 1, gain Gaze into the Abyss, gain Mercantile Opportunists, and roll one initial Navigator Mutation."
          },
          {
            key: "renegade-house",
            name: "Renegade House",
            type: "composite",
            lore: [
              "Renegade Houses have forsaken ancient Navigator tradition, either by ambition or exile, and have tampered recklessly with their own bloodlines in pursuit of power.",
              "Their scions often manifest unstable genius and terrible corruption in equal measure, drawing the eye of the Inquisition even as they cultivate strange new gifts."
            ],
            items: [
              {
                name: "Navigator Lineage: Renegade House",
                type: "talent",
                category: "specialAbility",
                benefit: "You hail from a Renegade House of the Navis Nobilite.",
                description: "Your House has cast aside the sacred strictures of the Navigator clans, embracing dangerous experimentation and the promise of limitless potential in defiance of tradition."
              },
              {
                name: "The Fruits of Corrupted Blood",
                type: "talent",
                category: "specialAbility",
                benefit: "Begin play with an additional Navigator Power. Choose three Navigator Powers to favour; gain +10 to tests with them, and others suffer -10 to resist them.",
                description: "In tampering with the fundamental nature of their bloodlines, the Renegade Houses have created both monsters and marvels. You begin play with an additional Navigator Power, and choose three Navigator Powers to which your unstable blood grants terrible affinity."
              },
              {
                name: "Unchecked Mutation",
                type: "talent",
                category: "trait",
                benefit: "When testing for mutation from new powers or improved mastery, tests are Challenging (+0) rather than Ordinary (+10).",
                description: "The tampering in your family line has left you far more prone to mutation and mental instability than other Navigators."
              },
              {
                name: "Renegades",
                type: "talent",
                category: "trait",
                benefit: "All tests involving official bodies of the Imperium suffer -10, and the Inquisition watches for evidence of your House's wrongdoing.",
                description: "The price of dabbling in the unknown is high, and Renegade Houses have paid in both standing and security."
              }
            ],
            rolls: [
              {
                formula: "1d5",
                resourcePath: "system.insanity.points",
                resourceLabel: "Insanity Points"
              },
              {
                formula: "1d5",
                resourcePath: "system.corruption.points",
                resourceLabel: "Corruption Points"
              }
            ],
            effects: [
              {
                type: "referenceTableRoll",
                name: "Initial Navigator Mutation",
                tableKey: "navigatorMutations",
                tableLabel: "Navigator Mutations",
                formula: "1d100",
                category: "trait"
              },
              {
                type: "referenceTableRoll",
                name: "Initial Navigator Mutation",
                tableKey: "navigatorMutations",
                tableLabel: "Navigator Mutations",
                formula: "1d100",
                category: "trait"
              }
            ],
            benefit: "Gain an additional Navigator Power, choose three favoured Navigator Powers, gain 1d5 Insanity and 1d5 Corruption, and roll two initial Navigator Mutations."
          }
        ]
      },
      {
        key: "renegadeBonusPower",
        label: "Renegade House: Additional Navigator Power",
        options: [
          {
            key: "renegade-bonus-power",
            name: "Choose Bonus Navigator Power",
            type: "navigatorPowerGrant",
            requiresPath: "renegade-house",
            benefit: "Select one additional Navigator Power from the compendium."
          }
        ]
      },
      {
        key: "renegadeFavouredPowerOne",
        label: "Renegade House: Favoured Power I",
        options: [
          {
            key: "renegade-favoured-power-1",
            name: "Choose Favoured Navigator Power I",
            type: "navigatorPowerFocus",
            requiresPath: "renegade-house",
            benefit: "Choose one Navigator Power to gain +10 on tests with it and impose -10 on others resisting it."
          }
        ]
      },
      {
        key: "renegadeFavouredPowerTwo",
        label: "Renegade House: Favoured Power II",
        options: [
          {
            key: "renegade-favoured-power-2",
            name: "Choose Favoured Navigator Power II",
            type: "navigatorPowerFocus",
            requiresPath: "renegade-house",
            benefit: "Choose a second Navigator Power to gain +10 on tests with it and impose -10 on others resisting it."
          }
        ]
      },
      {
        key: "renegadeFavouredPowerThree",
        label: "Renegade House: Favoured Power III",
        options: [
          {
            key: "renegade-favoured-power-3",
            name: "Choose Favoured Navigator Power III",
            type: "navigatorPowerFocus",
            requiresPath: "renegade-house",
            benefit: "Choose a third Navigator Power to gain +10 on tests with it and impose -10 on others resisting it."
          }
        ]
      }
    ]
  },
  seneschal: {
    key: "seneschal",
    label: "Seneschal",
    overview: [
      "Master of ceremonies, master of coin and commerce, master of logistics, emissaries, whispers, and spies, the Seneschal keeps the gears of a Trader House turning with relentless competence and vigilance.",
      "Where a Rogue Trader looks to the fate of great endeavours, the Seneschal masters the dangerous minutia beneath them: commerce, negotiation, risk, intelligence, and the hidden conditions that decide success or ruin.",
      "Many favour a hands-on approach, moving unseen as the grey man through ports, markets, and courts, observing quietly and discerning truth beneath courtesy, piety, and lies."
    ],
    startingSkillsInfo: [
      "Barter (Fel)",
      "Commerce (Fel)",
      "Common Lore (Underworld) (Int)",
      "Deceive (Fel)",
      "Evaluate (Int)",
      "Forbidden Lore (Archeotech) (Int)",
      "Inquiry (Fel)",
      "Literacy (Int)",
      "Speak Language (Low Gothic) (Int)",
      "Speak Language (Trader's Cant) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one sidearm: best-Craftsmanship hellpistol or common-Craftsmanship inferno pistol",
      "Choose one longarm: best-Craftsmanship hellgun or common-Craftsmanship boltgun",
      "Fixed gear: xeno-mesh armour, autoquill, data-slate, micro-bead, multikey, two sets of robes, synskin, chrono, cameleoline cloak"
    ],
    specialAbilityInfo: [
      "Seeker of Lore: Spend a Fate Point to automatically succeed at any Ciphers, Lore, or Logic Test in the minimum time. Gain one bonus Degree of Success on successful Commerce, Inquiry, or Evaluate Tests.",
      "Current implementation records this special ability on the actor and applies the published starting skills, talents, and gear package."
    ],
    startingSkills: [
      { skillId: "barter", trained: true },
      { skillId: "commerce", trained: true },
      { skillId: "common-lore/underworld", trained: true },
      { skillId: "deceive", trained: true },
      { skillId: "evaluate", trained: true },
      { skillId: "forbidden-lore/archeotech", trained: true },
      { skillId: "inquiry", trained: true },
      { skillId: "literacy", trained: true },
      { skillId: "speak-language/low-gothic", trained: true },
      { skillId: "speak-language/trader-s-cant", trained: true }
    ],
    grantedItems: [
      {
        name: "Basic Weapon Training (Universal)",
        talentId: "basic-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Pistol Weapon Training (Universal)",
        talentId: "pistol-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Seeker of Lore",
        type: "talent",
        category: "specialAbility",
        benefit: "Spend Fate to auto-succeed on Ciphers, Lore, or Logic; gain +1 DoS on Commerce, Inquiry, and Evaluate.",
        description: "The Seneschal may spend a Fate Point to automatically succeed at any Ciphers, Lore, or Logic Test. Doing so means that the Test is resolved in the minimum time required. In addition, the Seneschal adds one bonus Degree of Success to any successful Commerce, Inquiry, or Evaluate Test."
      },
      {
        name: "Xeno-mesh Armour",
        type: "armor",
        craftsmanship: "common",
        armorType: "mesh",
        benefit: "Xeno-mesh armour.",
        description: "Starting armour for the Seneschal career."
      },
      {
        name: "Auto Quill",
        type: "tool",
        shortDescription: "A self-writing quill for rapid contracts, ledgers, and annotations.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Data-slate",
        type: "gear",
        shortDescription: "Portable data slate for ledgers, contracts, and intelligence records.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for discreet coordination.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Multikey",
        type: "tool",
        shortDescription: "A versatile keying tool for locks, access points, and secure systems.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Robes (Set One)",
        type: "gear",
        shortDescription: "A first set of robes suited to ceremony, business, or disguise.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Robes (Set Two)",
        type: "gear",
        shortDescription: "A second set of robes for alternate guise, station, or occasion.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Synskin",
        type: "gear",
        shortDescription: "A close-fitting body glove for protection, discretion, and mobility.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Chrono",
        type: "gear",
        shortDescription: "A precision chronometer for schedules, timing, and coordination.",
        description: "Starting gear for the Seneschal career."
      },
      {
        name: "Cameleoline Cloak",
        type: "gear",
        shortDescription: "A cloak designed to obscure and blend the wearer into surroundings.",
        description: "Starting gear for the Seneschal career."
      }
    ],
    choices: [
      {
        key: "sidearm",
        label: "Starting Sidearm",
        options: [
          {
            key: "hellpistol",
            name: "Best-Craftsmanship Hellpistol",
            type: "item",
            item: {
              name: "Hellpistol",
              type: "weapon",
              craftsmanship: "best",
              class: "pistol",
              weaponType: "las",
              benefit: "Best-Craftsmanship hellpistol.",
              description: "Starting sidearm for the Seneschal career."
            }
          },
          {
            key: "inferno-pistol",
            name: "Common-Craftsmanship Inferno Pistol",
            type: "item",
            item: {
              name: "Inferno Pistol",
              type: "weapon",
              craftsmanship: "common",
              class: "pistol",
              weaponType: "melta",
              benefit: "Common-Craftsmanship inferno pistol.",
              description: "Starting sidearm for the Seneschal career."
            }
          }
        ]
      },
      {
        key: "longarm",
        label: "Starting Longarm",
        options: [
          {
            key: "hellgun",
            name: "Best-Craftsmanship Hellgun",
            type: "item",
            item: {
              name: "Hellgun",
              type: "weapon",
              craftsmanship: "best",
              class: "basic",
              weaponType: "las",
              benefit: "Best-Craftsmanship hellgun.",
              description: "Starting longarm for the Seneschal career."
            }
          },
          {
            key: "boltgun",
            name: "Common-Craftsmanship Boltgun",
            type: "item",
            item: {
              name: "Boltgun",
              type: "weapon",
              craftsmanship: "common",
              class: "basic",
              weaponType: "bolt",
              benefit: "Common-Craftsmanship boltgun.",
              description: "Starting longarm for the Seneschal career."
            }
          }
        ]
      }
    ]
  },
  voidMaster: {
    key: "voidMaster",
    label: "Void-Master",
    overview: [
      "Void-masters are the rare men and women who have risen high in the running of space-going vessels, mastering the systems, dangers, and disciplines of life between the stars through talent, survival, and experience.",
      "Whether proper officer, naval scion, trader rogue, pirate, or smuggler, each Void-master has earned the respect that comes from holding many lives in his hands and proving he can keep a ship alive in crisis.",
      "To them the void is not an abstraction but a place of dark majesty, familiar danger, and hard-won competence, and many are baffled that anyone would choose the imprisonment of a planet-bound life."
    ],
    startingSkillsInfo: [
      "Common Lore (Imperial Navy) (Int)",
      "Common Lore (War) (Int)",
      "Forbidden Lore (Xenos) (Int)",
      "Navigation (Stellar) (Int)",
      "Pilot (Space Craft) (Ag)",
      "Pilot (Flyers) (Ag)",
      "Scholastic Lore (Astromancy) (Int)",
      "Speak Language (Low Gothic) (Int)"
    ],
    startingEquipmentInfo: [
      "Choose one melee weapon: best-Craftsmanship mono-sword or common-Craftsmanship power sword",
      "Choose one sidearm: best-Craftsmanship hand cannon or common-Craftsmanship bolt pistol",
      "Fixed gear: guard flak armour, micro-bead, void suit, blessed ship token, re-breather, 2 bottles of amasec, pict-recorder, vox-caster",
      "Choose one clothing item: Imperial Navy uniform or beggar's cloak"
    ],
    specialAbilityInfo: [
      "Choose one mastery: Space, Gunnery, Augurs, or Small Craft.",
      "Each mastery allows the Void-master to re-roll failed Tests in its sphere while operating starships or small craft.",
      "Current implementation records the chosen mastery on the actor."
    ],
    startingSkills: [
      { skillId: "common-lore/imperial-navy", trained: true },
      { skillId: "common-lore/war", trained: true },
      { skillId: "forbidden-lore/xenos", trained: true },
      { skillId: "navigation/stellar", trained: true },
      { skillId: "pilot/spacecraft", trained: true },
      { skillId: "pilot/flyers", trained: true },
      { skillId: "scholastic-lore/astromancy", trained: true },
      { skillId: "speak-language/low-gothic", trained: true }
    ],
    grantedItems: [
      {
        name: "Pistol Weapon Training (Universal)",
        talentId: "pistol-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Melee Weapon Training (Universal)",
        talentId: "melee-weapon-training/universal",
        category: "talent"
      },
      {
        name: "Nerves of Steel",
        talentId: "nerves-of-steel",
        category: "talent"
      },
      {
        name: "Guard Flak Armour",
        type: "armor",
        craftsmanship: "common",
        armorType: "flak",
        benefit: "Guard flak armour.",
        description: "Starting armour for the Void-Master career."
      },
      {
        name: "Micro-bead",
        type: "gear",
        shortDescription: "Compact bead communication device for deck, bridge, and away-team coordination.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Void Suit",
        type: "gear",
        shortDescription: "Vacuum-rated protective suit for hostile environments and emergency survival.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Blessed Ship Token",
        type: "gear",
        shortDescription: "A devotional token carried for luck, shipboard blessing, and tradition.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Rebreather",
        type: "gear",
        shortDescription: "Breathing apparatus for smoke, toxic air, or compromised atmospheres.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Amasec (Bottle One)",
        type: "consumable",
        shortDescription: "One bottle of amasec.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Amasec (Bottle Two)",
        type: "consumable",
        shortDescription: "One bottle of amasec.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Pict-recorder",
        type: "gear",
        shortDescription: "Portable device for recording images and events.",
        description: "Starting gear for the Void-Master career."
      },
      {
        name: "Vox-caster",
        type: "gear",
        shortDescription: "Vox communications unit for shipboard or field use.",
        description: "Starting gear for the Void-Master career."
      }
    ],
    choices: [
      {
        key: "meleeWeapon",
        label: "Starting Melee Weapon",
        options: [
          {
            key: "mono-sword",
            name: "Best-Craftsmanship Mono-sword",
            type: "item",
            item: {
              name: "Mono-sword",
              type: "weapon",
              craftsmanship: "best",
              class: "melee",
              weaponType: "primitive",
              benefit: "Best-Craftsmanship mono-sword.",
              description: "Starting melee weapon for the Void-Master career."
            }
          },
          {
            key: "power-sword",
            name: "Common-Craftsmanship Power Sword",
            type: "item",
            item: {
              name: "Power Sword (Mordian)",
              type: "weapon",
              source: {
                name: "Power Sword (Mordian)"
              },
              craftsmanship: "common",
              class: "melee",
              benefit: "Common-Craftsmanship power sword.",
              description: "Starting melee weapon for the Void-Master career."
            }
          }
        ]
      },
      {
        key: "sidearm",
        label: "Starting Sidearm",
        options: [
          {
            key: "hand-cannon",
            name: "Best-Craftsmanship Hand Cannon",
            type: "item",
            item: {
              name: "Hand Cannon",
              type: "weapon",
              craftsmanship: "best",
              class: "pistol",
              weaponType: "sp",
              benefit: "Best-Craftsmanship hand cannon.",
              description: "Starting sidearm for the Void-Master career."
            }
          },
          {
            key: "bolt-pistol",
            name: "Common-Craftsmanship Bolt Pistol",
            type: "item",
            item: {
              name: "Bolt Pistol",
              type: "weapon",
              craftsmanship: "common",
              class: "pistol",
              weaponType: "bolt",
              benefit: "Common-Craftsmanship bolt pistol.",
              description: "Starting sidearm for the Void-Master career."
            }
          }
        ]
      },
      {
        key: "clothing",
        label: "Starting Clothing",
        options: [
          {
            key: "imperial-navy-uniform",
            name: "Imperial Navy Uniform",
            type: "item",
            item: {
              name: "Imperial Navy Uniform",
              type: "gear",
              craftsmanship: "common",
              benefit: "An Imperial Navy uniform.",
              description: "Starting clothing for the Void-Master career."
            }
          },
          {
            key: "beggars-cloak",
            name: "Beggar's Cloak",
            type: "item",
            item: {
              name: "Beggar's Cloak",
              type: "gear",
              craftsmanship: "common",
              benefit: "A beggar's cloak.",
              description: "Starting clothing for the Void-Master career."
            }
          }
        ]
      },
      {
        key: "mastery",
        label: "Void-Master Special Ability",
        options: [
          {
            key: "mastery-of-space",
            name: "Mastery of Space",
            type: "item",
            item: {
              name: "Mastery of Space",
              type: "talent",
              category: "specialAbility",
              benefit: "Re-roll failed Tests with Manoeuvre Actions aboard a spaceship.",
              description: "The Void-master can re-roll all failed Tests with Manoeuvre Actions aboard a spaceship."
            }
          },
          {
            key: "mastery-of-gunnery",
            name: "Mastery of Gunnery",
            type: "item",
            item: {
              name: "Mastery of Gunnery",
              type: "talent",
              category: "specialAbility",
              benefit: "Re-roll failed Tests with Shooting Actions aboard a starship.",
              description: "The Void-master can re-roll all failed Tests with Shooting Actions aboard a starship."
            }
          },
          {
            key: "mastery-of-augurs",
            name: "Mastery of Augurs",
            type: "item",
            item: {
              name: "Mastery of Augurs",
              type: "talent",
              category: "specialAbility",
              benefit: "Re-roll failed Tests involving Detection aboard a starship.",
              description: "The Void-master can re-roll all failed Tests involving Detection aboard a starship."
            }
          },
          {
            key: "mastery-of-small-craft",
            name: "Mastery of Small Craft",
            type: "item",
            item: {
              name: "Mastery of Small Craft",
              type: "talent",
              category: "specialAbility",
              benefit: "Re-roll failed Pilot Tests with small craft.",
              description: "The Void-master can re-roll all failed Pilot Tests with small craft such as shuttles, heavy lifters, guncutters, starfighters, and bombers."
            }
          }
        ]
      }
    ]
  }
};

export class RogueTraderAdvancementWindow extends Application {
  constructor(sheet, options = {}) {
    super(options);
    this.sheet = sheet;
    this.actor = sheet.actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "advancement-window-app"],
      width: 1040,
      height: 800,
      resizable: true,
      template: "systems/roguetrader/templates/apps/advancement.hbs",
      title: "Rogue Trader: Character Creation"
    });
  }

  getData() {
    const activeOriginTab = this.options.activeOriginTab ?? "homeWorld";
    const activeTab = this.options.activeTab ?? "step-one";
    const homeWorldState = this._getHomeWorldState();
    const selectedKey = this.options.selectedHomeWorld ?? homeWorldState.selected ?? "";
    const selectedHomeWorld = selectedKey ? HOME_WORLD_DEFINITIONS[selectedKey] ?? null : null;
    const birthrightState = this._getBirthrightState();
    const selectedBirthrightKey = this.options.selectedBirthright ?? birthrightState.selected ?? "";
    const selectedBirthright = selectedBirthrightKey ? BIRTHRIGHT_DEFINITIONS[selectedBirthrightKey] ?? null : null;
    const lureOfTheVoidState = this._getLureOfTheVoidState();
    const selectedLureOfTheVoidKey = this.options.selectedLureOfTheVoid ?? lureOfTheVoidState.selected ?? "";
    const selectedLureOfTheVoid = selectedLureOfTheVoidKey ? LURE_OF_THE_VOID_DEFINITIONS[selectedLureOfTheVoidKey] ?? null : null;
    const trialsAndTravailsState = this._getTrialsAndTravailsState();
    const selectedTrialsAndTravailsKey = this.options.selectedTrialsAndTravails ?? trialsAndTravailsState.selected ?? "";
    const selectedTrialsAndTravails = selectedTrialsAndTravailsKey ? TRIALS_AND_TRAVAILS_DEFINITIONS[selectedTrialsAndTravailsKey] ?? null : null;
    const motivationState = this._getMotivationState();
    const selectedMotivationKey = this.options.selectedMotivation ?? motivationState.selected ?? "";
    const selectedMotivation = selectedMotivationKey ? MOTIVATION_DEFINITIONS[selectedMotivationKey] ?? null : null;
    const careerState = this._getCareerState();
    const selectedCareerKey = this.options.selectedCareer ?? careerState.selected ?? "";
    const selectedCareer = selectedCareerKey ? CAREER_DEFINITIONS[selectedCareerKey] ?? null : null;

    return {
      actor: this.actor,
      activeTab,
      locked: Boolean(this.actor.system.advancement?.startingCharacteristics?.locked),
      formula: STARTING_CHARACTERISTIC_ROLL_FORMULA,
      tabs: {
        stepOne: "Step 1: Characteristics",
        stepTwo: "Origin Path",
        stepThree: "Career"
      },
      originTabs: ORIGIN_PATH_TABS.map((tab) => ({
        ...tab,
        active: tab.key === activeOriginTab,
        completed: isOriginTabCompleted(tab.key, {
          homeWorld: homeWorldState,
          birthright: birthrightState,
          lureOfTheVoid: lureOfTheVoidState,
          trialsAndTravails: trialsAndTravailsState,
          motivation: motivationState
        })
      })),
      activeOriginTab,
      isHomeWorldTab: activeOriginTab === "homeWorld",
      isBirthrightTab: activeOriginTab === "birthright",
      isLureOfTheVoidTab: activeOriginTab === "lureOfTheVoid",
      isTrialsAndTravailsTab: activeOriginTab === "trialsAndTravails",
      isMotivationTab: activeOriginTab === "motivation",
      rows: CHARACTERISTIC_DEFINITIONS.map((definition) => {
        const stored = this.actor.system.advancement?.startingCharacteristics?.values?.[definition.key] ?? {};
        const currentValue = Number(this.actor.system.characteristics?.[definition.key]?.value ?? 0);
        const value = Number(stored.value ?? currentValue);
        const generated = Boolean(stored.generated);
        const rerolled = Boolean(stored.rerolled);

        return {
          key: definition.key,
          label: definition.label,
          short: definition.short,
          value,
          generated,
          rerolled,
          canReroll: !Boolean(this.actor.system.advancement?.startingCharacteristics?.locked) && generated && !rerolled
        };
      }),
      homeWorlds: Object.values(HOME_WORLD_DEFINITIONS).map((homeWorld) => ({
        key: homeWorld.key,
        label: homeWorld.label,
        selected: homeWorld.key === selectedKey,
        confirmed: homeWorldState.confirmed && homeWorldState.selected === homeWorld.key
      })),
      selectedHomeWorld,
      hasSelectedHomeWorld: Boolean(selectedHomeWorld),
      homeWorldState,
      showHomeWorldOptions: homeWorldState.confirmed && homeWorldState.selected === selectedHomeWorld?.key,
      homeWorldWoundsLabel: homeWorldState.startingWoundsRolled
        ? `Starting Wounds: ${homeWorldState.startingWounds}`
        : `Roll Starting Wounds${selectedHomeWorld?.startingWounds?.formulaLabel ? ` (${selectedHomeWorld.startingWounds.formulaLabel})` : ""}`,
      homeWorldFateLabel: homeWorldState.startingFateRolled
        ? `Starting Fate: ${homeWorldState.startingFate}`
        : "Roll Starting Fate",
      selectedHomeWorldChoice: selectedHomeWorld?.specialChoices?.map((choice) => ({
        ...choice,
        selected: homeWorldState.specialChoice === choice.key
      })) ?? [],
      birthrights: Object.values(BIRTHRIGHT_DEFINITIONS).map((birthright) => ({
        key: birthright.key,
        label: birthright.label,
        selected: birthright.key === selectedBirthrightKey,
        confirmed: birthrightState.confirmed && birthrightState.selected === birthright.key
      })),
      selectedBirthright,
      hasSelectedBirthright: Boolean(selectedBirthright),
      birthrightState,
      showBirthrightChoices: birthrightState.confirmed && birthrightState.selected === selectedBirthright?.key,
      selectedBirthrightChoiceGroups: selectedBirthright?.choices
        ?.filter((group) => {
          if (group.key === "servicePath") return true;
          const selectedPath = birthrightState.choices?.servicePath ?? "";
          return group.options.some((option) => !option.requiresPath || option.requiresPath === selectedPath);
        })
        .map((group) => ({
          ...group,
          options: group.options
            .filter((option) => {
              const selectedPath = birthrightState.choices?.servicePath ?? "";
              return !option.requiresPath || option.requiresPath === selectedPath;
            })
            .map((option) => ({
              ...option,
              selected: birthrightState.choices?.[group.key] === option.key
            }))
        })) ?? [],
      lureOfTheVoidOptions: Object.values(LURE_OF_THE_VOID_DEFINITIONS).map((lure) => ({
        key: lure.key,
        label: lure.label,
        selected: lure.key === selectedLureOfTheVoidKey,
        confirmed: lureOfTheVoidState.confirmed && lureOfTheVoidState.selected === lure.key
      })),
      selectedLureOfTheVoid,
      hasSelectedLureOfTheVoid: Boolean(selectedLureOfTheVoid),
      lureOfTheVoidState,
      showLureOfTheVoidChoices: lureOfTheVoidState.confirmed && lureOfTheVoidState.selected === selectedLureOfTheVoid?.key,
      selectedLureOfTheVoidChoiceGroups: selectedLureOfTheVoid?.choices?.map((group) => ({
        ...group,
        options: group.options.map((option) => ({
          ...option,
          selected: lureOfTheVoidState.choices?.[group.key] === option.key,
          summary: summarizeChoiceOption(option)
        }))
      })) ?? [],
      trialsAndTravailsOptions: Object.values(TRIALS_AND_TRAVAILS_DEFINITIONS).map((trial) => ({
        key: trial.key,
        label: trial.label,
        selected: trial.key === selectedTrialsAndTravailsKey,
        confirmed: trialsAndTravailsState.confirmed && trialsAndTravailsState.selected === trial.key
      })),
      selectedTrialsAndTravails,
      hasSelectedTrialsAndTravails: Boolean(selectedTrialsAndTravails),
      trialsAndTravailsState,
      showTrialsAndTravailsChoices: trialsAndTravailsState.confirmed && trialsAndTravailsState.selected === selectedTrialsAndTravails?.key,
      selectedTrialsAndTravailsChoiceGroups: selectedTrialsAndTravails?.choices
        ?.filter((group) => {
          if (group.key === "darknessPath") return true;
          const selectedPath = trialsAndTravailsState.choices?.darknessPath ?? "";
          return group.options.some((option) => !option.requiresPath || option.requiresPath === selectedPath);
        })
        .map((group) => ({
          ...group,
          options: group.options
            .filter((option) => {
              const selectedPath = trialsAndTravailsState.choices?.darknessPath ?? "";
              return !option.requiresPath || option.requiresPath === selectedPath;
            })
            .map((option) => ({
              ...option,
              selected: trialsAndTravailsState.choices?.[group.key] === option.key,
              summary: summarizeChoiceOption(option)
            }))
        })) ?? [],
      motivations: Object.values(MOTIVATION_DEFINITIONS).map((motivation) => ({
        key: motivation.key,
        label: motivation.label,
        selected: motivation.key === selectedMotivationKey,
        confirmed: motivationState.confirmed && motivationState.selected === motivation.key
      })),
      selectedMotivation,
      hasSelectedMotivation: Boolean(selectedMotivation),
      motivationState,
      showMotivationChoices: motivationState.confirmed && motivationState.selected === selectedMotivation?.key,
      selectedMotivationChoiceGroups: selectedMotivation?.choices
        ?.filter((group) => {
          const selectedPaths = new Set(Object.values(motivationState.choices ?? {}));
          return group.options.some((option) => !option.requiresPath || selectedPaths.has(option.requiresPath));
        })
        .map((group) => ({
          ...group,
          options: group.options
            .filter((option) => {
              const selectedPaths = new Set(Object.values(motivationState.choices ?? {}));
              return !option.requiresPath || selectedPaths.has(option.requiresPath);
            })
            .map((option) => ({
              ...option,
              selected: motivationState.choices?.[group.key] === option.key,
              summary: summarizeChoiceOption(option)
            }))
        })) ?? [],
      careers: Object.values(CAREER_DEFINITIONS).map((career) => ({
        key: career.key,
        label: career.label,
        selected: career.key === selectedCareerKey,
        confirmed: careerState.confirmed && careerState.selected === career.key
      })),
      selectedCareer,
      hasSelectedCareer: Boolean(selectedCareer),
      careerState,
      showCareerChoices: careerState.confirmed && careerState.selected === selectedCareer?.key,
      selectedCareerChoiceGroups: selectedCareer?.choices?.filter((group) => {
        const selectedPaths = new Set(Object.values(careerState.choices ?? {}));
        return group.options.some((option) => !option.requiresPath || selectedPaths.has(option.requiresPath));
      }).map((group) => ({
        ...group,
        options: group.options.filter((option) => {
          const selectedPaths = new Set(Object.values(careerState.choices ?? {}));
          return !option.requiresPath || selectedPaths.has(option.requiresPath);
        }).map((option) => ({
          ...option,
          selected: careerState.choices?.[group.key] === option.key,
          summary: summarizeChoiceOption(option)
        }))
      })) ?? []
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".starting-characteristic-input").on("change", this._onStartingCharacteristicInput.bind(this));
    html.find(".starting-characteristics-roll-all-button").on("click", this._onRollAllStartingCharacteristics.bind(this));
    html.find(".starting-characteristic-roll-button").on("click", this._onRollStartingCharacteristic.bind(this));
    html.find(".starting-characteristic-reroll-button").on("click", this._onRerollStartingCharacteristic.bind(this));
    html.find(".starting-characteristic-lock-button").on("click", this._onLockStartingCharacteristics.bind(this));
    html.find(".character-creation-tab-button").on("click", this._onSwitchTab.bind(this));
    html.find(".origin-path-tab-button").on("click", this._onSwitchOriginTab.bind(this));
    html.find(".home-world-select-button").on("click", this._onSelectHomeWorld.bind(this));
    html.find(".home-world-confirm-button").on("click", this._onConfirmHomeWorld.bind(this));
    html.find(".home-world-option-button").on("click", this._onChooseHomeWorldOption.bind(this));
    html.find(".home-world-roll-wounds-button").on("click", this._onRollHomeWorldWounds.bind(this));
    html.find(".home-world-roll-fate-button").on("click", this._onRollHomeWorldFate.bind(this));
    html.find(".birthright-select-button").on("click", this._onSelectBirthright.bind(this));
    html.find(".birthright-confirm-button").on("click", this._onConfirmBirthright.bind(this));
    html.find(".birthright-option-button").on("click", this._onChooseBirthrightOption.bind(this));
    html.find(".lure-of-the-void-select-button").on("click", this._onSelectLureOfTheVoid.bind(this));
    html.find(".lure-of-the-void-confirm-button").on("click", this._onConfirmLureOfTheVoid.bind(this));
    html.find(".lure-of-the-void-option-button").on("click", this._onChooseLureOfTheVoidOption.bind(this));
    html.find(".trials-and-travails-select-button").on("click", this._onSelectTrialsAndTravails.bind(this));
    html.find(".trials-and-travails-confirm-button").on("click", this._onConfirmTrialsAndTravails.bind(this));
    html.find(".trials-and-travails-option-button").on("click", this._onChooseTrialsAndTravailsOption.bind(this));
    html.find(".motivation-select-button").on("click", this._onSelectMotivation.bind(this));
    html.find(".motivation-confirm-button").on("click", this._onConfirmMotivation.bind(this));
    html.find(".motivation-option-button").on("click", this._onChooseMotivationOption.bind(this));
    html.find(".career-select-button").on("click", this._onSelectCareer.bind(this));
    html.find(".career-confirm-button").on("click", this._onConfirmCareer.bind(this));
    html.find(".career-option-button").on("click", this._onChooseCareerOption.bind(this));

    const activeTab = this.options.activeTab ?? "step-one";
    this._setActiveTab(html, activeTab);
  }

  _getHomeWorldState() {
    return this.actor.system.advancement?.originPath?.homeWorld ?? {};
  }

  _getBirthrightState() {
    return this.actor.system.advancement?.originPath?.birthright ?? {};
  }

  _getLureOfTheVoidState() {
    return this.actor.system.advancement?.originPath?.lureOfTheVoid ?? {};
  }

  _getTrialsAndTravailsState() {
    return this.actor.system.advancement?.originPath?.trialsAndTravails ?? {};
  }

  _getMotivationState() {
    return this.actor.system.advancement?.originPath?.motivation ?? {};
  }

  _getCareerState() {
    return this.actor.system.advancement?.career ?? {};
  }

  async _onStartingCharacteristicInput(event) {
    const characteristicKey = event.currentTarget.dataset.characteristicKey;
    if (!characteristicKey) return;

    if (this.actor.system.advancement?.startingCharacteristics?.locked) {
      ui.notifications?.warn("Rogue Trader | Starting characteristics have already been locked in.");
      this.render(false);
      return;
    }

    const value = Number(event.currentTarget.value || 0);
    await this.actor.update({
      [`system.advancement.startingCharacteristics.values.${characteristicKey}.value`]: value,
      [`system.characteristics.${characteristicKey}.value`]: value
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _onRollStartingCharacteristic(event) {
    event.preventDefault();
    await this._rollStartingCharacteristic(event.currentTarget.dataset.characteristicKey, { reroll: false });
  }

  async _onRerollStartingCharacteristic(event) {
    event.preventDefault();
    await this._rollStartingCharacteristic(event.currentTarget.dataset.characteristicKey, { reroll: true });
  }

  async _onRollAllStartingCharacteristics(event) {
    event.preventDefault();

    const locked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (locked) {
      ui.notifications?.warn("Rogue Trader | Starting characteristics have already been locked in.");
      return;
    }

    const updates = {};
    const results = [];

    for (const definition of CHARACTERISTIC_DEFINITIONS) {
      const roll = await (new Roll(STARTING_CHARACTERISTIC_ROLL_FORMULA)).evaluate();
      const total = Number(roll.total ?? 0);

      updates[`system.advancement.startingCharacteristics.values.${definition.key}.value`] = total;
      updates[`system.advancement.startingCharacteristics.values.${definition.key}.generated`] = true;
      updates[`system.characteristics.${definition.key}.value`] = total;

      results.push({
        label: definition.label,
        short: definition.short,
        total
      });
    }

    await this.actor.update(updates);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Starting Characteristics</h3>
          <p><strong>Formula:</strong> ${STARTING_CHARACTERISTIC_ROLL_FORMULA}</p>
          <ul>
            ${results.map((result) => `<li><strong>${result.label} (${result.short}):</strong> ${result.total}</li>`).join("")}
          </ul>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _rollStartingCharacteristic(characteristicKey, { reroll = false } = {}) {
    if (!characteristicKey) return;

    const locked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (locked) {
      ui.notifications?.warn("Rogue Trader | Starting characteristics have already been locked in.");
      return;
    }

    const state = this.actor.system.advancement?.startingCharacteristics?.values?.[characteristicKey] ?? {};
    const generated = Boolean(state.generated);
    const alreadyRerolled = Boolean(state.rerolled);

    if (reroll && !generated) {
      ui.notifications?.warn("Rogue Trader | Roll the starting characteristic first.");
      return;
    }

    if (reroll && alreadyRerolled) {
      ui.notifications?.warn("Rogue Trader | The free reroll for that characteristic has already been used.");
      return;
    }

    const roll = await (new Roll(STARTING_CHARACTERISTIC_ROLL_FORMULA)).evaluate();
    const total = Number(roll.total ?? 0);
    const label = CHARACTERISTIC_DEFINITIONS.find((definition) => definition.key === characteristicKey)?.label ?? characteristicKey;

    await this.actor.update({
      [`system.advancement.startingCharacteristics.values.${characteristicKey}.value`]: total,
      [`system.advancement.startingCharacteristics.values.${characteristicKey}.generated`]: true,
      [`system.advancement.startingCharacteristics.values.${characteristicKey}.rerolled`]: reroll ? true : alreadyRerolled,
      [`system.characteristics.${characteristicKey}.value`]: total
    });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Starting ${label}</h3>
          <p><strong>Formula:</strong> ${STARTING_CHARACTERISTIC_ROLL_FORMULA}</p>
          <p><strong>Result:</strong> ${total}</p>
          <p><strong>Type:</strong> ${reroll ? "Free Reroll" : "Initial Roll"}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _onLockStartingCharacteristics(event) {
    event.preventDefault();

    if (this.actor.system.advancement?.startingCharacteristics?.locked) return;

    await this.actor.update({ "system.advancement.startingCharacteristics.locked": true });
    ui.notifications?.info("Rogue Trader | Starting characteristics locked in.");
    this.sheet.render(false);
    this.render(false);
  }

  _onSwitchTab(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.tab;
    if (!tab) return;

    this.options.activeTab = tab;
    this._setActiveTab($(this.element), tab);
  }

  _setActiveTab(html, tab) {
    html.find(".character-creation-tab-button").removeClass("active");
    html.find(`.character-creation-tab-button[data-tab="${tab}"]`).addClass("active");
    html.find(".character-creation-tab").removeClass("active");
    html.find(`.character-creation-tab[data-tab="${tab}"]`).addClass("active");
  }

  _onSwitchOriginTab(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.originTab;
    if (!tab) return;

    this.options.activeOriginTab = tab;
    this.render(false);
  }

  _onSelectHomeWorld(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.homeWorldKey;
    if (!key || !HOME_WORLD_DEFINITIONS[key]) return;

    this.options.selectedHomeWorld = key;
    this.options.activeOriginTab = "homeWorld";
    this.render(false);
  }

  _onSelectBirthright(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.birthrightKey;
    if (!key || !BIRTHRIGHT_DEFINITIONS[key]) return;

    this.options.selectedBirthright = key;
    this.options.activeOriginTab = "birthright";
    this.render(false);
  }

  async _onConfirmHomeWorld(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before confirming a Home World.");
      return;
    }

    const key = this.options.selectedHomeWorld;
    const definition = key ? HOME_WORLD_DEFINITIONS[key] : null;
    if (!definition) {
      ui.notifications?.warn("Rogue Trader | Select a Home World first.");
      return;
    }

    if (definition.placeholder) {
      ui.notifications?.warn("Rogue Trader | That Home World has not been built yet.");
      return;
    }

    const state = this._getHomeWorldState();
    if (state.confirmed) {
      ui.notifications?.warn("Rogue Trader | Home World has already been confirmed.");
      return;
    }

    const updateData = {
      "system.identity.homeWorld": definition.label,
      "system.advancement.originPath.homeWorld.selected": key,
      "system.advancement.originPath.homeWorld.confirmed": true
    };

    for (const [characteristicKey, amount] of Object.entries(definition.modifiers)) {
      const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
      updateData[`system.characteristics.${characteristicKey}.value`] = currentValue + Number(amount ?? 0);
    }

    if (definition.profitFactorBonus) {
      const currentProfitFactor = Number(this.actor.system.acquisitions?.profitFactor ?? 0);
      updateData["system.acquisitions.profitFactor"] = currentProfitFactor + Number(definition.profitFactorBonus ?? 0);
    }

    await this.actor.update(updateData);
    await this._grantHomeWorldBenefits(definition);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Home World Confirmed</h3>
          <p><strong>Home World:</strong> ${definition.label}</p>
          <p><strong>Effects Applied:</strong> ${definition.positives.slice(0, 6).join("; ")}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _onConfirmBirthright(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before confirming a Birthright.");
      return;
    }

    const homeWorldConfirmed = Boolean(this._getHomeWorldState().confirmed);
    if (!homeWorldConfirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Home World before confirming a Birthright.");
      return;
    }

    const key = this.options.selectedBirthright;
    const definition = key ? BIRTHRIGHT_DEFINITIONS[key] : null;
    if (!definition) {
      ui.notifications?.warn("Rogue Trader | Select a Birthright first.");
      return;
    }

    const state = this._getBirthrightState();
    if (state.confirmed) {
      ui.notifications?.warn("Rogue Trader | Birthright has already been confirmed.");
      return;
    }

    const updateData = {
      "system.advancement.originPath.birthright.selected": key,
      "system.advancement.originPath.birthright.confirmed": true
    };

    for (const [characteristicKey, amount] of Object.entries(definition.modifiers ?? {})) {
      const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
      updateData[`system.characteristics.${characteristicKey}.value`] = currentValue + Number(amount ?? 0);
    }

    await this.actor.update(updateData);
    await this._grantBirthrightBenefits(definition);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Birthright Confirmed</h3>
          <p><strong>Birthright:</strong> ${definition.label}</p>
          <p><strong>Effects Applied:</strong> ${definition.positives.slice(0, 5).join("; ")}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  _onSelectLureOfTheVoid(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.lureOfTheVoidKey;
    if (!key || !LURE_OF_THE_VOID_DEFINITIONS[key]) return;

    this.options.selectedLureOfTheVoid = key;
    this.options.activeOriginTab = "lureOfTheVoid";
    this.render(false);
  }

  async _onConfirmLureOfTheVoid(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before confirming a Lure of the Void.");
      return;
    }

    const homeWorldConfirmed = Boolean(this._getHomeWorldState().confirmed);
    if (!homeWorldConfirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Home World before confirming a Lure of the Void.");
      return;
    }

    const birthrightConfirmed = Boolean(this._getBirthrightState().confirmed);
    if (!birthrightConfirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Birthright before confirming a Lure of the Void.");
      return;
    }

    const key = this.options.selectedLureOfTheVoid;
    const definition = key ? LURE_OF_THE_VOID_DEFINITIONS[key] : null;
    if (!definition) {
      ui.notifications?.warn("Rogue Trader | Select a Lure of the Void first.");
      return;
    }

    const state = this._getLureOfTheVoidState();
    if (state.confirmed) {
      ui.notifications?.warn("Rogue Trader | Lure of the Void has already been confirmed.");
      return;
    }

    const updateData = {
      "system.advancement.originPath.lureOfTheVoid.selected": key,
      "system.advancement.originPath.lureOfTheVoid.confirmed": true
    };

    for (const [characteristicKey, amount] of Object.entries(definition.modifiers ?? {})) {
      const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
      updateData[`system.characteristics.${characteristicKey}.value`] = currentValue + Number(amount ?? 0);
    }

    await this.actor.update(updateData);
    await this._grantLureOfTheVoidBenefits(definition);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Lure of the Void Confirmed</h3>
          <p><strong>Lure of the Void:</strong> ${definition.label}</p>
          <p><strong>Effects Applied:</strong> ${definition.positives.slice(0, 4).join("; ")}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  _onSelectTrialsAndTravails(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.trialsAndTravailsKey;
    if (!key || !TRIALS_AND_TRAVAILS_DEFINITIONS[key]) return;

    this.options.selectedTrialsAndTravails = key;
    this.options.activeOriginTab = "trialsAndTravails";
    this.render(false);
  }

  async _onConfirmTrialsAndTravails(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before confirming Trials & Travails.");
      return;
    }

    if (!this._getHomeWorldState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Home World before confirming Trials & Travails.");
      return;
    }

    if (!this._getBirthrightState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Birthright before confirming Trials & Travails.");
      return;
    }

    if (!this._getLureOfTheVoidState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Lure of the Void before confirming Trials & Travails.");
      return;
    }

    const key = this.options.selectedTrialsAndTravails;
    const definition = key ? TRIALS_AND_TRAVAILS_DEFINITIONS[key] : null;
    if (!definition) {
      ui.notifications?.warn("Rogue Trader | Select a Trials & Travails option first.");
      return;
    }

    const state = this._getTrialsAndTravailsState();
    if (state.confirmed) {
      ui.notifications?.warn("Rogue Trader | Trials & Travails has already been confirmed.");
      return;
    }

    const updateData = {
      "system.advancement.originPath.trialsAndTravails.selected": key,
      "system.advancement.originPath.trialsAndTravails.confirmed": true
    };

    for (const [characteristicKey, amount] of Object.entries(definition.modifiers ?? {})) {
      const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
      updateData[`system.characteristics.${characteristicKey}.value`] = currentValue + Number(amount ?? 0);
    }

    await this.actor.update(updateData);
    await this._grantTrialsAndTravailsBenefits(definition);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Trials & Travails Confirmed</h3>
          <p><strong>Trials & Travails:</strong> ${definition.label}</p>
          <p><strong>Effects Applied:</strong> ${definition.positives.slice(0, 4).join("; ")}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  _onSelectMotivation(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.motivationKey;
    if (!key || !MOTIVATION_DEFINITIONS[key]) return;

    this.options.selectedMotivation = key;
    this.options.activeOriginTab = "motivation";
    this.render(false);
  }

  async _onConfirmMotivation(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before confirming Motivation.");
      return;
    }

    if (!this._getHomeWorldState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Home World before confirming Motivation.");
      return;
    }

    if (!this._getBirthrightState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Birthright before confirming Motivation.");
      return;
    }

    if (!this._getLureOfTheVoidState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm a Lure of the Void before confirming Motivation.");
      return;
    }

    if (!this._getTrialsAndTravailsState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Confirm Trials & Travails before confirming Motivation.");
      return;
    }

    const key = this.options.selectedMotivation;
    const definition = key ? MOTIVATION_DEFINITIONS[key] : null;
    if (!definition) {
      ui.notifications?.warn("Rogue Trader | Select a Motivation first.");
      return;
    }

    const state = this._getMotivationState();
    if (state.confirmed) {
      ui.notifications?.warn("Rogue Trader | Motivation has already been confirmed.");
      return;
    }

    const updateData = {
      "system.identity.motivation": definition.label,
      "system.advancement.originPath.motivation.selected": key,
      "system.advancement.originPath.motivation.confirmed": true
    };

    for (const [characteristicKey, amount] of Object.entries(definition.modifiers ?? {})) {
      const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
      updateData[`system.characteristics.${characteristicKey}.value`] = currentValue + Number(amount ?? 0);
    }

    await this.actor.update(updateData);
    await this._grantMotivationBenefits(definition);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Motivation Confirmed</h3>
          <p><strong>Motivation:</strong> ${definition.label}</p>
          <p><strong>Effects Applied:</strong> ${definition.positives.slice(0, 3).join("; ")}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  _onSelectCareer(event) {
    event.preventDefault();
    const key = event.currentTarget.dataset.careerKey;
    if (!key || !CAREER_DEFINITIONS[key]) return;

    this.options.selectedCareer = key;
    this.options.activeTab = "step-three";
    this.render(false);
  }

  async _onConfirmCareer(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before confirming a Career.");
      return;
    }

    if (!this._getHomeWorldState().confirmed || !this._getBirthrightState().confirmed || !this._getLureOfTheVoidState().confirmed || !this._getTrialsAndTravailsState().confirmed || !this._getMotivationState().confirmed) {
      ui.notifications?.warn("Rogue Trader | Complete the Origin Path before confirming a Career.");
      return;
    }

    const key = this.options.selectedCareer;
    const definition = key ? CAREER_DEFINITIONS[key] : null;
    if (!definition) {
      ui.notifications?.warn("Rogue Trader | Select a Career first.");
      return;
    }

    const state = this._getCareerState();
    if (state.confirmed) {
      ui.notifications?.warn("Rogue Trader | Career has already been confirmed.");
      return;
    }

    const existingXpLog = Array.isArray(this.actor.system?.advancement?.xpLog)
      ? [...this.actor.system.advancement.xpLog]
      : [];
    const hasStartingXpEntry = existingXpLog.some((entry) =>
      Number(entry?.amount ?? 0) === 500
      && String(entry?.type ?? "").trim().toLowerCase() === "award"
      && String(entry?.note ?? "").trim().toLowerCase() === "starting xp"
    );

    const updateData = {
      "system.identity.careerPath": definition.label,
      "system.advancement.career.selected": key,
      "system.advancement.career.confirmed": true
    };

    if (!hasStartingXpEntry) {
      const updatedXpLog = existingXpLog.concat([{
        amount: 500,
        note: "Starting XP",
        type: "award",
        awardedOn: new Date().toISOString()
      }]);

      updateData["system.advancement.xpLog"] = updatedXpLog;
      updateData["system.advancement.totalXp"] = 5000;
      updateData["system.advancement.spentXp"] = 4500;
    }

    await this.actor.update(updateData);

    await this._grantCareerBenefits(definition);
    await this._recordCareerChoice(definition);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Career Confirmed</h3>
          <p><strong>Career:</strong> ${definition.label}</p>
          <p><strong>Status:</strong> Career selected and recorded. Detailed starting grants can now be filled into this definition.</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _grantHomeWorldBenefits(definition) {
    await this._grantSkills(definition.startingSkills ?? []);
    await this._grantItems(definition.grantedItems ?? []);
  }

  async _grantBirthrightBenefits(definition) {
    await this._grantSkills(definition.startingSkills ?? []);
    await this._grantItems(definition.grantedItems ?? []);

    for (const effect of definition.autoEffects ?? []) {
      await this._applyChoiceEffect(effect, definition.label);
    }
  }

  async _grantLureOfTheVoidBenefits(definition) {
    await this._grantSkills(definition.startingSkills ?? []);
    await this._grantItems(definition.grantedItems ?? []);

    for (const effect of definition.autoEffects ?? []) {
      await this._applyChoiceEffect(effect, definition.label);
    }
  }

  async _grantTrialsAndTravailsBenefits(definition) {
    await this._grantSkills(definition.startingSkills ?? []);
    await this._grantItems(definition.grantedItems ?? []);

    for (const effect of definition.autoEffects ?? []) {
      await this._applyChoiceEffect(effect, definition.label);
    }
  }

  async _grantMotivationBenefits(definition) {
    await this._grantSkills(definition.startingSkills ?? []);
    await this._grantItems(definition.grantedItems ?? []);

    for (const effect of definition.autoEffects ?? []) {
      await this._applyChoiceEffect(effect, definition.label);
    }
  }

  async _grantCareerBenefits(definition) {
    await this._grantSkills(definition.startingSkills ?? []);
    await this._grantItems(definition.grantedItems ?? []);

    for (const effect of definition.autoEffects ?? []) {
      await this._applyChoiceEffect(effect, definition.label);
    }
  }

  async _grantSkills(skillList) {
    for (const skillData of skillList) {
      let canonicalData = null;
      let skillDefinition = null;
      try {
        canonicalData = skillData.skillId ? buildSkillItemData(skillData.skillId, skillData) : null;
        skillDefinition = skillData.skillId ? getRogueTraderSkillDefinition(skillData.skillId) : null;
      } catch (error) {
        console.warn(`Rogue Trader | Failed to resolve canonical skill '${skillData.skillId}', falling back to provided skill data.`, error);
      }

      const skillName = canonicalData?.name ?? skillData.name ?? skillData.skillId ?? "Unknown Skill";
      const existingSkill = this.actor.items.find((item) => item.type === "skill" && item.name === skillName);
      if (existingSkill) {
        const resolvedCharacteristic = canonicalData?.system?.characteristic ?? skillData.characteristic ?? skillDefinition?.characteristic ?? existingSkill.system.characteristic ?? "intelligence";
        const resolvedBasic = canonicalData?.system?.basic ?? skillData.basic ?? skillDefinition?.basic ?? existingSkill.system.basic ?? false;
        const resolvedSpecialization = canonicalData?.system?.specialization ?? skillData.specialization ?? skillDefinition?.specialization ?? existingSkill.system.specialization ?? "";
        let trained = skillData.trained ?? existingSkill.system.trained ?? false;
        let advance10 = skillData.advance10 ?? existingSkill.system.advance10 ?? false;
        let advance20 = skillData.advance20 ?? existingSkill.system.advance20 ?? false;

        if (skillData.increaseOneLevel) {
          if (!trained) {
            trained = true;
          } else if (!advance10) {
            advance10 = true;
          } else if (!advance20) {
            advance20 = true;
          }
        }

        await existingSkill.update({
          "system.characteristic": resolvedCharacteristic,
          "system.basic": resolvedBasic,
          "system.trained": trained,
          "system.advance10": advance10,
          "system.advance20": advance20,
          "system.specialization": resolvedSpecialization
        });
        continue;
      }

      const itemData = canonicalData ?? {
        name: skillName,
        type: "skill",
        system: {
          characteristic: skillData.characteristic ?? "intelligence",
          basic: Boolean(skillData.basic),
          trained: Boolean(skillData.increaseOneLevel || skillData.trained),
          advance10: Boolean(skillData.advance10),
          advance20: Boolean(skillData.advance20),
          bonus: 0,
          specialization: skillData.specialization ?? ""
        }
      };

      await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }

  _getCompendiumPackIdsForItem(itemData, itemType) {
    if (itemData.source?.pack) return [itemData.source.pack];

    if (["mutation", "malignancy", "mentalDisorder", "criticalInjury", "navigatorPower", "psychicPower", "psychicTechnique"].includes(itemType)) {
      return ["roguetrader.character-creation-options"];
    }

    if (itemType && itemType !== "talent") {
      return ["roguetrader.equipment"];
    }

    return [];
  }

  _getCompatibleCompendiumItemTypes(requestedType) {
    if (!requestedType || requestedType === "talent") return [];

    const physicalTypes = ["weapon", "armor", "gear", "tool", "consumable", "cybernetic", "ammunition", "modification"];
    if (!physicalTypes.includes(requestedType)) return [requestedType];

    return [
      requestedType,
      ...physicalTypes.filter((type) => type !== requestedType)
    ];
  }

  _normalizeCompendiumItemName(name) {
    return String(name ?? "")
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/\bmutation\b/g, " ")
      .replace(/\bmalignancy\b/g, " ")
      .replace(/\bcritical injury\b/g, " ")
      .replace(/\bmental disorder\b/g, " ")
      .replace(/\barmour\b/g, "armor")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  _scoreCompendiumNameMatch(requestedName, candidateName) {
    const requestedRaw = String(requestedName ?? "").trim();
    const candidateRaw = String(candidateName ?? "").trim();
    const requested = this._normalizeCompendiumItemName(requestedRaw);
    const candidate = this._normalizeCompendiumItemName(candidateRaw);

    if (!requested || !candidate) return 0;
    if (candidateRaw === requestedRaw) return 100;
    if (candidate.toLowerCase() === requested.toLowerCase()) return 95;
    if (candidate === requested) return 90;
    if (candidate.startsWith(requested) || requested.startsWith(candidate)) return 80;

    const requestedTokens = requested.split(" ").filter(Boolean);
    const candidateTokens = candidate.split(" ").filter(Boolean);
    if (!requestedTokens.length || !candidateTokens.length) return 0;

    const overlapping = requestedTokens.filter((token) => candidateTokens.includes(token)).length;
    const coverage = overlapping / requestedTokens.length;

    if (coverage === 1) return 70;
    if (coverage >= 0.75) return 50;
    if (coverage >= 0.5) return 25;
    return 0;
  }

  async _findCompendiumItemData(itemData, itemType) {
    const requestedName = itemData.source?.name ?? itemData.name;
    if (!requestedName || itemType === "talent") return null;

    const requestedType = itemData.source?.type ?? itemType;
    const compatibleTypes = this._getCompatibleCompendiumItemTypes(requestedType);
    for (const packId of this._getCompendiumPackIdsForItem(itemData, itemType)) {
      const pack = game.packs?.get(packId);
      if (!pack) continue;

      const index = await pack.getIndex();
      const exactEntry = index.find((entry) => {
        const sameName = String(entry.name ?? "") === String(requestedName);
        const sameType = !requestedType || String(entry.type ?? "") === String(requestedType);
        return sameName && sameType;
      });

      const fallbackEntry = exactEntry ?? index.find((entry) => {
        const sameName = String(entry.name ?? "").toLowerCase() === String(requestedName).toLowerCase();
        const sameType = !requestedType || String(entry.type ?? "") === String(requestedType);
        return sameName && sameType;
      });

      let matchedEntry = fallbackEntry;
      if (!matchedEntry) {
        const candidates = index
          .map((entry) => {
            const entryType = String(entry.type ?? "");
            const typeIndex = requestedType ? compatibleTypes.indexOf(entryType) : 0;
            if (requestedType && typeIndex === -1) return null;

            return {
              entry,
              score: this._scoreCompendiumNameMatch(requestedName, entry.name),
              typePriority: typeIndex === -1 ? Number.MAX_SAFE_INTEGER : typeIndex
            };
          })
          .filter(Boolean)
          .filter((result) => result.score >= 70)
          .sort((a, b) =>
            b.score - a.score
            || a.typePriority - b.typePriority
            || String(a.entry.name ?? "").length - String(b.entry.name ?? "").length
          );

        matchedEntry = candidates[0]?.entry ?? null;
      }

      if (!matchedEntry) continue;

      const document = await pack.getDocument(matchedEntry._id);
      if (!document) continue;
      return document.toObject();
    }

    return null;
  }

  _applyCompendiumItemOverrides(baseItemData, itemData) {
    const clone = foundry.utils.deepClone(baseItemData);
    const itemType = clone.type;

    if (itemData.name && !itemData.source?.name && itemData.name !== clone.name) {
      clone.name = itemData.name;
    }

    if (!clone.system) clone.system = {};

    if (itemData.availability !== undefined) clone.system.availability = itemData.availability;
    if (itemData.craftsmanship !== undefined) clone.system.craftsmanship = itemData.craftsmanship;
    if (itemData.weight !== undefined) clone.system.weight = itemData.weight;

    if (itemType === "weapon") {
      if (itemData.class !== undefined) clone.system.class = itemData.class;
      if (itemData.weaponType !== undefined) clone.system.weaponType = itemData.weaponType;
      if (itemData.range !== undefined) clone.system.range = itemData.range;
      if (itemData.rof !== undefined) clone.system.rof = itemData.rof;
      if (itemData.damage !== undefined) clone.system.damage = itemData.damage;
      if (itemData.penetration !== undefined) clone.system.penetration = itemData.penetration;
      if (itemData.clip !== undefined) clone.system.clip = itemData.clip;
      if (itemData.currentClip !== undefined) clone.system.currentClip = itemData.currentClip;
      if (itemData.reload !== undefined) clone.system.reload = itemData.reload;
      if (itemData.special !== undefined) clone.system.special = itemData.special;
    } else if (itemType === "armor") {
      if (itemData.armorType !== undefined) clone.system.armorType = itemData.armorType;
      if (itemData.locations !== undefined) clone.system.locations = itemData.locations;
      if (itemData.ap !== undefined) clone.system.ap = itemData.ap;
      if (itemData.special !== undefined) clone.system.special = itemData.special;
    } else if (itemType === "gear" || itemType === "consumable" || itemType === "tool" || itemType === "cybernetic") {
      if (itemData.shortDescription !== undefined && !clone.system.shortDescription) clone.system.shortDescription = itemData.shortDescription;
    } else if (itemType === "talent") {
      if (itemData.category !== undefined) clone.system.category = itemData.category;
      if (itemData.rating !== undefined) clone.system.rating = itemData.rating;
      if (itemData.prerequisites !== undefined) clone.system.prerequisites = itemData.prerequisites;
      if (itemData.benefit !== undefined) clone.system.benefit = itemData.benefit;
      if (itemData.description !== undefined) clone.system.description = itemData.description;
    }

    return clone;
  }

  async _promptForNavigatorCreationPower({ title, excludeOwned = false, excludeFavoured = false } = {}) {
    const pack = game.packs?.get("roguetrader.character-creation-options");
    if (!pack || pack.documentName !== "Item") {
      ui.notifications?.warn("Rogue Trader | Navigator power compendium could not be found.");
      return null;
    }

    const ownedNames = new Set(
      (excludeOwned ? this.actor.items.filter((item) => item.type === "navigatorPower") : [])
        .map((item) => String(item.name ?? "").trim().toLowerCase())
    );
    const favouredNames = new Set(
      (excludeFavoured ? this.actor.items.filter((item) => item.name?.startsWith("Favoured Navigator Power: ")) : [])
        .map((item) => String(item.name ?? "").replace(/^Favoured Navigator Power:\s*/i, "").trim().toLowerCase())
    );

    const documents = await pack.getDocuments();
    const options = documents
      .filter((item) => item.type === "navigatorPower")
      .filter((item) => !ownedNames.has(String(item.name ?? "").trim().toLowerCase()))
      .filter((item) => !favouredNames.has(String(item.name ?? "").trim().toLowerCase()))
      .map((item) => {
        const itemData = item.toObject();
        delete itemData._id;
        return {
          id: item.id,
          label: item.name,
          itemData
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    if (!options.length) {
      ui.notifications?.warn("Rogue Trader | No navigator power options were available for that selection.");
      return null;
    }

    const optionMarkup = options.map((option) => `<option value="${option.id}">${foundry.utils.escapeHTML(option.label)}</option>`).join("");

    return new Promise((resolve) => {
      let finished = false;
      const finish = (value) => {
        if (finished) return;
        finished = true;
        resolve(value);
      };

      new Dialog({
        title: title ?? "Choose Navigator Power",
        content: `
          <form class="roguetrader-advance-choice-form">
            <div class="form-group">
              <label>Selection</label>
              <select name="choice">${optionMarkup}</select>
            </div>
          </form>
        `,
        buttons: {
          choose: {
            label: "Choose",
            callback: (html) => {
              const selectedId = html.find('[name=\"choice\"]').val();
              finish(options.find((option) => option.id === selectedId) ?? null);
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "choose",
        close: () => finish(null)
      }).render(true);
    });
  }

  async _grantItems(itemList) {
    for (const itemData of itemList) {
      let canonicalData = null;
      let talentDefinition = null;
      const requestedType = itemData.type ?? "talent";

      try {
        canonicalData = itemData.talentId ? buildTalentItemData(itemData.talentId, itemData) : null;
        talentDefinition = itemData.talentId ? getRogueTraderTalentDefinition(itemData.talentId) : null;
      } catch (error) {
        console.warn(`Rogue Trader | Failed to resolve canonical talent '${itemData.talentId}', falling back to provided item data.`, error);
      }

      const itemType = canonicalData?.type ?? requestedType;
      const compendiumData = canonicalData ? null : await this._findCompendiumItemData(itemData, itemType);

      let newItem = canonicalData
        ?? (compendiumData ? this._applyCompendiumItemOverrides(compendiumData, itemData) : null);

      const itemName = newItem?.name ?? itemData.name ?? itemData.talentId ?? "Unknown Item";
      const existing = this.actor.items.find((item) => item.type === (newItem?.type ?? itemType) && item.name === itemName);
      if (existing && !itemData.allowDuplicates) continue;

      if (!newItem) {
        if (itemType !== "talent") {
          const warning = `Rogue Trader | No compendium item found for '${itemData.name ?? itemData.source?.name ?? "Unknown Item"}' (${itemType}); using fallback item data.`;
          console.warn(warning);
          ui.notifications?.warn(warning);
        }
        if (itemType === "weapon") {
          newItem = {
            name: itemName,
            type: "weapon",
            system: {
              description: itemData.description ?? "",
              equipped: false,
              availability: itemData.availability ?? "average",
              craftsmanship: itemData.craftsmanship ?? "common",
              class: itemData.class ?? "basic",
              weaponType: itemData.weaponType ?? "solid",
              range: itemData.range ?? 0,
              rof: itemData.rof ?? "S/0/0",
              damage: itemData.damage ?? "1d10+0 I",
              penetration: itemData.penetration ?? 0,
              clip: itemData.clip ?? 0,
              currentClip: itemData.currentClip ?? itemData.clip ?? 0,
              reload: itemData.reload ?? "full",
              weight: itemData.weight ?? 0,
              special: itemData.special ?? {}
            }
          };
        } else if (itemType === "armor") {
          newItem = {
            name: itemName,
            type: "armor",
            system: {
              description: itemData.description ?? "",
              equipped: false,
              availability: itemData.availability ?? "average",
              craftsmanship: itemData.craftsmanship ?? "common",
              armorType: itemData.armorType ?? "carapace",
              locations: itemData.locations ?? {
                arms: false,
                body: false,
                legs: false,
                head: false
              },
              ap: itemData.ap ?? {
                arms: 0,
                body: 0,
                legs: 0,
                head: 0
              },
              weight: itemData.weight ?? 0,
              special: itemData.special ?? {}
            }
          };
        } else if (itemType === "gear" || itemType === "consumable" || itemType === "tool" || itemType === "cybernetic") {
          newItem = {
            name: itemName,
            type: itemType,
            system: {
              description: itemData.description ?? "",
              equipped: false,
              availability: itemData.availability ?? "average",
              craftsmanship: itemData.craftsmanship ?? "common",
              weight: itemData.weight ?? 0,
              shortDescription: itemData.shortDescription ?? itemData.benefit ?? ""
            }
          };
        } else if (itemType === "mutation" || itemType === "malignancy" || itemType === "mentalDisorder" || itemType === "criticalInjury") {
          newItem = {
            name: itemName,
            type: itemType,
            system: {
              description: itemData.description ?? "",
              equipped: false,
              availability: itemData.availability ?? "average",
              craftsmanship: itemData.craftsmanship ?? "common",
              summary: itemData.summary ?? itemData.benefit ?? "",
              severity: itemData.severity ?? "",
              sourceTable: itemData.sourceTable ?? "",
              rollRange: itemData.rollRange ?? "",
              notes: itemData.notes ?? ""
            }
          };
        } else {
          newItem = {
            name: itemName,
            type: "talent",
            system: {
              category: itemData.category ?? talentDefinition?.category ?? "talent",
              rating: itemData.rating ?? "",
              prerequisites: itemData.prerequisites ?? talentDefinition?.prerequisites ?? "",
              benefit: itemData.benefit ?? talentDefinition?.benefit ?? "",
              description: itemData.description ?? talentDefinition?.description ?? itemData.benefit ?? talentDefinition?.benefit ?? ""
            }
          };
        }
      }

      await this.actor.createEmbeddedDocuments("Item", [newItem]);
    }
  }

  _shouldRecordChoiceAsItem(option) {
    return Boolean(option?.recordChoice);
  }

  async _recordLureOfTheVoidChoice(definition, option) {
    if (!this._shouldRecordChoiceAsItem(option)) return;
    const name = `Lure of the Void: ${option.name}`;
    const existing = this.actor.items.find((item) => item.type === "talent" && item.name === name);
    if (existing) return;
    const summary = summarizeChoiceOption(option);

    await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type: "talent",
      system: {
        category: "trait",
        rating: "",
        prerequisites: "",
        benefit: summary.join("; ") || `Selected ${option.name} from ${definition.label}.`,
        description: `This records the chosen Lure of the Void option: ${option.name} from ${definition.label}.${summary.length ? ` Effects: ${summary.join("; ")}.` : ""}`
      }
    }]);
  }

  async _recordTrialsAndTravailsChoice(definition, option) {
    if (!this._shouldRecordChoiceAsItem(option)) return;
    const name = `Trials & Travails: ${option.name}`;
    const existing = this.actor.items.find((item) => item.type === "talent" && item.name === name);
    if (existing) return;
    const summary = summarizeChoiceOption(option);

    await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type: "talent",
      system: {
        category: "trait",
        rating: "",
        prerequisites: "",
        benefit: summary.join("; ") || `Selected ${option.name} from ${definition.label}.`,
        description: `This records the chosen Trials & Travails option: ${option.name} from ${definition.label}.${summary.length ? ` Effects: ${summary.join("; ")}.` : ""}`
      }
    }]);
  }

  async _recordMotivationChoice(definition, option) {
    if (!this._shouldRecordChoiceAsItem(option)) return;
    const name = `Motivation: ${option.name}`;
    const existing = this.actor.items.find((item) => item.type === "talent" && item.name === name);
    if (existing) return;
    const summary = summarizeChoiceOption(option);

    await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type: "talent",
      system: {
        category: "trait",
        rating: "",
        prerequisites: "",
        benefit: summary.join("; ") || `Selected ${option.name} from ${definition.label}.`,
        description: `This records the chosen Motivation option: ${option.name} from ${definition.label}.${summary.length ? ` Effects: ${summary.join("; ")}.` : ""}`
      }
    }]);
  }

  async _recordCareerChoice(definition) {
    const name = `Career: ${definition.label}`;
    const existing = this.actor.items.find((item) => item.type === "talent" && item.name === name);
    if (existing) return;

    await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type: "talent",
      system: {
        category: "trait",
        rating: "",
        prerequisites: "",
        benefit: definition.overview?.[0] ?? `Selected the ${definition.label} career.`,
        description: [
          `This records the selected career: ${definition.label}.`,
          definition.overview?.length ? `Overview: ${definition.overview.join(" ")}` : "",
          definition.startingSkillsInfo?.length ? `Starting Skills: ${definition.startingSkillsInfo.join(" ")}` : "",
          definition.startingEquipmentInfo?.length ? `Starting Equipment: ${definition.startingEquipmentInfo.join(" ")}` : "",
          definition.specialAbilityInfo?.length ? `Special Ability: ${definition.specialAbilityInfo.join(" ")}` : ""
        ].filter(Boolean).join("\n\n")
      }
    }]);
  }

  async _recordCareerOptionChoice(definition, option) {
    if (!this._shouldRecordChoiceAsItem(option)) return;
    const name = `Career Option: ${option.name}`;
    const existing = this.actor.items.find((item) => item.type === "talent" && item.name === name);
    if (existing) return;
    const summary = summarizeChoiceOption(option);

    await this.actor.createEmbeddedDocuments("Item", [{
      name,
      type: "talent",
      system: {
        category: "trait",
        rating: "",
        prerequisites: "",
        benefit: summary.join("; ") || `Selected ${option.name} from ${definition.label}.`,
        description: `This records the chosen Career option: ${option.name} from ${definition.label}.${summary.length ? ` Effects: ${summary.join("; ")}.` : ""}`
      }
    }]);
  }

  async _onChooseHomeWorldOption(event) {
    event.preventDefault();
    const choiceKey = event.currentTarget.dataset.choiceKey;
    const homeWorldKey = this._getHomeWorldState().selected;
    const definition = HOME_WORLD_DEFINITIONS[homeWorldKey];
    const choice = definition?.specialChoices?.find((entry) => entry.key === choiceKey);
    if (!choice) return;

    const existingChoice = this._getHomeWorldState().specialChoice;
    if (existingChoice) {
      ui.notifications?.warn("Rogue Trader | A Home World special choice has already been selected.");
      return;
    }

    if (choice.type === "characteristicBonus" && choice.characteristicKey) {
      const currentValue = Number(this.actor.system.characteristics?.[choice.characteristicKey]?.value ?? 0);
      await this.actor.update({
        [`system.characteristics.${choice.characteristicKey}.value`]: currentValue + Number(choice.amount ?? 0),
        "system.advancement.originPath.homeWorld.specialChoice": choiceKey
      });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: Home World Choice</h3>
            <p><strong>Choice:</strong> ${choice.name}</p>
            <p><strong>Effect:</strong> ${choice.benefit}</p>
          </div>
        `
      });

      this.sheet.render(false);
      this.render(false);
      return;
    }

    const existingTalent = this.actor.items.find((item) => item.type === "talent" && item.name === choice.name);
    if (!existingTalent) {
      await this.actor.createEmbeddedDocuments("Item", [{
        name: choice.name,
        type: "talent",
        system: {
          category: choice.category,
          rating: "",
          prerequisites: "",
          benefit: choice.benefit,
          description: choice.benefit
        }
      }]);
    }

    await this.actor.update({ "system.advancement.originPath.homeWorld.specialChoice": choiceKey });
    this.sheet.render(false);
    this.render(false);
  }

  async _onChooseBirthrightOption(event) {
    event.preventDefault();
    const groupKey = event.currentTarget.dataset.groupKey;
    const optionKey = event.currentTarget.dataset.optionKey;
    const birthrightKey = this._getBirthrightState().selected;
    const definition = BIRTHRIGHT_DEFINITIONS[birthrightKey];
    const group = definition?.choices?.find((entry) => entry.key === groupKey);
    const option = group?.options?.find((entry) => entry.key === optionKey);
    if (!group || !option) return;

    const existingChoice = this._getBirthrightState().choices?.[groupKey];
    if (existingChoice) {
      ui.notifications?.warn("Rogue Trader | That Birthright choice has already been selected.");
      return;
    }

    await this._applyChoiceEffect(option, definition.label);
    await this.actor.update({
      [`system.advancement.originPath.birthright.choices.${groupKey}`]: optionKey
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _onChooseLureOfTheVoidOption(event) {
    event.preventDefault();
    const groupKey = event.currentTarget.dataset.groupKey;
    const optionKey = event.currentTarget.dataset.optionKey;
    const lureKey = this._getLureOfTheVoidState().selected;
    const definition = LURE_OF_THE_VOID_DEFINITIONS[lureKey];
    const group = definition?.choices?.find((entry) => entry.key === groupKey);
    const option = group?.options?.find((entry) => entry.key === optionKey);
    if (!group || !option) return;

    const existingChoice = this._getLureOfTheVoidState().choices?.[groupKey];
    if (existingChoice) {
      ui.notifications?.warn("Rogue Trader | That Lure of the Void choice has already been selected.");
      return;
    }

    try {
      await this._applyChoiceEffect(option, definition.label);
      await this.actor.update({
        [`system.advancement.originPath.lureOfTheVoid.choices.${groupKey}`]: optionKey
      });
      await this._recordLureOfTheVoidChoice(definition, option);
    } catch (error) {
      console.error("Rogue Trader | Failed to apply Lure of the Void choice.", error);
      ui.notifications?.error("Rogue Trader | Failed to apply that Lure of the Void choice. Check the console for details.");
      return;
    }

    this.sheet.render(false);
    this.render(false);
  }

  async _onChooseTrialsAndTravailsOption(event) {
    event.preventDefault();
    const groupKey = event.currentTarget.dataset.groupKey;
    const optionKey = event.currentTarget.dataset.optionKey;
    const trialsKey = this._getTrialsAndTravailsState().selected;
    const definition = TRIALS_AND_TRAVAILS_DEFINITIONS[trialsKey];
    const group = definition?.choices?.find((entry) => entry.key === groupKey);
    const option = group?.options?.find((entry) => entry.key === optionKey);
    if (!group || !option) return;

    const existingChoice = this._getTrialsAndTravailsState().choices?.[groupKey];
    if (existingChoice) {
      ui.notifications?.warn("Rogue Trader | That Trials & Travails choice has already been selected.");
      return;
    }

    try {
      await this._applyChoiceEffect(option, definition.label);
      await this.actor.update({
        [`system.advancement.originPath.trialsAndTravails.choices.${groupKey}`]: optionKey
      });
      await this._recordTrialsAndTravailsChoice(definition, option);
    } catch (error) {
      console.error("Rogue Trader | Failed to apply Trials & Travails choice.", error);
      ui.notifications?.error("Rogue Trader | Failed to apply that Trials & Travails choice. Check the console for details.");
      return;
    }

    this.sheet.render(false);
    this.render(false);
  }

  async _onChooseMotivationOption(event) {
    event.preventDefault();
    const groupKey = event.currentTarget.dataset.groupKey;
    const optionKey = event.currentTarget.dataset.optionKey;
    const motivationKey = this._getMotivationState().selected;
    const definition = MOTIVATION_DEFINITIONS[motivationKey];
    const group = definition?.choices?.find((entry) => entry.key === groupKey);
    const option = group?.options?.find((entry) => entry.key === optionKey);
    if (!group || !option) return;

    const existingChoice = this._getMotivationState().choices?.[groupKey];
    if (existingChoice) {
      ui.notifications?.warn("Rogue Trader | That Motivation choice has already been selected.");
      return;
    }

    try {
      await this._applyChoiceEffect(option, definition.label);
      await this.actor.update({
        [`system.advancement.originPath.motivation.choices.${groupKey}`]: optionKey
      });
      await this._recordMotivationChoice(definition, option);
    } catch (error) {
      console.error("Rogue Trader | Failed to apply Motivation choice.", error);
      ui.notifications?.error("Rogue Trader | Failed to apply that Motivation choice. Check the console for details.");
      return;
    }

    this.sheet.render(false);
    this.render(false);
  }

  async _onChooseCareerOption(event) {
    event.preventDefault();
    const groupKey = event.currentTarget.dataset.groupKey;
    const optionKey = event.currentTarget.dataset.optionKey;
    const careerKey = this._getCareerState().selected;
    const definition = CAREER_DEFINITIONS[careerKey];
    const group = definition?.choices?.find((entry) => entry.key === groupKey);
    const option = group?.options?.find((entry) => entry.key === optionKey);
    if (!group || !option) return;

    const existingChoice = this._getCareerState().choices?.[groupKey];
    if (existingChoice) {
      ui.notifications?.warn("Rogue Trader | That Career choice has already been selected.");
      return;
    }

    try {
      await this._applyChoiceEffect(option, definition.label);
      await this.actor.update({
        [`system.advancement.career.choices.${groupKey}`]: optionKey
      });
      await this._recordCareerOptionChoice(definition, option);
    } catch (error) {
      console.error("Rogue Trader | Failed to apply Career choice.", error);
      ui.notifications?.error("Rogue Trader | Failed to apply that Career choice. Check the console for details.");
      return;
    }

    this.sheet.render(false);
    this.render(false);
  }

  async _applyChoiceEffect(option, sourceLabel) {
    const summary = summarizeChoiceOption(option);

    if (option.type === "characteristicBonus" && option.characteristicKey) {
      const currentValue = Number(this.actor.system.characteristics?.[option.characteristicKey]?.value ?? 0);
      await this.actor.update({
        [`system.characteristics.${option.characteristicKey}.value`]: currentValue + Number(option.amount ?? 0)
      });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: ${sourceLabel} Choice</h3>
            <p><strong>Choice:</strong> ${option.name}</p>
            ${summary.length ? `<p><strong>Effect:</strong> ${summary.join("; ")}</p>` : ""}
          </div>
        `
      });
      return;
    }

      if (option.type === "item" && option.item) {
        await this._grantItems([option.item]);
        return;
      }

      if (option.type === "navigatorPowerGrant") {
        const selectedPower = await this._promptForNavigatorCreationPower({
          title: option.name ?? "Choose Navigator Power",
          excludeOwned: true
        });
        if (!selectedPower) return;

        await this._grantItems([selectedPower.itemData]);
        option.name = selectedPower.label;
        option.benefit = `Gain ${selectedPower.label} as an additional Navigator Power.`;
        return;
      }

      if (option.type === "navigatorPowerFocus") {
        const selectedPower = await this._promptForNavigatorCreationPower({
          title: option.name ?? "Choose Favoured Navigator Power",
          excludeOwned: false,
          excludeFavoured: true
        });
        if (!selectedPower) return;

        const focusItem = {
          name: `Favoured Navigator Power: ${selectedPower.label}`,
          type: "talent",
          category: "specialAbility",
          benefit: `Gain +10 to tests with ${selectedPower.label}; others suffer -10 to resist it.`,
          description: `The unstable gifts of the Renegade bloodline grant a peculiar affinity with ${selectedPower.label}. You gain +10 to tests with this power in addition to mastery bonuses, and all tests by others to resist it suffer -10.`
        };

        await this._grantItems([focusItem]);
        option.name = selectedPower.label;
        option.benefit = `Favoured Power: ${selectedPower.label}. Gain +10 to tests with it, and others suffer -10 to resist it.`;
        return;
      }

      if (option.type === "skill" && option.skill) {
        await this._grantSkills([option.skill]);
        return;
      }

    if (option.type === "skillAdvance" && option.skill) {
      await this._grantSkills([{ ...option.skill, increaseOneLevel: true }]);

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: ${sourceLabel} Choice</h3>
            <p><strong>Choice:</strong> ${option.name}</p>
            ${summary.length ? `<p><strong>Effect:</strong> ${summary.join("; ")}</p>` : ""}
          </div>
        `
      });
      return;
    }

    if (option.type === "resourceRoll" && option.formula && option.resourcePath) {
      const roll = await (new Roll(option.formula)).evaluate();
      const rolledAmount = Number(roll.total ?? 0);
      const currentValue = Number(foundry.utils.getProperty(this.actor, option.resourcePath) ?? 0);
      await this.actor.update({
        [option.resourcePath]: currentValue + rolledAmount
      });

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: ${sourceLabel}</h3>
            <p><strong>Choice:</strong> ${option.name}</p>
            <p><strong>Effect:</strong> +${rolledAmount} ${option.resourceLabel ?? "Points"}</p>
          </div>
        `
      });
      return;
    }

    if (option.type === "composite") {
      if (option.modifiers) {
        const updateData = {};
        for (const [characteristicKey, amount] of Object.entries(option.modifiers)) {
          const currentValue = Number(this.actor.system.characteristics?.[characteristicKey]?.value ?? 0);
          updateData[`system.characteristics.${characteristicKey}.value`] = currentValue + Number(amount ?? 0);
        }
        if (Object.keys(updateData).length) {
          await this.actor.update(updateData);
        }
      }

      if (option.updates) {
        const updateData = {};
        for (const [path, amount] of Object.entries(option.updates)) {
          const currentValue = Number(foundry.utils.getProperty(this.actor, path) ?? 0);
          updateData[path] = currentValue + Number(amount ?? 0);
        }
        if (Object.keys(updateData).length) {
          await this.actor.update(updateData);
        }
      }

      await this._grantSkills(option.skills ?? []);
      await this._grantItems(option.items ?? []);

      for (const conditional of option.conditionalItems ?? []) {
        const currentValue = Number(this.actor.system.characteristics?.[conditional.characteristicKey]?.value ?? 0);
        if (currentValue >= Number(conditional.min ?? 0) && conditional.item) {
          await this._grantItems([conditional.item]);
        }
      }

      for (const rollEffect of option.rolls ?? []) {
          await this._applyChoiceEffect({ ...rollEffect, type: "resourceRoll", name: option.name }, sourceLabel);
        }

        for (const effect of option.effects ?? []) {
          await this._applyChoiceEffect({ ...effect, name: effect.name ?? option.name }, sourceLabel);
        }

        await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: ${sourceLabel} Choice</h3>
            <p><strong>Choice:</strong> ${option.name}</p>
            ${summary.length ? `<p><strong>Effect:</strong> ${summary.join("; ")}</p>` : ""}
          </div>
        `
      });
      return;
    }

    if (option.type === "mutationRoll") {
      const roll = await (new Roll(option.formula ?? "1d100")).evaluate();
      const total = Number(roll.total ?? 0);
      const resolvedEntry = resolveReferenceTableResult("mutations", total);
      const mutationItem = buildReferenceTableItemData("mutations", total, {
        type: "mutation"
      });

      if (mutationItem) {
        await this._grantItems([mutationItem]);
      }

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `
          <div class="roguetrader-roll-card">
            <h3>${this.actor.name}: ${sourceLabel}</h3>
            <p><strong>Choice:</strong> ${option.name}</p>
            <p><strong>Mutation Roll:</strong> ${total}</p>
            <p><strong>Effect:</strong> ${resolvedEntry?.name ?? "Recorded mutation result; exact table entry pending reference data."}</p>
          </div>
        `
      });
      return;
    }

    if (option.type === "referenceTableRoll" && option.tableKey) {
      const roll = await (new Roll(option.formula ?? "1d100")).evaluate();
      const total = Number(roll.total ?? 0);
      const resolvedEntry = resolveReferenceTableResult(option.tableKey, total);
      if (option.tableKey === "heirloomItems" && resolvedEntry?.name) {
        await this._grantItems([{
          name: resolvedEntry.name,
          type: resolvedEntry.itemType ?? "gear",
          source: {
            name: resolvedEntry.name,
            type: resolvedEntry.itemType ?? "gear"
          }
        }]);
      } else {
        const tableItem = buildReferenceTableItemData(option.tableKey, total, {
          category: option.category
        });

        if (tableItem) {
          await this._grantItems([{
            ...tableItem,
            sourceLabel
          }]);
        }
      }

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<strong>${sourceLabel}</strong>: rolled ${total} on the ${option.tableLabel ?? option.tableKey} table.${resolvedEntry ? ` Granted <em>${resolvedEntry.name}</em>.` : ""}`
      });
      return;
    }
  }

  async _onRollHomeWorldWounds(event) {
    event.preventDefault();
    const characteristicsLocked = Boolean(this.actor.system.advancement?.startingCharacteristics?.locked);
    if (!characteristicsLocked) {
      ui.notifications?.warn("Rogue Trader | Confirm and lock starting characteristics before rolling starting Wounds.");
      return;
    }

    const state = this._getHomeWorldState();
    if (!state.confirmed) return;
    if (state.startingWoundsRolled) {
      ui.notifications?.warn("Rogue Trader | Starting Wounds have already been rolled.");
      return;
    }

    const definition = HOME_WORLD_DEFINITIONS[state.selected];
    const startingWoundsConfig = definition?.startingWounds;
    if (!startingWoundsConfig?.extraRollFormula) {
      ui.notifications?.warn("Rogue Trader | Starting Wounds are not configured for that Home World yet.");
      return;
    }

    const toughnessBonus = this.actor.getCharacteristicBonus?.("toughness") ?? Math.floor(Number(this.actor.system.characteristics?.toughness?.value ?? 0) / 10);
    const bonusRoll = await (new Roll(startingWoundsConfig.extraRollFormula)).evaluate();
    const total = (toughnessBonus * 2) + Number(bonusRoll.total ?? 0);

    await this.actor.update({
      "system.resources.wounds.value": total,
      "system.resources.wounds.max": total,
      "system.advancement.originPath.homeWorld.startingWounds": total,
      "system.advancement.originPath.homeWorld.startingWoundsRolled": true
    });

    await bonusRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Starting Wounds</h3>
          <p><strong>Home World:</strong> ${definition?.label ?? "Unknown"}</p>
          <p><strong>Formula:</strong> ${startingWoundsConfig.formulaLabel ?? "(TB x 2) + Roll"}</p>
          <p><strong>Toughness Bonus:</strong> ${toughnessBonus}</p>
          <p><strong>Total Wounds:</strong> ${total}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }

  async _onRollHomeWorldFate(event) {
    event.preventDefault();
    const state = this._getHomeWorldState();
    if (!state.confirmed) return;
    if (state.startingFateRolled) {
      ui.notifications?.warn("Rogue Trader | Starting Fate has already been rolled.");
      return;
    }

    const definition = HOME_WORLD_DEFINITIONS[state.selected];
    const startingFateConfig = definition?.startingFate;
    if (!startingFateConfig?.rollFormula || !startingFateConfig?.thresholds?.length) {
      ui.notifications?.warn("Rogue Trader | Starting Fate is not configured for that Home World yet.");
      return;
    }

    const roll = await (new Roll(startingFateConfig.rollFormula)).evaluate();
    const rollTotal = Number(roll.total ?? 0);
    const fate =
      startingFateConfig.thresholds.find((threshold) => rollTotal <= Number(threshold.max))?.value ??
      Number(startingFateConfig.thresholds.at(-1)?.value ?? 0);

    await this.actor.update({
      "system.resources.fate.value": fate,
      "system.resources.fate.max": fate,
      "system.advancement.originPath.homeWorld.startingFate": fate,
      "system.advancement.originPath.homeWorld.startingFateRolled": true
    });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
        <div class="roguetrader-roll-card">
          <h3>${this.actor.name}: Starting Fate Points</h3>
          <p><strong>Home World:</strong> ${definition?.label ?? "Unknown"}</p>
          <p><strong>Roll:</strong> ${rollTotal}</p>
          <p><strong>Starting Fate:</strong> ${fate}</p>
        </div>
      `
    });

    this.sheet.render(false);
    this.render(false);
  }
}



