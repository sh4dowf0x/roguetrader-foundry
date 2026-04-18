const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class RogueTraderPsychicTechniqueSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderPsychicTechniqueSheet, {
      types: ["psychicTechnique"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "psychic-technique"],
    position: {
      width: 600,
      height: 640
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
      template: "systems/roguetrader/templates/items/psychic-technique.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
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
