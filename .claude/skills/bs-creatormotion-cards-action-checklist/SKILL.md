---
name: bs-creatormotion-cards-action-checklist
description: Track a screen demonstration with a checklist that completes at matching moments. Keep the checklist and media aligned in one composition.
---

# Synchronized Action Checklist

Use this Skill when the explanation benefits from this exact visual relationship: visible task list + screen media → timed checks → completed state.

Preserve the defining sequence. Read `references/motion-spec.md` before editing the composition. Keep labels concise enough for the 1920 by 1080 canvas; keep supporting labels at least 24 px. Use the same content and timing across the four supplied styles.

## Content controls

- `tasks`: default `[{"label": "Review the notes", "at": 1.4}, {"label": "Choose one action", "at": 3.1}, {"label": "Try it this week", "at": 4.8}]`.
- `screenTitle`: default `"Session checklist"`.
- `presenter`: default `false`.

- `screenMediaKey`: key in `images` for a real local screen recording; default `screen-recording`. Without it, the example reuses the bundled generated mobileScreen image. The editable checklist shows demonstration timing; the still image is not a synchronized screen recording. When a recording is supplied, set each task `at` value from the actual recording.

The renderer accepts local `images` and presenter `media` where the composition uses them. Reuse the bundled generated image defaults when no reference is supplied; explicit user images override the named slots. Photos, covers, content imagery and chat avatars must remain real raster images, never HTML placeholder drawings. Read `references/image-policy.md` and `references/default-image-slots.md` for material selection and replacement keys.

## Build and review

From the extracted Skill directory, create a composition with a JSON content file:

```sh
node scripts/create.mjs --out ./output/my-video --style white-yellow --data ./content.json
```

For presenter scenes, add `--media ./presenter.mp4` when required. Image defaults are automatic; add `--images ./images.json` only to replace or extend named image slots. Its local paths resolve relative to the image JSON file. The other styles are `charcoal-lime`, `paper-orange` and `midnight-ice`.

Then inspect and render the created composition:

```sh
npx --yes hyperframes@0.8.30 inspect ./output/my-video --json
npx --yes hyperframes@0.8.30 render ./output/my-video --output ./output/my-video.mp4 --fps 30 --quality high --strict
```

Use the package renderer with local content, a selected style and any required local media. Preserve the module's deterministic GSAP timeline. Check the first visible state, each relationship change and the final reading hold. Inspect the rendered video for cropping, overlapping labels and incorrect connector endpoints. A presenter take must cover its entire visible interval; the default media window is at most 6.8 seconds.

## Scope

Rows already exist; state updates are tied to demonstrated actions and cannot be replaced by arbitrary entrance staggering.


## Reference-led shot treatment

The list is now a compact paper note beside a more physical phone frame, with plain square boxes and stroke-drawn checks. Supplied screen video still replaces the neutral example. Check timing remains driven by the actual task at values; no fabricated screen metrics are introduced. Follow the authored direction and timing in `references/motion-spec.md`. Keep replacement text within the same visual hierarchy.

## Chinese typography

Chinese content uses the bundled Smiley Sans (Deyi Hei) by default. The generator detects Chinese in the resolved content and applies it with no flag, including to Latin words in the same composition; Noto Sans SC stays behind it for rare characters. Smiley Sans has one slanted display weight, so hierarchy comes from size, color and spacing rather than weight. Pass `--zh-font noto-sans-sc` only when the user wants the plainer Noto Sans SC; a supplied `--font` always wins. `build.json` records the choice under `typography`.

## Image material contract

`mobileScreen` supplies the default raster screen image. A user-supplied key named by `screenMediaKey` (default `screen-recording`) takes priority and may hold a local screenshot or recording. Keep the left-hand checkbox timing editable; align task `at` values to actual user recordings instead of implying that a still image contains a real timed interaction.

Follow [the image policy](references/image-policy.md) before adapting visual content. Photos, covers, document imagery and chat avatars use actual raster assets. Without user references, reuse the generated defaults in [the slot map](references/default-image-slots.md); do not ask for every image. User-specified images replace the corresponding slots first. Keep typography, vector diagrams, masks and movement editable in HyperFrames. New image subjects require the available image-generation tool (image2 when exposed), with actual provider/model provenance; no silent HTML substitute. Required presenter video and aligned alpha mattes remain separate inputs.
