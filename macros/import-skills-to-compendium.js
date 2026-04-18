/**
 * Rogue Trader | Import Skills To Compendium
 *
 * Usage:
 * 1. Create a new Script macro in Foundry.
 * 2. Paste this file's contents into the macro.
 * 3. Run it once while the Rogue Trader system is active.
 *
 * By default this imports into the system pack:
 *   roguetrader.character-creation-options
 *
 * Re-running the macro updates existing skill items by name/type.
 */

const TARGET_PACK_ID = "roguetrader.character-creation-options";
const DEFAULT_SKILL_ICON = "icons/svg/book.svg";

async function runImport() {
  const skillModulePath = `${foundry.utils.getRoute("systems/roguetrader/module/skill.js")}?skillImport=${Date.now()}`;
  const skillModule = await import(skillModulePath)
    .catch(() => null);

  const skillsApi = skillModule
    ? {
        list: skillModule.listRogueTraderSkills,
        buildItemData: skillModule.buildSkillItemData
      }
    : game?.roguetrader?.skills;

  if (!skillsApi?.list || !skillsApi?.buildItemData) {
    ui.notifications?.error("Rogue Trader | Skill registry is unavailable. Make sure the system is loaded.");
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

  const skills = skillsApi.list?.() ?? [];
  if (!skills.length) {
    ui.notifications?.error("Rogue Trader | No skill definitions were found.");
    return;
  }

  const sortedSkills = [...skills].sort((left, right) =>
    String(left.fullName ?? left.name ?? "").localeCompare(String(right.fullName ?? right.name ?? ""))
  );

  const index = await pack.getIndex();
  let created = 0;
  let updated = 0;

  for (const skill of sortedSkills) {
    const itemData = skillsApi.buildItemData(skill.id, {
      name: skill.fullName ?? skill.name,
      characteristic: skill.characteristic,
      basic: skill.basic,
      specialization: skill.specialization ?? "",
      description: skill.description ?? ""
    });

    if (!itemData) {
      console.warn("Rogue Trader | Failed to build skill item data for entry:", skill);
      continue;
    }

    itemData.img = itemData.img || DEFAULT_SKILL_ICON;
    itemData.system = itemData.system || {};
    itemData.system.trained = false;
    itemData.system.advance10 = false;
    itemData.system.advance20 = false;
    itemData.system.bonus = Number(itemData.system.bonus ?? 0) || 0;

    const existing = index.find((doc) => doc.type === "skill" && doc.name === itemData.name);
    if (existing) {
      const existingDocument = await pack.getDocument(existing._id);
      await existingDocument.update(itemData);
      updated += 1;
      continue;
    }

    await Item.create(itemData, { pack: TARGET_PACK_ID });
    created += 1;
  }

  const message = `Rogue Trader | Skill import complete. Created ${created}, updated ${updated}.`;
  ui.notifications?.info(message);
  console.log(message);
}

await runImport();
