// ===== Faith Tracker =====

// Add Faith tab to all Actor sheets
Hooks.on("renderActorSheet", (app, html, data) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", "");

  // Add Faith tab if missing
  const tabs = html.find(".sheet-tabs");
  const body = html.find(".sheet-body");
  if (!tabs.find('[data-tab="faith"]').length) {
    tabs.append(`<a class="item" data-tab="faith"><i class="fas fa-star"></i> Faith</a>`);
    const faithTab = $(`
      <div class="tab faith" data-tab="faith">
        <div class="faith-tab">
          <h2>Faith Tracker</h2>
          <div class="form-group">
            <label>Deity</label>
            <input type="text" class="faith-deity" value="${actor.getFlag("faith-tracker", "deity")}">
          </div>
          <div class="form-group">
            <label>Faith Points</label>
            <input type="number" class="faith-points" value="${actor.getFlag("faith-tracker", "faithPoints")}" min="0">
          </div>
          <button class="spend-faith btn">Spend Faith</button>
        </div>
      </div>
    `);
    body.append(faithTab);

    // Listeners
    faithTab.find(".faith-deity").change(ev => actor.setFlag("faith-tracker", "deity", ev.target.value));
    faithTab.find(".faith-points").change(ev => actor.setFlag("faith-tracker", "faithPoints", parseInt(ev.target.value) || 0));
    faithTab.find(".spend-faith").click(() => spendFaith(actor));
  }
});

// HUD button for tokens
Hooks.on("renderTokenHUD", (hud, html, token) => {
  const actor = token.actor;
  if (!actor) return;
  const faith = actor.getFlag("faith-tracker", "faithPoints") || 0;

  const faithButton = $(`
    <div class="control-icon faith-control" title="Faith Points">
      <i class="fas fa-hands-praying"></i>
      <div class="faith-count">${faith}</div>
    </div>
  `);
  faithButton.click(() => {
    spendFaith(actor);
    faithButton.find(".faith-count").text(actor.getFlag("faith-tracker", "faithPoints") || 0);
  });
  html.find(".col.right").append(faithButton);
});

// Automatic Last Prayer for D&D5e
Hooks.on("preUpdateActor", (actor, update) => {
  if (!actor || actor.type !== "character") return;

  const oldHP = getProperty(actor.system, "attributes.hp.value");
  const newHP = update.system?.attributes?.hp?.value;
  if (newHP !== undefined && newHP <= 0 && oldHP > 0 && (actor.getFlag("faith-tracker", "faithPoints") || 0) > 0) {
    // Spend Faith and restore 1 HP
    spendFaith(actor);
    setProperty(update, "system.attributes.hp.value", 1);
    ui.notifications.info(`${actor.name} survived death by invoking their Faith!`);
  }
});

// Core function
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
  } else {
    ui.notifications.warn(`${actor.name} has no Faith Points left.`);
  }
}
