Hooks.on("renderActorSheet", (app, html, data) => {
  const actor = app.actor;
  if (!actor) return;

  // Initialize flags if missing
  if (actor.getFlag("faith-tracker", "faithPoints") === undefined)
    actor.setFlag("faith-tracker", "faithPoints", 1);
  if (actor.getFlag("faith-tracker", "deity") === undefined)
    actor.setFlag("faith-tracker", "deity", "");

  // --- Insert Faith Panel below Class ---
  if (!html.find(".faith-panel").length) {
    const classSection = html.find(".character-info"); // Adjust this selector to your sheet
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
    });
    faithPanel.find(".faith-points").change(ev => {
      actor.setFlag("faith-tracker", "faithPoints", parseInt(ev.target.value) || 0);
      updateFaithDisplay(actor, html);
    });
    faithPanel.find(".spend-faith").click(() => {
      spendFaith(actor);
      updateFaithDisplay(actor, html);
    });
  }

  // --- Faith Display on Sheet Header ---
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

// --- Update display dynamically
function updateFaithDisplay(actor, html) {
  const points = actor.getFlag("faith-tracker", "faithPoints") || 0;
  const deity = actor.getFlag("faith-tracker", "deity") || "None";
  html.find(".faith-display .faith-points").text(points);
  html.find(".faith-display .faith-deity").text(deity);
  html.find(".faith-panel .faith-points").val(points);
  html.find(".faith-panel .faith-deity").val(deity);
}
