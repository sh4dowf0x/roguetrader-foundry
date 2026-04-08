export class RogueTraderItem extends Item {
  async roll(options = {}) {
    switch (this.type) {
      case "skill":
        return this.rollSkill(options);
      case "psychicTechnique":
        return this.rollPsychicTechnique(options);
      case "weapon":
        return this.rollAttack(options);
      default:
        ui.notifications?.warn(`Rogue Trader | No default roll configured for ${this.type}.`);
        return null;
    }
  }

  async rollSkill(options = {}) {
    if (!this.actor) {
      ui.notifications?.warn("Rogue Trader | Skills must be owned by an actor to roll.");
      return null;
    }

    return this.actor.rollSkill(this, options);
  }

  async rollPsychicTechnique(options = {}) {
    if (!this.actor) {
      ui.notifications?.warn("Rogue Trader | Psychic techniques must be owned by an actor to roll.");
      return null;
    }

    return this.actor.rollPsychicTechnique(this, options);
  }

  async rollAttack(options = {}) {
    if (!this.actor) {
      ui.notifications?.warn("Rogue Trader | Weapons must be owned by an actor to roll attacks.");
      return null;
    }

    return this.actor.rollAttack(this, options);
  }
}

