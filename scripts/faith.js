// ===== Faith Tracker for Foundry v12 (Final Version) =====

/* ---------------- Render Actor Sheet ---------------- */
Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags if missing
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", "");

  // --- Add Faith tab button ---
  const tabNav = html.find(".tabs");
  if (!tabNav.find('a[data-tab="faith"]').length) {
    tabNav.append(`<a class="item" data-tab="faith">Faith</a>`);
    html.find(".tab").parent().append(`<div class="tab" data-tab="faith"></div>`);

    tabNav.find('a[data-tab="faith"]').click(function() {
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
    faithTab.html(`
      <div class="faith-panel">
        <h3>Faith</h3>
        <label>Deity: <input type="text" class="faith-deity" value="${actor.getFlag("faith-tracker","deity")}"></label>
        <label>Faith Points: <input type="number" class="faith-points" value="${actor.getFlag("faith-tracker","faithPoints")}" min="0"></label>
        <button class="spend-faith btn">Spend Faith</button>
      </div>
    `);

    // Event listeners
    faithTab.find(".faith-deity").change(ev => {
      actor.setFlag("faith-tracker","deity", ev.target.value);
      updateFaithHeader(actor, html);
    });
    faithTab.find(".faith-points").change(ev => {
      actor.setFlag("faith-tracker","faithPoints", parseInt(ev.target.value) || 0);
      updateFaithHeader(actor, html);
    });
    faithTab.find(".spend-faith").click(() => {
      spendFaith(actor);
      updateFaithHeader(actor, html);
    });
  }

  // --- Faith display next to Edit button ---
  updateFaithHeader(actor, html);
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

/* ---------------- Update Faith Header ---------------- */
function updateFaithHeader(actor, html) {
  let header = html?.find(".faith-header");
  if (!header.length) {
    const windowHeader = html.find(".window-header .window-title");
    header = $(`<div class="faith-header"></div>`);
    windowHeader.append(header);
  }
  const points = actor.getFlag("faith-tracker","faithPoints") || 0;
  const deity = actor.getFlag("faith-tracker","deity") || "None";
  header.html(`🛐 ${points} - ${deity}`);
}
