const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const TORPEDO_TYPE_PROFILES = {
  plasma: {
    label: "Plasma",
    speed: 10,
    damage: "2d10+14",
    critRating: "10",
    range: "60"
  },
  boarding: {
    label: "Boarding",
    speed: 10,
    damage: "2d10+11",
    critRating: "-",
    range: "60"
  },
  melta: {
    label: "Melta",
    speed: 10,
    damage: "2d10+15",
    critRating: "9+",
    range: "60"
  },
  virus: {
    label: "Virus",
    speed: 10,
    damage: "2d10+10",
    critRating: "-",
    range: "60"
  },
  vortex: {
    label: "Vortex",
    speed: 10,
    damage: "2d10+5",
    critRating: "6+",
    range: "60"
  }
};
const TORPEDO_GUIDANCE_OPTIONS = {
  standard: "Standard",
  guided: "Guided",
  seeking: "Seeking",
  shortBurn: "Short-Burn"
};

export class RogueTraderShipWeaponSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static register() {
    Items.registerSheet("roguetrader", RogueTraderShipWeaponSheet, {
      types: ["shipWeapon"],
      makeDefault: true
    });
  }

  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["roguetrader", "sheet", "item", "ship-weapon"],
    position: {
      width: 820,
      height: 760
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
      template: "systems/roguetrader/templates/items/ship-weapon.hbs",
      root: true
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isTorpedoWeapon = String(this.item.system?.weaponClass ?? "").trim().toLowerCase() === "torpedo";
    context.weaponClassOptions = {
      macrobattery: "Macrobattery",
      lance: "Lance",
      nova: "Nova Cannon",
      torpedo: "Torpedo Tube",
      bay: "Landing Bay"
    };
    context.torpedoTypeOptions = Object.fromEntries(
      Object.entries(TORPEDO_TYPE_PROFILES).map(([key, profile]) => [key, profile.label])
    );
    context.torpedoGuidanceOptions = TORPEDO_GUIDANCE_OPTIONS;
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
      { key: "battlecruiser", label: "Battlecruisers" },
      { key: "grandCruiser", label: "Grand Cruisers" },
      { key: "battleship", label: "Battleships" },
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
    context.componentStatusOptions = {
      intact: "Intact",
      unpowered: "Unpowered",
      damaged: "Damaged",
      destroyed: "Destroyed"
    };
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const root = this.#getRootElement();
    if (!root) return;

    this.#configureScrollLayout(root);
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const weaponClass = String(expanded.system?.weaponClass ?? this.item.system?.weaponClass ?? "").trim().toLowerCase();
    const torpedoType = String(expanded.system?.torpedoType ?? this.item.system?.torpedoType ?? "").trim().toLowerCase();

    if (weaponClass === "torpedo") {
      const profile = TORPEDO_TYPE_PROFILES[torpedoType] ?? null;
      if (profile) {
        expanded.system.torpedoSpeed = profile.speed;
        expanded.system.damage = profile.damage;
        expanded.system.critRating = profile.critRating;
        expanded.system.range = profile.range;
      }
    } else {
      expanded.system.torpedoSpeed = 0;
    }

    return super._updateObject(event, foundry.utils.flattenObject(expanded));
  }

  #getRootElement() {
    if (this.element instanceof HTMLElement) return this.element;
    return this.element?.[0] ?? null;
  }

  #configureScrollLayout(root) {
    const windowContent = root.matches(".window-content")
      ? root
      : (root.closest?.(".window-content") ?? root.querySelector(".window-content"));
    const form = root.matches("form")
      ? root
      : (root.closest?.("form") ?? root.querySelector("form"));
    const weaponSheet = root.matches(".ship-weapon-sheet")
      ? root
      : (root.closest?.(".ship-weapon-sheet") ?? root.querySelector(".ship-weapon-sheet"));
    const sheetBody = weaponSheet?.querySelector(".ship-weapon-sheet-body");

    if (windowContent) {
      windowContent.style.display = "flex";
      windowContent.style.flexDirection = "column";
      windowContent.style.minHeight = "0";
      windowContent.style.height = "100%";
      windowContent.style.overflowY = "auto";
      windowContent.style.overflowX = "hidden";
      windowContent.style.padding = "0";
    }

    if (form) {
      form.style.display = "flex";
      form.style.flexDirection = "column";
      form.style.flex = "1 1 auto";
      form.style.minHeight = "0";
      form.style.height = "auto";
      form.style.overflow = "visible";
    }

    if (weaponSheet) {
      weaponSheet.style.flex = "1 1 auto";
      weaponSheet.style.minHeight = "0";
      weaponSheet.style.height = "100%";
      weaponSheet.style.overflow = "visible";
    }

    if (sheetBody) {
      sheetBody.style.flex = "1 1 auto";
      sheetBody.style.minHeight = "0";
      sheetBody.style.overflow = "visible";
    }
  }
}
