/**
 * Rogue Trader | Import Malignancies To Compendium
 *
 * Usage:
 * 1. Create a new Script macro in Foundry.
 * 2. Paste this file's contents into the macro.
 * 3. Run it once while the Rogue Trader system is active.
 *
 * By default this imports into the system pack:
 *   roguetrader.character-creation-options
 *
 * Re-running the macro updates existing malignancy items by name/type.
 */

const TARGET_PACK_ID = "roguetrader.character-creation-options";
const DEFAULT_MALIGNANCY_ICON = "icons/svg/poison.svg";

function padRoll(value) {
  return String(Number(value ?? 0)).padStart(2, "0");
}

function buildRollRangeLabel(entry) {
  const min = Number(entry.min ?? 0);
  const max = Number(entry.max ?? min);
  return min === max ? padRoll(min) : `${padRoll(min)}-${padRoll(max)}`;
}

async function runImport() {
  if (!game?.roguetrader?.references) {
    ui.notifications?.error("Rogue Trader | Reference API is unavailable. Make sure the system is loaded.");
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

  const table = game.roguetrader.references.getTable("malignancies");
  if (!table?.entries?.length) {
    ui.notifications?.error("Rogue Trader | No malignancy reference entries were found.");
    return;
  }

  const index = await pack.getIndex();
  let created = 0;
  let updated = 0;

  for (const entry of table.entries) {
    const itemData = game.roguetrader.references.buildItemData("malignancies", entry.min, {
      type: "malignancy",
      name: entry.name,
      summary: entry.benefit ?? "",
      description: entry.description ?? entry.benefit ?? "",
      sourceTable: "malignancies",
      rollRange: buildRollRangeLabel(entry)
    });

    if (!itemData) {
      console.warn("Rogue Trader | Failed to build malignancy item data for entry:", entry);
      continue;
    }

    itemData.img = itemData.img || DEFAULT_MALIGNANCY_ICON;
    itemData.system = itemData.system || {};
    itemData.system.equipped = false;
    itemData.system.availability = itemData.system.availability || "unique";
    itemData.system.craftsmanship = itemData.system.craftsmanship || "common";

    const existing = index.find((doc) => doc.type === "malignancy" && doc.name === itemData.name);
    if (existing) {
      const existingDocument = await pack.getDocument(existing._id);
      await existingDocument.update(itemData);
      updated += 1;
      continue;
    }

    await Item.create(itemData, { pack: TARGET_PACK_ID });
    created += 1;
  }

  const message = `Rogue Trader | Malignancy import complete. Created ${created}, updated ${updated}.`;
  ui.notifications?.info(message);
  console.log(message);
}

await runImport();
