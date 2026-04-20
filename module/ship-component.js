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
    this.#injectHeaderControls(root);
  }

  _getComponentTypeLabel(itemType) {
    switch (String(itemType ?? "")) {
      case "essentialComponent": return "Essential Component";
      case "supplementalComponent": return "Supplemental Component";
      case "shipComponent": return "Ship Component";
      default: return "Ship Component";
    }
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
    const componentSheet = root.matches(".ship-component-sheet")
      ? root
      : (root.closest?.(".ship-component-sheet") ?? root.querySelector(".ship-component-sheet"));
    const sheetBody = componentSheet?.querySelector(".ship-component-sheet-body");

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

    if (componentSheet) {
      componentSheet.style.flex = "1 1 auto";
      componentSheet.style.minHeight = "0";
      componentSheet.style.height = "100%";
      componentSheet.style.overflow = "visible";
    }

    if (sheetBody) {
      sheetBody.style.flex = "1 1 auto";
      sheetBody.style.minHeight = "0";
      sheetBody.style.overflow = "visible";
    }
  }

  #injectHeaderControls(root) {
    if (!game.user?.isGM) return;

    const windowHeader = root.matches(".window-header")
      ? root
      : (root.closest?.(".window-content")?.previousElementSibling?.matches?.(".window-header")
        ? root.closest(".window-content").previousElementSibling
        : (root.closest?.(".application")?.querySelector?.(".window-header")
          ?? root.closest?.(".app")?.querySelector?.(".window-header")
          ?? document.querySelector?.(`[data-appid="${this.appId}"] .window-header`)));

    if (!windowHeader) return;

    const existingButton = windowHeader.querySelector(`.rt-ship-component-modifiers[data-app-id="${this.appId}"]`);
    if (existingButton) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "header-control icon rt-ship-component-modifiers";
    button.dataset.appId = String(this.appId);
    button.title = "Edit Ship Modifiers";
    button.setAttribute("aria-label", "Edit Ship Modifiers");
    button.innerHTML = `<i class="fas fa-sliders-h"></i>`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.#openShipModifiersDialog();
    });

    const closeButton = windowHeader.querySelector('[data-action="close"], .window-header-control.close, .header-control.close, .close');
    if (closeButton) {
      closeButton.insertAdjacentElement("beforebegin", button);
      return;
    }

    windowHeader.append(button);
  }

  async #openShipModifiersDialog() {
    const currentValue = String(this.item.system?.shipModifiers ?? "").trim();

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      new Dialog({
        title: `${this.item.name}: Ship Modifiers`,
        content: `
          <div class="roguetrader-attack-reaction-dialog">
            <p>Enter component modifiers as a comma-separated list.</p>
            <p><strong>Example:</strong> Speed +1, Manoeuvrability +5, Morale +10</p>
            <div class="form-group">
              <label for="rt-ship-component-modifiers">Modifiers</label>
              <textarea id="rt-ship-component-modifiers" name="shipModifiers" rows="6" placeholder="Speed +1, Manoeuvrability +5, Morale +10">${foundry.utils.escapeHTML(currentValue)}</textarea>
            </div>
          </div>
        `,
        buttons: {
          save: {
            label: "Save",
            callback: async (html) => {
              const root = html?.[0] ?? html;
              const value = String(root?.querySelector?.('[name="shipModifiers"]')?.value ?? "").trim();
              await this.item.update({ "system.shipModifiers": value });
              finish(value);
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => finish(null)
          }
        },
        default: "save",
        close: () => finish(null)
      }).render(true);
    });
  }
}
