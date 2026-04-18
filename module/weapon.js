const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const WEAPON_QUALITIES = [
  { key: "accurate", label: "Accurate" },
  { key: "balanced", label: "Balanced" },
  { key: "blast", label: "Blast" },
  { key: "cleansingFire", label: "Cleansing Fire" },
  { key: "customized", label: "Customized" },
  { key: "defensive", label: "Defensive" },
  { key: "felling", label: "Felling" },
  { key: "flame", label: "Flame" },
  { key: "flexible", label: "Flexible" },
  { key: "force", label: "Force" },
  { key: "haywire", label: "Haywire" },
  { key: "inaccurate", label: "Inaccurate" },
  { key: "overheats", label: "Overheats" },
  { key: "powerField", label: "Power Field" },
  { key: "primitive", label: "Primitive" },
  { key: "recharge", label: "Recharge" },
  { key: "reliable", label: "Reliable" },
  { key: "sanctified", label: "Sanctified" },
  { key: "scatter", label: "Scatter" },
  { key: "shocking", label: "Shocking" },
  { key: "smoke", label: "Smoke" },
  { key: "snare", label: "Snare" },
  { key: "storm", label: "Storm" },
  { key: "tearing", label: "Tearing" },
  { key: "toxic", label: "Toxic" },
  { key: "twinLinked", label: "Twin-linked" },
  { key: "unbalanced", label: "Unbalanced" },
  { key: "unreliable", label: "Unreliable" },
  { key: "unstable", label: "Unstable" },
  { key: "unwieldy", label: "Unwieldy" },
  { key: "warpWeapon", label: "Warp Weapon" }
];

export class RogueTraderWeaponSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderWeaponSheet, {
      types: ["weapon"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "weapon"],
    position: {
      width: 820,
      height: 840
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
      template: "systems/roguetrader/templates/items/weapon.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const weaponClass = this.item.system.class ?? "basic";
    const weaponType = this.item.system.weaponType ?? "las";
    const special = this.item.system.special ?? {};

    context.item = this.item;
    context.system = this.item.system;
    context.weaponClassOptions = {
      basic: "Basic",
      melee: "Melee",
      pistol: "Pistol",
      thrown: "Thrown",
      heavy: "Heavy"
    };
    context.weaponTypeOptions = {
      las: "Las",
      sp: "SP",
      bolt: "Bolt",
      melta: "Melta",
      plasma: "Plasma",
      flame: "Flame",
      primitive: "Primitive",
      launcher: "Launcher",
      grenade: "Grenade",
      missile: "Missile",
      exotic: "Exotic",
      chain: "Chain",
      power: "Power",
      exoticMelee: "Exotic Melee",
      shock: "Shock"
    };
    context.availabilityOptions = {
      ubiquitous: "Ubiquitous",
      abundant: "Abundant",
      plentiful: "Plentiful",
      common: "Common",
      average: "Average",
      scarce: "Scarce",
      rare: "Rare",
      veryRare: "Very Rare",
      extremelyRare: "Extremely Rare",
      nearUnique: "Near Unique",
      unique: "Unique"
    };
    context.craftsmanshipOptions = {
      best: "Best",
      good: "Good",
      common: "Common",
      poor: "Poor"
    };
    context.reloadOptions = {
      half: "1/2 Action",
      full: "Full",
      twoFull: "2 Full",
      threeFull: "3 Full",
      fourFull: "4 Full",
      fiveFull: "5 Full"
    };
    context.showRange = weaponClass !== "melee";
    context.showRof = weaponClass !== "melee";
    context.showClipAndReload = weaponClass !== "melee" && weaponClass !== "thrown";
    context.showMaximalMode = String(weaponType).trim().toLowerCase() === "plasma";
    context.weaponQualities = WEAPON_QUALITIES.map((quality) => ({
      ...quality,
      checked: Boolean(special[quality.key])
    }));

    return context;
  }
}


