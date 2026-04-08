export class RogueTraderShipWeaponSheet extends ItemSheet {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderShipWeaponSheet, {
      types: ["shipWeapon"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "item", "ship-weapon"],
      width: 820,
      height: 760,
      template: "systems/roguetrader/templates/items/ship-weapon.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.item = this.item;
    context.system = this.item.system;
    context.weaponClassOptions = {
      macrobattery: "Macrobattery",
      lance: "Lance",
      nova: "Nova Cannon",
      torpedo: "Torpedo Tube",
      bay: "Landing Bay"
    };
    context.locationOptions = {
      dorsal: "Dorsal",
      prow: "Prow",
      keel: "Keel",
      port: "Port",
      starboard: "Starboard"
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
    context.mountLocationOptions = [
      { key: "any", label: "Any" },
      { key: "dorsal", label: "Dorsal" },
      { key: "prow", label: "Prow" },
      { key: "keel", label: "Keel" },
      { key: "port", label: "Port" },
      { key: "starboard", label: "Starboard" }
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
}
