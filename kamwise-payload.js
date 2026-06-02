/**
 * Kamwise Action Network payload builder (ported from Kamwise 2023CustomHtml).
 * Generates Singular field keys like away_team_full_name1, odds_spread_away_public1, etc.
 */
(function (global) {
  const PAYLOAD_FIELDS = [
    "away_team|full_name",
    "away_team|id",
    "away_team|abbr",
    "away_team|logo",
    "away_team|color",
    "home_team|full_name",
    "home_team|id",
    "home_team|abbr",
    "home_team|logo",
    "home_team|color",
    "bet_percent|percent",
    "bet_percent|type",
    "bet_percent|percent",
    "bet_percent|type",
    "odds|away_over",
    "odds|away_under",
    "odds|away_total",
    "odds|home_over",
    "odds|home_under",
    "odds|home_total",
    "odds|ml_away",
    "odds|ml_away_money",
    "odds|ml_away_public",
    "odds|ml_home",
    "odds|ml_home_money",
    "odds|ml_home_public",
    "odds|over",
    "odds|spread_away",
    "odds|spread_away_money",
    "odds|spread_home",
    "odds|spread_home_money",
    "odds|spread_home_public",
    "odds|total",
    "odds|total_over_money",
    "odds|total_over_public",
    "odds|total_under_money",
    "odds|total_under_public",
    "odds|total_over_money",
    "odds|under",
    "id",
    "league_name",
    "money_percent|percent",
    "money_percent|type",
    "start_time",
    "status",
    "winning_team_id",
    "away_team|customStat",
    "home_team|customStat",
    "Transition",
    "TransitionTypeTeam",
    "TransitionTeam_logo",
    "TransitionTeam_color",
    "TransitionTypeText",
    "TransitionText"
  ];

  const DEFAULT_GAMES_DATANODE_URL =
    "https://app.singular.live/apiv1/datanodes/3846/data";
  const DEFAULT_GAMES_AUTH =
    "Basic ZGF0YUBhY3Rpb25uZXR3b3JrLmNvbToxMjM0";

  function cleanObject(obj) {
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      }
    }
    return obj;
  }

  function generateNFLPayloadById({
    gameData,
    id,
    currentOdds,
    homeColor,
    awayColor,
    customStat
  }) {
    if (currentOdds == "" || !currentOdds || currentOdds == " ") {
      currentOdds = "odds";
    }
    if (homeColor == "" || !homeColor || homeColor == " ") {
      homeColor = "primary_color";
    }
    if (awayColor == "" || !awayColor || awayColor == " ") {
      awayColor = "primary_color";
    }

    const payload = {};
    if (customStat === "allStats") {
      payload["oneStat" + id] = false;
      payload["allStats" + id] = true;
    } else {
      payload["oneStat" + id] = true;
      payload["allStats" + id] = false;
    }

    PAYLOAD_FIELDS.forEach((field) => {
      const splittedField = field.split("|");

      if (!splittedField[1]) {
        payload[splittedField[0] + id] = gameData[splittedField[0]];
      } else if (splittedField[1] === "customStat") {
        payload["game_customStat" + id] = customStat;

        let current = "";
        if (splittedField[0] === "away_team") current = "away";
        else current = "home";

        if (customStat == "SPREAD") {
          if (gameData[currentOdds] && gameData[currentOdds][`spread_${current}`]) {
            payload[`${splittedField[0]}_customStat${id}`] =
              gameData[currentOdds][`spread_${current}`];
          }
          if (
            gameData[currentOdds] &&
            gameData[currentOdds][`spread_${current}_public`]
          ) {
            payload[`odds_spread_${current}_public${id}`] =
              gameData[currentOdds][`spread_${current}_public`];
          }
          if (
            gameData[currentOdds] &&
            gameData[currentOdds][`spread_${current}_money`]
          ) {
            payload[`odds_spread_${current}_money${id}`] =
              gameData[currentOdds][`spread_${current}_money`];
          }
          if (payload[`${splittedField[0]}_customStat${id}`] > 0) {
            payload[`${splittedField[0]}_customStat${id}`] =
              "+" + payload[`${splittedField[0]}_customStat${id}`];
          }
        } else if (customStat == "MONEYLINE") {
          if (gameData[currentOdds] && gameData[currentOdds][`ml_${current}`]) {
            payload[`${splittedField[0]}_customStat${id}`] =
              gameData[currentOdds][`ml_${current}`];
          }
          if (
            gameData[currentOdds] &&
            gameData[currentOdds][`ml_${current}_public`]
          ) {
            payload[`odds_spread_${current}_public${id}`] =
              gameData[currentOdds][`ml_${current}_public`];
          }
          if (
            gameData[currentOdds] &&
            gameData[currentOdds][`ml_${current}_money`]
          ) {
            payload[`odds_spread_${current}_money${id}`] =
              gameData[currentOdds][`ml_${current}_money`];
          }
          if (payload[`${splittedField[0]}_customStat${id}`] > 0) {
            payload[`${splittedField[0]}_customStat${id}`] =
              "+" + payload[`${splittedField[0]}_customStat${id}`];
          }
        } else if (customStat == "O/U") {
          let value;
          if (current == "away") {
            if (
              gameData[currentOdds] &&
              gameData[currentOdds][`total_over_public`]
            ) {
              payload[`odds_spread_${current}_public${id}`] =
                gameData[currentOdds][`total_over_public`];
            }
            if (
              gameData[currentOdds] &&
              gameData[currentOdds][`total_over_money`]
            ) {
              payload[`odds_spread_${current}_money${id}`] =
                gameData[currentOdds][`total_over_money`];
            }
            if (gameData[currentOdds]) {
              value = `o ${gameData[currentOdds].total}`;
            }
          } else {
            if (
              gameData[currentOdds] &&
              gameData[currentOdds][`total_under_public`]
            ) {
              payload[`odds_spread_${current}_public${id}`] =
                gameData[currentOdds][`total_under_public`];
            }
            if (
              gameData[currentOdds] &&
              gameData[currentOdds][`total_under_money`]
            ) {
              payload[`odds_spread_${current}_money${id}`] =
                gameData[currentOdds][`total_under_money`];
            }
            if (gameData[currentOdds]) {
              value = `u ${gameData[currentOdds].total}`;
            }
          }
          if (value) payload[`${splittedField[0]}_customStat${id}`] = value;
        }
      } else if (splittedField[0] == "odds") {
        if (gameData[currentOdds] && gameData[currentOdds][splittedField[1]]) {
          payload[splittedField[0] + "_" + splittedField[1] + id] =
            gameData[currentOdds][splittedField[1]];
          payload[splittedField[0] + "_value" + id] = currentOdds;
        }
      } else if (splittedField[1] == "color") {
        let currentColor;
        if (splittedField[0] === "away_team") currentColor = awayColor;
        else currentColor = homeColor;

        if (
          gameData[splittedField[0]] &&
          gameData[splittedField[0]][currentColor]
        ) {
          payload[splittedField[0] + "_" + splittedField[1] + id] =
            gameData[splittedField[0]][currentColor];
          payload[splittedField[0] + "_" + splittedField[1] + "_value" + id] =
            currentColor;
        }
      } else if (
        gameData[splittedField[0]] &&
        gameData[splittedField[0]][splittedField[1]]
      ) {
        payload[splittedField[0] + "_" + splittedField[1] + id] =
          gameData[splittedField[0]][splittedField[1]];
      }
    });

    return cleanObject(payload);
  }

  function generateTransitionPayload({
    Transition,
    TransitionTeamId,
    TransitionTypeTeam,
    TransitionText,
    TransitionTypeText,
    TransitionTeam_logo,
    TransitionTeam_color,
    TransitionColorType
  }) {
    const payload = {};
    if (!TransitionTeamId) TransitionTeamId = "";
    payload["Transition"] = Transition;
    payload["TransitionTeamId"] = TransitionTeamId;
    payload["TransitionTypeTeam"] = TransitionTypeTeam;
    payload["TransitionText"] = TransitionText;
    payload["TransitionTypeText"] = TransitionTypeText;
    payload["TransitionTeam_logo"] = TransitionTeam_logo;
    payload["TransitionTeam_color"] = TransitionTeam_color;
    payload["TransitionColorType"] = TransitionColorType;
    return cleanObject(payload);
  }

  async function getGamesData(options = {}) {
    const url = options.url ?? DEFAULT_GAMES_DATANODE_URL;
    const auth = options.auth ?? DEFAULT_GAMES_AUTH;
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: auth,
        "content-type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Games datanode failed: ${response.status}`);
    }
    const json = await response.json();
    const games = JSON.parse(json.payload.games);
    return Object.values(games);
  }

  function buildCompletePayload({
    gamesNumber,
    slots,
    gamesData,
    teamsList,
    transitionsOptions
  }) {
    let completePayload = {};

    for (let slot = 1; slot <= gamesNumber; slot++) {
      const slotConfig = slots[slot];
      if (!slotConfig?.gameId) continue;

      const gameData = gamesData.find(
        (game) => String(game.id) === String(slotConfig.gameId)
      );
      if (!gameData) continue;

      const gamePayload = generateNFLPayloadById({
        gameData,
        id: slot,
        currentOdds: slotConfig.currentOdds,
        homeColor: slotConfig.homeColor,
        awayColor: slotConfig.awayColor,
        customStat: slotConfig.customStat
      });
      completePayload = { ...completePayload, ...gamePayload };
    }

    const transitionPayload = generateTransitionPayload(
      transitionsOptions || {}
    );
    completePayload = { ...completePayload, ...transitionPayload };
    completePayload.gamesNumber = gamesNumber;
    return completePayload;
  }

  function buildTeamsList(gamesData) {
    const teamsList = [];
    gamesData.forEach((game) => {
      if (!teamsList.find((team) => team.id == game.home_team.id)) {
        teamsList.push(game.home_team);
      }
      if (!teamsList.find((team) => team.id == game.away_team.id)) {
        teamsList.push(game.away_team);
      }
    });
    return teamsList.sort((a, b) => a.id - b.id);
  }

  global.KamwisePayload = {
    PAYLOAD_FIELDS,
    cleanObject,
    generateNFLPayloadById,
    generateTransitionPayload,
    getGamesData,
    buildCompletePayload,
    buildTeamsList,
    DEFAULT_GAMES_DATANODE_URL,
    DEFAULT_GAMES_AUTH
  };
})(typeof window !== "undefined" ? window : globalThis);
