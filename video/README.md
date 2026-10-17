# Contractor AI: pitch and demo video

A 90-second video (1920x1080, 30 fps, H.264) built with Remotion. It uses real captures of the platform taken with Playwright.

## Render

```bash
cd video
npm install
npm run capture   # opens PLATFORM_URL, saves assets/captures/*.png and reads the home-page counters
npm run render    # writes out/contractor-ai-pitch.mp4, out/subtitles.en.srt, out/subtitles.es.srt
```

`npm run build` runs both steps. `npm run test-render` renders a 2-second test scene to check the setup, and `npm run studio` opens the preview.

If `npm run capture` cannot reach the platform, it stops and records why in `assets/captures/status.json`. The video then shows **[CAPTURA PENDIENTE]** wherever a capture belongs. No screen is invented.

## What to change, and where

Everything is in `config.ts`:

| Variable | What it does |
|---|---|
| `PLATFORM_URL` | URL that gets captured and is shown in the closing scene. Rerun `npm run capture` after changing it. |
| `CONTACT` | Email shown in the closing scene. |
| `NARRATION_LANG` | `"en"` or `"es"`: the language of the on-screen text and of the burned-in subtitles. Both `.srt` files are always exported. |
| `DURATION_S` | Total length when there is no narration file. All scenes scale proportionally. |
| `SCENE_BOUNDS_S` | Where each scene starts and ends, in seconds (script: 0/10/25/50/65/80/90). |
| `SCRIPT_FIGURES` | The script's figures. Counters read from the live platform replace them. |

The script and its Spanish translation, split into subtitle cues, are in `script.ts`.

## Narration and music

- `assets/narration.mp3` (recorded by the founder): when present, the video takes the audio's length and scales the scenes to it. For exact cuts, add `assets/narration.timings.json` with the start time of each scene plus the end time, e.g. `{"scenes": [0, 10.4, 26.1, 51.0, 66.2, 81.5, 91.3]}`.
- `assets/music.mp3` (optional): low instrumental background, used only if the file exists.
- Neither file is committed to git.

## Structure

- `config.ts`: variables.
- `script.ts`: narration as cues (EN/ES).
- `timeline.ts`: frame timing shared by the video and the `.srt` files.
- `scripts/capture.ts`: Playwright capture.
- `scripts/prepare.ts`: detects the assets and writes `assets/manifest.json`.
- `scripts/srt.ts`: exports the subtitles.
- `src/`: Remotion composition and scenes.
