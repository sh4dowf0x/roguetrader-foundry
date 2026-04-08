const PSYCHIC_PHENOMENA_TABLE = [
  { min: 1, max: 3, name: "Dark Foreboding", effect: "A faint breeze blows past and everyone nearby feels that somewhere in the galaxy, something unfortunate just happened." },
  { min: 4, max: 5, name: "Warp Echo", effect: "For a few seconds, all noises cause echoes regardless of the surroundings." },
  { min: 6, max: 8, name: "Unholy Stench", effect: "The air around the psyker becomes permeated with a bizarre and foul smell." },
  { min: 9, max: 11, name: "Mind Warp", effect: "The psyker suffers 1 Insanity Point as negative emotions surge to the surface." },
  { min: 12, max: 14, name: "Hoarfrost", effect: "The temperature plummets and a thin coating of frost covers everything within 3d10 metres." },
  { min: 15, max: 17, name: "Aura of Taint", effect: "Animals within 1d100 metres become spooked and agitated; Psyniscience can pinpoint the psyker as the cause." },
  { min: 18, max: 20, name: "Memory Worm", effect: "All people within line of sight of the psyker forget something trivial." },
  { min: 21, max: 23, name: "Spoilage", effect: "Food and drink go bad in a 5d10 metre radius." },
  { min: 24, max: 26, name: "Haunting Breeze", effect: "Winds whip up around the psyker for a few seconds, blowing light objects about and guttering fires within 3d10 metres." },
  { min: 27, max: 29, name: "Veil of Darkness", effect: "For the remainder of the round, the area within 3d10 metres is plunged into immediate darkness." },
  { min: 30, max: 32, name: "Distorted Reflections", effect: "Mirrors and other reflective surfaces within 5d10 metres distort or shatter." },
  { min: 33, max: 35, name: "Breath Leech", effect: "Everyone nearby, including the psyker, becomes short of breath for one round and cannot Run or Charge." },
  { min: 36, max: 38, name: "Daemonic Mask", effect: "For a fleeting moment the psyker takes on a daemonic appearance, gains Fear 1 for the round, and suffers 1 Corruption Point." },
  { min: 39, max: 41, name: "Unnatural Decay", effect: "All plant-life within 3d10 metres of the psyker withers and dies." },
  { min: 42, max: 44, name: "Spectral Gale", effect: "Howling winds erupt within 4d10 metres, requiring an Easy (+30) Agility or Strength Test to avoid being knocked prone." },
  { min: 45, max: 47, name: "Bloody Tears", effect: "Blood weeps from stone and wood within 3d10 metres; faces in art and statuary appear to cry blood." },
  { min: 48, max: 50, name: "The Earth Protests", effect: "The ground shakes suddenly; everyone within 5d10 metres must make a Routine (+10) Agility Test or be knocked down." },
  { min: 51, max: 53, name: "Psy Discharge", effect: "Static electricity fills the air for 5d10 metres, hair stands on end, and unprotected electronics short out." },
  { min: 54, max: 56, name: "Warp Ghosts", effect: "Ghostly apparitions fill the area for a few moments; everyone nearby except the psyker must test against Fear (1)." },
  { min: 57, max: 59, name: "Falling Upwards", effect: "Everything within 2d10 metres, including the psyker, rises 1d10 metres before crashing back down." },
  { min: 60, max: 62, name: "Banshee Howl", effect: "A shrill keening rings out; mortals nearby must pass a Challenging (+0) Toughness Test or be deafened for 1d10 rounds." },
  { min: 63, max: 65, name: "The Furies", effect: "The psyker is assailed by unseen horrors, slammed down, suffers 1d5 Wounds, and must test against Fear (2)." },
  { min: 66, max: 68, name: "Shadow of the Warp", effect: "Reality twists and everyone within 1d100 metres must make a Difficult (-10) Willpower Test or gain 1d5 Insanity Points." },
  { min: 69, max: 71, name: "Tech Scorn", effect: "Nearby unwarded tech malfunctions, ranged weapons jam, and characters with cybernetics must pass a Routine (+10) Toughness Test or suffer 1d5 damage." },
  { min: 72, max: 74, name: "Warp Madness", effect: "All creatures within 2d10 metres except the psyker become Frenzied for a round and suffer 1d5 Corruption Points unless they pass a Difficult (-10) Willpower Test." }
];

const PERILS_OF_THE_WARP_TABLE = [
  { min: 1, max: 5, name: "The Gibbering", effect: "The psyker must make a Challenging (+0) Willpower Test or suffer 1d5+1 Insanity Points and be stunned for 1d5 rounds." },
  { min: 6, max: 9, name: "Warp Burn", effect: "A violent burst of warp energy smashes into the psyker's mind; he suffers 1d5 Wounds and is stunned for 1d5 rounds." },
  { min: 10, max: 13, name: "Psychic Concussion", effect: "The psyker is knocked unconscious for 1d5 rounds and everyone within 3d10 metres must make a Routine (+10) Willpower Test or be stunned for one round." },
  { min: 14, max: 18, name: "Psy-Blast", effect: "There is an explosion of power and the psyker is thrown 1d10 metres into the air before crashing down." },
  { min: 19, max: 24, name: "Soul Sear", effect: "Warp power scorches the psyker's soul; he cannot use any powers for one hour and suffers 5 Corruption Points." },
  { min: 25, max: 30, name: "Locked In", effect: "The psyker falls catatonic in an ethereal prison and must spend full actions testing Willpower each round to escape." },
  { min: 31, max: 38, name: "Chronological Incontinence", effect: "The psyker winks out of existence and reappears in 1d10 rounds, suffering 1d5 Insanity Points and 1d5 permanent Toughness damage." },
  { min: 39, max: 46, name: "Psychic Mirror", effect: "The power rebounds on the psyker; hostile powers affect him normally, while beneficial ones are canceled and inflict 1d10+5 Energy damage ignoring armour unless warded." },
  { min: 47, max: 55, name: "Warp Whispers", effect: "Terrible voices fill the area; everyone nearby must make a Hard (-20) Willpower Test or suffer 1d10 Corruption Points." },
  { min: 56, max: 58, name: "Vice Versa", effect: "The psyker's mind swaps bodies with a random nearby creature or person for 1d10 rounds, with dangerous consequences if either body dies." },
  { min: 59, max: 67, name: "Dark Summoning", effect: "A Warp Predator tears into existence within 3d10 metres for 1d10 rounds or until slain." },
  { min: 68, max: 72, name: "Rending the Veil", effect: "Everyone within 1d100 metres must test against Fear (3) as reality frays with daemonic visions for 1d5 rounds." },
  { min: 73, max: 78, name: "Blood Rain", effect: "A psychic storm erupts in a 5d10 metre area; everyone must pass a Challenging (+0) Strength Test or be knocked prone, and all psychic powers there automatically invoke Perils for 1d5 rounds." },
  { min: 79, max: 82, name: "Cataclysmic Blast", effect: "Warp power overloads violently; everyone within 1d10 metres takes 1d10+5 Energy damage and the psyker may use no further powers for 1d5 hours." },
  { min: 83, max: 86, name: "Mass Possession", effect: "Daemons invade every living thing within 1d100 metres; each character must resist as if attacked by the Puppet Master technique." },
  { min: 87, max: 90, name: "Reality Quake", effect: "Reality buckles in a 3d10 metre radius and everything in the area takes 2d10 Rending damage; warded objects and Untouchables halve the damage." },
  { min: 91, max: 99, name: "Lost to the Warp", effect: "The psyker must make an immediate Very Hard (-30) Willpower Test or be dragged into the warp, suffering 4d10 Corruption Points even on survival." },
  { min: 100, max: 100, name: "Destruction", effect: "The psyker is immediately and irrevocably destroyed; there is a 50% chance a daemonic entity appears in his place." }
];

function resolveTableEntry(table, total) {
  return table.find((entry) => total >= entry.min && total <= entry.max) ?? null;
}

export function getPsychicPhenomenaEntry(total) {
  if (total >= 75) {
    return {
      min: 75,
      max: 100,
      name: "Perils of the Warp",
      effect: "Roll on the Perils of the Warp table instead."
    };
  }

  return resolveTableEntry(PSYCHIC_PHENOMENA_TABLE, total);
}

export function getPerilsOfTheWarpEntry(total) {
  const normalizedTotal = total === 0 ? 100 : total;
  return resolveTableEntry(PERILS_OF_THE_WARP_TABLE, normalizedTotal);
}

