# Compendium Pack Workflow

Compendium content is authored as YAML under `pack-source/<pack-name>/`, one file per document (organized into real subfolders matching each compendium's in-Foundry folder structure). The compiled binary packs Foundry actually reads (`packs/<pack-name>/`) are build output only - **gitignored, never committed**. This keeps compendium edits diffable and reviewable in git instead of being opaque binary blobs.

## After a fresh clone

`packs/` doesn't exist yet. Run once before opening the module in Foundry:

```bash
scripts/pack-all.sh
```

## Editing compendium content

1. Edit the YAML files under `pack-source/<pack-name>/`.
2. Run `scripts/pack-all.sh` to rebuild `packs/`.
3. Reload the world in Foundry to see your changes.
4. Commit the YAML diff under `pack-source/` - never commit anything under `packs/` (it's gitignored).

## If you edited content live in Foundry instead

Run `scripts/unpack-all.sh` to re-sync `pack-source/` from the compiled packs, then review `git diff pack-source/` before committing (the unpack step uses `--omitVolatile`, so pure timestamp churn doesn't show up as noise - only real content changes will).

## The one gotcha that matters

`pack-source/` uses `--folders` on unpack, which nests documents into real subdirectories. Packing them back **requires `--recursive`**, or every foldered document gets silently deleted from the compiled pack instead of just skipped. Both scripts already do this correctly - don't invoke `fvtt package pack` manually without `--recursive` if a pack has any folders.

## Publishing a work-in-progress pack

Some pack folders exist under `pack-source/` but are intentionally **not** declared in `module.json`'s `packs` array yet (currently: `actors`, `tarot-draconique`) - they're WIP content, unpacked and committed for diffable editing, but never loaded by Foundry and never shipped in a release (the CI release workflow only builds packs listed in `module.json`). To publish one, add its declaration to `module.json`'s `packs` array - no other change is needed, the next tagged release will pick it up automatically.

## CI

`.github/workflows/release.yml` runs the same pack-build step (scoped to `module.json`'s declared packs) before zipping every tagged release, so the repository itself never needs to store compiled binaries.
