const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class RogueTraderStarshipHullSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderStarshipHullSheet, {
      types: ["starshipHull"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "starship-hull"],
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
      template: "systems/roguetrader/templates/items/starship-hull.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.classOptions = {
      transport: "Transport",
      raider: "Raider",
      frigate: "Frigate",
      lightCruiser: "Light Cruiser",
      cruiser: "Cruiser",
      grandCruiser: "Grand Cruiser",
      battleship: "Battlecruiser"
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
    return context;
  }
}
