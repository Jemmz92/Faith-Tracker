// ===== Faith Tracker for Foundry V12 (Final Version) =====

const DEITIES = {
  "Selaryon": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Selaryon.png",
    text: "From the first spark of creation, Selaryon cast his silver light across the void, shaping the heavens and weaving the threads of fate. Mortals who look to the stars may find guidance, prophecy, and the balance between light and dark. Those who follow Selaryon seek clarity, cosmic insight, and the patience to let destiny unfold."
  },
  "Kaelthar": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Kaelthar.png",
    text: "Kaelthar descended to teach mortals discipline, strategy, and honor. His temples are both sanctuaries and training halls, where knights and generals hone their skills. Followers of Kaelthar embrace courage in battle, fairness in combat, and the protection of kingdoms. Valor is not only strength, but the moral righteousness to wield it justly."
  },
  "Luminael": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Luminael.png",
    text: "Luminael bathes the lands of Averis in life-giving light. He blesses rivers, valleys, and those who heal the sick. Priests and healers call upon him to protect the innocent, cure disease, and shine hope into dark corners. To serve Luminael is to bring warmth and light, even when shadows loom."
  },
  "Noctyra": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Noctyra.png",
    text: "Noctyra guides the natural end of life and the shadows that lie in all law and judgment. She watches over tombs, crypts, and northern wastelands, ensuring every debt is paid, mortal or divine. Her followers respect the inevitability of death and the mysteries hidden in darkness, embracing both caution and the quiet power of endings."
  },
  "Verdalis": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Verdalis.png",
    text: "Verdalis tends the wilds, teaching mortals to live in harmony with forests, beasts, and mountains. Druids and travelers honor him to find guidance on paths untamed and to ensure growth, harvest, and balance. Those who follow Verdalis champion the preservation of nature and the wisdom of the land itself."
  },
  "Zerithia": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Zerithia.png",
    text: "Zerithia’s favor shapes the rise of cities and the flow of coin. Merchants, gamblers, and adventurers seek her blessings, knowing fortune comes with risk. She teaches that ambition must be measured, luck is fleeting, and every gain may carry a hidden cost. To follow Zerithia is to gamble with fate and wealth alike."
  },
  "Amaryth": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Amaryth.png",
    text: "Amaryth spreads joy, passion, and the courage to follow one’s heart. Her presence fills cities with music, art, and gardens of beauty. Lovers, artists, and dreamers pray to her for inspiration, companionship, and freedom. To serve Amaryth is to celebrate life’s passions and defend the creative spark in all things."
  },
  "Dravok": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Dravok.png",
    text: "Born from wrath and chaos, Dravok once raged across Averis, burning cities and splitting mountains. Though destroyed by the other gods, his essence lingers in volcanoes, storms, and cursed ruins. Followers of Dravok—or those who dare study him—learn of unchecked power, destruction’s allure, and the consequences of hubris."
  },
  "Eryndra": {
    image: "https://raw.githubusercontent.com/jemmz92/faith-tracker/main/faith-images/Eryndra.png",
    text: "Eryndra was born from mortal ambition and the sparks of invention, guiding the evolution of both people and machines. Her temples are workshops and academies, her followers explorers, alchemists, and inventors. To follow Eryndra is to embrace change, pursue knowledge, and push the limits of tradition—but progress carries risk, and not all creations are meant to endure."
  }
};

const DEITY_EFFECTS = {
  "Selaryon": "Gain Truesight 30 ft. for 1 hour.",
  "Kaelthar": "Free melee attack with advantage, +PB radiant damage.",
  "Luminael": "Heal 2d10 + level HP; undead within 30 ft. have disadvantage against you.",
  "Noctyra": "Rise with 1d4 shadow wraiths aiding you for 3 rounds.",
  "Verdalis": "Roots restrain enemies in 15 ft. radius (1 min).",
  "Zerithia": "Auto success on 1 roll within 1 minute; lose 1d4 × 10 gp.",
  "Amaryth": "Allies in 30 ft. regain 1d6 + PB HP and gain advantage on next attack.",
  "Dravok": "Enemies in 15 ft. take 2d10 fire damage; you gain 1 level of exhaustion.",
  "Eryndra": "Gain an extra action each turn for 1d4 rounds, then collapse at 0 HP (stable)."
};

Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags if missing
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", "Selaryon");

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

  const faithTab = html.find('.tab[data-tab="faith"]');
  if (!faithTab.find(".faith-panel").length) {
    let currentDeity = actor.getFlag("faith-tracker","deity");
    let deityOptions = Object.keys(DEITIES).map(d => `<option value="${d}" ${d===currentDeity?"selected":""}>${d}</option>`).join("");

    faithTab.html(`
      <div class="faith-panel">
        <h3>Faith</h3>
        <label>Deity: 
          <select class="faith-deity">${deityOptions}</select>
        </label>
        <label>Faith Points: 
          <input type="number" class="faith-points" value="${actor.getFlag("faith-tracker","faithPoints")}" min="0">
        </label>
        <div class="faith-buttons">
          <button class="submit-faith btn">Submit</button>
          <button class="spend-faith btn">Spend Faith</button>
        </div>
        <div class="faith-deity-info" style="margin-top:10px;">
          <img src="${DEITIES[currentDeity].image}" style="max-width:560px; max-height:560px; display:block; margin-bottom:10px;">
          <p>${DEITIES[currentDeity].text}</p>
        </div>
      </div>
    `);

    // --- Update deity info on dropdown change ---
    faithTab.find(".faith-deity").change(function() {
      const selected = $(this).val();
      const infoDiv = faithTab.find(".faith-deity-info");
      infoDiv.html(`
     <img src="${DEITIES[selected].image}" style="max-width:560px; max-height:560px; display:block; margin-bottom:10px;">
        <p>${DEITIES[selected].text}</p>
      `);
    });

    // --- Submit Button ---
    faithTab.find(".submit-faith").click(async () => {
      const newDeity = faithTab.find(".faith-deity").val();
      const newFaith = parseInt(faithTab.find(".faith-points").val()) || 0;

      await actor.setFlag("faith-tracker","deity", newDeity);
      await actor.setFlag("faith-tracker","faithPoints", newFaith);

      refreshBadge(actor, app);
      ui.notifications.info(`Faith updated: ${newFaith} points, Deity: ${newDeity}`);
    });

    // --- Spend Faith Button ---
    faithTab.find(".spend-faith").click(async () => {
      await spendFaith(actor);
      refreshBadge(actor, app);
    });
  }

  // --- Initial badge update ---
  refreshBadge(actor, app);
});

// --- Badge Refresh ---
function refreshBadge(actor, sheetApp) {
  const points = actor.getFlag("faith-tracker","faithPoints") || 0;
  const badge = sheetApp.element.find('a[data-tab="faith"] .faith-badge');
  if (badge.length) badge.text(points);
}

// --- Spend Faith Function ---
async function spendFaith(actor) {
  let faith = actor.getFlag("faith-tracker", "faithPoints") || 0;
  const deity = actor.getFlag("faith-tracker", "deity") || "Selaryon";

  if (faith > 0) {
    // Consume faith point
    await actor.setFlag("faith-tracker", "faithPoints", faith - 1);
    await actor.setFlag("faith-tracker", "faithless", true);

    const effectText = DEITY_EFFECTS[deity] || "";

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<b>${actor.name}</b> invokes their Last Prayer to <i>${deity}</i> and spends a Faith Point!<br><i>Effect: ${effectText}</i>`
    });

  } else {
    ui.notifications.warn(`${actor.name} has no Faith Points left.`);
  }
}

// --- Automatic Last Prayer ---
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
