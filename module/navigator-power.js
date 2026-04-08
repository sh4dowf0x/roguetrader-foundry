export class RogueTraderNavigatorPowerSheet extends ItemSheet {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderNavigatorPowerSheet, {
      types: ["navigatorPower"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "item", "navigator-power"],
      width: 560,
      height: 560,
      template: "systems/roguetrader/templates/items/navigator-power.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.item = this.item;
    context.system = this.item.system;
    context.masteryOptions = {
      "n/a": "N/A",
      novice: "Novice",
      adept10: "Adept +10",
      master20: "Master +20"
    };

    return context;
  }
}
