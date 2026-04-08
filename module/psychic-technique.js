export class RogueTraderPsychicTechniqueSheet extends ItemSheet {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderPsychicTechniqueSheet, {
      types: ["psychicTechnique"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "item", "psychic-technique"],
      width: 600,
      height: 620,
      template: "systems/roguetrader/templates/items/psychic-technique.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.item = this.item;
    context.system = this.item.system;
    context.valueOptions = {
      100: "100",
      200: "200",
      300: "300",
      400: "400",
      500: "500"
    };
    context.focusPowerTestOptions = {
      no: "No",
      willpower: "Willpower",
      opposedWillpower: "Opposed Willpower",
      psyniscience: "Psyniscience"
    };
    context.focusTimeOptions = {
      "n/a": "N/A",
      varies: "Varies",
      freeAction: "Free Action",
      fullAction: "Full Action",
      halfAction: "Half Action"
    };
    context.sustainOptions = {
      no: "No",
      yes: "Yes",
      "n/a": "N/A"
    };

    return context;
  }
}
