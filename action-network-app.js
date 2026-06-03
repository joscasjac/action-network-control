(function () {
  const params = new URLSearchParams(window.location.search);
  const iframeId = params.get("iframeId") || "standalone-preview";
  const client = new IframeClient(iframeId);

  let connected = false;
  let pushTimer = null;
  let gamesData = [];
  let teamsList = [];

  let state = {
    gamesNumber: 1,
    slots: {},
    transitionsOptions: {
      Transition: false,
      TransitionTeamId: "",
      TransitionTypeTeam: false,
      TransitionText: "",
      TransitionTypeText: true,
      TransitionTeam_logo: "",
      TransitionTeam_color: "",
      TransitionColorType: "primary_color"
    }
  };

  const gamesFromUrl = Number(params.get("games"));
  const lockGamesNumberFromUrl = gamesFromUrl >= 1 && gamesFromUrl <= 4;
  if (lockGamesNumberFromUrl) {
    state.gamesNumber = gamesFromUrl;
  }

  function defaultSlot(slotId, gameId) {
    return {
      gameId: gameId ?? "",
      filter: "",
      awayColor: "primary_color",
      homeColor: "primary_color",
      currentOdds: "odds",
      customStat: "SPREAD"
    };
  }

  function ensureSlots() {
    for (let i = 1; i <= 4; i++) {
      if (!state.slots[i]) {
        const defaultGame = gamesData[i - 1];
        state.slots[i] = defaultSlot(i, defaultGame ? defaultGame.id : "");
      }
    }
  }

  function schedulePush() {
    if (!connected) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const payload = ActionNetworkPayload.buildCompletePayload({
        gamesNumber: state.gamesNumber,
        slots: state.slots,
        gamesData,
        teamsList,
        transitionsOptions: buildTransitionOptions()
      });
      client.setPayload(payload);
    }, 120);
  }

  function buildTransitionOptions() {
    const active = document.getElementById("is-active-transition")?.checked ?? false;
    const transitionType = document.getElementById("transition-type")?.value ?? "transition_text";
    const transitionTeamId = document.getElementById("transition-team")?.value ?? "";
    const transitionColor =
      document.getElementById("transition-color")?.value ?? "primary_color";
    const transitionText = document.getElementById("transition-text")?.value ?? "";
    const transitionFilter = document.getElementById("transition-filter")?.value ?? "";

    const TransitionTypeTeam = transitionType === "transition_team";
    const TransitionTypeText = transitionType === "transition_text";

    let TransitionTeam_logo = "";
    let TransitionTeam_color = "";
    let teamId = transitionTeamId;

    if (TransitionTypeTeam && teamId && teamId !== "selectTeam") {
      const team = teamsList.find((t) => String(t.id) === String(teamId));
      if (team) {
        TransitionTeam_logo = team.logo;
        TransitionTeam_color = team[transitionColor] ?? "";
      }
    } else if (!TransitionTypeTeam) {
      teamId = "";
    }

    return {
      Transition: active,
      TransitionTeamId: teamId === "selectTeam" ? "" : teamId,
      TransitionTypeTeam,
      TransitionText: transitionText,
      TransitionTypeText,
      TransitionTeam_logo,
      TransitionTeam_color,
      TransitionColorType: transitionColor,
      _filter: transitionFilter
    };
  }

  function filterGames(filterText) {
    if (!filterText) return gamesData;
    const q = filterText.toLowerCase();
    return gamesData.filter(
      (game) =>
        game.home_team.full_name.toLowerCase().includes(q) ||
        game.away_team.full_name.toLowerCase().includes(q)
    );
  }

  function isGameInactive(gameId) {
    if (!gameId) return false;
    return !gamesData.find((game) => String(game.id) === String(gameId));
  }

  function gameOptionsHtml(slotId, selectedId, filterText) {
    const filtered = filterGames(filterText);
    let html = `<option value="">Select game</option>`;
    filtered.forEach((game) => {
      const label = `${game.away_team.full_name} vs. ${game.home_team.full_name}`;
      const selected = String(game.id) === String(selectedId) ? "selected" : "";
      html += `<option value="${game.id}" ${selected}>${label}</option>`;
    });
    if (selectedId && !filtered.find((g) => String(g.id) === String(selectedId))) {
      const inactive = gamesData.find((g) => String(g.id) === String(selectedId));
      const label = inactive
        ? `${inactive.away_team.full_name} vs. ${inactive.home_team.full_name}`
        : `Game ${selectedId}`;
      html += `<option value="${selectedId}" selected>${label} (inactive)</option>`;
    }
    return html;
  }

  function teamOptionsHtml(selectedId, filterText) {
    const q = (filterText ?? "").toLowerCase();
    let html = `<option value="selectTeam">Select team</option>`;
    teamsList
      .filter((team) => !q || team.full_name.toLowerCase().includes(q))
      .forEach((team) => {
        const selected = String(team.id) === String(selectedId) ? "selected" : "";
        html += `<option value="${team.id}" ${selected}>${team.full_name}</option>`;
      });
    return html;
  }

  function renderGamePanel(slotId) {
    const slot = state.slots[slotId];
    const visible = slotId <= state.gamesNumber;
    const inactive = isGameInactive(slot.gameId);

    return `
      <section class="game-panel ${visible ? "visible" : ""}" data-slot="${slotId}">
        <h2>Game ${slotId}</h2>
        <div class="row">
          <label>
            Filter
            <input type="text" data-slot="${slotId}" data-field="filter" value="${slot.filter ?? ""}" placeholder="Search teams…" />
          </label>
          <label>
            Game
            <select data-slot="${slotId}" data-field="gameId">
              ${gameOptionsHtml(slotId, slot.gameId, slot.filter)}
            </select>
          </label>
        </div>
        <div class="row">
          <label>
            Away color
            <select data-slot="${slotId}" data-field="awayColor">
              <option value="primary_color" ${slot.awayColor === "primary_color" ? "selected" : ""}>Primary</option>
              <option value="secondary_color" ${slot.awayColor === "secondary_color" ? "selected" : ""}>Secondary</option>
            </select>
          </label>
          <label>
            Home color
            <select data-slot="${slotId}" data-field="homeColor">
              <option value="primary_color" ${slot.homeColor === "primary_color" ? "selected" : ""}>Primary</option>
              <option value="secondary_color" ${slot.homeColor === "secondary_color" ? "selected" : ""}>Secondary</option>
            </select>
          </label>
        </div>
        <div class="row">
          <label>
            Game data
            <select data-slot="${slotId}" data-field="currentOdds">
              <option value="odds" ${slot.currentOdds === "odds" ? "selected" : ""}>Latest</option>
              <option value="firsthalf_odds" ${slot.currentOdds === "firsthalf_odds" ? "selected" : ""}>First half</option>
            </select>
          </label>
          <label>
            Stat type
            <select data-slot="${slotId}" data-field="customStat">
              <option value="SPREAD" ${slot.customStat === "SPREAD" ? "selected" : ""}>Spread</option>
              <option value="MONEYLINE" ${slot.customStat === "MONEYLINE" ? "selected" : ""}>Money</option>
              <option value="O/U" ${slot.customStat === "O/U" ? "selected" : ""}>Over/Under</option>
              <option value="allStats" ${slot.customStat === "allStats" ? "selected" : ""}>All stats</option>
            </select>
          </label>
        </div>
        ${
          inactive
            ? `<div class="status warn">WARNING: THE ID PREVIOUSLY SELECTED IS NOT ACTIVE ANYMORE</div>`
            : ""
        }
      </section>
    `;
  }

  function updateTransitionVisibility() {
    const type = document.getElementById("transition-type")?.value;
    const active = document.getElementById("is-active-transition")?.checked;
    const teamWrap = document.getElementById("transition-team-wrap");
    const filterWrap = document.getElementById("transition-filter-wrap");
    const colorWrap = document.getElementById("transition-color-wrap");
    const textWrap = document.getElementById("transition-text-wrap");
    const optionsWrap = document.getElementById("transition-options");

    if (optionsWrap) {
      optionsWrap.classList.toggle("hidden", !active);
    }
    const isTeam = type === "transition_team";
    teamWrap?.classList.toggle("hidden", !isTeam);
    filterWrap?.classList.toggle("hidden", !isTeam);
    colorWrap?.classList.toggle("hidden", !isTeam);
    textWrap?.classList.toggle("hidden", isTeam);
  }

  function renderGameSelect(slotId) {
    const slot = state.slots[slotId];
    const select = document.querySelector(
      `select[data-slot="${slotId}"][data-field="gameId"]`
    );
    if (!select || !slot) return;
    const current = select.value;
    select.innerHTML = gameOptionsHtml(slotId, slot.gameId, slot.filter);
    if (current) select.value = current;
  }

  function renderTransitionTeamSelect() {
    const select = document.getElementById("transition-team");
    if (!select) return;
    const filter = document.getElementById("transition-filter")?.value ?? "";
    const current = select.value;
    select.innerHTML = teamOptionsHtml(current, filter);
  }

  function render() {
    const gamesNumberSection = document.getElementById("games-number-section");
    if (gamesNumberSection) {
      gamesNumberSection.classList.toggle("hidden", lockGamesNumberFromUrl);
    }

    document.querySelectorAll("#game-count-buttons button").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.count) === state.gamesNumber);
    });

    document.getElementById("games-container").innerHTML = [1, 2, 3, 4]
      .map(renderGamePanel)
      .join("");

    document.getElementById("is-active-transition").checked =
      state.transitionsOptions.Transition ?? false;
    document.getElementById("transition-type").value =
      state.transitionsOptions.TransitionTypeTeam ? "transition_team" : "transition_text";
    document.getElementById("transition-color").value =
      state.transitionsOptions.TransitionColorType ?? "primary_color";
    document.getElementById("transition-text").value =
      state.transitionsOptions.TransitionText ?? "";

    renderTransitionTeamSelect();
    const teamSelect = document.getElementById("transition-team");
    if (teamSelect && state.transitionsOptions.TransitionTeamId) {
      teamSelect.value = state.transitionsOptions.TransitionTeamId;
    }

    updateTransitionVisibility();
    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll("#game-count-buttons button").forEach((btn) => {
      btn.onclick = () => {
        if (lockGamesNumberFromUrl) return;
        state.gamesNumber = Number(btn.dataset.count);
        render();
        schedulePush();
      };
    });

    document.querySelectorAll("[data-slot]").forEach((el) => {
      const slotId = Number(el.dataset.slot);
      const field = el.dataset.field;
      if (!field) return;

      const handler = () => {
        state.slots[slotId][field] = el.value;
        if (field === "filter") {
          renderGameSelect(slotId);
        }
        schedulePush();
      };

      if (el.tagName === "INPUT") {
        el.oninput = handler;
      } else {
        el.onchange = () => {
          handler();
          if (field === "filter" || field === "gameId") {
            const warning = isGameInactive(state.slots[slotId].gameId);
            if (field === "gameId") render();
          }
        };
      }
    });

    document.getElementById("is-active-transition").onchange = () => {
      updateTransitionVisibility();
      schedulePush();
    };
    document.getElementById("transition-type").onchange = () => {
      updateTransitionVisibility();
      schedulePush();
    };
    document.getElementById("transition-team").onchange = schedulePush;
    document.getElementById("transition-color").onchange = schedulePush;
    document.getElementById("transition-text").oninput = schedulePush;
    document.getElementById("transition-filter").oninput = () => {
      renderTransitionTeamSelect();
    };
  }

  async function loadGames() {
    try {
      gamesData = await ActionNetworkPayload.getGamesData();
      teamsList = ActionNetworkPayload.buildTeamsList(gamesData);
      ensureSlots();
    } catch (error) {
      console.error(error);
      gamesData = [];
      teamsList = [];
      ensureSlots();
    }
    render();
    schedulePush();
  }

  client.onInitialData(() => {
    connected = true;
    schedulePush();
  });

  client.onItemStateChanged(() => {});

  loadGames();
})();
