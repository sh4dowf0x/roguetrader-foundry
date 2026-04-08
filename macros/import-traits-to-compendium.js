/**
 * Rogue Trader | Import Traits To Compendium
 *
 * Usage:
 * 1. Create a new Script macro in Foundry.
 * 2. Paste this file's contents into the macro.
 * 3. Run it once while the Rogue Trader system is active.
 *
 * By default this imports into the system pack:
 *   roguetrader.character-creation-options
 *
 * Re-running the macro updates existing trait items by name/type.
 */

const TARGET_PACK_ID = "roguetrader.character-creation-options";
const DEFAULT_TRAIT_ICON = "icons/svg/aura.svg";

async function runImport() {
  if (!game?.roguetrader?.talents) {
    ui.notifications?.error("Rogue Trader | Talent/trait registry is unavailable. Make sure the system is loaded.");
    return;
  }

  const pack = game.packs.get(TARGET_PACK_ID);
  if (!pack) {
    ui.notifications?.error(`Rogue Trader | Could not find pack '${TARGET_PACK_ID}'.`);
    return;
  }

  if (pack.documentName !== "Item") {
    ui.notifications?.error(`Rogue Trader | Pack '${TARGET_PACK_ID}' is not an Item pack.`);
    return;
  }

  const traits = (game.roguetrader.talents.list?.() ?? [])
    .filter((entry) => String(entry.category ?? "").trim().toLowerCase() === "trait");

  if (!traits.length) {
    ui.notifications?.error("Rogue Trader | No trait definitions were found.");
    return;
  }

  const sortedTraits = [...traits].sort((left, right) =>
    String(left.fullName ?? left.name ?? "").localeCompare(String(right.fullName ?? right.name ?? ""))
  );

  const index = await pack.getIndex();
  let created = 0;
  let updated = 0;

  for (const trait of sortedTraits) {
    const itemData = game.roguetrader.talents.buildItemData(trait.id, {
      type: "talent",
      name: trait.fullName ?? trait.name,
      category: "trait",
      prerequisites: trait.prerequisites ?? "",
      benefit: trait.benefit ?? "",
      description: trait.description ?? trait.benefit ?? ""
    });

    if (!itemData) {
      console.warn("Rogue Trader | Failed to build trait item data for entry:", trait);
      continue;
    }

    itemData.img = itemData.img || DEFAULT_TRAIT_ICON;
    itemData.system = itemData.system || {};
    itemData.system.equipped = false;
    itemData.system.availability = itemData.system.availability || "unique";
    itemData.system.craftsmanship = itemData.system.craftsmanship || "common";

    const existing = index.find((doc) =>
      doc.type === "talent"
      && doc.name === itemData.name
    );

    if (existing) {
      const existingDocument = await pack.getDocument(existing._id);
      await existingDocument.update(itemData);
      updated += 1;
      continue;
    }

    await Item.create(itemData, { pack: TARGET_PACK_ID });
    created += 1;
  }

  const message = `Rogue Trader | Trait import complete. Created ${created}, updated ${updated}.`;
  ui.notifications?.info(message);
  console.log(message);
}

await runImport();
