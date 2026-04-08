/**
 * Rogue Trader | Import Critical Injuries To Compendium
 *
 * Usage:
 * 1. Create a new Script macro in Foundry.
 * 2. Paste this file's contents into the macro.
 * 3. Run it once while the Rogue Trader system is active.
 *
 * By default this imports into the system pack:
 *   roguetrader.character-creation-options
 *
 * Re-running the macro updates existing critical injury items by name/type.
 */

const TARGET_PACK_ID = "roguetrader.character-creation-options";
const DEFAULT_CRITICAL_INJURY_ICON = "icons/svg/blood.svg";

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

  const injuries = game.roguetrader.references.listCriticalInjuries?.()
    ?? Object.values(game.roguetrader.references.criticalInjuries ?? {});
  if (!injuries.length) {
    ui.notifications?.error("Rogue Trader | No critical injury definitions were found.");
    return;
  }

  const index = await pack.getIndex();
  let created = 0;
  let updated = 0;

  for (const injury of injuries) {
    const itemData = game.roguetrader.references.buildCriticalInjuryItemData(injury.key, {
      type: "criticalInjury",
      name: injury.name,
      summary: injury.benefit ?? "",
      description: injury.description ?? injury.benefit ?? "",
      sourceTable: "criticalInjuries",
      notes: Array.isArray(injury.tags) ? injury.tags.join(", ") : ""
    });

    if (!itemData) {
      console.warn("Rogue Trader | Failed to build critical injury item data for entry:", injury);
      continue;
    }

    itemData.img = itemData.img || DEFAULT_CRITICAL_INJURY_ICON;
    itemData.system = itemData.system || {};
    itemData.system.equipped = false;
    itemData.system.availability = itemData.system.availability || "unique";
    itemData.system.craftsmanship = itemData.system.craftsmanship || "common";

    const existing = index.find((doc) => doc.type === "criticalInjury" && doc.name === itemData.name);
    if (existing) {
      const existingDocument = await pack.getDocument(existing._id);
      await existingDocument.update(itemData);
      updated += 1;
      continue;
    }

    await Item.create(itemData, { pack: TARGET_PACK_ID });
    created += 1;
  }

  const message = `Rogue Trader | Critical injury import complete. Created ${created}, updated ${updated}.`;
  ui.notifications?.info(message);
  console.log(message);
}

await runImport();


