const SHIP_CONSTRUCTION_STAGES = [
  { key: "hull", label: "Hull" },
  { key: "essential", label: "Essential Components" },
  { key: "supplemental", label: "Supplemental Components" },
  { key: "weapons", label: "Weapons" },
  { key: "summary", label: "Summary" }
];

const ESSENTIAL_COMPONENT_SLOTS = [
  { key: "plasmaDriveUuid", componentType: "plasmaDrives", label: "Plasma Drive" },
  { key: "warpEngineUuid", componentType: "warpEngines", label: "Warp Engine" },
  { key: "gellarFieldUuid", componentType: "gellarFields", label: "Gellar Field" },
  { key: "voidShieldUuid", componentType: "voidShields", label: "Void Shield" },
  { key: "shipsBridgeUuid", componentType: "shipsBridge", label: "Ship's Bridge" },
  { key: "lifeSustainerUuid", componentType: "lifeSustainers", label: "Life Sustainer" },
  { key: "crewQuartersUuid", componentType: "crewQuarters", label: "Crew Quarters" },
  { key: "augurArrayUuid", componentType: "augurArrays", label: "Augur Arrays" }
];

const SUPPLEMENTAL_COMPONENT_CATEGORIES = [
  { key: "cargoPassengerHolds", label: "Cargo / Passenger Holds" },
  { key: "augmentsEnhancements", label: "Augments / Enhancements" },
  { key: "additionalFacilities", label: "Additional Facilities" }
];

const SHIP_WEAPON_LOCATION_LABELS = {
  dorsal: "Dorsal",
  prow: "Prow",
  keel: "Keel",
  port: "Port",
  starboard: "Starboard"
};

const SHIP_WEAPON_CLASS_LABELS = {
  macrobattery: "Macrobattery",
  lance: "Lance",
  nova: "Nova Cannon",
  torpedo: "Torpedo Tube",
  bay: "Landing Bay"
};

const STARSHIP_HULL_CLASSES = [
  { key: "all", label: "All" },
  { key: "transport", label: "Transport" },
  { key: "raider", label: "Raider" },
  { key: "frigate", label: "Frigate" },
  { key: "lightCruiser", label: "Light Cruiser" },
  { key: "cruiser", label: "Cruiser" },
  { key: "grandCruiser", label: "Grand Cruiser" },
  { key: "battleship", label: "Battlecruiser" }
];

const INDEX_ITEM_TYPES = new Set(["starshipHull", "essentialComponent", "supplementalComponent", "shipWeapon"]);

function normalizeUuid(value) {
  return String(value ?? "").trim();
}

function formatSignedValue(value) {
  const number = Number(value ?? 0) || 0;
  return number >= 0 ? `+${number}` : `${number}`;
}

function getSourceLabel(item) {
  if (item?.parent?.uuid) return "Owned";
  if (item?.pack) {
    const pack = game.packs?.get(item.pack);
    return pack?.metadata?.label ?? "Compendium";
  }
  return "World";
}

function buildIndexEntry(item) {
  const shipPointCost = Number(item.system?.shipPointCost ?? item.system?.shipPoints ?? 0) || 0;
  return {
    uuid: item.uuid,
    id: item.id,
    name: item.name,
    img: item.img || "icons/svg/ship.svg",
    type: item.type,
    sourceLabel: getSourceLabel(item),
    owned: Boolean(item.parent?.uuid),
    shipPointCost,
    power: Number(item.system?.power ?? 0) || 0,
    generation: Number(item.system?.generation ?? 0) || 0,
    space: Number(item.system?.space ?? 0) || 0,
    componentType: String(item.system?.componentType ?? item.system?.categoryType ?? "").trim(),
    allowedHulls: foundry.utils.deepClone(item.system?.allowedHulls ?? {}),
    allowedLocations: foundry.utils.deepClone(item.system?.allowedLocations ?? {}),
    origin: String(item.system?.origin ?? "").trim(),
    hullClass: String(item.system?.class ?? "").trim(),
    dimensions: String(item.system?.dimensions ?? "").trim(),
    mass: String(item.system?.mass ?? "").trim(),
    crewComplement: String(item.system?.crewComplement ?? "").trim(),
    acceleration: String(item.system?.acceleration ?? "").trim(),
    speed: Number(item.system?.speed ?? 0) || 0,
    maneuverability: Number(item.system?.maneuverability ?? 0) || 0,
    maneuverabilityLabel: formatSignedValue(item.system?.maneuverability ?? 0),
    detection: Number(item.system?.detection ?? 0) || 0,
    detectionLabel: formatSignedValue(item.system?.detection ?? 0),
    hullIntegrity: Number(item.system?.hullIntegrity ?? 0) || 0,
    armor: Number(item.system?.armor ?? 0) || 0,
    turretRating: Number(item.system?.turretRating ?? 0) || 0,
    shields: Number(item.system?.shields ?? 0) || 0,
    weaponCapacity: foundry.utils.deepClone(item.system?.weaponCapacity ?? {}),
    weaponClass: String(item.system?.weaponClass ?? "").trim(),
    weaponClassLabel: SHIP_WEAPON_CLASS_LABELS[String(item.system?.weaponClass ?? "").trim()] ?? String(item.system?.weaponClass ?? "").trim(),
    shortDescription: String(item.system?.shortDescription ?? "").trim(),
    description: String(item.system?.description ?? "").trim(),
    specialRules: String(item.system?.specialRules ?? "").trim()
  };
}

function normalizeHullClass(value) {
  return String(value ?? "").trim();
}

function getEssentialHullEligibilityKey(selectedHull) {
  return normalizeHullClass(selectedHull?.hullClass);
}

function filterEssentialComponentsForHull(components, selectedHull, componentType) {
  const list = Array.isArray(components) ? components : [];
  const requiredType = String(componentType ?? "").trim();
  const hullEligibilityKey = getEssentialHullEligibilityKey(selectedHull);

  return list.filter((entry) => {
    if (requiredType && String(entry.componentType ?? "").trim() !== requiredType) return false;
    if (!selectedHull) return false;
    const allowedHulls = entry.allowedHulls ?? {};
    return Boolean(allowedHulls.allShips || allowedHulls[hullEligibilityKey]);
  });
}

function buildEssentialSlotSelections(components, selectedHull, selectedEssentialSlots = {}) {
  return ESSENTIAL_COMPONENT_SLOTS.map((slot) => {
    const compatibleEntries = filterEssentialComponentsForHull(components, selectedHull, slot.componentType);
    const selectedUuid = normalizeUuid(selectedEssentialSlots?.[slot.key]);
    const selectedEntry = compatibleEntries.find((entry) => entry.uuid === selectedUuid) ?? null;
    return {
      ...slot,
      selectedUuid,
      selectedEntry,
      compatibleEntries: compatibleEntries.map((entry) => ({
        ...entry,
        checked: entry.uuid === selectedUuid
      }))
    };
  });
}

function buildSupplementalSelections(components, selectedHull, selectedSupplementalComponents = []) {
  const selectedUuids = new Set((Array.isArray(selectedSupplementalComponents) ? selectedSupplementalComponents : []).map(normalizeUuid).filter(Boolean));

  return SUPPLEMENTAL_COMPONENT_CATEGORIES.map((category) => {
    const compatibleEntries = filterEssentialComponentsForHull(components, selectedHull, category.key);
    const selectedEntries = compatibleEntries.filter((entry) => selectedUuids.has(entry.uuid));
    return {
      ...category,
      selectedEntries,
      compatibleEntries: compatibleEntries.map((entry) => ({
        ...entry,
        checked: selectedUuids.has(entry.uuid)
      }))
    };
  });
}

function buildWeaponSlotSelections(shipWeapons, selectedHull, selectedShipWeapons = {}) {
  const hull = selectedHull ?? {};
  const selectedBySlot = foundry.utils.deepClone(selectedShipWeapons ?? {});
  const hullEligibilityKey = getEssentialHullEligibilityKey(selectedHull);
  const slots = [];

  for (const [locationKey, label] of Object.entries(SHIP_WEAPON_LOCATION_LABELS)) {
    const capacity = Math.max(0, Number(hull.weaponCapacity?.[locationKey] ?? 0) || 0);
    for (let index = 1; index <= capacity; index += 1) {
      const slotKey = `${locationKey}-${index}`;
      const selectedUuid = normalizeUuid(selectedBySlot?.[slotKey]);
      const compatibleEntries = (Array.isArray(shipWeapons) ? shipWeapons : []).filter((entry) => {
        const allowedHulls = entry.allowedHulls ?? {};
        const allowedLocations = entry.allowedLocations ?? {};
        const hullMatch = Boolean(allowedHulls.allShips || allowedHulls[hullEligibilityKey]);
        const locationMatch = Boolean(allowedLocations.any || allowedLocations[locationKey]);
        return hullMatch && locationMatch;
      });
      const selectedEntry = compatibleEntries.find((entry) => entry.uuid === selectedUuid) ?? null;
      slots.push({
        slotKey,
        locationKey,
        label: `${label} ${index}`,
        selectedUuid,
        selectedEntry,
        compatibleEntries: compatibleEntries.map((entry) => ({
          ...entry,
          checked: entry.uuid === selectedUuid
        }))
      });
    }
  }

  return slots;
}

function computeBuildTotalsFromSelections(selectedHull, essentialSlotSelections, supplementalSelections, weaponSlotSelections, shipPointBudget = 0) {
  const hullCost = Number(selectedHull?.shipPointCost ?? 0) || 0;
  const essentialCost = essentialSlotSelections.reduce((total, slot) => total + (Number(slot.selectedEntry?.shipPointCost ?? 0) || 0), 0);
  const supplementalCost = supplementalSelections.reduce((total, category) => total + category.selectedEntries.reduce((inner, entry) => inner + (Number(entry.shipPointCost ?? 0) || 0), 0), 0);
  const shipWeaponCost = weaponSlotSelections.reduce((total, slot) => total + (Number(slot.selectedEntry?.shipPointCost ?? 0) || 0), 0);

  const powerProvided = Number(essentialSlotSelections.find((slot) => slot.key === "plasmaDriveUuid")?.selectedEntry?.power ?? 0) || 0;
  const supplementalGeneration = supplementalSelections.reduce((total, category) => total + category.selectedEntries.reduce((inner, entry) => inner + (Number(entry.generation ?? 0) || 0), 0), 0);
  const essentialPowerUsed = essentialSlotSelections
    .filter((slot) => slot.key !== "plasmaDriveUuid")
    .reduce((total, slot) => total + (Number(slot.selectedEntry?.power ?? 0) || 0), 0);
  const supplementalPowerUsed = supplementalSelections.reduce((total, category) => total + category.selectedEntries.reduce((inner, entry) => inner + (Number(entry.power ?? 0) || 0), 0), 0);
  const shipWeaponPowerUsed = weaponSlotSelections.reduce((total, slot) => total + (Number(slot.selectedEntry?.power ?? 0) || 0), 0);

  const essentialSpaceUsed = essentialSlotSelections.reduce((total, slot) => total + (Number(slot.selectedEntry?.space ?? 0) || 0), 0);
  const supplementalSpaceUsed = supplementalSelections.reduce((total, category) => total + category.selectedEntries.reduce((inner, entry) => inner + (Number(entry.space ?? 0) || 0), 0), 0);
  const shipWeaponSpaceUsed = weaponSlotSelections.reduce((total, slot) => total + (Number(slot.selectedEntry?.space ?? 0) || 0), 0);
  const spaceAvailable = Number(selectedHull?.space ?? 0) || 0;

  return {
    shipPointBudget,
    hullCost,
    essentialCost,
    supplementalCost,
    shipWeaponCost,
    totalSpent: hullCost + essentialCost + supplementalCost + shipWeaponCost,
    remaining: shipPointBudget - (hullCost + essentialCost + supplementalCost + shipWeaponCost),
    powerProvided,
    supplementalGeneration,
    powerUsed: essentialPowerUsed + supplementalPowerUsed + shipWeaponPowerUsed,
    powerTotal: powerProvided + supplementalGeneration,
    spaceUsed: essentialSpaceUsed + supplementalSpaceUsed + shipWeaponSpaceUsed,
    spaceAvailable
  };
}

async function getIndexedItemsForType(actor, itemType) {
  const entries = [];
  const seen = new Set();

  const ownedItems = Array.from(actor.items ?? []).filter((item) => item.type === itemType);
  for (const item of ownedItems) {
    const uuid = normalizeUuid(item.uuid);
    if (!uuid || seen.has(uuid)) continue;
    seen.add(uuid);
    entries.push(buildIndexEntry(item));
  }

  const worldItems = (game.items?.contents ?? []).filter((item) => item.type === itemType && item.parent == null);
  for (const item of worldItems) {
    const uuid = normalizeUuid(item.uuid);
    if (!uuid || seen.has(uuid)) continue;
    seen.add(uuid);
    entries.push(buildIndexEntry(item));
  }

  const packs = (game.packs ?? []).filter((pack) => pack.documentName === "Item");
  for (const pack of packs) {
    let documents = [];
    try {
      documents = await pack.getDocuments();
    } catch (error) {
      console.warn(`Rogue Trader | Could not read compendium pack ${pack.collection} for ship construction index.`, error);
      continue;
    }

    for (const item of documents) {
      if (item.type !== itemType) continue;
      const uuid = normalizeUuid(item.uuid);
      if (!uuid || seen.has(uuid)) continue;
      seen.add(uuid);
      entries.push(buildIndexEntry(item));
    }
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

async function getIndexedItemsForTypes(actor, itemTypes) {
  const combined = [];
  const seen = new Set();

  for (const itemType of itemTypes) {
    const entries = await getIndexedItemsForType(actor, itemType);
    for (const entry of entries) {
      const uuid = normalizeUuid(entry.uuid);
      if (!uuid || seen.has(uuid)) continue;
      seen.add(uuid);
      combined.push(entry);
    }
  }

  return combined.sort((left, right) => left.name.localeCompare(right.name));
}

function summarizeIndex(entries, { sampleSize = 6 } = {}) {
  const list = Array.isArray(entries) ? entries : [];
  return {
    count: list.length,
    sampleEntries: list.slice(0, sampleSize),
    totalShipPointCost: list.reduce((total, entry) => total + (Number(entry.shipPointCost ?? 0) || 0), 0)
  };
}

export class RogueTraderShipConstructionApplication extends FormApplication {
  constructor(actor, options = {}) {
    super(actor, options);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["roguetrader", "ship-construction-app"],
      id: "roguetrader-ship-construction",
      width: 1040,
      height: 900,
      template: "systems/roguetrader/templates/actors/ship-construction.hbs",
      submitOnChange: false,
      submitOnClose: false,
      closeOnSubmit: false
    });
  }

  get title() {
    return `${this.actor?.name ?? "Voidship"}: Construct Voidship`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    const draft = foundry.utils.deepClone(this.actor.system?.construction ?? {});
    const hulls = await getIndexedItemsForType(this.actor, "starshipHull");
    const essentialComponents = await getIndexedItemsForTypes(this.actor, ["essentialComponent", "shipComponent"]);
    const supplementalComponents = await getIndexedItemsForType(this.actor, "supplementalComponent");
    const shipWeapons = await getIndexedItemsForType(this.actor, "shipWeapon");

    const selectedHullUuid = normalizeUuid(draft.selectedHullUuid)
      || normalizeUuid(this.actor.items.get(this.actor.system?.activeHullItemId)?.uuid);
    const selectedHull = hulls.find((entry) => entry.uuid === selectedHullUuid) ?? null;
    const selectedHullClass = String(draft.selectedHullClass ?? "all") || "all";
    const shipPointBudget = Number(draft.shipPointBudget ?? this.actor.system?.shipPoints?.value ?? 0) || 0;
    const hullCost = Number(selectedHull?.shipPointCost ?? 0) || 0;
    const selectedEssentialSlots = foundry.utils.deepClone(draft.selectedEssentialSlots ?? {});
    const selectedSupplementalComponents = Array.isArray(draft.selectedSupplementalComponents)
      ? foundry.utils.deepClone(draft.selectedSupplementalComponents)
      : [];
    const selectedShipWeapons = foundry.utils.deepClone(draft.selectedShipWeapons ?? {});
    const essentialSlotSelections = buildEssentialSlotSelections(essentialComponents, selectedHull, selectedEssentialSlots);
    const supplementalSelections = buildSupplementalSelections(supplementalComponents, selectedHull, selectedSupplementalComponents);
    const weaponSlotSelections = buildWeaponSlotSelections(shipWeapons, selectedHull, selectedShipWeapons);
    const totals = computeBuildTotalsFromSelections(
      selectedHull,
      essentialSlotSelections,
      supplementalSelections,
      weaponSlotSelections,
      shipPointBudget
    );
    const filteredHulls = selectedHullClass === "all"
      ? hulls
      : hulls.filter((hull) => normalizeHullClass(hull.hullClass) === selectedHullClass);

    context.actor = this.actor;
    context.system = this.actor.system;
    context.draft = {
      stage: String(draft.stage ?? "hull") || "hull",
      shipPointBudget,
      selectedHullUuid,
      selectedHullName: selectedHull?.name ?? String(draft.selectedHullName ?? ""),
      selectedHullClass,
      selectedEssentialSlots,
      selectedSupplementalComponents,
      selectedShipWeapons
    };
    context.stages = SHIP_CONSTRUCTION_STAGES.map((stage) => ({
      ...stage,
      active: stage.key === context.draft.stage
    }));
    context.stageState = {
      hull: context.draft.stage === "hull",
      essential: context.draft.stage === "essential",
      supplemental: context.draft.stage === "supplemental",
      weapons: context.draft.stage === "weapons",
      summary: context.draft.stage === "summary"
    };
    context.hullClassFilters = STARSHIP_HULL_CLASSES.map((entry) => ({
      ...entry,
      active: entry.key === selectedHullClass
    }));
    context.index = {
      hulls: filteredHulls.map((hull) => ({
        ...hull,
        checked: hull.uuid === selectedHullUuid
      })),
      essentialComponents,
      essentialSlots: essentialSlotSelections,
      supplementalComponents,
      supplementalCategories: supplementalSelections,
      shipWeapons,
      shipWeaponSlots: weaponSlotSelections,
      hullSummary: summarizeIndex(hulls, { sampleSize: 8 }),
      essentialSummary: summarizeIndex(essentialComponents),
      supplementalSummary: summarizeIndex(supplementalComponents),
      shipWeaponSummary: summarizeIndex(shipWeapons)
    };
    context.selectedHull = selectedHull;
    context.selectedEssentialComponents = essentialSlotSelections;
    context.selectedSupplementalComponents = supplementalSelections.flatMap((category) => category.selectedEntries);
    context.selectedShipWeapons = weaponSlotSelections.filter((slot) => slot.selectedEntry).map((slot) => ({
      ...slot.selectedEntry,
      slotLabel: slot.label
    }));
    context.activeSidebar = {
      hull: context.stageState.hull,
      essential: context.stageState.essential,
      supplemental: context.stageState.supplemental,
      weapons: context.stageState.weapons,
      summary: context.stageState.summary
    };
    context.shipPointSummary = {
      total: shipPointBudget,
      hullCost,
      essentialCost: totals.essentialCost,
      supplementalCost: totals.supplementalCost,
      shipWeaponCost: totals.shipWeaponCost,
      spent: totals.totalSpent,
      remaining: totals.remaining
    };
    context.powerSummary = {
      used: totals.powerUsed,
      total: totals.powerTotal
    };
    context.spaceSummary = {
      used: totals.spaceUsed,
      total: totals.spaceAvailable
    };
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-ship-construction-stage]").on("click", async (event) => {
      event.preventDefault();
      const stage = String(event.currentTarget?.dataset?.shipConstructionStage ?? "").trim();
      if (!stage) return;
      await this.actor.update({
        "system.construction.stage": stage
      });
      this.render(false);
    });

    html.find("[data-ship-construction-hull-class]").on("click", async (event) => {
      event.preventDefault();
      const selectedHullClass = String(event.currentTarget?.dataset?.shipConstructionHullClass ?? "all") || "all";
      await this.actor.update({
        "system.construction.selectedHullClass": selectedHullClass
      });
      this.render(false);
    });

    html.find('[name="system.construction.shipPointBudget"]').on("change", async (event) => {
      const shipPointBudget = Number(event.currentTarget?.value ?? 0) || 0;
      await this.actor.update({
        "system.construction.shipPointBudget": shipPointBudget
      });
      this.render(false);
    });

    html.find('[name="system.construction.selectedHullUuid"]').on("change", async (event) => {
      const selectedHullUuid = normalizeUuid(event.currentTarget?.value);
      const selectedHull = selectedHullUuid ? await fromUuid(selectedHullUuid) : null;
      const clearedSlots = Object.fromEntries(ESSENTIAL_COMPONENT_SLOTS.map((slot) => [slot.key, ""]));
      await this.actor.update({
        "system.construction.selectedHullUuid": selectedHullUuid,
        "system.construction.selectedHullName": selectedHull?.name ?? "",
        "system.construction.selectedEssentialSlots": clearedSlots,
        "system.construction.selectedSupplementalComponents": [],
        "system.construction.selectedShipWeapons": {}
      });
      this.render(false);
    });

    html.find("[data-ship-construction-essential-slot]").on("change", async (event) => {
      const slotKey = String(event.currentTarget?.dataset?.shipConstructionEssentialSlot ?? "").trim();
      const selectedUuid = normalizeUuid(event.currentTarget?.value);
      if (!slotKey) return;
      await this.actor.update({
        [`system.construction.selectedEssentialSlots.${slotKey}`]: selectedUuid
      });
      this.render(false);
    });

    html.find("[data-ship-construction-supplemental]").on("change", async () => {
      const selectedSupplementalComponents = Array.from(
        html.find('[data-ship-construction-supplemental]:checked')
      ).map((input) => normalizeUuid(input.value)).filter(Boolean);
      await this.actor.update({
        "system.construction.selectedSupplementalComponents": selectedSupplementalComponents
      });
      this.render(false);
    });

    html.find("[data-ship-construction-weapon-slot]").on("change", async (event) => {
      const slotKey = String(event.currentTarget?.dataset?.shipConstructionWeaponSlot ?? "").trim();
      const selectedUuid = normalizeUuid(event.currentTarget?.value);
      if (!slotKey) return;
      await this.actor.update({
        [`system.construction.selectedShipWeapons.${slotKey}`]: selectedUuid
      });
      this.render(false);
    });

    html.off("click.shipConstructionSubmit");
    html.on("click.shipConstructionSubmit", "[data-ship-construction-submit]", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = String(event.currentTarget?.dataset?.shipConstructionSubmit ?? "save").trim() || "save";
      ui.notifications?.info(`Voidship construction: ${action}`);
      html.find('[name="system.construction.submitAction"]').val(action);
      const formData = this._getSubmitData();
      formData["system.construction.submitAction"] = action;
      const applyHull = action === "apply" || action === "build";
      await this._saveConstructionDraft(formData, { applyHull });
    });
  }

  async _updateObject(event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const submitAction = String(expanded.system?.construction?.submitAction ?? "save").trim() || "save";
    const applyHull = submitAction === "apply" || submitAction === "build";
    await this._saveConstructionDraft(formData, { applyHull });
  }

  async _saveConstructionDraft(formData, { applyHull = false } = {}) {
    const expanded = foundry.utils.expandObject(formData);
    const constructionData = expanded.system?.construction ?? {};
    const shipPointBudget = Number(constructionData.shipPointBudget ?? this.actor.system?.shipPoints?.value ?? 0) || 0;
    const selectedHullUuid = normalizeUuid(constructionData.selectedHullUuid)
      || normalizeUuid(this.actor.system?.construction?.selectedHullUuid)
      || normalizeUuid(this.actor.items.get(this.actor.system?.activeHullItemId)?.uuid);
    const stage = String(constructionData.stage ?? this.actor.system?.construction?.stage ?? "hull") || "hull";
    const selectedHullClass = String(constructionData.selectedHullClass ?? this.actor.system?.construction?.selectedHullClass ?? "all") || "all";
    const selectedEssentialSlots = foundry.utils.deepClone(constructionData.selectedEssentialSlots ?? this.actor.system?.construction?.selectedEssentialSlots ?? {});
    const selectedSupplementalComponents = Array.isArray(constructionData.selectedSupplementalComponents)
      ? foundry.utils.deepClone(constructionData.selectedSupplementalComponents)
      : foundry.utils.deepClone(this.actor.system?.construction?.selectedSupplementalComponents ?? []);
    const selectedShipWeapons = foundry.utils.deepClone(constructionData.selectedShipWeapons ?? this.actor.system?.construction?.selectedShipWeapons ?? {});

    const updates = {
      "system.construction.stage": stage,
      "system.construction.shipPointBudget": shipPointBudget,
      "system.construction.selectedHullUuid": selectedHullUuid,
      "system.construction.selectedHullClass": selectedHullClass,
      "system.construction.selectedEssentialSlots": selectedEssentialSlots,
      "system.construction.selectedSupplementalComponents": selectedSupplementalComponents,
      "system.construction.selectedShipWeapons": selectedShipWeapons
    };

    let selectedHull = null;
    if (selectedHullUuid) {
      selectedHull = await fromUuid(selectedHullUuid);
      updates["system.construction.selectedHullName"] = selectedHull?.name ?? "";
    } else {
      updates["system.construction.selectedHullName"] = "";
    }

    await this.actor.update(updates);

    console.log("Rogue Trader | Ship construction draft save", {
      actor: this.actor?.name,
      applyHull,
      selectedHullUuid,
      selectedEssentialSlots,
      selectedSupplementalComponents,
      selectedShipWeapons
    });

    if (applyHull && selectedHull && this.actor.sheet?.applyStarshipHullToShip) {
      const appliedHull = await this.actor.sheet.applyStarshipHullToShip(selectedHull);
      const selectedHullEntry = buildIndexEntry(selectedHull);
      const essentialComponents = await getIndexedItemsForTypes(this.actor, ["essentialComponent", "shipComponent"]);
      const supplementalComponents = await getIndexedItemsForType(this.actor, "supplementalComponent");
      const shipWeapons = await getIndexedItemsForType(this.actor, "shipWeapon");
      const essentialSlotSelections = buildEssentialSlotSelections(essentialComponents, selectedHullEntry, selectedEssentialSlots);
      const supplementalSelections = buildSupplementalSelections(supplementalComponents, selectedHullEntry, selectedSupplementalComponents);
      const weaponSlotSelections = buildWeaponSlotSelections(shipWeapons, selectedHullEntry, selectedShipWeapons);
      const totals = computeBuildTotalsFromSelections(
        selectedHullEntry,
        essentialSlotSelections,
        supplementalSelections,
        weaponSlotSelections,
        shipPointBudget
      );

      const selectedEssentialCount = Object.values(selectedEssentialSlots ?? {}).map(normalizeUuid).filter(Boolean).length;
      const selectedSupplementalCount = (Array.isArray(selectedSupplementalComponents) ? selectedSupplementalComponents : []).map(normalizeUuid).filter(Boolean).length;
      const selectedWeaponCount = Object.values(selectedShipWeapons ?? {}).map(normalizeUuid).filter(Boolean).length;
      ui.notifications?.info(
        `Ship build selections: ${selectedEssentialCount} essential, ${selectedSupplementalCount} supplemental, ${selectedWeaponCount} weapons.`
      );

      const rebuiltCounts = await this._rebuildConstructionManagedItems({
        selectedEssentialSlots,
        selectedSupplementalComponents,
        selectedShipWeapons
      });
      await this.actor.update({
        "system.shipPoints.value": shipPointBudget,
        "system.shipPoints.spent": totals.totalSpent,
        "system.power.value": totals.powerTotal,
        "system.power.used": totals.powerUsed,
        "system.space.value": totals.spaceAvailable,
        "system.space.used": totals.spaceUsed,
        "system.construction.selectedHullName": appliedHull?.name ?? selectedHull.name
      });
      ui.notifications?.info(
        `Voidship built: ${rebuiltCounts.essential} essential, ${rebuiltCounts.supplemental} supplemental, ${rebuiltCounts.weapons} weapon items applied.`
      );
      this.actor.sheet?.render(false);
    } else {
      await this.actor.update({
        "system.shipPoints.value": shipPointBudget,
        "system.shipPoints.spent": applyHull ? 0 : Number(this.actor.system?.shipPoints?.spent ?? 0) || 0
      });
    }

    this.render(false);
  }

  async _syncConstructionItems(selectedUuids, expectedType) {
    const uuids = Array.isArray(selectedUuids) ? selectedUuids.map(normalizeUuid).filter(Boolean) : [];
    const managedItems = Array.from(this.actor.items ?? []).filter((item) =>
      item.getFlag("roguetrader", "shipConstructionManaged") &&
      item.getFlag("roguetrader", "constructionGroup") === expectedType
    );

    const selectedUuidSet = new Set(uuids);
    const itemsToDelete = managedItems.filter((item) => !selectedUuidSet.has(normalizeUuid(item.getFlag("roguetrader", "sourceUuid"))));
    if (itemsToDelete.length) {
      await this.actor.deleteEmbeddedDocuments("Item", itemsToDelete.map((item) => item.id));
    }

    const existingManagedBySource = new Map(
      Array.from(this.actor.items ?? [])
        .filter((item) =>
          item.getFlag("roguetrader", "shipConstructionManaged") &&
          item.getFlag("roguetrader", "constructionGroup") === expectedType
        )
        .map((item) => [normalizeUuid(item.getFlag("roguetrader", "sourceUuid")), item])
    );

    const createdIds = [];
    for (const uuid of uuids) {
      const existing = existingManagedBySource.get(uuid);
      if (existing) {
        createdIds.push(existing.id);
        continue;
      }

      const sourceItem = await fromUuid(uuid);
      if (!sourceItem || sourceItem.documentName !== "Item") continue;
      const itemData = sourceItem.toObject();
      delete itemData._id;
      itemData.type = expectedType;
      itemData.flags ??= {};
      itemData.flags.roguetrader = {
        ...(itemData.flags.roguetrader ?? {}),
        shipConstructionManaged: true,
        sourceUuid: uuid,
        constructionGroup: expectedType
      };
      const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
      if (created) createdIds.push(created.id);
    }

    return createdIds;
  }

  async _syncConstructionItemsBySlot(selectedBySlot, expectedType) {
    const entries = Object.entries(selectedBySlot ?? {})
      .map(([slotKey, uuid]) => ({ slotKey, uuid: normalizeUuid(uuid) }))
      .filter((entry) => entry.uuid);

    const slotKeys = new Set(entries.map((entry) => entry.slotKey));
    const managedItems = Array.from(this.actor.items ?? []).filter((item) =>
      item.getFlag("roguetrader", "shipConstructionManaged") &&
      item.getFlag("roguetrader", "constructionGroup") === expectedType
    );

    const itemsToDelete = managedItems.filter((item) => !slotKeys.has(String(item.getFlag("roguetrader", "constructionSlotKey") ?? "")));
    if (itemsToDelete.length) {
      await this.actor.deleteEmbeddedDocuments("Item", itemsToDelete.map((item) => item.id));
    }

    const existingManagedBySlot = new Map(
      Array.from(this.actor.items ?? [])
        .filter((item) =>
          item.getFlag("roguetrader", "shipConstructionManaged") &&
          item.getFlag("roguetrader", "constructionGroup") === expectedType
        )
        .map((item) => [String(item.getFlag("roguetrader", "constructionSlotKey") ?? ""), item])
    );

    for (const entry of entries) {
      const sourceItem = await fromUuid(entry.uuid);
      if (!sourceItem || sourceItem.documentName !== "Item") continue;

      const existing = existingManagedBySlot.get(entry.slotKey);
      if (existing) {
        const updateData = sourceItem.toObject();
        delete updateData._id;
        updateData.type = expectedType;
        updateData.flags ??= {};
        updateData.flags.roguetrader = {
          ...(updateData.flags.roguetrader ?? {}),
          shipConstructionManaged: true,
          sourceUuid: entry.uuid,
          constructionSlotKey: entry.slotKey,
          constructionGroup: expectedType
        };
        updateData.system = foundry.utils.mergeObject(foundry.utils.deepClone(updateData.system ?? {}), {
          location: entry.slotKey.split("-")[0]
        });
        await existing.update(updateData);
        continue;
      }

      const itemData = sourceItem.toObject();
      delete itemData._id;
      itemData.type = expectedType;
      itemData.flags ??= {};
      itemData.flags.roguetrader = {
        ...(itemData.flags.roguetrader ?? {}),
        shipConstructionManaged: true,
        sourceUuid: entry.uuid,
        constructionSlotKey: entry.slotKey,
        constructionGroup: expectedType
      };
      itemData.system = foundry.utils.mergeObject(foundry.utils.deepClone(itemData.system ?? {}), {
        location: entry.slotKey.split("-")[0]
      });
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }

  async _rebuildConstructionManagedItems({ selectedEssentialSlots = {}, selectedSupplementalComponents = [], selectedShipWeapons = {} } = {}) {
    const managedItems = Array.from(this.actor.items ?? []).filter((item) => item.getFlag("roguetrader", "shipConstructionManaged"));
    if (managedItems.length) {
      await this.actor.deleteEmbeddedDocuments("Item", managedItems.map((item) => item.id));
    }

    const essentialPayload = [];
    const supplementalPayload = [];
    const weaponPayload = [];

    for (const [slotKey, uuidValue] of Object.entries(selectedEssentialSlots ?? {})) {
      const uuid = normalizeUuid(uuidValue);
      if (!uuid) continue;
      const sourceItem = await fromUuid(uuid);
      if (!sourceItem || sourceItem.documentName !== "Item") continue;
      const itemData = sourceItem.toObject();
      delete itemData._id;
      itemData.type = "essentialComponent";
      itemData.flags ??= {};
      itemData.flags.roguetrader = {
        ...(itemData.flags.roguetrader ?? {}),
        shipConstructionManaged: true,
        sourceUuid: uuid,
        constructionSlotKey: slotKey,
        constructionGroup: "essentialComponent"
      };
      essentialPayload.push(itemData);
    }

    for (const uuidValue of Array.isArray(selectedSupplementalComponents) ? selectedSupplementalComponents : []) {
      const uuid = normalizeUuid(uuidValue);
      if (!uuid) continue;
      const sourceItem = await fromUuid(uuid);
      if (!sourceItem || sourceItem.documentName !== "Item") continue;
      const itemData = sourceItem.toObject();
      delete itemData._id;
      itemData.type = "supplementalComponent";
      itemData.flags ??= {};
      itemData.flags.roguetrader = {
        ...(itemData.flags.roguetrader ?? {}),
        shipConstructionManaged: true,
        sourceUuid: uuid,
        constructionGroup: "supplementalComponent"
      };
      supplementalPayload.push(itemData);
    }

    for (const [slotKey, uuidValue] of Object.entries(selectedShipWeapons ?? {})) {
      const uuid = normalizeUuid(uuidValue);
      if (!uuid) continue;
      const sourceItem = await fromUuid(uuid);
      if (!sourceItem || sourceItem.documentName !== "Item") continue;
      const itemData = sourceItem.toObject();
      delete itemData._id;
      itemData.type = "shipWeapon";
      itemData.system = foundry.utils.mergeObject(foundry.utils.deepClone(itemData.system ?? {}), {
        location: slotKey.split("-")[0]
      });
      itemData.flags ??= {};
      itemData.flags.roguetrader = {
        ...(itemData.flags.roguetrader ?? {}),
        shipConstructionManaged: true,
        sourceUuid: uuid,
        constructionSlotKey: slotKey,
        constructionGroup: "shipWeapon"
      };
      weaponPayload.push(itemData);
    }

    if (essentialPayload.length) {
      console.log("Rogue Trader | Creating essential components", essentialPayload.map((item) => ({ name: item.name, type: item.type })));
      await this.actor.createEmbeddedDocuments("Item", essentialPayload);
    }
    if (supplementalPayload.length) {
      console.log("Rogue Trader | Creating supplemental components", supplementalPayload.map((item) => ({ name: item.name, type: item.type })));
      await this.actor.createEmbeddedDocuments("Item", supplementalPayload);
    }
    if (weaponPayload.length) {
      console.log("Rogue Trader | Creating ship weapons", weaponPayload.map((item) => ({ name: item.name, type: item.type, location: item.system?.location })));
      await this.actor.createEmbeddedDocuments("Item", weaponPayload);
    }

    return {
      essential: essentialPayload.length,
      supplemental: supplementalPayload.length,
      weapons: weaponPayload.length
    };
  }
}
