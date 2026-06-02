# Action Network–style control panel (Stream Craft Studio)

This example mirrors the [Kamwise Action Network custom HTML control](https://www.kamwise.com/actionNetwork/2023CustomHtml/index.html?games=0): game count, per-game settings (colors, data window, stat type), and transition controls. It talks to **Stream Craft Studio** through the `IframeClient` bridge instead of Kamwise.

## How it fits together

```mermaid
flowchart LR
  subgraph studio [Stream Craft Studio]
    Playlist[Playlist item]
    CustomEditor[CustomHTMLEditor iframe]
    SingularPreview[Singular preview / output]
  end
  subgraph hosted [Your hosted HTML]
    Control[index.html control UI]
  end
  Control -->|SET_PAYLOAD via postMessage| CustomEditor
  CustomEditor -->|setPayload / preview| SingularPreview
  Playlist --> CustomEditor
```

1. **Singular composition** — Subcomposition includes a `customHTML` control node (studio auto-detects this and sets editor type to `customHTML`).
2. **Studio settings** — For that subcomposition: Editor = **Custom HTML**, URL = hosted `index.html` (see below).
3. **Playlist** — Add an item on that logic layer; selecting it loads your control page in the item editor.
4. **Control page** — Uses `IframeClient` to push payload keys into Singular preview (same pattern as Kamwise → their engine).

## Payload format (Kamwise-compatible)

This control uses the same payload keys as [Kamwise Action Network](https://www.kamwise.com/actionNetwork/2023CustomHtml/index.html):

- `away_team_full_name1`, `home_team_logo1`, `away_team_color1`, …
- `oneStat1` / `allStats1`, `game_customStat1`, `odds_spread_away_public1`, …
- `Transition`, `TransitionText`, `TransitionTypeTeam`, …
- `gamesNumber`

Games are loaded from the Singular Action Network datanode (same source as Kamwise). Control values match Kamwise: `primary_color` / `secondary_color`, `odds` / `firsthalf_odds`, `SPREAD` / `MONEYLINE` / `O/U` / `allStats`.

## Host the control page

### Option A — Stream Craft hosting (recommended)

1. Create a project in `stream-craft-studio-hosting`.
2. Upload `index.html` and `iframe-client.js` (same folder).
3. Publish the project.
4. Use the live URL, e.g.  
   `https://your-host/api/live/{projectId}/index.html`

### Option B — Local dev (with `npm run dev`)

From `stream-craft-studio-control`:

```bash
npm run dev
```

The dev server serves this folder at:

**http://localhost:5173/action-network-control/index.html**

Use that URL as the Custom HTML URL in studio settings (studio appends `?iframeId=...` when loading the iframe). The terminal also prints this link when the dev server starts.

### Option C — Refresh iframe client from control app

```bash
cd stream-craft-studio-control
npm run build:iframe
cp dist/iframe/iframe-client.js examples/action-network-control/
```

## Studio configuration checklist

1. Load your Singular app in Stream Craft Studio.
2. **Settings → Editor configuration** — For the sports subcomposition:
   - Editor: **Custom HTML**
   - URL: your hosted `index.html`
3. Add a playlist item on that layer.
4. Select the item — the Kamwise-style panel appears in the item editor; Singular preview updates as you change controls.
5. Use **Update** when the graphic is **In** on program to push changes to output.

## Action Network data

Kamwise wires game dropdowns to live Action Network IDs. This example uses `MOCK_GAMES`; replace that list with your API:

```javascript
async function loadGames() {
  const res = await fetch("https://your-api/events");
  const events = await res.json();
  // populate selects, then schedulePush()
}
```

Inactive IDs (Kamwise’s “ID NOT ACTIVE” warning) should be handled in your API layer when a saved `gameId` is no longer on the slate.

## Related code in this repo

- `stream-craft-studio-control/src/components/itemEditor/CustomHTMLEditor.tsx` — iframe host
- `stream-craft-studio-control/src/lib/iframe-client.ts` — bridge library
- `stream-craft-studio-control/src/services/IframeMessageService.ts` — message routing
