/**
 * Rogue Trader | Import Talents To Compendium
 *
 * Usage:
 * 1. Create a new Script macro in Foundry.
 * 2. Paste this file's contents into the macro.
 * 3. Run it once while the Rogue Trader system is active.
 *
 * By default this imports into the system pack:
 *   roguetrader.character-creation-options
 *
 * Re-running the macro updates existing talent items by name/type.
 */

const TARGET_PACK_ID = "roguetrader.character-creation-options";
const DEFAULT_TALENT_ICON = "icons/svg/book.svg";

async function runImport() {
  if (!game?.roguetrader?.talents) {
    ui.notifications?.error("Rogue Trader | Talent registry is unavailable. Make sure the system is loaded.");
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

  const talents = game.roguetrader.talents.list?.() ?? [];
  if (!talents.length) {
    ui.notifications?.error("Rogue Trader | No talent definitions were found.");
    return;
  }

  const sortedTalents = [...talents].sort((left, right) =>
    String(left.fullName ?? left.name ?? "").localeCompare(String(right.fullName ?? right.name ?? ""))
  );

  const index = await pack.getIndex();
  let created = 0;
  let updated = 0;

  for (const talent of sortedTalents) {
    const itemData = game.roguetrader.talents.buildItemData(talent.id, {
      type: "talent",
      name: talent.fullName ?? talent.name,
      category: talent.category ?? "talent",
      prerequisites: talent.prerequisites ?? "",
      benefit: talent.benefit ?? "",
      description: talent.description ?? talent.benefit ?? ""
    });

    if (!itemData) {
      console.warn("Rogue Trader | Failed to build talent item data for entry:", talent);
      continue;
    }

    itemData.img = itemData.img || DEFAULT_TALENT_ICON;
    itemData.system = itemData.system || {};
    itemData.system.equipped = false;
    itemData.system.availability = itemData.system.availability || "unique";
    itemData.system.craftsmanship = itemData.system.craftsmanship || "common";

    const existing = index.find((doc) => doc.type === "talent" && doc.name === itemData.name);
    if (existing) {
      const existingDocument = await pack.getDocument(existing._id);
      await existingDocument.update(itemData);
      updated += 1;
      continue;
    }

    await Item.create(itemData, { pack: TARGET_PACK_ID });
    created += 1;
  }

  const message = `Rogue Trader | Talent import complete. Created ${created}, updated ${updated}.`;
  ui.notifications?.info(message);
  console.log(message);
}

await runImport();
