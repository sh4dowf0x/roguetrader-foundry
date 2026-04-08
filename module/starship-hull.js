export class RogueTraderStarshipHullSheet extends ItemSheet {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderStarshipHullSheet, {
      types: ["starshipHull"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "item", "starship-hull"],
      width: 780,
      height: 820,
      template: "systems/roguetrader/templates/items/starship-hull.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
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

  activateListeners(html) {
    super.activateListeners(html);
    const textareas = html.find(".starship-hull-autosize");
    textareas.each((_, element) => {
      this._autosizeTextarea(element);
    });
    textareas.on("input", (event) => {
      this._autosizeTextarea(event.currentTarget);
    });
    textareas.on("change", (event) => {
      this._autosizeTextarea(event.currentTarget);
    });
    requestAnimationFrame(() => {
      textareas.each((_, element) => {
        this._autosizeTextarea(element);
      });
    });
    window.setTimeout(() => {
      textareas.each((_, element) => {
        this._autosizeTextarea(element);
      });
    }, 80);
  }

  _autosizeTextarea(element) {
    if (!(element instanceof HTMLTextAreaElement)) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight + 12, 96)}px`;
  }
}
