# Motion specification

## Relationship

visible task list + screen media → timed checks → completed state

## Must retain

- Persistent checklist.
- Action-time checkbox changes.
- Phone media and optional presenter.

## Distinctness

Rows already exist; state updates are tied to demonstrated actions and cannot be replaced by arbitrary entrance staggering.

## Authored direction and timing

The list is now a compact paper note beside a more physical phone frame, with plain square boxes and stroke-drawn checks. Supplied screen video still replaces the neutral example. Check timing remains driven by the actual task at values; no fabricated screen metrics are introduced.

All layout is settled from the start. Each check stroke lasts 0.20 s at its supplied action timestamp, with the corresponding example-screen state changing on the same beat.

Use HyperFrames only. Keep the Google font assets local and preserve the static fine grid in dark styles. A quiet final reading hold is intentional; do not add arbitrary ambient movement. Review real rendered frames around the principal change, not only the poster.

## Verification

Use the deterministic HyperFrames timeline at 1920×1080 and 30 fps. Keep identical content and movement across all four palettes. Verify full-frame entry, every edit or relationship change, and the final reading hold in rendered frames. Check actual text bounds, readable contrast, connector endpoints and media alignment. Intentional camera clipping or foreground occlusion is limited to the named layers; it does not excuse unreadable labels. Use bundled generated imagery or the user's supplied replacements for image content, and editable geometry for diagrams; do not fabricate metrics or source evidence.

## Image material contract

`mobileScreen` supplies the default raster screen image. A user-supplied key named by `screenMediaKey` (default `screen-recording`) takes priority and may hold a local screenshot or recording. Keep the left-hand checkbox timing editable; align task `at` values to actual user recordings instead of implying that a still image contains a real timed interaction.

Use the raster defaults in `default-image-slots.md` when no image reference is supplied. User replacements through `--images` override only their named slots. Preserve the reference's image-rich material: photos, avatars, covers, document imagery and content thumbnails must not become HTML drawings or placeholder text lines. Text labels, real charts, controls and motion remain editable. Generated default imagery is illustrative, not factual evidence. See `image-policy.md` for generation, provenance and replacement details.
