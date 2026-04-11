export class RogueTraderTorpedoSheet extends ActorSheet {
  static register() {
    Actors.registerSheet("roguetrader", RogueTraderTorpedoSheet, {
      types: ["torpedo"],
      makeDefault: true
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "sheet", "actor", "torpedo"],
      width: 720,
      height: 640,
      template: "systems/roguetrader/templates/actors/torpedo-sheet.hbs",
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.torpedoTypeOptions = {
      plasma: "Plasma",
      boarding: "Boarding",
      melta: "Melta",
      virus: "Virus",
      vortex: "Vortex"
    };
    context.guidanceOptions = {
      standard: "Standard",
      guided: "Guided",
      seeking: "Seeking",
      shortBurn: "Short-Burn"
    };
    return context;
  }
}
