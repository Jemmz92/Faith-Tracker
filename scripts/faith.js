// ===== Faith Tracker for Foundry v12 (Final Version) =====

const DEITIES = [
  "Selaryon", "Kaelthar", "Luminael", "Noctyra",
  "Verdalis", "Zerithia", "Amaryth", "Dravok", "Eryndra"
];

Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags if missing
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", DEITIES[0]);

  // --- Add Faith tab button (badge only) ---
  const tabNav = html.find(".tabs");
  let faithTabButton = tabNav.find('a[data-tab="faith"]');
  if (!faithTabButton.length) {
    tabNav.append(`<a class="item" data-tab="faith"><span class="faith-badge">0</span></a>`); 
    html.find(".tab").parent().append(`<div class="tab" data-tab="faith"></div>`);
    faithTabButton = tabNav.find('a[data-tab="faith"]');

    faithTabButton.click(function() {
      const tab = $(this).data("tab");
      html.find(".tab").removeClass("active");
      html.find(`.tab[data-tab="${tab}"]`).addClass("active");
      tabNav.find("a").removeClass("active");
      $(this).addClass("active");
    });
  }

  // --- Populate Faith tab ---
  const faithTab = html.find('.tab[data-tab="faith"]');
  if (!faithTab.find(".faith-panel").length) {
    let currentDeity = actor.getFlag("faith-tracker","deity");
    let deityOptions = DEITIES.map(d => `<option value="${d}" ${d===currentDeity?"selected":""}>${d}</option>`).join("");
    
    faithTab.html(`
      <div class="faith-panel">
        <h3>Faith</h3>
        <label>Deity: 
          <select class="faith-deity">${deityOptions}</select>
        </label>
        <label>Faith Points: 
          <input type="number" class="faith-points" value="${actor.getFlag("faith-tracker","faithPoints")}" min="0">
        </label>
        <button class="submit-faith btn">Submit</button>
      </div>
    `);

    // Submit button event
    faithTab.find(".submit-faith").click(() => {
      const newDeity = faithTab.find(".faith-deity").val();
      const newFaith = parseInt(faithTab.find(".faith-points").val()) || 0;

      actor.setFlag("faith-tracker","deity", newDeity);
      actor.setFlag("faith-tracker","faithPoints", newFaith);

      updateFaithBadge(actor, html);
      ui.notifications.info(`Faith updated: ${newFaith} points, Deity: ${newDeity}`);
    });
  }

  // --- Update badge ---
  updateFaithBadge(actor, html);
});

/* ---------------- Automatic Last Prayer for D&D5e ---------------- */
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
  const deity = actor.getFlag("faith-tracker", "deity") || DEITIES[0];

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

/* ---------------- Update Faith Badge ---------------- */
function updateFaithBadge(actor, html) {
  const points = actor.getFlag("faith-tracker","faithPoints") || 0;
  html.find('a[data-tab="faith"] .faith-badge').text(points);
}
