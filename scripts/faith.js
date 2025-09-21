// ===== Faith Tracker for Foundry v12 =====

/* ---------------- Actor Sheet Faith Panel ---------------- */
Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", "");

  // --- Faith Panel under Class Section ---
  if (!html.find(".faith-panel").length) {
    const classSection = html.find(".character-info");
    const faithPanel = $(`
      <div class="faith-panel form-group">
        <label><strong>Faith</strong></label>
        <div>
          <span>Deity: </span>
          <input type="text" class="faith-deity" value="${actor.getFlag("faith-tracker", "deity")}">
        </div>
        <div>
          <span>Faith Points: </span>
          <input type="number" class="faith-points" value="${actor.getFlag("faith-tracker", "faithPoints")}" min="0">
        </div>
        <button class="spend-faith btn">Spend Faith</button>
      </div>
    `);
    classSection.append(faithPanel);

    // Event listeners
    faithPanel.find(".faith-deity").change(ev => {
      actor.setFlag("faith-tracker", "deity", ev.target.value);
      updateFaithHeader(actor, html);
    });
    faithPanel.find(".faith-points").change(ev => {
      actor.setFlag("faith-tracker", "faithPoints", parseInt(ev.target.value) || 0);
      updateFaithHeader(actor, html);
    });
    faithPanel.find(".spend-faith").click(() => {
      spendFaith(actor);
      updateFaithHeader(actor, html);
    });
  }

  // --- Faith display next to Edit button ---
  if (!html.find(".faith-header").length) {
    const header = html.find(".window-header .window-title");
    const faithHeader = $(`
      <div class="faith-header">
        🛐 <span class="faith-points">${actor.getFlag("faith-tracker","faithPoints")}</span> - <span class="faith-deity">${actor.getFlag("faith-tracker","deity")}</span>
      </div>
    `);
    header.append(faithHeader);
  } else {
    updateFaithHeader(actor, html);
  }
});

/* ---------------- Automatic Last Prayer (D&D5e) ---------------- */
Hooks.on("preUpdateActor", (actor, update) => {
  if (!actor || !["character","npc"].includes(actor.type)) return;

  const oldHP = getProperty(actor.system, "attributes.hp.value");
  const newHP = update.system?.attributes?.hp?.value;
  if (newHP !== undefined && newHP <= 0 && oldHP > 0 && (actor.getFlag("faith-tracker", "faithPoints") || 0) > 0) {
    spendFaith(actor);
    setProperty(update, "system.attributes.hp.value", 1);
    ui.notifications.info(`${actor.name} survived death by invoking their Faith!`);
  }
});

/* ---------------- Core Functions ---------------- */
function spendFaith(actor) {
  let faith = actor.getFlag("faith-tracker", "faithPoints") || 0;
  const deity = actor.getFlag("faith-tracker", "deity") || "their god";

  if (faith > 0) {
    actor.setFlag("faith-tracker", "faithPoints", faith - 1);
    actor.setFlag("faith-tracker", "faithless", true);

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<b>${actor.name}</b> invokes their Last Prayer to <i>${deity}</i> and survives! They are now Faithless.`
    });

    updateFaithHeader(actor);
  } else {
    ui.notifications.warn(`${actor.name} has no Faith Points left.`);
  }
}

/* ---------------- Update Faith Display in Header ---------------- */
function updateFaithHeader(actor, html) {
  const points = actor.getFlag("faith-tracker", "faithPoints") || 0;
  const deity = actor.getFlag("faith-tracker", "deity") || "None";
  const header = html?.find(".faith-header");
  if (header) {
    header.find(".faith-points").text(points);
    header.find(".faith-deity").text(deity);
  }
}
