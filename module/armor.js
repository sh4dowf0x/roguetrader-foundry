const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ARMOR_LOCATIONS = [
  { key: "arms", label: "Arms" },
  { key: "body", label: "Body" },
  { key: "legs", label: "Legs" },
  { key: "head", label: "Head" }
];

const ARMOR_SPECIALS = [
  { key: "communications", label: "Communications" },
  { key: "autoSenses", label: "Auto-senses" },
  { key: "preysense", label: "Preysense" },
  { key: "powerArmour", label: "Power Armour" },
  { key: "rebreather", label: "Rebreather" },
  { key: "sealed", label: "Sealed" },
  { key: "hulking", label: "Hulking" },
  { key: "flak", label: "Flak" },
  { key: "primitive", label: "Primitive" }
];

export class RogueTraderArmorSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderArmorSheet, {
      types: ["armor"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "armor"],
    position: {
      width: 780,
      height: 820
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
      template: "systems/roguetrader/templates/items/armor.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const locations = this.item.system.locations ?? {};
    const ap = this.item.system.ap ?? {};
    const special = this.item.system.special ?? {};

    context.item = this.item;
    context.system = this.item.system;
    context.armorTypeOptions = {
      primitive: "Primitive",
      flak: "Flak",
      mesh: "Mesh",
      carapace: "Carapace",
      other: "Other",
      power: "Power"
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
    context.locationRows = ARMOR_LOCATIONS.map((location) => ({
      ...location,
      covered: Boolean(locations[location.key]),
      ap: Number(ap[location.key] ?? 0)
    }));
    context.armorSpecials = ARMOR_SPECIALS.map((quality) => ({
      ...quality,
      checked: Boolean(special[quality.key])
    }));

    return context;
  }
}
