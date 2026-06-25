# @paxibay/templates

Remotion compositions bundled per template. Driven entirely by a `RenderManifest` prop.

## Templates

| ID | Status | Composition |
|---|---|---|
| `review` | ✅ MVP | `templates/review/Composition.tsx` |
| `app-intro` | TODO | – |
| `product-ad` | TODO | – |
| `report` | TODO | – |
| `news` | TODO | – |
| `tutorial` | TODO | – |

## Local dev

```bash
npm run studio       # open http://localhost:3000 — preview all compositions
npm run render <id>  # render to MP4 from sample manifest
```

## Adding a new template

1. Create `src/templates/<slug>/Composition.tsx` exporting a `React.FC<RenderManifest>`.
2. Create `src/templates/<slug>/sample-manifest.ts` for studio preview.
3. Register in `src/registry.ts` and `src/Root.tsx`.
4. Re-export from `src/index.ts`.

## Shared building blocks (`src/shared/`)

- `SceneFader` — crossfade wrapper (in/out opacity on a sequence).
- More to come: `KenBurnsVideo`, `LessonBadge`, `TextOverlay` per visual style.

## Manifest contract

See `@paxibay/core/types#RenderManifest`. Web app generates this; engine consumes it.
