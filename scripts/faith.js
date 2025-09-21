// ===== Faith Tracker for Foundry v12 =====

/* ---------------- Actor Sheet Faith Panel ---------------- */
Hooks.on("renderActorSheet", (app, html, data) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags if missing
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", "");

  // Insert Faith panel under Class section
  if (!html.find(".faith-panel").length) {
    const classSection = html.find(".character-info"); // adjust if your sheet differs
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
      updateFaithDisplay(actor, html);
      updateTokenFaith(actor);
    });
    faithPanel.find(".faith-points").change(ev => {
      actor.setFlag("faith-tracker", "faithPoints", parseInt(ev.target.value) || 0);
      updateFaithDisplay(actor, html);
      updateTokenFaith(actor);
    });
    faithPanel.find(".spend-faith").click(() => {
      spendFaith(actor);
      updateFaithDisplay(actor, html);
      updateTokenFaith(actor);
    });
  }

  // Faith display on sheet header
  if (!html.find(".faith-display").length) {
    const faithDisplay = $(`
      <div class="faith-display">
        <strong>Faith:</strong> <span class="faith-points">${actor.getFlag("faith-tracker","faithPoints")}</span>
        <br>
        <strong>Deity:</strong> <span class="faith-deity">${actor.getFlag("faith-tracker","deity")}</span>
      </div>
    `);
    html.find(".window-header").append(faithDisplay);
  }
});

/* ---------------- Token Faith Display ---------------- */
Hooks.on("renderToken", (token, html) => {
  const actor = token.actor;
  if (!actor) return;

  // Remove old display to prevent duplicates
  html.find(".token-faith-display").remove();

  const faithPoints = actor.getFlag("faith-tracker", "faithPoints") || 0;

  const faithDisplay = $(`
    <div class="token-faith-display">
      🛐 ${faithPoints}
    </div>
  `);

  html.append(faithDisplay);
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

    updateTokenFaith(actor);
  } else {
    ui.notifications.warn(`${actor.name} has no Faith Points left.`);
  }
}

/* ---------------- Update Displays ---------------- */
function updateFaithDisplay(actor, html) {
  const points = actor.getFlag("faith-tracker", "faithPoints") || 0;
  const deity = actor.getFlag("faith-tracker", "deity") || "None";
  html.find(".faith-display .faith-points").text(points);
  html.find(".faith-display .faith-deity").text(deity);
  html.find(".faith-panel .faith-points").val(points);
  html.find(".faith-panel .faith-deity").val(deity);
}

/* Update token Faith display */
function updateTokenFaith(actor) {
  const tokens = canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);
  tokens.forEach(t => {
    const html = t?.hud?.element || t?.sheet?.element;
    if (html) {
      html.find(".token-faith-display").text(`🛐 ${actor.getFlag("faith-tracker", "faithPoints") || 0}`);
    }
  });
}
