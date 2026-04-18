const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class RogueTraderShipComponentSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderShipComponentSheet, {
      types: ["shipComponent", "essentialComponent", "supplementalComponent"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "ship-component"],
    position: {
      width: 760,
      height: 700
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
      template: "systems/roguetrader/templates/items/ship-component.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.componentTypeLabel = this._getComponentTypeLabel(this.item.type);
    context.usesSupplementalCategories = this.item.type === "supplementalComponent";
    const componentType = String(this.item.system?.componentType ?? this.item.system?.categoryType ?? "").trim();
    context.isVoidShieldComponent = !context.usesSupplementalCategories && componentType === "voidShields";
    context.componentCategoryOptions = context.usesSupplementalCategories
      ? {
          cargoPassengerHolds: "Cargo / Passenger Holds",
          augmentsEnhancements: "Augments / Enhancements",
          additionalFacilities: "Additional Facilities"
        }
      : {
          plasmaDrives: "Plasma Drives",
          warpEngines: "Warp Engines",
          gellarFields: "Gellar Fields",
          voidShields: "Void Shields",
          shipsBridge: "Ship's Bridge",
          lifeSustainers: "Life Sustainers",
          crewQuarters: "Crew Quarters",
          augurArrays: "Augur Arrays"
        };
    context.hullAvailabilityOptions = [
      { key: "transport", label: "Transports" },
      { key: "raider", label: "Raiders" },
      { key: "frigate", label: "Frigates" },
      { key: "lightCruiser", label: "Light Cruisers" },
      { key: "cruiser", label: "Cruisers" },
      { key: "grandCruiser", label: "Grand Cruisers" },
      { key: "battleship", label: "Battlecruisers" },
      { key: "allShips", label: "All Ships" }
    ];
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

  _getComponentTypeLabel(itemType) {
    switch (String(itemType ?? "")) {
      case "essentialComponent": return "Essential Component";
      case "supplementalComponent": return "Supplemental Component";
      case "shipComponent": return "Ship Component";
      default: return "Ship Component";
    }
  }
}
