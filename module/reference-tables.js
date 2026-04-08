const REFERENCE_TABLE_DEFINITIONS = Object.freeze({
  mutations: {
    key: "mutations",
    label: "Mutations",
    defaultCategory: "trait",
    entries: [
      {
        min: 1,
        max: 5,
        name: "Grotesque",
        benefit: "-20 Fellowship to interact with normals; +10 Intimidate.",
        description: "The mutant is badly deformed, scarred, or bestial, marking them as accursed and impure. The mutant takes a -20 penalty on Fellowship Tests made to interact with 'normals,' but gains a +10 bonus to Intimidate Tests."
      },
      {
        min: 6,
        max: 10,
        name: "Tough Hide",
        benefit: "Gain Natural Armour 2.",
        description: "The mutant gains the Natural Armour 2 Trait from dense skin and thick scar tissue."
      },
      {
        min: 11,
        max: 15,
        name: "Misshapen",
        benefit: "Cannot run; reduce Agility by 2d10.",
        description: "The mutant's spine and limbs are horribly twisted. The mutant may no longer run and reduces its Agility by 2d10."
      },
      {
        min: 16,
        max: 20,
        name: "Feels No Pain",
        benefit: "Gain +5 Wounds and Iron Jaw.",
        description: "The mutant cares little for injury or harm. It gains +5 Wounds and the Iron Jaw Talent."
      },
      {
        min: 21,
        max: 25,
        name: "Brute",
        benefit: "Increase Strength and Toughness by 10 each.",
        description: "The mutant is physically powerful, with deformed masses of slab-like muscle. Increase its Strength and Toughness Characteristics by 10 each."
      },
      {
        min: 26,
        max: 30,
        name: "Nightsider",
        benefit: "Gain Dark Sight; -10 to tests in bright light unless shielded.",
        description: "The mutant gains keen eyesight, allowing it to see clearly in areas of low light. It gains the Dark Sight Trait, but takes a -10 penalty to all tests when in the area of bright light, unless its eyes are shielded and skin covered."
      },
      {
        min: 31,
        max: 35,
        name: "Mental Regressive",
        benefit: "Roll 1d10 for Int/Per/WP/Fel changes; gain 1d10 Insanity.",
        description: "The mutant has regressed mentally. Roll 1d10 for Intelligence, Perception, Willpower, and Fellowship separately. On a 1-5, reduce the Characteristic by 1d10; on a 6-7, halve the Characteristic; on an 8-9, there is no change; on a 10, reduce the Characteristic to 5. The mutant also gains 1d10 Insanity Points."
      },
      {
        min: 36,
        max: 40,
        name: "Malformed Hands",
        benefit: "-10 Weapon Skill and Ballistic Skill; -20 to fine manipulation tests.",
        description: "The mutant's hands fuse into slab-like appendages. Reduce its Weapon Skill and Ballistic Skill by 10. Furthermore, the mutant takes a -20 penalty to any test requiring fine physical manipulation."
      },
      {
        min: 41,
        max: 45,
        name: "Tox Blood",
        benefit: "+20 resist poison; reduce Toughness and Intelligence by 1d10; contact poisons others.",
        description: "The mutant's system is saturated with toxic pollutants and poisonous chemicals. It gains a +20 bonus to Toughness Tests made to resist poison, but reduces its Toughness and Intelligence Characteristics by 1d10. Should the mutant's blood come into contact with a living creature, that creature must succeed on a Difficult (-10) Toughness Test or take 1d10 points of damage that ignores Armour and Toughness."
      },
      {
        min: 46,
        max: 50,
        name: "Hulking",
        benefit: "Gain Hulking Size; +10 Strength; +5 Wounds.",
        description: "The mutant grows in stature and body-mass. It gains the Hulking Size Trait, increases its Strength Characteristic by 10 and gains +5 Wounds."
      },
      {
        min: 51,
        max: 55,
        name: "Wyrdling",
        benefit: "Gain Psy Rating 2 or next Psy Rating, plus 2 Psychic Techniques.",
        description: "The mutant has minor psychic powers that it has so far been able to conceal. The mutant gains the Psy Rating 2 Talent. If it already has this talent, it gains the next highest Psy Rating talent that it doesn't have. The mutant gains 2 Psychic Techniques of its choice from the discipline of its choice."
      },
      {
        min: 56,
        max: 59,
        name: "Vile Deformity",
        benefit: "Gain Fear 1.",
        description: "The mutant is marked by some terrible deformity that shows the touch of the Warp and should not exist in a rational universe. The mutant gains the Fear 1 Trait."
      },
      {
        min: 60,
        max: 63,
        name: "Aberration",
        benefit: "+10 Strength and Agility; -1d10 Intelligence; -10 Fellowship.",
        description: "The mutant has become a weird hybrid of man and animal (or reptile, insect, or some other beast). The mutant increases its Strength and Agility by +10, reduces its Intelligence by -1d10, and its Fellowship by -10."
      },
      {
        min: 64,
        max: 67,
        name: "Degenerate Mind",
        benefit: "Reduce Intelligence and Fellowship by 1d10; roll for Frenzy, Fearless, or From Beyond.",
        description: "The mutant's mind is Warped and inhuman. Reduce its Intelligence and Fellowship each by -1d10. Also, roll 1d10. On a 1-3, it gains the Frenzy talent; on a 4-7, it gains the Fearless talent; on an 8-0, it gains the From Beyond Trait."
      },
      {
        min: 68,
        max: 71,
        name: "Ravaged Body",
        benefit: "Roll 1d5 times on this table.",
        description: "The mutant's body has been entirely remade by the Warp. Roll 1d5 times on this table. Such mutations, regardless of their nature, still show the obvious touch of Chaos."
      },
      {
        min: 72,
        max: 74,
        name: "Clawed/Fanged",
        benefit: "Gain a Natural Weapon trait (either I or R damage).",
        description: "The mutant gains razor claws, a fanged maw, barbed flesh or some other form of natural weapon. It gains the Natural Weapon Trait (either I or R damage)."
      },
      {
        min: 75,
        max: 78,
        name: "Necrophage",
        benefit: "+10 Toughness; gain Regeneration; must sustain itself on raw meat or carrion.",
        description: "The mutant gains +10 to Toughness and the Regeneration Trait, but must sustain itself on copious quantities of raw meat or starve."
      },
      {
        min: 79,
        max: 81,
        name: "Corrupted Flesh",
        benefit: "When taking critical damage, gain Fear 2 for that round.",
        description: "Beneath the mutant's skin a blasphemous transformation has taken place exchanging living organs for writhing creatures and blood for ichorous, maggot-ridden filth. Whenever the mutant takes critical damage, it gains Fear 2 for that round."
      },
      {
        min: 82,
        max: 85,
        name: "Venomous",
        benefit: "Natural attacks gain Toxic.",
        description: "The mutant's natural attacks are toxic. It gains the Toxic Trait."
      },
      {
        min: 86,
        max: 89,
        name: "Hideous Strength",
        benefit: "Gain Unnatural Strength.",
        description: "The mutant gains the Unnatural Strength Trait."
      },
      {
        min: 90,
        max: 91,
        name: "Multiple Appendages",
        benefit: "Gain Ambidextrous, Two-Weapon Wielder, +10 Climb, +10 grapple attacks.",
        description: "The mutant has sprouted additional functioning limbs in the shape of arms, tentacles or a prehensile tail (or tails). It gains the Ambidextrous and Two Weapon Wielder talents, and a +10 bonus on Climb Tests and grapple attacks."
      },
      {
        min: 92,
        max: 93,
        name: "Worm",
        benefit: "Gain +5 Wounds and Crawler.",
        description: "The mutant's lower limbs have fused together to form a worm or snake-like tail. The mutant gains 5 extra Wounds and the Crawler Trait."
      },
      {
        min: 94,
        max: 94,
        name: "Nightmarish",
        benefit: "Gain Fear 3.",
        description: "So warped and horrific is the mutant's appearance it can cause enemies to flee in fear. It gains the Fear 3 Trait."
      },
      {
        min: 95,
        max: 95,
        name: "Malleable",
        benefit: "+10 Agility; +20 Climb and grapple; can fit through very small spaces.",
        description: "The mutant possesses a sickeningly liquid flexibility and is able to distend and flatten its body. Increase its Agility by 10. It gains a +20 bonus on Climb Tests and grappling attacks. Also, it may fit through spaces as small as one-quarter its usual body dimensions."
      },
      {
        min: 96,
        max: 96,
        name: "Winged",
        benefit: "Gain Flyer at AB x 2.",
        description: "The mutant's body has warped to accommodate a pair of leathery wings or the like. It gains the Flyer Trait at a rate equal to its AB x 2."
      },
      {
        min: 97,
        max: 97,
        name: "Corpulent",
        benefit: "+5 Wounds; gain Unnatural Toughness; may no longer run.",
        description: "The mutant's huge and bloated frame gives it +5 Wounds and the Unnatural Toughness Trait. It may no longer take the Run action."
      },
      {
        min: 98,
        max: 98,
        name: "Shadow Kin",
        benefit: "Gain Phase; -10 Strength and Toughness.",
        description: "The mutant has only a tenuous grip on our reality and, though wasted and gaunt, can slip partly into the Warp at will. It gains the Phase Trait and decreases its Strength and Toughness Characteristics by 10."
      },
      {
        min: 99,
        max: 99,
        name: "Corrosive Bile",
        benefit: "Ranged vomit attack deals 1d10+2 R (or E) Tearing Damage; requires BS; full action; can be dodged but not parried.",
        description: "The mutant may vomit burning bile, flesh-eating grubs, or some other horrific substance instead of attacking normally in close combat. The mutant must test Ballistic Skill to use this mutation. Using it is a full action. It can be dodged, but not parried. On a successful test, the attack deals 1d10+2 R (or E) Tearing Damage."
      },
      {
        min: 100,
        max: 100,
        name: "Hellspawn",
        benefit: "Gain Daemonic, Fear 2, and From Beyond.",
        description: "Saturated with the energies of the Warp, the mutant is more than part daemon, gaining the Daemonic, Fear (2), and From Beyond Traits."
      }
    ]
  },
  navigatorMutations: {
    key: "navigatorMutations",
    label: "Navigator Mutations",
    defaultCategory: "trait",
    entries: [
      {
        min: 1,
        max: 15,
        name: "Strangely Jointed Limbs",
        benefit: "Gain Contortionist as a trained Basic Skill; if already known, gain Talented (Contortionist) instead.",
        description: "The navigator's limbs have extra joints that articulate differently to a normal human. Gain the Contortionist Skill as a trained Basic Skill. If the character already possesses the Contortionist Skill, gain the Talented (Contortionist) Talent instead."
      },
      {
        min: 16,
        max: 30,
        name: "Elongated Form",
        benefit: "Lose 1d5 Toughness permanently; re-roll if already Bloated Form.",
        description: "The navigator becomes extremely tall and painfully thin, losing 1d5 Toughness permanently. Re-roll this mutation if the character already has the Bloated Form mutation."
      },
      {
        min: 31,
        max: 45,
        name: "Pale and Hairless Flesh",
        benefit: "Skin turns pale and marbled; body becomes completely without hair.",
        description: "The navigator's skin turns pale and marbled with veins, and the body becomes completely without hair."
      },
      {
        min: 46,
        max: 55,
        name: "Eyes as Dark as the Void",
        benefit: "Gain the Dark Sight Trait.",
        description: "The navigator's eyes become completely black and without iris. Gain the Dark Sight Trait."
      },
      {
        min: 56,
        max: 60,
        name: "Withered Form",
        benefit: "Reduce Strength by 10 permanently and halve movement; re-roll if already Bloated Form.",
        description: "The navigator's body is withered, flesh hanging loosely from the bones. Reduce Strength by 10 permanently and halve movement rates. Re-roll this mutation if the character already has the Bloated Form mutation."
      },
      {
        min: 61,
        max: 65,
        name: "Bloated Form",
        benefit: "+5 Wounds and Sturdy, but may no longer run; re-roll if already Elongated Form or Withered Form.",
        description: "The navigator's body grows grossly bloated and the limbs thicken with flesh. Gain +5 Wounds and the Sturdy Trait, but the character may no longer run. Re-roll this mutation if the character already has Elongated Form or Withered Form."
      },
      {
        min: 66,
        max: 70,
        name: "Membranous Growths",
        benefit: "Suffer -5 Fellowship permanently.",
        description: "Membranes of skin spread between the navigator's limbs and digits and skin sags in folds from the flesh. Suffer -5 Fellowship permanently."
      },
      {
        min: 71,
        max: 75,
        name: "Inhuman Visage",
        benefit: "Gain Fear (1).",
        description: "The navigator's face is devoid of human features, with only slits, holes, and unblinking eyes remaining. Gain the Fear (1) Trait."
      },
      {
        min: 76,
        max: 80,
        name: "Fingers like Talons",
        benefit: "Gain the Natural Weapons Trait.",
        description: "The bones of the navigator's fingers grow long, harden, and sharpen into talons. Gain the Natural Weapons Trait."
      },
      {
        min: 81,
        max: 85,
        name: "Teeth as Sharp as Needles",
        benefit: "Gain Natural Weapons and suffer -1d5 Fellowship.",
        description: "The navigator's mouth fills with hundreds of fine, pointed teeth. Gain the Natural Weapons Trait and suffer -1d5 Fellowship."
      },
      {
        min: 86,
        max: 90,
        name: "Disturbing Grace",
        benefit: "Gain Unnatural Agility (2).",
        description: "The navigator moves with a fluid, sinuous grace that is unpleasant and unnatural in its quality. Gain the Unnatural Agility (2) Trait."
      },
      {
        min: 91,
        max: 95,
        name: "Strange Vitality",
        benefit: "Gain the Regeneration Trait.",
        description: "The navigator possesses a vitality and resilience that is at odds with the physical form. Wounds bleed translucent fluid and close quickly, while bones knit together after horrifying breaks. Gain the Regeneration Trait."
      },
      {
        min: 96,
        max: 100,
        name: "Unnatural Presence",
        benefit: "-10 to positive social interaction tests; +10 to intimidation and fear-inducing tests.",
        description: "Living beings feel strange sensations around the navigator: a cloying touch on the skin, a keening whine in the ears, and a metallic tang in the mouth. All tests involving positive social interaction are at -10, while all those involving intimidation or inducing fear are at +10."
      }
    ]
  },
  shockTable: {
    key: "shockTable",
    label: "Shock Table",
    defaultCategory: "reference",
    entries: [
      {
        min: 1,
        max: 20,
        name: "Badly Startled",
        benefit: "Only one Half Action next Turn; then acts normally.",
        description: "The character is badly startled. He may only take a single Half Action in his next Turn, but afterwards he may act normally."
      },
      {
        min: 21,
        max: 40,
        name: "Shaken",
        benefit: "-10 to all Tests for the rest of the encounter unless he snaps out of it.",
        description: "Fear grips the character and he begins to shake and tremble. He is at a -10 penalty on all Tests for the rest of the encounter unless he can recover his wits."
      },
      {
        min: 41,
        max: 60,
        name: "Reeling with Shock",
        benefit: "Cannot willingly approach the object of fear; otherwise acts normally at -10 to all Tests until encounter ends; gain 1 Insanity Point.",
        description: "Reeling with shock, the character backs away from the thing that confronts him. The character cannot willingly approach the object of his fear, but may otherwise act normally, with a -10 penalty on all Tests until the end of the encounter. The character gains 1 Insanity Point."
      },
      {
        min: 61,
        max: 80,
        name: "Frozen by Terror",
        benefit: "May take no Actions until he snaps out of it; afterwards -10 to all Tests for the rest of the encounter; gain 1d5 Insanity Points.",
        description: "The character is frozen by terror. The character may make no Actions until he snaps out of it. After snapping out of it, the character will make all Tests with a -10 penalty for the rest of the encounter. The character gains 1d5 Insanity Points."
      },
      {
        min: 81,
        max: 100,
        name: "Panic",
        benefit: "Must flee source of fear if able; otherwise only Half Actions and -20 to all Tests; gain 1d5 Insanity Points.",
        description: "Panic grips the character. He must flee the source of his fear, if able, as fast as he can, and if prevented from doing so, he may only take Half Actions and is at a -20 penalty to all Tests. The character gains 1d5 Insanity Points. Once away from the danger, he must successfully snap out of it to regain control."
      },
      {
        min: 101,
        max: 120,
        name: "Faints Dead Away",
        benefit: "Falls unconscious for 1d5 Rounds; afterwards -10 to all Tests for the rest of the encounter; gain 1d5 Insanity Points.",
        description: "Fainting dead away, the character keels over and remains unconscious for 1d5 Rounds. Once he regains consciousness, he is still shaken and takes all Tests with a -10 penalty until the end of the encounter. The character gains 1d5 Insanity Points."
      },
      {
        min: 121,
        max: 130,
        name: "Totally Overcome",
        benefit: "Screams and vomits uncontrollably for 1d5 Rounds; helpless; afterwards only one Half Action each Turn until he can rest; gain 1d5 Insanity Points.",
        description: "Totally overcome, the character screams and vomits uncontrollably for 1d5 Rounds. During this time he is helpless, may do nothing and drop anything he is holding. Afterwards, until the end of the encounter, the character may only take a single Half Action each Turn until he can rest. The character gains 1d5 Insanity Points."
      },
      {
        min: 131,
        max: 140,
        name: "Manic Frenzy",
        benefit: "Laughs hysterically and attacks randomly until he snaps out of it or is knocked unconscious; gain 1d5 Insanity Points.",
        description: "The character laughs hysterically and randomly attacks anything near him in a manic frenzy, firing wildly or using whatever weapon he has to hand. This effect lasts until the character snaps out of it, or until he is knocked unconscious. The character gains 1d5 Insanity Points."
      },
      {
        min: 141,
        max: 160,
        name: "Collapsed in Gibbering Horror",
        benefit: "Falls to ground for 1d5+1 Rounds sobbing and babbling; may do nothing; afterwards -20 to all Tests until encounter ends; gain 1d5+1 Insanity Points.",
        description: "The character crumples to the ground for 1d5+1 Rounds sobbing, babbling, and tearing at his own flesh, and may do nothing. Even after he returns to his senses, he is a complete mess and at a -20 penalty on all Tests until the end of the encounter. The character gains 1d5+1 Insanity Points."
      },
      {
        min: 161,
        max: 170,
        name: "Catatonic",
        benefit: "Becomes catatonic for 1d5 hours and may not be roused; gain 1d10 Insanity Points.",
        description: "The character's mind snaps and he becomes catatonic for 1d5 hours and may not be roused. The character gains 1d10 Insanity Points."
      },
      {
        min: 171,
        max: 999,
        name: "Acute Hallucinations",
        benefit: "Suffers acute hallucinations for 2d10 Rounds; afterwards -20 to all Tests until encounter ends; gain 2d10 Insanity Points and 1d10 permanent Willpower damage.",
        description: "The character is so affected that he begins to see strange and terrible visions as his hold on reality shatters. The character suffers the effects of acute hallucinations for 2d10 Rounds. After the hallucinations fade, the character will make all Tests with a -20 penalty while the encounter lasts. The character gains 2d10 Insanity Points and takes 1d10 points of permanent Willpower damage."
      }
    ]
  },
  malignancies: {
    key: "malignancies",
    label: "Malignancies",
    defaultCategory: "trait",
    entries: [
      {
        min: 1,
        max: 10,
        name: "Palsy",
        benefit: "Reduce Agility by 1d10.",
        description: "The character suffers from numerous minor tics, shakes, and tremors with no medical cause. Reduce his Agility by 1d10."
      },
      {
        min: 11,
        max: 15,
        name: "Dark-hearted",
        benefit: "Reduce Fellowship by 1d10.",
        description: "The character grows increasingly cruel, callous, and vindictive. Reduce his Fellowship by 1d10."
      },
      {
        min: 16,
        max: 20,
        name: "Ill-fortuned",
        benefit: "On Fate Point use, roll 1d10; on 7-10 it has no effect but is still lost.",
        description: "Whenever the character uses a Fate Point, roll a d10. On a score of 7, 8, 9 or 10 it has no effect but is lost anyway."
      },
      {
        min: 21,
        max: 22,
        name: "Skin Afflictions",
        benefit: "-20 to Charm Tests.",
        description: "The character is plagued by boils, scabs, weeping sores, and the like. He takes a -20 penalty to all Charm Tests."
      },
      {
        min: 23,
        max: 25,
        name: "Night Eyes",
        benefit: "In bright light, suffer -10 to all Tests unless eyes are shielded.",
        description: "Light pains the character, and unless he shields his eyes, he suffers a -10 penalty on all Tests when in an area of bright light."
      },
      {
        min: 26,
        max: 30,
        name: "Morbid",
        benefit: "Reduce Intelligence by 1d10.",
        description: "The character finds it hard to concentrate as his mind is filled with macabre visions and tortured, gloom-filled trains of thought. The character's Intelligence is reduced by 1d10."
      },
      {
        min: 31,
        max: 33,
        name: "Witch-mark",
        benefit: "Develop a visible deformity or easily concealable mutation.",
        description: "The character develops some minor physical deformity or easily concealable mutation. It is small, but perhaps enough to consign him to the stake if found out by a fanatical witch hunter. He must hide it well!"
      },
      {
        min: 34,
        max: 45,
        name: "Fell Obsession",
        benefit: "Gain an obsession tied to a sinister or malign focus.",
        description: "This is the same as the Obsession Disorder. However, in this case the character is obsessed by a sinister or malign focus, such as collecting finger-bone trophies, ritual scarification, carrying out meaningless vivisections, and similar fixations."
      },
      {
        min: 46,
        max: 50,
        name: "Hatred",
        benefit: "Develop implacable hatred of a single group, individual, or social class.",
        description: "The character develops an implacable hatred of a single group, individual, or social class. The character will never side with or aid them without explicit orders or other vital cause, and even then grudgingly."
      },
      {
        min: 51,
        max: 55,
        name: "Irrational Nausea",
        benefit: "Must test Toughness or suffer -10 to all Tests while near the object of revulsion.",
        description: "The character feels sick at the sight or sound of some otherwise innocuous thing such as prayer books and holy items, bare flesh, human laughter, fresh food, shellfish, and so forth. When he encounters the object of his revulsion, he must Test Toughness or suffer a -10 penalty to all Tests as long as he remains in its presence."
      },
      {
        min: 56,
        max: 60,
        name: "Wasted Frame",
        benefit: "Reduce Strength by 1d10.",
        description: "The character's pallor becomes corpse-like and his muscles waste away. The character's Strength is reduced by 1d10."
      },
      {
        min: 61,
        max: 63,
        name: "Night Terrors",
        benefit: "Plagued by daemonic visions during sleep.",
        description: "The character is plagued by daemonic visions in his sleep. See Horrific Nightmares for details."
      },
      {
        min: 64,
        max: 70,
        name: "Poor Health",
        benefit: "Reduce Toughness by 1d10.",
        description: "The character constantly suffers petty illnesses and phantom pains, and his wounds never seem to heal fully. The character's Toughness is reduced by 1d10."
      },
      {
        min: 71,
        max: 75,
        name: "Distrustful",
        benefit: "-10 Fellowship Tests when dealing with strangers.",
        description: "The character cannot conceal the distrust and antipathy he has for others. He must take a -10 penalty to Fellowship Tests when dealing with strangers."
      },
      {
        min: 76,
        max: 80,
        name: "Malign Sight",
        benefit: "Reduce Perception by 1d10.",
        description: "The world seems to darken, tarnish, and rot if the character looks too long at anything. The character's Perception is reduced by 1d10."
      },
      {
        min: 81,
        max: 83,
        name: "Ashen Taste",
        benefit: "Food and drink are disgusting; double the negative effects for levels of Fatigue.",
        description: "Food and drink hold disgusting tastes and offer little sustenance for the character, and he can barely stomach eating. The character doubles the negative effects for levels of Fatigue."
      },
      {
        min: 84,
        max: 90,
        name: "Bloodlust",
        benefit: "After being wounded in combat, must test Willpower to incapacitate or spare foes rather than kill them.",
        description: "Murderous rage is never far from the character's mind. After being wounded in combat, he must Test Willpower to incapacitate or allow his enemies to flee, rather than kill them outright, even if his intent is otherwise."
      },
      {
        min: 91,
        max: 93,
        name: "Blackouts",
        benefit: "Suffer unexplained blackouts; occurrence and consequences are up to the GM.",
        description: "The character suffers from inexplicable blackouts. When they occur and what happens during them is up to the GM."
      },
      {
        min: 94,
        max: 100,
        name: "Strange Addiction",
        benefit: "Addicted to a bizarre or unnatural substance; acts like a Minor Compulsion.",
        description: "The character is addicted to some bizarre and unnatural substance, such as eating rose petals, drinking blood, the taste of widows' tears, and similar cravings. This acts like a Minor Compulsion, but is freakish enough to cause serious suspicion if found out."
      }
    ]
  },
  mentalTraumas: {
    key: "mentalTraumas",
    label: "Mental Traumas",
    defaultCategory: "trait",
    entries: [
      {
        min: 1,
        max: 40,
        name: "Withdrawn and Quiet",
        benefit: "-10 to all Fellowship-based Tests for 3d10 hours.",
        description: "The character becomes withdrawn and quiet. The character is at -10 to all Fellowship-based Tests. This lasts for 3d10 hours."
      },
      {
        min: 41,
        max: 70,
        name: "Compulsive Action",
        benefit: "Must compulsively perform an action; -10 to Intelligence, Fellowship, and Perception Tests for 3d10 hours.",
        description: "The character must compulsively perform an action such as fevered praying, frantically cleaning a weapon, reciting verse, and so on, and pays little attention to anything else. All Tests that are based on Intelligence, Fellowship, or Perception suffer a -10 penalty. This effect lasts for 3d10 hours."
      },
      {
        min: 71,
        max: 100,
        name: "Jumpy and Fearful",
        benefit: "+10 to Perception-based Tests and -10 to Willpower for 1d5 days.",
        description: "The character is constantly fearful, seeing danger everywhere, and is extremely jumpy. The character gains a +10 bonus to all Perception-based Tests and a -10 penalty to his Willpower for the next 1d5 days."
      },
      {
        min: 101,
        max: 120,
        name: "Temporary Severe Phobia",
        benefit: "Suffers from a temporary severe phobia for 1d5 days.",
        description: "The character suffers from a temporary severe phobia. This effect lasts for 1d5 days."
      },
      {
        min: 121,
        max: 130,
        name: "Agitated Under Pressure",
        benefit: "First pass a Willpower Test before any Test; combat Tests take -10 for 1d5 days.",
        description: "The character reacts to the slightest stress or pressure by becoming extremely agitated. When performing any task that involves a Test, the character must first pass a Willpower Test or suffer a -10 modifier to the Test. If the character gets into combat, all Tests during combat automatically suffer a -10 modifier. This effect lasts for 1d5 days."
      },
      {
        min: 131,
        max: 140,
        name: "Exhausting Nightmares",
        benefit: "Suffers vivid nightmares; gains 1 Fatigue each day for 1d10 days.",
        description: "The character suffers vivid and extreme nightmares whenever he tries to sleep. The next day and for the next 1d10 days, the character will be exhausted by lack of sleep and gains a level of fatigue. This effect lasts for 1d5 days."
      },
      {
        min: 141,
        max: 150,
        name: "Struck Dumb",
        benefit: "Unable to speak for 1d5 days.",
        description: "The character is struck dumb and is unable to speak. This lasts for 1d5 days."
      },
      {
        min: 151,
        max: 160,
        name: "Distressed and Unfocused",
        benefit: "-10 to all Characteristics for 1d10 days, to a minimum of 1.",
        description: "Extremely distressed and unfocused, the character refuses to eat or drink and looks in a terrible state. The character takes a -10 penalty to all Characteristics (no Characteristic can be reduced below 1) for 1d10 days."
      },
      {
        min: 161,
        max: 170,
        name: "Hysterically Blind or Deaf",
        benefit: "Temporarily becomes blind or deaf for 1d10 days.",
        description: "The character temporarily becomes hysterically blind or deaf. This effect lasts for 1d10 days."
      },
      {
        min: 171,
        max: 999,
        name: "Traumatised and Unresponsive",
        benefit: "Cannot initiate actions but may be gently led for 1d10 days.",
        description: "The character becomes completely traumatised and virtually unresponsive. He can't initiate actions but may be gently led. This effect lasts for 1d10 days."
      }
    ]
  },
  heirloomItems: {
    key: "heirloomItems",
    label: "Heirloom Items",
    defaultCategory: "gear",
    entries: [
      {
        min: 1,
        max: 20,
        name: "Archeotech Laspistol",
        itemType: "weapon",
        benefit: "Gain one best-Craftsmanship archeotech laspistol.",
        description: "A weapon of unknown origin and great antiquity. You gain one best-Craftsmanship archeotech laspistol."
      },
      {
        min: 21,
        max: 40,
        name: "Angevin Era Chainsword",
        itemType: "weapon",
        benefit: "Gain one Best-Craftsmanship chainsword.",
        description: "An ancient blade bearing Crusade purity seals and kill-marks, supposedly used against dire xenos in the cleansing of the Drusus Marches. You gain one Best-Craftsmanship chainsword."
      },
      {
        min: 41,
        max: 60,
        name: "Ancestral Seal",
        itemType: "gear",
        benefit: "+10 to Interaction Skill Tests when displayed while dealing with Imperial citizens or organisations.",
        description: "A potent and respected mark of power once held, passed down through a family even after their scions have long departed the vaults of Imperial rulership. You gain a +10% bonus to all Interaction Skill Tests when displaying the seal and dealing with Imperial citizens or organisations."
      },
      {
        min: 61,
        max: 80,
        name: "Saint-blessed Carapace Armour",
        itemType: "armor",
        benefit: "Gain one best-Craftsmanship set of carapace armour.",
        description: "A set of armour that once belonged to a saint's honour-guard. Anointed and inscribed with the saint's teachings, it is a sign to stir the faithful of the Imperial Creed. You gain one best-Craftsmanship set of carapace armour."
      },
      {
        min: 81,
        max: 100,
        name: "Reliquary of Saint Drusus",
        itemType: "gear",
        benefit: "+20 to Interaction Skill Tests when displayed while dealing with any member of the Ministorum.",
        description: "An inscribed void-steel canister containing a true relic of the saint, attested in Ecclesiarchy data-vaults. Such an artefact opens many doors in the Ministorum. You gain a +20% bonus to all Interaction Skill Tests when displaying the reliquary and dealing with any member of the Ministorum."
      }
    ]
  },
  criticalEffectsEnergyArm: {
    key: "criticalEffectsEnergyArm",
    label: "Energy Critical Effects - Arm",
    defaultCategory: "critical",
    damageType: "energy",
    location: "arm",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Numb and Tingling Arm",
        benefit: "Tests involving the arm are at -30 for 1 Round.",
        description: "A blast to the arm leaves it all numb and tingly. Tests made involving the arm are at -30 for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Useless Arm",
        benefit: "Arm is useless for 1d5 Rounds; take 1 Fatigue.",
        description: "The attack smashes the arm, sending currents of energy crackling down to the fingers and up to the shoulder. The arm is useless for 1d5 Rounds and the character takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Burned Arm",
        benefit: "Stunned 1 Round; 2 Fatigue; arm useless for 1d5 Rounds.",
        description: "The attack burns the target's arm leaving him Stunned for 1 Round and inflicts 2 levels of Fatigue. The arm is useless for 1d5 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Vomiting Shock",
        benefit: "Stunned 1 Round; 3 Fatigue; arm useless for 1d10 Rounds.",
        description: "The shock of the attack makes the target vomit. He is Stunned for 1 Round and takes 3 levels of Fatigue. The arm is useless for 1d10 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Scorched Arm",
        benefit: "WS and BS halved for 1 Round; take 1d5 Fatigue.",
        description: "The arm suffers superficial burns inflicting no small amount of pain on the target. The target's WS and BS are halved (round down) for 1 Round and the target takes 1d5 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Fused Fingers",
        benefit: "WS and BS halved for 1d10 Rounds; 1d5 Fatigue; may permanently lose use of the hand on failed Toughness Test.",
        description: "The attack wreathes the arm in flame, scorching clothing and armour, and temporarily fusing together the target's fingers. The target halves WS and BS for 1d10 Rounds, takes 1d5 levels of Fatigue, and must successfully Test Toughness or lose the use of the hand permanently.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Ruined Hand"
      },
      {
        min: 7,
        max: 7,
        name: "Shattered Arm",
        benefit: "Arm is broken until repaired; counts as only having one arm; Stunned 1 Round; 1d5 Fatigue.",
        description: "With a terrible snapping sound, the heat of the attack boils the marrow in the target's arm, causing it to shatter. The target's arm is broken and until it is repaired the target counts as only having one arm. The target is Stunned for 1 Round and also takes 1d5 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Arm"
      },
      {
        min: 8,
        max: 8,
        name: "Severed Arm",
        benefit: "Arm severed; Toughness Test or Stunned 1 Round; 1d10 Fatigue; Blood Loss; counts as only having one arm.",
        description: "Energy sears through the arm at the shoulder, causing the limb to be severed from the body. The target must take a Toughness Test or become Stunned for 1 Round. In addition the target takes 1d10 levels of Fatigue and is suffering from Blood Loss. The target now only has one arm.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Arm"
      },
      {
        min: 9,
        max: 9,
        name: "Arm Burned to the Bone",
        benefit: "Toughness Test or die from shock; if alive, 1d10 Fatigue, Stunned 1 Round, and only one arm remains.",
        description: "Fire consumes the target's arm, burning the flesh to a crisp right down to the bone. The target must make an immediate Toughness Test or die from shock. If he survives, however, the target takes 1d10 levels of Fatigue and is Stunned for 1 Round. The target now only has one arm.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Arm"
      },
      {
        min: 10,
        max: 10,
        name: "Arm Reduced to Ash",
        benefit: "Arm is reduced to ash and the target dies immediately.",
        description: "The attack reduces the arm to a cloud of ash and sends the target crumbling to the ground where he immediately dies from shock, clutching his smoking stump.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsEnergyBody: {
    key: "criticalEffectsEnergyBody",
    label: "Energy Critical Effects - Body",
    defaultCategory: "critical",
    damageType: "energy",
    location: "body",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Breath Stolen",
        benefit: "Can take only a Half Action next Turn.",
        description: "A blow to the target's body steals a breath from his lungs. The target can take only a Half Action on his next Turn.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Air Punched Out",
        benefit: "Take 1 Fatigue.",
        description: "The blast punches the air from the target's body, inflicting 1 level of Fatigue upon him.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Cooked Torso",
        benefit: "Take 2 Fatigue and be Stunned for 1 Round.",
        description: "The attack cooks the flesh on the chest and abdomen, inflicting 2 levels of Fatigue and leaving the target Stunned for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Scorched Body",
        benefit: "Take 1d10 Fatigue.",
        description: "The energy ripples all over the character, scorching his body and inflicting 1d10 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Knocked Down in Agony",
        benefit: "Knocked prone; Agility Test or catch fire; 1d5 Fatigue; must take Stand Action to get up.",
        description: "The fury of the attack forces the target to the ground, helplessly covering his face and keening in agony. The target is knocked to the ground and must make an Agility Test or catch fire. The target takes 1d5 levels of Fatigue and must take the Stand Action to regain his feet.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Reeling Burn",
        benefit: "Knocked prone; Stunned for 1d10 Rounds; 1d5 Fatigue; Agility Test or catch fire.",
        description: "Struck by the full force of the attack, the target is sent reeling to the ground, smoke spiralling out of the wound. The target is knocked to the ground, Stunned for 1d10 Rounds, and takes 1d5 levels of Fatigue. In addition, he must make an Agility Test or catch fire.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 7,
        max: 7,
        name: "Organs Cooked",
        benefit: "Stunned for 2d10 Rounds; Toughness is halved.",
        description: "The intense power of the energy attack cooks the target's organs, burning his lungs and heart with intense heat. The target is Stunned for 2d10 Rounds and reduces his Toughness by half (round down).",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Internal Organ Damage"
      },
      {
        min: 8,
        max: 8,
        name: "Hideously Scarred Torso",
        benefit: "Stunned for 2d10 Rounds; Strength, Toughness, and Agility halved; permanent scarring halves Fellowship.",
        description: "As the attack washes over the target, his skin turns black and peels off while bloody body fat seeps out of his clothing and armour. The target is Stunned for 2d10 Rounds and the attack halves his Strength, Toughness and Agility. The extensive scarring permanently halves the target's Fellowship characteristic.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Hideous Scarring"
      },
      {
        min: 9,
        max: 9,
        name: "Blackened Corpse",
        benefit: "The target is completely encased in fire and dies.",
        description: "The target is completely encased in fire, melting his skin and popping his eyes like superheated eggs. He falls to the ground a blackened corpse.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Detonating Corpse",
        benefit: "As above, plus carried ammunition may explode and grenades or missiles may detonate.",
        description: "As above, except in addition, if the target is carrying any ammunition, there is a 50% chance it explodes. Unless they can make a successful Dodge Test, all creatures within 1d5 metres take 1d10+5 Explosive Damage. If the target carried any grenades or missiles, one round after the Damage was dealt they detonate where the target's body lies with the normal effects.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsEnergyHead: {
    key: "criticalEffectsEnergyHead",
    label: "Energy Critical Effects - Head",
    defaultCategory: "critical",
    damageType: "energy",
    location: "head",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Frazzled Senses",
        benefit: "-10 to all Tests except Toughness for 1 Round.",
        description: "A grazing blow to the head frazzles the target's senses, imposing a -10 penalty to all Tests (except Toughness) for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Dazzled Blindness",
        benefit: "Blinded for 1 Round.",
        description: "The blast of energy dazzles the target, leaving him blinded for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Ear Cook-off",
        benefit: "Stunned for 1 Round and take 1 Fatigue.",
        description: "The attack cooks off the target's ear, leaving him Stunned for 1 Round and inflicting 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Burned Scalp",
        benefit: "Take 2 Fatigue and be blinded for 1d5 Rounds.",
        description: "The energy attack burns away all of the hairs on the target's head as well as leaving him reeling from the injury. The attack deals 2 levels of Fatigue and the target is blinded for 1d5 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Burned Face",
        benefit: "Blinded for 1d10 Rounds and take 3 Fatigue.",
        description: "A blast of energy envelopes the target's head, burning his face and hair, and causing him to scream like a stuck Grox. In addition to losing his hair, he is blinded for 1d10 Rounds and takes 3 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Blasted Eyes",
        benefit: "Blinded for 1d10 hours; permanently reduce Fellowship by 1d10; take 1d5 Fatigue.",
        description: "The attack cooks the target's face, melting his features and damaging his eyes. The target is blinded for the next 1d10 hours and permanently reduces his Fellowship characteristic by 1d10 points. The target also takes 1d5 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Blasted Eyes"
      },
      {
        min: 7,
        max: 7,
        name: "Burned to the Skull",
        benefit: "Permanently blinded; take 1d10 Fatigue; reset Fellowship to 1d10 unless already 10 or less.",
        description: "In a gruesome display, the flesh is burned from the target's head, exposing charred bone and muscle underneath. The target is blinded permanently and takes 1d10 levels of Fatigue. Also, roll 1d10. This is the target's new Fellowship, unless their Fellowship is already 10 or less, in which case nobody really notices the difference.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Permanent Blindness"
      },
      {
        min: 8,
        max: 8,
        name: "Head Destroyed",
        benefit: "Head is destroyed in a convocation of fiery death; target does not survive.",
        description: "The target's head is destroyed in a convocation of fiery death. He does not survive.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Exploding Brain",
        benefit: "Brain explodes and target is no more.",
        description: "Superheated by the attack, the target's brain explodes, tearing apart his skull and sending flaming chunks of meat flying at those nearby. The target is no more.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Headless Burning Corpse",
        benefit: "As above, but the body catches fire and runs headless 2d10 metres, igniting flammables.",
        description: "As above, except the target's entire body catches fire and runs off headless 2d10 metres in a random direction. Anything flammable it passes, including characters, must make an Agility Test or catch fire.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsEnergyLeg: {
    key: "criticalEffectsEnergyLeg",
    label: "Energy Critical Effects - Leg",
    defaultCategory: "critical",
    damageType: "energy",
    location: "leg",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Gasping Leg Hit",
        benefit: "Gain 1 Fatigue.",
        description: "A blow to the leg leaves the target gasping for air. The target gains 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Slowed Movement",
        benefit: "Halve all movement for 1 Round.",
        description: "A grazing strike against the leg slows the target for a bit. The target halves all movement for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Broken Leg Stagger",
        benefit: "Stunned for 1 Round and halve all movement for 1d5 Rounds.",
        description: "The blast breaks the target's leg leaving him Stunned for 1 Round and halving all movement for 1d5 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Leg Agony",
        benefit: "Take 1d5 Fatigue and halve all movement for 1d5 Rounds.",
        description: "A solid blow to the leg sends electric currents of agony coursing through the target. The target takes 1d5 levels of Fatigue and halves all movement for 1d5 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Burned Leg",
        benefit: "Take 1 Fatigue and move at half speed for 2d10 Rounds.",
        description: "The target's leg endures horrific burn Damage, fusing clothing and armour with flesh and bone. The target takes 1 level of Fatigue and moves at half speed for 2d10 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Ruined Foot",
        benefit: "Toughness Test or lose the foot; on success movement is halved until medical attention; take 2 Fatigue.",
        description: "The attack burns the target's foot, charring the flesh and emitting a foul aroma. The target must successfully Test Toughness or lose the foot. On a success, the target's movement rates are halved until he receives medical attention. In addition, the target takes 2 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Foot"
      },
      {
        min: 7,
        max: 7,
        name: "Fried Leg",
        benefit: "Leg is broken until repaired; counts as having lost the leg; Toughness Test or Stunned 1 Round; take 1d5 Fatigue; now only one leg remains.",
        description: "The energy attack fries the leg, leaving it a mess of blackened flesh. The leg is broken and until repaired, the target counts as having lost the leg. The target must take a Toughness Test or become Stunned for 1 Round. In addition the target gains 1d5 levels of Fatigue. The target now only has one leg.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Leg"
      },
      {
        min: 8,
        max: 8,
        name: "Severed Leg",
        benefit: "Leg severed; Toughness Test or Stunned 1 Round; 1d10 Fatigue; Blood Loss; now only one leg remains.",
        description: "Energy sears through the bone, causing the leg to be severed. The target must take a Toughness Test or become Stunned for 1 Round. In addition the target gains 1d10 levels of Fatigue and is suffering from Blood Loss. The target now only has one leg.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Leg"
      },
      {
        min: 9,
        max: 9,
        name: "Leg Reduced to Gristle",
        benefit: "Challenging (+0) Toughness Test or die from shock; leg is utterly lost.",
        description: "The force of the attack reduces the leg to little more than a chunk of sizzling gristle. The target make a Challenging (+0) Toughness Test or die from shock. The leg is utterly lost.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Leg"
      },
      {
        min: 10,
        max: 10,
        name: "Immolated from the Leg Up",
        benefit: "The leg immolates and the target dies in a matter of agonising seconds.",
        description: "In a terrifying display of power, the leg immolates and fire consumes the target completely. The target dies in a matter of agonising seconds.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsExplosiveArm: {
    key: "criticalEffectsExplosiveArm",
    label: "Explosive Critical Effects - Arm",
    defaultCategory: "critical",
    damageType: "explosive",
    location: "arm",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Jerking Limb",
        benefit: "Take 1 Fatigue.",
        description: "The attack throws the limb backwards, painfully jerking it away from the body, inflicting 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Fractured Limb",
        benefit: "Drop anything held in the hand and take 2 Fatigue.",
        description: "The attack sends a fracture through the limb. The target drops anything held in the hand and takes 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Missing Fingers",
        benefit: "Lose 1d5 fingers; take 3 Fatigue; anything carried in the hand is destroyed.",
        description: "The explosion takes 1d5 fingers from the target's hand. The target takes 3 levels of Fatigue and anything carried in the hand is destroyed. If this is an explosive, it goes off. Messy.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Missing Fingers"
      },
      {
        min: 4,
        max: 4,
        name: "Howling Wound",
        benefit: "Take 1d5 Fatigue, be Stunned for 1 Round, and the limb is useless until medical attention is received.",
        description: "The blast causes the target to howl in agony. He takes 1d5 levels of Fatigue, is Stunned for 1 Round, and the limb is useless until medical attention is received.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Ruined Hand",
        benefit: "Immediate Toughness Test or lose the hand; even on success the hand is useless until medical attention; take 1d5 Fatigue.",
        description: "Fragments from the explosion tear into the target's hand, ripping away flesh and muscle alike. He must immediately Test Toughness or lose the hand. Even on a success, the hand is useless until medical attention is received. The target takes 1d5 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Hand"
      },
      {
        min: 6,
        max: 6,
        name: "Mangled Arm",
        benefit: "Take 1d5 Fatigue; arm is broken until repaired; counts as only having one arm; suffers Blood Loss.",
        description: "The explosive attack shatters the bone and mangles the flesh turning the target's arm into a red ruin, inflicting 1d5 levels of Fatigue. The target's arm is broken and, until repaired, the target counts as having only one arm. In addition, the horrendous nature of the wound means that he now suffers from Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Arm"
      },
      {
        min: 7,
        max: 7,
        name: "Blown Apart Arm",
        benefit: "Challenging (+0) Toughness Test or die; on success be Stunned for 1d10 Rounds, take 1d10 Fatigue, suffer Blood Loss, and now only have one arm.",
        description: "In a violent hail of flesh, the arm is blown apart. The target must immediately make a Challenging (+0) Toughness Test or die from shock. On a success, the target is Stunned for 1d10 rounds, takes 1d10 levels of Fatigue, and suffers Blood Loss. He now only has one arm.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Arm"
      },
      {
        min: 8,
        max: 8,
        name: "Disintegrated Arm",
        benefit: "Arm disintegrates and the target dies in a pool of blood and organs.",
        description: "The arm disintegrates under the force of the explosion taking a good portion of the shoulder and chest with it. The target is sent screaming to the ground, where he dies in a pool of his own blood and organs.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Body Torn Open",
        benefit: "Target is instantly killed; carried power weapon source may explode for 1d10+5 Impact Damage within 2 metres.",
        description: "With a mighty bang the arm is blasted from the target's body, killing the target instantly in a rain of blood droplets. In addition, if the target was carrying a weapon with a power source in his hand (such as a power sword or chainsword) then it explodes, dealing 1d10+5 Impact Damage to anyone within two metres.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Detonating Arm Catastrophe",
        benefit: "As above, plus carried ammunition explodes within 1d10 metres and grenades or missiles detonate on the target's person.",
        description: "As above, except if the target is carrying any ammunition it explodes dealing 1d10+5 Impact Damage to anyone within 1d10 metres (this is in addition to Damage caused by exploding power weapons noted above). If the target is carrying any grenades or missiles, these too detonate on his person.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsExplosiveBody: {
    key: "criticalEffectsExplosiveBody",
    label: "Explosive Critical Effects - Body",
    defaultCategory: "critical",
    damageType: "explosive",
    location: "body",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Blown Back",
        benefit: "Blown backwards 1d5 metres and take 1 Fatigue per metre travelled; land Prone.",
        description: "The target is blown backwards 1d5 metres and takes 1 level of Fatigue per metre travelled. He is Prone when he lands.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Slammed Backwards",
        benefit: "Blown backwards 1d10 metres, taking 1 Fatigue per metre travelled; if striking a solid object, take 1d5 additional Fatigue.",
        description: "The target is blown backwards 1d10 metres, taking 1 level of Fatigue per metre travelled. If he strikes a solid object, he takes 1d5 additional levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Armor Shredded",
        benefit: "Armor protecting the body is destroyed; if unarmoured, blown backwards 1d10 metres; take 2 Fatigue for every metre travelled.",
        description: "The explosion destroys whatever armour protected the body. If the target wore none, the target is blown backwards 1d10 metres, as above, but the target takes 2 levels of Fatigue for every metre travelled.",
        persistent: true,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Sprawling Impact",
        benefit: "Take 1d5 Fatigue, be Stunned for 1 Round, and must spend a Full Action to regain feet.",
        description: "The explosion sends the target sprawling to the ground. He takes 1d5 levels of Fatigue, is Stunned for 1 Round, and must spend a Full Action to regain his feet.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Tenderised Innards",
        benefit: "Falls down Stunned for 1 Round and takes 1d10 Fatigue.",
        description: "Concussion from the explosion knocks the target to the ground and tenderises his innards. The target falls down Stunned for 1 Round and takes 1d10 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Weeping Wounds",
        benefit: "Stunned for 1 Round, take 1d10 Fatigue, and suffer Blood Loss.",
        description: "Chunks of the target's flesh are ripped free by the force of the attack leaving large, weeping wounds. The target is Stunned for 1 Round, takes 1d10 levels of Fatigue and is now suffering Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Blood-Loss Torso Trauma"
      },
      {
        min: 7,
        max: 7,
        name: "Ruptured Nerves",
        benefit: "Falls down, Stunned for 1d10 Rounds, takes 1d10 Fatigue, suffers Blood Loss, and can only take Half Actions for the next 1d10 hours.",
        description: "The explosive force of the attack ruptures the target's flesh and scrambles his nervous system, knocking him to the ground. The target falls down, is Stunned for 1d10 Rounds and takes 1d10 levels of Fatigue. In addition, he now suffers Blood Loss and can only take Half Actions for the next 1d10 hours as he tries to regain control of his body.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Nerve Damage"
      },
      {
        min: 8,
        max: 8,
        name: "Chest Explosion",
        benefit: "Chest explodes outward, killing the target instantly.",
        description: "The target's chest explodes outward, disgorging a river of partially cooked organs onto the ground, killing him instantly.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Torn to Gobbets",
        benefit: "Target is torn into bloody gobbets; carried ammunition explodes within 1d10 metres and grenades or missiles detonate on the target's person.",
        description: "Pieces of the target's body fly in all directions as he is torn into bloody gobbets by the attack. In addition, if the target is carrying any ammunition, it explodes dealing 1d10+5 Impact Damage to anyone within 1d10 metres. If the target is carrying any grenades or missiles, these too detonate on the target's person.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Gore-Drenched Blast",
        benefit: "As above; anyone within 1d10 metres must make a Challenging (+0) Agility Test or suffer -10 to WS and BS for 1 Round as blood fouls their sight.",
        description: "As above, except anyone within 1d10 metres of the target is drenched in gore and must make a Challenging (+0) Agility Test or suffer a -10 penalty to Weapon Skill and Ballistic Skill Tests for 1 Round as blood fouls their sight.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsExplosiveHead: {
    key: "criticalEffectsExplosiveHead",
    label: "Explosive Critical Effects - Head",
    defaultCategory: "critical",
    damageType: "explosive",
    location: "head",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Confused by Blast",
        benefit: "Can take only a Half Action next Turn and takes 1 Fatigue.",
        description: "The explosion leaves the target confused. He can take only a Half Action on his next Turn and takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Blind and Deaf for a Moment",
        benefit: "Blind and deaf for 1 Round; take 2 Fatigue.",
        description: "The flash and noise leaves the target blind and deaf for 1 Round. The target takes 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Face Full of Shrapnel",
        benefit: "Take 2 Fatigue.",
        description: "The detonation leaves the target's face a bloody ruin from scores of small cuts. The target takes 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Burst Shock",
        benefit: "Knocked to the ground, Stunned for 1 Round, and takes 2 Fatigue.",
        description: "The force of the burst knocks the target to the ground and Stuns him for 1 Round. The target takes 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Flayed Face and Deafened Ears",
        benefit: "Stunned for 1d10 Rounds; permanently deafened; take 1d5 Fatigue; can only take Half Actions for 1d5 hours; Fellowship drops by 1d10.",
        description: "The explosion flays the flesh from the target's face and bursts his eardrums with its force. The target is Stunned for 1d10 Rounds and is permanently deafened. The target takes 1d5 levels of Fatigue and can only take Half Actions for 1d5 hours. Finally, the target's Fellowship drops by 1d10 due to hideous scarring.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Deafened and Scarred"
      },
      {
        min: 6,
        max: 6,
        name: "Head Explodes",
        benefit: "Head explodes and the result is instantly fatal.",
        description: "The target's head explodes under the force of the attack, leaving his headless corpse to spurt blood from the neck for the next few minutes. Needless to say this is instantly fatal.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 7,
        max: 7,
        name: "Head and Body Torn Apart",
        benefit: "Target is instantly killed; carried ammunition explodes for 1d10+5 Impact Damage within 1d5 metres; grenades and missiles detonate on the target's person.",
        description: "Both head and body are blown into a mangled mess, instantly killing the target. In addition, if the target is carrying any ammunition it explodes dealing 1d10+5 Impact Damage to any creatures within 1d5 metres. If the target was carrying grenades or missiles, these too explode on the target's person.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 8,
        max: 8,
        name: "Gory Collapse",
        benefit: "Head and torso peel apart; for the rest of the fight, anyone moving over the mess must make a Challenging (+0) Agility Test or fall prone.",
        description: "In a series of unpleasant explosions the target's head and torso peel apart, leaving a gory mess on the ground. For the rest of the fight, anyone moving over this spot must make a Challenging (+0) Agility Test or fall prone.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Crimson Mist",
        benefit: "Target ceases to exist in any tangible way, turning into crimson mist.",
        description: "The target ceases to exist in any tangible way, entirely turning into a kind of crimson mist. You don't get much deader than this, except...",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Unspeakable Death",
        benefit: "As above, and allies within 10 metres must make an immediate Challenging (+0) Willpower Test or spend their next Turn fleeing from the attacker.",
        description: "As above, except such is the unspeakably appalling manner in which the target was killed, that any of the target's allies who are within ten metres of where the target stood, must make an immediate Challenging (+0) Willpower Test or spend their next Turn fleeing from the attacker.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsExplosiveLeg: {
    key: "criticalEffectsExplosiveLeg",
    label: "Explosive Critical Effects - Leg",
    defaultCategory: "critical",
    damageType: "explosive",
    location: "leg",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Glancing Blast",
        benefit: "Sent backwards one metre.",
        description: "A glancing blast sends the character backwards one metre.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Feet Swept Out",
        benefit: "Lands Prone and takes 1 Fatigue.",
        description: "The force of the explosion takes the target's feet out from under him. He lands Prone and takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Cracked Leg",
        benefit: "Stunned for 1 Round, halve all movement for 1d5 Rounds, and take 1 Fatigue.",
        description: "The concussion cracks the target's leg, leaving him Stunned for 1 Round and halving all movement for 1d5 Rounds. The target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Spinning Through the Air",
        benefit: "Travel 1d5 metres away, take 1 Fatigue per metre travelled, spend a Full Action to regain feet, and halve all movement for 1d10 Rounds.",
        description: "The explosion sends the target spinning through the air. The target travels 1d5 metres away from the explosion and takes 1 level of Fatigue per metre travelled. It takes the target a Full Action to regain his feet and he halves all movement for 1d10 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Shattered Foot",
        benefit: "Challenging (+0) Toughness Test or permanently lose use of the foot; take 1d5 Fatigue; on success halve movement until medical attention.",
        description: "Explosive force removes part of the target's foot and scatters it over a wide area. The target must make an immediate Challenging (+0) Toughness Test or permanently lose the use of his foot, inflicting 1d5 levels of Fatigue. On a success, the target takes 1d5 levels of Fatigue and halves his movement until he receives medical attention.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Ruined Foot"
      },
      {
        min: 6,
        max: 6,
        name: "Shattered Leg Bones",
        benefit: "Take 1d10 Fatigue; leg is broken until repaired; counts as having only one leg; suffer Blood Loss.",
        description: "The concussive force of the blast shatters the target's leg bones and splits apart his flesh, inflicting 1d10 levels of Fatigue. The leg is broken and, until repaired, the target counts as having only one leg. In addition, the horrendous nature of the wound means that he now suffers from Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Leg"
      },
      {
        min: 7,
        max: 7,
        name: "Smoking Meat Leg",
        benefit: "Challenging (+0) Toughness Test or die; on success be Stunned for 1d10 Rounds, take 1d10 Fatigue, suffer Blood Loss, and now only have one leg.",
        description: "The explosion reduces the target's leg into a hunk of smoking meat. The target must immediately make a Challenging (+0) Toughness Test or die from shock. On a successful Test, the target is still Stunned for 1d10 rounds, takes 1d10 levels of Fatigue and suffers Blood Loss. He now has only one leg.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Leg"
      },
      {
        min: 8,
        max: 8,
        name: "Leg Torn Free",
        benefit: "Leg is torn from the body in a geyser of gore; instantly fatal.",
        description: "The blast tears the leg from the body in a geyser of gore, sending him crashing to the ground, blood pumping from the ragged stump: instantly fatal.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Leg Eruption",
        benefit: "Leg explodes in an eruption of blood, instantly killing the target and damaging anyone within two metres for 1d10+2 Impact Damage.",
        description: "The leg explodes in an eruption of blood, killing the target immediately and sending tiny fragments of bone, clothing and armour hurling off in all directions. Anyone within two metres of the target takes 1d10+2 Impact Damage.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Detonating Leg Corpse",
        benefit: "As above, plus carried ammunition explodes within 1d10 metres and grenades or missiles detonate on the target's person.",
        description: "As above, except in addition, if the target is carrying any ammunition, it explodes dealing 1d10+5 Impact Damage to anyone within 1d10 metres. If the target is carrying any grenades or missiles, these too detonate on the target's person.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsImpactArm: {
    key: "criticalEffectsImpactArm",
    label: "Impact Critical Effects - Arm",
    defaultCategory: "critical",
    damageType: "impact",
    location: "arm",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Numbed Limb",
        benefit: "Drop anything held in that hand.",
        description: "The attack numbs the target's limb causing him to drop anything held in that hand.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Deep Bruise",
        benefit: "Take 1 Fatigue.",
        description: "The strike leaves a deep bruise. The target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Crushing Pain",
        benefit: "Take 1 Fatigue and drop whatever was held in that hand.",
        description: "The impact inflicts crushing pain and the target takes 1 level of Fatigue and drops whatever was held in that hand.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Reeling Limb",
        benefit: "Stunned for 1 Round; limb useless for 1d5 Rounds; take 1 Fatigue.",
        description: "The impact leaves the target reeling from pain. The target is Stunned for 1 Round. The limb is useless for 1d5 Rounds and the target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Muscle and Bone Trauma",
        benefit: "WS and BS halved for 1d10 Rounds; take 1 Fatigue; Agility Test or drop anything held in that hand.",
        description: "Muscle and bone take a pounding as the attack rips into the arm. The target's Weapon Skill and Ballistic Skill are both halved (round down) for 1d10 Rounds. In addition, the target takes 1 level of Fatigue and must make an Agility Test or drop anything held in that hand.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Crushed Hand",
        benefit: "Break 1d5 fingers; take 1 Fatigue; Challenging (+0) Toughness Test or lose use of the hand.",
        description: "The attack pulverises the target's hand, crushing and breaking 1d5 fingers (for the purposes of this Critical, a thumb counts as a finger). The target takes 1 level of Fatigue and must immediately make a Challenging (+0) Toughness Test or lose the use of his hand.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Ruined Hand"
      },
      {
        min: 7,
        max: 7,
        name: "Shattered Arm Bone",
        benefit: "Arm is broken until repaired; counts as only having one arm; take 2 Fatigue.",
        description: "With a loud snap, the arm bone is shattered and left hanging limply at the target's side, dribbling blood onto the ground. The arm is broken and, until repaired, the target counts as having one arm and takes 2 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Arm"
      },
      {
        min: 8,
        max: 8,
        name: "Arm Torn Off",
        benefit: "Challenging (+0) Toughness Test or die; on success be Stunned for 1d10 Rounds, take 1d5 Fatigue, suffer Blood Loss, and now only have one arm.",
        description: "The force of the attack takes the arm off just below the shoulder, showering blood and gore across the ground. The target must immediately make a Challenging (+0) Toughness Test or die from shock. If he passes the Test, he is still Stunned for 1d10 rounds, takes 1d5 levels of Fatigue and suffers from Blood Loss. He now only has one arm.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Arm"
      },
      {
        min: 9,
        max: 9,
        name: "Arm Removed in Gore",
        benefit: "Arm is removed from the body; target dies after a few agonised seconds.",
        description: "In a rain of blood, gore and meat, the target's arm is removed from his body. Screaming incoherently, he twists about in agony for a few seconds before collapsing to the ground and dying.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Shrapnel Arm Death",
        benefit: "As above, plus anyone within 2 metres suffers 1d5-3 Impact Damage to a random location from bone, clothing, and armour fragments.",
        description: "As above, except as the arm is removed it is smashed apart by the force of the attack, and bone, clothing and armour fragments fly about like shrapnel. Anyone within 2 metres of the target suffers 1d5-3 Impact Damage to a random location.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsImpactBody: {
    key: "criticalEffectsImpactBody",
    label: "Impact Critical Effects - Body",
    defaultCategory: "critical",
    damageType: "impact",
    location: "body",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Winded Torso Hit",
        benefit: "Can take only a Half Action on next Turn.",
        description: "A blow to the target's body steals the breath from his lungs. The target can take only a Half Action on his next Turn.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Air Driven Out",
        benefit: "Take 1 Fatigue.",
        description: "The impact punches the air from the target's body, inflicting 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Broken Rib",
        benefit: "Take 2 Fatigue and be Stunned for 1 Round.",
        description: "The attack breaks a rib and inflicts 2 levels of Fatigue. The target is also Stunned for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Shattering Body Blow",
        benefit: "Take 1d5 Fatigue and be Stunned for 1 Round.",
        description: "The blow batters the target, shattering ribs. The target takes 1d5 levels of Fatigue and is Stunned for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Winded and Doubling Over",
        benefit: "Take 1d5 Fatigue and be Stunned for 2 Rounds.",
        description: "A solid blow to the chest winds the target and he momentary doubles over in pain, clutching himself and crying in agony. The target takes 1d5 levels of Fatigue and is Stunned for 2 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Knocked Sprawling",
        benefit: "Flies 1d5 metres away and falls prone; if striking a wall or other solid object, he stops; take 1d5 Fatigue and be Stunned for 2 Rounds.",
        description: "The attack knocks the target sprawling on the ground. The target flies 1d5 metres away from the attacker and falls prone (if the target strikes a wall of other solid object, he stops). The target takes 1d5 levels of Fatigue and is Stunned for 2 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 7,
        max: 7,
        name: "Multiple Broken Ribs",
        benefit: "1d5 ribs break; may either lie still awaiting medical attention or continue acting; 20% chance a jagged rib pierces a vital organ and kills instantly; take 1d5 Fatigue.",
        description: "With an audible crack, 1d5 of the target's ribs break. The target can either lay down and stay still awaiting medical attention (a successful Medicae Test sets the ribs) or continue to take Actions, though each Round there is a 20% chance that a jagged rib pierces a vital organ and kills the character instantly. The target takes 1d5 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Ribs"
      },
      {
        min: 8,
        max: 8,
        name: "Ruptured Organs",
        benefit: "Suffer Blood Loss and take 1d10 Fatigue.",
        description: "The force of the attack ruptures several of the target's organs and knocks him down, gasping in wretched pain. The target suffers Blood Loss and takes 1d10 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Internal Organ Damage"
      },
      {
        min: 9,
        max: 9,
        name: "Body Blow Death",
        benefit: "Target jerks back, spews blood, and dies.",
        description: "The target jerks back from the force of the attack, throwing back his head and spewing out a jet of blood before crumpling to the ground dead.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Thrown Corpse",
        benefit: "As above, except the target is thrown 1d10 metres away; anyone in the path must make a Challenging (+0) Agility Test or be Knocked Down.",
        description: "As above, except the target is thrown 1d10 metres away from the attack. Anyone in the target's path must make a Challenging (+0) Agility Test or be Knocked Down.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsImpactHead: {
    key: "criticalEffectsImpactHead",
    label: "Impact Critical Effects - Head",
    defaultCategory: "critical",
    damageType: "impact",
    location: "head",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Ringing Head",
        benefit: "Must make a Challenging (+0) Toughness Test or suffer 1 Fatigue.",
        description: "The impact fills the target's head with a terrible ringing noise. The target must make a Challenging (+0) Toughness Test or suffer 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Seeing Stars",
        benefit: "Take 1 Fatigue and suffer -10 to WS and BS Tests for 1 Round.",
        description: "The attack causes the target to see stars. The target takes 1 level of Fatigue and suffers a -10 penalty to Weapon Skill and Ballistic Skill Tests for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Exploding Nose",
        benefit: "Blinded for 1 Round and take 2 Fatigue.",
        description: "The target's nose explodes in a torrent of blood, blinding him for 1 Round and dealing 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Staggering Concussion",
        benefit: "Take 1d5 Fatigue.",
        description: "The concussive strike staggers the target, dealing 1d5 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Reeling Pain",
        benefit: "Stunned for 1 Round.",
        description: "The force of the blow sends the target reeling in pain. The target is Stunned for 1 Round.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Snapped Back Head",
        benefit: "Stunned for 1d5 Rounds and take 2 Fatigue.",
        description: "The target's head is snapped back by the attack leaving him staggering around trying to control mind-numbing pain. The target is Stunned for 1d5 Rounds and takes 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 7,
        max: 7,
        name: "Fractured Skull",
        benefit: "Stunned for 1d10 Rounds and halve all movement for 1d10 hours.",
        description: "The attack slams into the target's head, fracturing his skull and opening a long tear in his scalp. The target is Stunned for 1d10 Rounds and halves all movement for 1d10 hours.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Skull Fracture"
      },
      {
        min: 8,
        max: 8,
        name: "Pulverised Brain",
        benefit: "Brain is pulverised; target does not survive.",
        description: "Blood pours from the target's noise, mouth, ears and eyes as the attack pulverises his brain. He does not survive the experience.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Burst Head",
        benefit: "Head bursts, spraying gore; anyone within 4 metres must make an Agility Test or suffer -10 to WS and BS on their next Turn.",
        description: "The target's head bursts like an overripe fruit and sprays blood, bone and brains in all directions. Anyone within 4 metres of the target must make an Agility Test or suffer a -10 penalty to their WS and BS on their next Turn as gore gets in their eyes or on their visors.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Overpenetrating Skull Strike",
        benefit: "As above, except the attack may immediately hit another target nearby.",
        description: "As above, except that the attack was so powerful that it passes through the target and may hit another target nearby. If the hit was from a melee weapon, the attacker may immediately make another attack (with the same weapon) against any other target they can reach without moving. If the hit was from a ranged weapon they may immediately make another attack (with the same weapon) against any target standing directly behind the original target and still within range of their weapon.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsImpactLeg: {
    key: "criticalEffectsImpactLeg",
    label: "Impact Critical Effects - Leg",
    defaultCategory: "critical",
    damageType: "impact",
    location: "leg",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Gasping Leg Blow",
        benefit: "Take 1 Fatigue.",
        description: "A light blow to the leg leaves the target gasping for air. The target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Slowed Leg",
        benefit: "Halve all movement for 1 Round and take 1 Fatigue.",
        description: "A grazing strike against the leg slows the target. The target halves all movement for 1 Round and takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Broken Leg Stun",
        benefit: "Stunned for 1 Round, halve all movement for 1d5 Rounds, and take 1 Fatigue.",
        description: "The blow breaks the target's leg leaving him Stunned for 1 Round and halving all movement for 1d5 Rounds. The target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Lightning Agony",
        benefit: "Take 1d5 Fatigue and halve all movement for 1d5 Rounds.",
        description: "A solid blow to the leg sends lightning agony coursing through the target. The target takes 1d5 levels of Fatigue and halves all movement for 1d5 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Micro Fractures",
        benefit: "Agility reduced by -20 for 1d10 Rounds and take 1d5 Fatigue.",
        description: "A powerful impact causes micro fractures in the target's bones, inflicting considerable agony. The target's Agility is reduced by -20 for 1d10 Rounds and he takes 1d5 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Shattered Foot Bones",
        benefit: "Immediate Toughness Test or permanently lose use of the foot; on success halve all movement until medical attention; take 2 Fatigue.",
        description: "Several of the tiny bones in the target's foot snap like twigs with cracking noises. The target must make an immediate Toughness Test or permanently lose the use of his foot. On a success, halve all movement until medical attention is received. The target takes 2 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Ruined Foot"
      },
      {
        min: 7,
        max: 7,
        name: "Broken Leg Collapse",
        benefit: "Knocked down with a broken leg; until repaired, counts as only having one leg; take 2 Fatigue.",
        description: "With a nasty crunch, the leg is broken and the target is knocked down mewling in pain. The target falls to the ground with a broken leg and, until it is repaired, he counts as only having one leg. The target takes 2 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Leg"
      },
      {
        min: 8,
        max: 8,
        name: "Lower Leg Ripped Away",
        benefit: "Challenging (+0) Toughness Test or die; on success be Stunned for 1d10 Rounds, take 1d5 Fatigue, suffer Blood Loss, and now only have one leg.",
        description: "The force of the attack rips the lower half of the leg away in a stream of blood. The target must immediately make a Challenging (+0) Toughness Test or die from shock. On a success, the target is Stunned for 1d10 rounds, takes 1d5 levels of Fatigue and suffers Blood Loss. He now only has one leg.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Leg"
      },
      {
        min: 9,
        max: 9,
        name: "Fountain of Blood",
        benefit: "Leg is ripped apart; target dies in a spreading pool of gore.",
        description: "The hit rips apart the flesh of the leg, causing blood to spray out in all directions. Even as the target tries futilely to stop the sudden flood of vital fluid, he falls to the ground and dies in a spreading pool of gore.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Screaming Death",
        benefit: "As above, but the target's death screams drown out all conversation within 2d10 metres for the rest of the Round.",
        description: "As above, but such is the agony of the target's death that his piteous screams drowns out all conversation within 2d10 metres for the rest of the Round.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsRendingArm: {
    key: "criticalEffectsRendingArm",
    label: "Rending Critical Effects - Arm",
    defaultCategory: "critical",
    damageType: "rending",
    location: "arm",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Hand Slashed Open",
        benefit: "Anything held in this arm is torn free.",
        description: "The slashing attack tears anything free that was held in this arm.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Deep Cuts",
        benefit: "Drop whatever was held and take 1 Fatigue.",
        description: "Deep cuts cause the target to drop whatever was held and inflicts 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Shredding Pain",
        benefit: "Take 2 Fatigue and drop whatever was held in that hand.",
        description: "The shredding attack sends the target screaming in pain. He takes 2 levels of Fatigue and drops whatever was held in that hand.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Flayed Limb",
        benefit: "Falls prone, takes 2 Fatigue, and the limb is useless for 1d10 Rounds.",
        description: "The attack flays the skin from the limb, filling the air with blood and the sounds of his screaming. The target falls prone from the agony and takes 2 levels of Fatigue. The limb is useless for 1d10 Rounds.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Bloody Furrow",
        benefit: "Take 1d5 Fatigue, vomit, drop whatever was held, limb useless until medical attention, and suffer Blood Loss.",
        description: "A bloody and very painful looking furrow is opened up in the target's arm. The target takes 1d5 levels of Fatigue and vomits all over the place in agony. He drops whatever was held and the limb is useless until medical attention is received. The target also suffers Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Blood-Loss Arm Trauma"
      },
      {
        min: 6,
        max: 6,
        name: "Mangled Hand",
        benefit: "Liberates 1d5 fingers; take 3 Fatigue; Challenging (+0) Toughness Test or lose use of the hand.",
        description: "The blow mangles flesh and muscle as it hacks into the target's hand, liberating 1d5 fingers in the process (a roll of a 5 means that the thumb has been sheared off). The target takes 3 levels of Fatigue and must immediately make a Challenging (+0) Toughness Test or lose the use of his hand.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Ruined Hand"
      },
      {
        min: 7,
        max: 7,
        name: "Dangling Ruined Arm",
        benefit: "Take 1d5 Fatigue; arm broken until repaired; counts as having only one arm; suffers Blood Loss.",
        description: "The attack rips apart skin, muscle, bone and sinew with ease, turning the target's arm into a dangling ruin and inflicting 1d5 levels of Fatigue. The arm is broken and, until repaired, the target counts as having only one arm. In addition, numerous veins have been severed and the target is now suffering from Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Arm"
      },
      {
        min: 8,
        max: 8,
        name: "Arm Flies Free",
        benefit: "Challenging (+0) Toughness Test or die; on success Stunned for 1d10 Turns, suffers Blood Loss, takes 1d10 Fatigue, and now has only one arm.",
        description: "With an assortment of unnatural, wet ripping sounds, the arm flies free of the body trailing blood behind it in a crimson arc. The target must immediately make a Challenging (+0) Toughness Test or die from shock. If he passes the Test, he is Stunned for 1d10 Turns and suffers Blood Loss. He also takes 1d10 levels of Fatigue and now has only one arm.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Arm"
      },
      {
        min: 9,
        max: 9,
        name: "Sliced Through to the Torso",
        benefit: "Arm is sliced off and through into the torso, instantly killing the target.",
        description: "The attack slices clean through the arm and into the torso, drenching the ground in blood and gore and killing the target instantly.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Death Spasm Trigger Pull",
        benefit: "As above; severed arm's fingers may fire a held weapon, possibly hitting a random target within 2d10 metres.",
        description: "As above. However, as the arm falls to the ground its fingers spasm uncontrollably, pumping the trigger of any held weapon. If the target was carrying a ranged weapon there is a 5% chance that a single randomly determined target within 2d10 metres will be hit by these shots, in which case resolve a single hit from the target's weapon as normal.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsRendingBody: {
    key: "criticalEffectsRendingBody",
    label: "Rending Critical Effects - Body",
    defaultCategory: "critical",
    damageType: "rending",
    location: "body",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Painful Laceration",
        benefit: "If not wearing armour on this location, take 1 Fatigue; if armoured, no effect.",
        description: "If the target is not wearing armour on this location, he takes 1 level of Fatigue from a painful laceration. If he is wearing armour, there is no effect.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Armor Torn Open",
        benefit: "Body armour AP reduced by 1; take 1 Fatigue; if not armoured, also Stunned for 1 Round.",
        description: "The attack damages the target's armour, reducing its Armour Points by 1. In addition, the target takes 1 level of Fatigue. If not armoured, the target is also Stunned for 1 Round.",
        persistent: true,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Skin Torn from Torso",
        benefit: "Stunned for 1 Round and take 2 Fatigue.",
        description: "The attack rips a large patch of skin from the target's torso, leaving him gasping in pain. The target is Stunned for 1 Round and takes 2 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 4,
        max: 4,
        name: "Pool of Blood",
        benefit: "Ground becomes slick; anyone moving through it must make an Agility Test or fall prone; target takes 1d5 Fatigue.",
        description: "A torrent of blood spills from the deep cuts, making the ground slick with gore. All characters attempting to move through this pool of blood must succeed on an Agility Test or fall Prone. The target takes 1d5 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 5,
        max: 5,
        name: "Long Torso Wound",
        benefit: "Take 1d5 Fatigue.",
        description: "The blow opens up a long wound in the target's torso, causing him to double over in terrible pain. The target takes 1d5 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Chunk Torn Out",
        benefit: "Target is Prone and takes 1d10 Fatigue.",
        description: "The mighty attack takes a sizeable chunk out of the target and knocks him to the ground as he clutches the oozing wound, shrieking in pain. The target is Prone and takes 1d10 levels of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 7,
        max: 7,
        name: "Abdomen Opened",
        benefit: "Either hold guts in with one arm until a Medicae Test or keep fighting with a 20% chance each turn of intestines spilling out for an additional 2d10 Damage; take 1d5 Fatigue and suffer Blood Loss.",
        description: "The attack cuts open the target's abdomen. The target can either choose to use one arm to hold his guts in (until a medic can bind them in place with a successful Medicae Test), or fight on regardless and risk a 20% chance each turn that his middle splits open, spilling his intestines all over the ground, causing an additional 2d10 Damage. In either case, the target takes 1d5 levels of Fatigue and is now suffering Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Abdominal Trauma"
      },
      {
        min: 8,
        max: 8,
        name: "Torso Skinned Open",
        benefit: "Challenging (+0) Toughness Test or die; on success permanently lose 1d10 Toughness, take 1d10 Fatigue, and suffer Blood Loss.",
        description: "With a vile tearing noise, the skin on the target's chest comes away revealing a red ruin of muscle. The target must make a Challenging (+0) Toughness Test or die. If he passes, he permanently loses 1d10 from his Toughness, takes 1d10 levels of Fatigue, and now suffers Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Severe Torso Trauma"
      },
      {
        min: 9,
        max: 9,
        name: "Cleaved from Gullet to Groin",
        benefit: "Target is cleaved open and dies immediately.",
        description: "The powerful blow cleaves the target from gullet to groin, revealing his internal organs and spilling them on to the ground before him. The target is now quite dead.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Corpse Surrounded by Gore",
        benefit: "As above, and for the rest of the fight anyone moving within 4 metres of the corpse must make a Challenging (+0) Agility Test or fall prone.",
        description: "As above, except that the area and the target are awash with gore. For the rest of the fight, anyone moving within four metres of the target's corpse must make a Challenging (+0) Agility Test or fall prone.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsRendingHead: {
    key: "criticalEffectsRendingHead",
    label: "Rending Critical Effects - Head",
    defaultCategory: "critical",
    damageType: "rending",
    location: "head",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Face Torn Open",
        benefit: "Take 1 Fatigue; if wearing a helmet, there is no effect.",
        description: "The attack tears skin from the target's face dealing 1 level of Fatigue. If the target is wearing a helmet, there is no effect.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Bleeding Scalp",
        benefit: "-10 to WS and BS for 1d10 Turns due to blood in the eyes; take 1 Fatigue.",
        description: "The attack slices open the target's scalp which immediately begins to bleed profusely. Due to blood pouring into the target's eyes, he suffers a -10 penalty to both Weapon Skill and Ballistic Skill for the next 1d10 Turns. The target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Helmet or Ear Gone",
        benefit: "Helmet is torn free; if no helmet, lose an ear instead and take 2 Fatigue.",
        description: "The attack tears the target's helmet from his head. If wearing no helmet, the target loses an ear instead and inflicts 2 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Ear"
      },
      {
        min: 4,
        max: 4,
        name: "Scooped-Out Eye",
        benefit: "Take 1d5 Fatigue and be Stunned for 1 Round after losing one eye.",
        description: "The attack scoops out one of the target's eyes, inflicting 1d5 levels of Fatigue and leaving the target Stunned for 1 Round.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Eye"
      },
      {
        min: 5,
        max: 5,
        name: "Face Opened Up",
        benefit: "Stunned for 1d5 Rounds and take 1d5 Fatigue; if wearing a helmet, the helmet comes off.",
        description: "The attack opens up the target's face, leaving him Stunned for 1d5 Rounds and inflicting 1d5 levels of Fatigue. If the target is wearing a helmet, the helmet comes off.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Important Feature Lost",
        benefit: "Lose an eye, nose, or ear; suffer Blood Loss; take 1d5 Fatigue.",
        description: "As the blow rips violently across the target's face—it takes with it an important feature. Roll 1d10 to see what the target has lost. 1-3: Eye. 4-7: Nose (permanently halve Fellowship), 8-10: Ear (permanently reduce Fellowship by 1d10; the wound can always be hidden with hair.) In addition, the target is now suffering from Blood Loss and takes 1d5 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Facial Maiming"
      },
      {
        min: 7,
        max: 7,
        name: "Face Removed",
        benefit: "Permanently blinded; Fellowship reduced to 1d10; trouble speaking clearly; suffers Blood Loss and takes 1d10 Fatigue.",
        description: "In a splatter of skin and teeth, the attack removes most of the target's face. He is permanently blinded and has his Fellowship permanently reduced to 1d10, and also now has trouble speaking without slurring his words. In addition, the target is suffering from Blood Loss and takes 1d10 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Face Destroyed"
      },
      {
        min: 8,
        max: 8,
        name: "Brain Oozing Out",
        benefit: "Head is sliced into, eyes pop out, brain oozes down the cheek, and the target dies.",
        description: "The blow slices into the side of the target's head causing his eyes to pop out and his brain to ooze down his cheek like spilled jelly. He's dead before he hits the ground.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 9,
        max: 9,
        name: "Head Flies Free",
        benefit: "Head flies free and lands 2d10 metres away; target is instantly slain.",
        description: "With a sound not unlike a wet sponge being torn in half, the target's head flies free of its body and sails through the air, landing harmlessly 2d10 metres away with a soggy thud. The target is instantly slain.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Neck Torrent",
        benefit: "As above, and nearby characters must make a Challenging (+0) Agility Test or suffer -10 to WS and BS for 1 Round as gore fills their eyes or fouls their visor.",
        description: "As above, except the target's neck spews blood in a torrent, drenching all those nearby and forcing them to make a Challenging (+0) Agility Test. Anyone who fails the Test, suffers a -10 penalty to his Weapon Skill and Ballistic Skill Tests for 1 Round as gore fills his eyes or fouls his visor.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  criticalEffectsRendingLeg: {
    key: "criticalEffectsRendingLeg",
    label: "Rending Critical Effects - Leg",
    defaultCategory: "critical",
    damageType: "rending",
    location: "leg",
    entries: [
      {
        min: 1,
        max: 1,
        name: "Jerking Leg Hit",
        benefit: "Take 1 Fatigue.",
        description: "The attack knocks the limb backwards, painfully jerking it away from the body. The target takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 2,
        max: 2,
        name: "Split Kneecap",
        benefit: "Must make a Challenging (+0) Agility Test or fall prone; takes 1 Fatigue regardless.",
        description: "The target's kneecap splits open. He must make a Challenging (+0) Agility Test or fall prone. Regardless, he takes 1 level of Fatigue.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 3,
        max: 3,
        name: "Flesh Torn from Leg",
        benefit: "Take 1 Fatigue and suffer Blood Loss.",
        description: "The attack rips a length of flesh from the leg, causing blood to gush from the wound. The target takes 1 level of Fatigue and suffers Blood Loss.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Blood-Loss Leg Trauma"
      },
      {
        min: 4,
        max: 4,
        name: "Kneecap Torn Free",
        benefit: "Move at half speed until medical attention is received and take 2 Fatigue.",
        description: "The attack rips the kneecap free from the target's leg, causing it to collapse out from under him. The target moves at half speed until medical attention is received. In addition, he takes 2 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Kneecap Destroyed"
      },
      {
        min: 5,
        max: 5,
        name: "Opened Leg to the Bone",
        benefit: "Take 1d5 Fatigue and halve movement for 1d10 hours.",
        description: "In a spray of blood, the target's leg is opened up, exposing bone, sinew and muscle. The target takes 1d5 levels of Fatigue and halves his movement for 1d10 hours.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        min: 6,
        max: 6,
        name: "Foot Sliced Off",
        benefit: "Immediate Challenging (+0) Toughness Test or permanently lose use of the foot; on success movement is halved until medical attention; in either case take 1d5 Fatigue.",
        description: "The blow slices a couple of centimetres off the end of the target's foot. The target must make an immediate Challenging (+0) Toughness Test or permanently lose the use of his foot. On a success, movement is halved until he receives medical attention. In either case, the target takes 1d5 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Ruined Foot"
      },
      {
        min: 7,
        max: 7,
        name: "Ligaments Torn Apart",
        benefit: "Leg is broken until repaired; counts as only having one leg; suffers Blood Loss and takes 1d10 Fatigue.",
        description: "The force of the blow cuts deep into the leg, grinding against bone and tearing ligaments apart. The leg is broken and, until repaired, the target counts as only having one leg. In addition, the level of maiming is such that the target is now suffering from Blood Loss. He also takes 1d10 levels of Fatigue.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Broken Leg"
      },
      {
        min: 8,
        max: 8,
        name: "Leg Hacked Off",
        benefit: "Immediate Toughness Test or die; on success Stunned for 1d10 Rounds, take 1d10 Fatigue, suffer Blood Loss, and now only have one leg.",
        description: "In a single bloody hack the leg is lopped off the target, spurting its vital fluids across the ground. The target must immediately make a Toughness Test or die from shock. On a success, the target is Stunned for 1d10 Rounds, takes 1d10 Fatigue and suffers Blood Loss. He now has only one leg.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Leg"
      },
      {
        min: 9,
        max: 9,
        name: "Hip Chop Death",
        benefit: "Leg comes away at the hip; target pitches to the ground howling and dies moments later.",
        description: "With a meaty chop, the leg comes away at the hip. The target pitches to the ground howling in agony, before dying moments later.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      },
      {
        min: 10,
        max: 10,
        name: "Blood Tide Collapse",
        benefit: "As above, and anyone making a Run or Charge Action within 6 metres this Turn must make a Challenging (+0) Agility Test or fall over.",
        description: "As above, except that the tide of blood is so intense that, for the remainder of the battle, anyone making a Run or Charge Action within six metres of the target this Turn must make a Challenging (+0) Agility Test or fall over.",
        persistent: false,
        createsCriticalInjury: false,
        fatal: true
      }
    ]
  },
  conditionsAndSpecialDamage: {
    key: "conditionsAndSpecialDamage",
    label: "Conditions and Special Damage",
    defaultCategory: "condition",
    entries: [
      {
        key: "amputated-limbs",
        name: "Amputated Limbs",
        category: "injuryProcedure",
        benefit: "Amputation causes Blood Loss, requires treatment, and delays natural healing by 1d10+2 days.",
        description: "A character that loses body parts, except for the head, is also affected by Blood Loss and must be treated quickly. If the character lives, someone with the Medicae Skill must be found to adequately treat the stump to ensure that it heals well. If no medic is available, there is only a 20% chance that the stump will heal over. If it does not, the amputee dies a horrible death from infection after 1d10 days. Whether or not it heals naturally or a medic treats it, the character does not start removing Damage for 1d10+2 days. Assuming the character survives all of the above, the character must also cope with the lasting side-effects of the lost limb.",
        persistent: true,
        createsCriticalInjury: false
      },
      {
        key: "lost-hand",
        name: "Lost Hand",
        category: "criticalInjury",
        benefit: "-20 to tests relying on two hands; cannot wield two-handed weapons; if it is the primary hand, suffer the usual -20 off-hand attack penalty until retrained.",
        description: "The character suffers a -20 penalty on all Skill and Characteristic Tests that rely on the use of two hands and cannot wield two-handed weapons. A shield can be strapped to the injured arm, however. Should this be the character's primary hand, the character must cope with the customary -20 penalty to Weapon Skill Tests made to attack with weapons using the secondary hand. For every 100 xp spent, this penalty can be reduced by 10.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Hand"
      },
      {
        key: "lost-arm",
        name: "Lost Arm",
        category: "criticalInjury",
        benefit: "As Lost Hand, but no shield can be strapped to the missing arm.",
        description: "As with a lost hand, but a character cannot strap a shield to the arm since he no longer has it. Losing both arms is far worse and usually demands replacement limbs or retirement.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Arm"
      },
      {
        key: "lost-eye",
        name: "Lost Eye",
        category: "criticalInjury",
        benefit: "-10 Ballistic Skill and -20 to tests that rely on sight; losing both eyes causes blindness.",
        description: "Losing one eye permanently reduces a character's Ballistic Skill by -10. In addition, the character suffers a -20 penalty to all Skill and Characteristic Tests that rely on sight. Should a character lose both eyes, he becomes blinded.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Eye"
      },
      {
        key: "lost-foot",
        name: "Lost Foot",
        category: "criticalInjury",
        benefit: "Halve all movement, round up, and suffer -20 to movement actions and mobility-based tests.",
        description: "The character permanently reduces all movement by half, rounding up, and suffers a -20 penalty to all movement Actions as well as Skill and Characteristic Tests that rely on mobility, such as Shadowing. Losing both feet makes normal movement nearly impossible without assistance or augmentation.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Foot"
      },
      {
        key: "lost-leg",
        name: "Lost Leg",
        category: "criticalInjury",
        benefit: "As Lost Foot, but the character also cannot use the Dodge Skill.",
        description: "Treat this as a lost foot, but the character cannot use the Dodge Skill. Losing both legs leaves the character effectively unable to move normally without assistance, augmentation, or replacement limbs.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Lost Leg"
      },
      {
        key: "blinded",
        name: "Blinded",
        category: "condition",
        benefit: "Automatically fails vision-based tests and Ballistic Skill Tests, and suffers -30 to Weapon Skill and most other tests that ordinarily benefit from sight.",
        description: "A blind character automatically fails all tests based on vision and automatically fails all Ballistic Skill Tests. He also suffers a -30 penalty to Weapon Skill Tests and most other tests that ordinarily benefit from vision.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Blindness"
      },
      {
        key: "blood-loss",
        name: "Blood Loss",
        category: "condition",
        benefit: "10% chance of death each Round until treated; can be staunched with Medicae.",
        description: "Blood Loss is a Critical Effect that can result from Critical Damage. Characters suffering from Blood Loss have a 10% chance of dying each Round unless treated in some way. If the suffering character is conscious, he may attempt a Difficult (-10) Medicae Test each Round to staunch the bleeding. If the character is also trying to engage in strenuous activity, attempts to staunch the bleeding instead requires a Very Hard (-30) Medicae Test. Another character may attempt the test if the victim is unconscious or unwilling.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        key: "deafened",
        name: "Deafened",
        category: "condition",
        benefit: "Automatically fails tests that rely on hearing and cannot communicate normally by sound.",
        description: "The character cannot hear at all, or at least not well enough to communicate with others. Until the character recovers or has the disability repaired, he automatically fails any Skill or Characteristic Test that relies on hearing.",
        persistent: true,
        createsCriticalInjury: true,
        injuryHint: "Deafness"
      },
        {
          key: "fire",
          name: "Fire",
          category: "specialDamage",
          benefit: "May catch fire on a Challenging (+0) Agility Test; once burning, suffer 1d10 Energy Damage ignoring armour and 1 Fatigue each Round until extinguished.",
          description: "A character suffers Damage from fire each Round he is exposed to it. At the beginning of each Round after the first in which a character is exposed to the same source of flames, or if hit by a weapon with the Flame quality or certain Toxic Critical Effects, he must make a Challenging (+0) Agility Test or catch on fire. Once on fire, the character suffers 1d10 Damage with no reduction from armour and takes 1 level of Fatigue each Round until the fire is extinguished. All fire Damage is treated as Energy Damage for Critical Effects. While on fire, a character must make a Challenging (+0) Willpower Test at the beginning of each Turn to act normally; otherwise he may only run around and scream. A burning character may attempt to extinguish the flames by dropping prone and making a Hard (-20) Agility Test as a Full Action.",
          persistent: false,
          createsCriticalInjury: false
        },
        {
          key: "on-fire",
          name: "On Fire",
          category: "condition",
          benefit: "At the start of each Turn, take 1d10 Energy Damage ignoring armour but not Toughness, gain 1 Fatigue, and make a Willpower Test or spend the Turn running around and screaming. A Hard (-20) Agility Test can extinguish the flames.",
          description: "A character who is on fire suffers 1d10 Energy Damage at the start of each Turn. This damage is not reduced by armour, but Toughness still applies normally. The character also gains 1 level of Fatigue each Turn while burning. At the beginning of each Turn, the burning character must make a Challenging (+0) Willpower Test to act normally; on a failure he may only run around and scream, counting this as a Full Action. A burning character may attempt to extinguish the flames by dropping prone and making a Hard (-20) Agility Test as a Full Action.",
          persistent: false,
          createsCriticalInjury: false
        },
        {
          key: "falling",
          name: "Falling",
        category: "specialDamage",
        benefit: "Suffer 1d10 +1 Damage per metre fallen; armour offers no protection and Damage counts as Impact.",
        description: "To work out Damage from falling, roll 1d10 and add +1 per metre the character fell. Use the hit location table to determine which part of the body hits the ground first. Armour offers no protection against falls. Damage from falling is treated as Impact Damage for the purposes of determining Critical Effects. The GM may adjust the damage depending on the landing surface, local gravity, and similar conditions.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        key: "stunned",
        name: "Stunned",
        category: "condition",
        benefit: "Cannot take Actions or Reactions; WS and BS Tests to hit the character are Routine (+20).",
        description: "A character can become Stunned due to Psychic Powers, Critical Damage, or talents such as Takedown. Weapon Skill and Ballistic Skill Tests to hit Stunned characters are considered Routine (+20). In addition, Stunned characters cannot take Actions or Reactions such as Dodge. A Stunned character is not helpless or unaware.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        key: "suffocation",
        name: "Suffocation",
        category: "specialDamage",
        benefit: "Can hold breath for TB minutes while conserving oxygen or 2xTB Rounds while active; failed Toughness Tests cause Fatigue, then unconsciousness, then 1d10 Damage per Round ignoring armour and Toughness.",
        description: "There are many ways to suffocate, including drowning, smoke inhalation, and exposure to certain toxins. If conserving oxygen, a character can hold his breath for a number of minutes equal to his Toughness Bonus. If engaged in strenuous activity, he may hold his breath for a number of Rounds equal to twice his Toughness Bonus. While holding breath, the character must make a Challenging (+0) Toughness Test each minute or Round, depending on activity. Failure causes 1 level of Fatigue. If Fatigue exceeds Toughness Bonus, the character falls unconscious for 10-TB minutes. If still deprived of oxygen after the allotted time, the character automatically falls unconscious regardless of Fatigue. If unconscious and still deprived of oxygen, the character suffers 1d10 Damage each Round until death; Armour and Toughness cannot reduce this Damage.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        key: "unconsciousness",
        name: "Unconsciousness",
        category: "condition",
        benefit: "Completely unaware, helpless, and unable to act; typically lasts 10-TB minutes if no other duration is given.",
        description: "Unconsciousness is usually a temporary state that typically results from excessive Fatigue or Critical Damage. The duration is usually included in whatever caused it, but if no duration is given it lasts for 10-TB minutes. An unconscious character is completely unaware of his surroundings, cannot take any Actions, and is treated as a helpless target.",
        persistent: false,
        createsCriticalInjury: false
      },
      {
        key: "useless-limbs",
        name: "Useless Limbs",
        category: "injuryProcedure",
        benefit: "Failed Toughness Tests can turn a useless limb into an amputation; even on success, the limb is useless for 1d5+1 weeks.",
        description: "Certain Critical Effects indicate a risk of permanently losing the use of a limb unless the affected character succeeds at a Challenging (+0) Toughness Test. If a character with the Medicae Skill is present and assisting, the victim gains a +20 bonus to this test. Even on a success, the limb must be held in a sling for 1d5+1 weeks and is useless during this time. If the Toughness Test fails, the limb must be removed, requiring a character with the Medicae Skill to succeed at a Difficult (-10) Medicae Test. Failure means the limb still comes off, but the surgery inflicts 1d10 Damage to the limb. If the amputee lives, the limb is lost, the character suffers Blood Loss, and the wound must then be treated as an amputated limb.",
        persistent: true,
        createsCriticalInjury: false
      },
      {
        key: "vacuum",
        name: "Vacuum",
        category: "specialDamage",
        benefit: "Sudden exposure allows survival for TB Rounds before 1d10+3 Explosive Damage per Round from depressurisation; space also inflicts 1d10 Energy Damage on failed Toughness Tests from cold.",
        description: "If suddenly exposed to vacuum, a character may survive unharmed for a number of Rounds equal to his Toughness Bonus. Unless he has an oxygen source, he also begins to suffer suffocation. At the end of each Round after this, he suffers 1d10+3 Explosive Damage from depressurisation. If in the vacuum of space, at the end of each Round he must make a Challenging (+0) Toughness Test or also suffer 1d10 Energy Damage from the extreme cold. Armour does not reduce this Damage. If trapped in a gradually worsening atmosphere, the character may survive unharmed for a number of Rounds equal to twice his Toughness Bonus. After that, he begins to experience suffocation and depressurisation. Each Round thereafter, he must make a Toughness Test with a cumulative -10 penalty. Success inflicts 1d5 Explosive Damage; failure inflicts 1d10 Explosive Damage. Armour cannot reduce this Damage.",
        persistent: false,
        createsCriticalInjury: false
      }
    ]
  }
});

const MENTAL_DISORDER_DEFINITIONS = Object.freeze({
  "the-flesh-is-weak": {
    key: "the-flesh-is-weak",
    name: "The Flesh is Weak",
    severities: ["severe", "acute"],
    benefit: "Obsessed with replacing flesh through surgery and bionics.",
    description: "The character sees his flesh as weak and will constantly blame it for his failures and problems. He will also try to change and/or remove his flesh, becoming increasingly obsessed with surgical modification as well as bionic replacement.",
    severityDescriptions: {
      severe: "The character's contempt for his own flesh is an active fixation and increasingly shapes his decisions.",
      acute: "The character's obsession with cutting away weakness dominates his outlook and behaviour."
    }
  },
  phobia: {
    key: "phobia",
    name: "Phobia",
    severities: ["minor", "severe", "acute"],
    benefit: "Must pass Willpower to interact with the focus of fear.",
    description: "The character has a deep dislike and fear for a particular thing or circumstance. A phobic character must succeed on a Willpower Test to interact with the focus of his phobia. Enforced or gratuitous exposure to the focus of his exposure may incur Fear Tests.",
    examples: ["Fear of the Dead", "Fear of Insects"],
    severityDescriptions: {
      minor: "The fear is pronounced but only rarely overwhelming. Tests to overcome it gain a +10 bonus.",
      severe: "The phobia asserts itself regularly and without any bonus to resist.",
      acute: "The slightest exposure can trigger panic. Tests to overcome it suffer a -10 penalty."
    }
  },
  "obsession-compulsion": {
    key: "obsession-compulsion",
    name: "Obsession/Compulsion",
    severities: ["minor", "severe", "acute"],
    benefit: "Must pass Willpower to avoid the compulsion or obsession when opportunity arises.",
    description: "The character has a compulsion to perform a particular action or is obsessed with a particular thing. A character must make a Willpower Test not to act in a compulsive way or not pursue his obsession when the opportunity arises.",
    examples: ["Kleptomania", "Self-mortification"],
    severityDescriptions: {
      minor: "The compulsion intrudes only occasionally. Tests to resist it gain a +10 bonus.",
      severe: "The compulsion is strong and recurring. There is no modifier to resist it.",
      acute: "The compulsion dominates behaviour at the slightest trigger. Tests to resist it suffer a -10 penalty."
    }
  },
  "visions-and-voices": {
    key: "visions-and-voices",
    name: "Visions and Voices",
    severities: ["minor", "severe", "acute"],
    benefit: "Sees or hears things that are not there.",
    description: "The character sees things that are not there and hears things that others do not. Acute sufferers may be completely immersed within their visions.",
    examples: ["Dead Comrade", "Flashbacks"],
    severityDescriptions: {
      minor: "The hallucinations are intermittent. Tests to overcome the disorder gain a +10 bonus.",
      severe: "The hallucinations are vivid and frequent. There is no modifier to resist.",
      acute: "The character may be completely immersed in the visions. Tests to overcome the disorder suffer a -10 penalty."
    }
  },
  delusion: {
    key: "delusion",
    name: "Delusion",
    severities: ["minor", "severe", "acute"],
    benefit: "Acts on a false belief despite evidence to the contrary.",
    description: "The character suffers from a particular false belief that he has to act on as if it were the truth, despite his better judgement or evidence to the contrary.",
    examples: ["Invulnerability", "Righteousness"],
    severityDescriptions: {
      minor: "The delusion surfaces occasionally. Tests to overcome it gain a +10 bonus.",
      severe: "The delusion strongly shapes judgement. There is no modifier to resist it.",
      acute: "The delusion overwhelms better judgement at the slightest stimulation. Tests to overcome it suffer a -10 penalty."
    }
  },
  "horrific-nightmares": {
    key: "horrific-nightmares",
    name: "Horrific Nightmares",
    severities: ["minor", "severe"],
    benefit: "After a stressful day, must pass Willpower or wake with 1 Fatigue.",
    description: "The character suffers from vivid and reoccurring nightmares: trying to run from a black sun in the sky, or being imprisoned in an endless machine, for example. After any stressful day, the character must pass a Willpower Test in order not to succumb to his terrors while asleep. If he fails, the character will suffer from a single level of Fatigue on the following day.",
    severityDescriptions: {
      minor: "The nightmares come after stressful days. Tests to overcome the disorder gain a +10 bonus.",
      severe: "The nightmares are strong and regular. There is no modifier to resist their effects."
    }
  }
});

const CRITICAL_INJURY_DEFINITIONS = Object.freeze({
  "lost-hand": {
    key: "lost-hand",
    name: "Lost Hand",
    benefit: "-20 to tests relying on two hands; cannot wield two-handed weapons; off-hand attack penalties may apply.",
    description: "The character suffers a -20 penalty on all Skill and Characteristic Tests that rely on the use of two hands and cannot wield two-handed weapons. A shield can be strapped to the injured arm, however. Should this be the character's primary hand, the character must cope with the customary -20 penalty to Weapon Skill Tests made to attack with weapons using the secondary hand. For every 100 xp spent, this penalty can be reduced by 10.",
    tags: ["amputation", "arm", "hand"],
    sourceKeys: ["lost-hand"],
    sourceInjuryHints: ["Lost Hand"]
  },
  "lost-arm": {
    key: "lost-arm",
    name: "Lost Arm",
    benefit: "As Lost Hand, but no shield can be strapped to the missing arm.",
    description: "As with a lost hand, but a character cannot strap a shield to the arm since he no longer has it. Losing both arms is far worse and usually demands replacement limbs or retirement.",
    tags: ["amputation", "arm"],
    sourceKeys: ["lost-arm"],
    sourceInjuryHints: ["Lost Arm"]
  },
  "lost-eye": {
    key: "lost-eye",
    name: "Lost Eye",
    benefit: "-10 Ballistic Skill and -20 to tests that rely on sight.",
    description: "Losing one eye permanently reduces a character's Ballistic Skill by -10. In addition, the character suffers a -20 penalty to all Skill and Characteristic Tests that rely on sight. Should a character lose both eyes, he becomes blinded.",
    tags: ["eye", "vision", "head"],
    sourceKeys: ["lost-eye"],
    sourceInjuryHints: ["Lost Eye"]
  },
  "lost-foot": {
    key: "lost-foot",
    name: "Lost Foot",
    benefit: "Halve all movement, round up, and suffer -20 to movement actions and mobility-based tests.",
    description: "The character permanently reduces all movement by half, rounding up, and suffers a -20 penalty to all movement Actions as well as Skill and Characteristic Tests that rely on mobility, such as Shadowing.",
    tags: ["amputation", "foot", "leg", "mobility"],
    sourceKeys: ["lost-foot"],
    sourceInjuryHints: ["Lost Foot"]
  },
  "lost-leg": {
    key: "lost-leg",
    name: "Lost Leg",
    benefit: "As Lost Foot, but the character also cannot use the Dodge Skill.",
    description: "Treat this as a lost foot, but the character cannot use the Dodge Skill. Losing both legs leaves the character effectively unable to move normally without assistance, augmentation, or replacement limbs.",
    tags: ["amputation", "leg", "mobility"],
    sourceKeys: ["lost-leg"],
    sourceInjuryHints: ["Lost Leg"]
  },
  blindness: {
    key: "blindness",
    name: "Blindness",
    benefit: "Automatically fails vision-based tests and Ballistic Skill Tests, and suffers -30 to Weapon Skill and most other tests that ordinarily benefit from sight.",
    description: "A blind character automatically fails all tests based on vision and automatically fails all Ballistic Skill Tests. He also suffers a -30 penalty to Weapon Skill Tests and most other tests that ordinarily benefit from vision.",
    tags: ["vision", "head", "sensory"],
    sourceKeys: ["blinded"],
    sourceInjuryHints: ["Permanent Blindness", "Blindness", "Blasted Eyes", "Face Destroyed"]
  },
  deafness: {
    key: "deafness",
    name: "Deafness",
    benefit: "Automatically fails tests that rely on hearing and cannot communicate normally by sound.",
    description: "The character cannot hear at all, or at least not well enough to communicate with others. Until the character recovers or has the disability repaired, he automatically fails any Skill or Characteristic Test that relies on hearing.",
    tags: ["hearing", "head", "sensory"],
    sourceKeys: ["deafened"],
    sourceInjuryHints: ["Deafness", "Deafened and Scarred"]
  },
  "broken-arm": {
    key: "broken-arm",
    name: "Broken Arm",
    benefit: "Counts as only having one arm until repaired.",
    description: "The arm is broken and, until repaired, the character counts as having only one arm. Depending on the source of the injury, the character may also be suffering Blood Loss, Fatigue, or shock.",
    tags: ["arm", "fracture", "mobility"],
    sourceInjuryHints: ["Broken Arm"]
  },
  "broken-leg": {
    key: "broken-leg",
    name: "Broken Leg",
    benefit: "Counts as only having one leg until repaired.",
    description: "The leg is broken and, until repaired, the character counts as having only one leg. Depending on the source of the injury, the character may also suffer Blood Loss, reduced movement, or shock.",
    tags: ["leg", "fracture", "mobility"],
    sourceInjuryHints: ["Broken Leg"]
  },
  "ruined-hand": {
    key: "ruined-hand",
    name: "Ruined Hand",
    benefit: "The hand is maimed, crippled, or permanently loses function unless replaced or repaired.",
    description: "The character's hand is crushed, mangled, burned, or otherwise ruined. Until repaired or replaced, it is effectively unusable and may impose severe penalties on any tests requiring both hands or fine manipulation.",
    tags: ["hand", "maimed", "arm"],
    sourceInjuryHints: ["Ruined Hand"]
  },
  "ruined-foot": {
    key: "ruined-foot",
    name: "Ruined Foot",
    benefit: "The foot is maimed or permanently loses function, severely reducing mobility.",
    description: "The character's foot is crushed, burned, or partially destroyed. Until repaired or replaced, movement is severely hindered and many mobility-based actions suffer penalties or become impossible.",
    tags: ["foot", "maimed", "mobility", "leg"],
    sourceInjuryHints: ["Ruined Foot"]
  },
  "missing-fingers": {
    key: "missing-fingers",
    name: "Missing Fingers",
    benefit: "Lost fingers impair grip and fine manipulation.",
    description: "The character has lost one or more fingers, reducing dexterity, grip, and the ability to perform delicate tasks until prosthetics, augmetics, or other remedies are found.",
    tags: ["hand", "fingers", "maimed"],
    sourceInjuryHints: ["Missing Fingers"]
  },
  "internal-organ-damage": {
    key: "internal-organ-damage",
    name: "Internal Organ Damage",
    benefit: "Severe internal trauma can reduce Toughness, restrict activity, and require long recovery.",
    description: "The character's internal organs have been cooked, ruptured, or otherwise severely damaged. This is an ongoing serious injury, likely involving long recovery, fatigue, pain, restricted actions, and possible lasting Characteristic loss.",
    tags: ["body", "internal", "torso"],
    sourceInjuryHints: ["Internal Organ Damage", "Severe Torso Trauma", "Abdominal Trauma"]
  },
  "hideous-scarring": {
    key: "hideous-scarring",
    name: "Hideous Scarring",
    benefit: "Permanent scarring reduces Fellowship and may mark the character for life.",
    description: "The character is left with extensive visible scarring or disfigurement that permanently alters appearance and social presence. This often causes a lasting Fellowship penalty.",
    tags: ["scar", "appearance", "fellowship"],
    sourceInjuryHints: ["Hideous Scarring", "Facial Maiming", "Deafened and Scarred"]
  },
  "blood-loss-trauma": {
    key: "blood-loss-trauma",
    name: "Blood-Loss Trauma",
    benefit: "Major open wound causing ongoing Blood Loss and a dangerous recovery period.",
    description: "The character has sustained a grievous open wound that causes Blood Loss and serious systemic trauma. Even after immediate treatment, recovery is difficult and the injury may continue to hamper activity.",
    tags: ["blood-loss", "trauma", "wound"],
    sourceInjuryHints: ["Blood-Loss Arm Trauma", "Blood-Loss Leg Trauma", "Blood-Loss Torso Trauma"]
  },
  "nerve-damage": {
    key: "nerve-damage",
    name: "Nerve Damage",
    benefit: "Loss of coordination, reduced control, or restricted actions due to damaged nerves.",
    description: "The character's nervous system has been badly damaged, leading to impaired control, slower responses, restricted actions, and an uneven or unreliable recovery.",
    tags: ["nerves", "body", "coordination"],
    sourceInjuryHints: ["Nerve Damage"]
  },
  "broken-ribs": {
    key: "broken-ribs",
    name: "Broken Ribs",
    benefit: "Breathing and physical exertion become painful and risky until properly treated.",
    description: "One or more ribs have been broken. Until set and healed, breathing, movement, and strenuous activity are painful, and further exertion may worsen the injury or risk puncturing vital organs.",
    tags: ["ribs", "torso", "fracture"],
    sourceInjuryHints: ["Broken Ribs"]
  },
  "skull-fracture": {
    key: "skull-fracture",
    name: "Skull Fracture",
    benefit: "Severe head trauma can cause long-lasting disorientation, reduced movement, and neurological complications.",
    description: "The character has suffered a fractured skull or similar major head trauma. Recovery is slow and the injury may cause ongoing penalties, neurological symptoms, or vulnerability to further damage.",
    tags: ["head", "fracture", "neurological"],
    sourceInjuryHints: ["Skull Fracture"]
  },
  "kneecap-destroyed": {
    key: "kneecap-destroyed",
    name: "Kneecap Destroyed",
    benefit: "Movement is badly compromised until medical reconstruction or augmentation is possible.",
    description: "The character's kneecap has been torn free or destroyed, leaving the leg unstable and severely impairing movement until serious treatment or replacement is obtained.",
    tags: ["leg", "knee", "mobility"],
    sourceInjuryHints: ["Kneecap Destroyed"]
  }
});

function normalizePercentileRoll(rollTotal) {
  const total = Number(rollTotal ?? 0);
  if (total === 0) return 100;
  if (total < 0) return 0;
  if (total > 100) return 100;
  return total;
}

export function getReferenceTableDefinition(tableKey) {
  return REFERENCE_TABLE_DEFINITIONS[tableKey] ?? null;
}

export function listReferenceTables() {
  return Object.values(REFERENCE_TABLE_DEFINITIONS);
}

export function resolveReferenceTableResult(tableKey, rollTotal) {
  const table = getReferenceTableDefinition(tableKey);
  if (!table) return null;

  const normalizedRoll = normalizePercentileRoll(rollTotal);
  return table.entries.find((entry) => normalizedRoll >= Number(entry.min ?? 0) && normalizedRoll <= Number(entry.max ?? 0)) ?? null;
}

export function buildReferenceTableItemData(tableKey, rollTotal, overrides = {}) {
  const table = getReferenceTableDefinition(tableKey);
  if (!table) return null;

  const normalizedRoll = normalizePercentileRoll(rollTotal);
  const entry = resolveReferenceTableResult(tableKey, normalizedRoll);
  const formattedRoll = String(normalizedRoll).padStart(2, "0");
  const itemType = overrides.type ?? ((tableKey === "mutations" || tableKey === "navigatorMutations") ? "mutation" : tableKey === "malignancies" ? "malignancy" : "talent");
  const singularLabel = table.label.replace(/ies$/i, "y").replace(/s$/i, "");

  if (!entry) {
    return {
      name: overrides.name ?? `Unresolved ${singularLabel} (${formattedRoll})`,
      type: itemType,
      system: {
        ...(itemType === "talent"
          ? {
              category: overrides.category ?? table.defaultCategory,
              rating: "",
              prerequisites: "",
              benefit: overrides.benefit ?? `Recorded a ${table.label.toLowerCase()} roll of ${formattedRoll}.`
            }
          : {
              summary: overrides.summary ?? overrides.benefit ?? `Recorded a ${table.label.toLowerCase()} roll of ${formattedRoll}.`,
              severity: overrides.severity ?? "",
              sourceTable: overrides.sourceTable ?? table.key,
              rollRange: overrides.rollRange ?? formattedRoll,
              notes: overrides.notes ?? ""
            }),
        description: overrides.description ?? `This character rolled ${formattedRoll} on the ${table.label} table. The system reference entries for this table have not been populated yet, so resolve the exact result from the book and update this record later.`
      }
    };
  }

  return {
    name: overrides.name ?? entry.name,
    type: itemType,
    system: {
      ...(itemType === "talent"
        ? {
            category: overrides.category ?? entry.category ?? table.defaultCategory,
            rating: "",
            prerequisites: "",
            benefit: overrides.benefit ?? entry.benefit ?? `${table.label} result for roll ${formattedRoll}.`
          }
        : {
            summary: overrides.summary ?? overrides.benefit ?? entry.benefit ?? `${table.label} result for roll ${formattedRoll}.`,
            severity: overrides.severity ?? "",
            sourceTable: overrides.sourceTable ?? table.key,
            rollRange: overrides.rollRange ?? `${String(entry.min).padStart(2, "0")}-${String(entry.max).padStart(2, "0")}`,
            notes: overrides.notes ?? ""
          }),
      description: overrides.description ?? entry.description ?? entry.benefit ?? `${table.label} result for roll ${formattedRoll}.`
    }
  };
}

export function getMentalDisorderDefinition(disorderKey) {
  return MENTAL_DISORDER_DEFINITIONS[disorderKey] ?? null;
}

export function listMentalDisorders() {
  return Object.values(MENTAL_DISORDER_DEFINITIONS);
}

export function getCriticalInjuryDefinition(injuryKey) {
  return CRITICAL_INJURY_DEFINITIONS[injuryKey] ?? null;
}

export function listCriticalInjuries() {
  return Object.values(CRITICAL_INJURY_DEFINITIONS);
}

export function buildCriticalInjuryItemData(injuryKey, overrides = {}) {
  const injury = getCriticalInjuryDefinition(injuryKey);
  if (!injury) return null;

  return {
    name: overrides.name ?? injury.name,
    type: overrides.type ?? "criticalInjury",
    system: {
      summary: overrides.summary ?? overrides.benefit ?? injury.benefit,
      severity: overrides.severity ?? "",
      sourceTable: overrides.sourceTable ?? "criticalInjuries",
      rollRange: overrides.rollRange ?? "",
      notes: overrides.notes ?? "",
      description: overrides.description ?? injury.description
    }
  };
}

export function buildMentalDisorderItemData(disorderKey, severity = null, overrides = {}) {
  const disorder = getMentalDisorderDefinition(disorderKey);
  if (!disorder) return null;

  const normalizedSeverity = severity ? String(severity).toLowerCase() : null;
  const chosenSeverity = normalizedSeverity && disorder.severities.includes(normalizedSeverity)
    ? normalizedSeverity
    : disorder.severities[0] ?? null;
  const severityLabel = chosenSeverity ? `${chosenSeverity.charAt(0).toUpperCase()}${chosenSeverity.slice(1)} ` : "";
  const severityDescription = chosenSeverity ? disorder.severityDescriptions?.[chosenSeverity] : "";

  return {
    name: overrides.name ?? `${severityLabel}${disorder.name}`.trim(),
    type: overrides.type ?? "mentalDisorder",
    system: {
      summary: overrides.summary ?? overrides.benefit ?? disorder.benefit,
      severity: overrides.severity ?? chosenSeverity ?? "",
      sourceTable: overrides.sourceTable ?? "mentalDisorders",
      rollRange: overrides.rollRange ?? "",
      notes: overrides.notes ?? "",
      description: overrides.description ?? [disorder.description, severityDescription].filter(Boolean).join("\n\n")
    }
  };
}

export const ROGUE_TRADER_XENOS_RACES = [
  "Orks",
  "Eldar",
  "Necrons",
  "Tyranids",
  "T'au",
  "Drukhari"
];

export function listXenosRaces() {
  return [...ROGUE_TRADER_XENOS_RACES];
}

export const ROGUE_TRADER_REFERENCE_TABLES = REFERENCE_TABLE_DEFINITIONS;
export const ROGUE_TRADER_MENTAL_DISORDERS = MENTAL_DISORDER_DEFINITIONS;
export const ROGUE_TRADER_CRITICAL_INJURIES = CRITICAL_INJURY_DEFINITIONS;

