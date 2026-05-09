---
phase: 02-trip-photos-notes
plan: 02
subsystem: data
tags: [meta.json, sample-data, bia-trip, media-directory]
dependency_graph:
  requires: [02-01-PLAN.md]
  provides: [data/bia/meta.json, media/bia/]
  affects: [PhotoCarousel, StatsPanel]
tech_stack:
  added: []
  patterns: [per-trip meta.json, trip-id-based directory structure]
key_files:
  created: [data/bia/meta.json, media/bia/]
  modified: []
decisions:
  - data/bia/ uses trip-id naming (not geographic name) as per CLAUDE.md schema
  - media/bia/ directory created empty; photos added by human at checkpoint
metrics:
  duration: ~3m
  completed_date: 2026-05-09
  tasks_completed: 1 of 2 (Task 2 is a human checkpoint — paused)
---

# Phase 2 Plan 02: Sample Trip Data (bia) Summary

**One-liner:** Sample meta.json for Belle-Ile & Brittany with extended notes and two photo stubs, ready for the human to add real JPEG files.

## What Was Built

Task 1 created `data/bia/meta.json` — the first real per-trip metadata file in the project. It exercises all three meta.json schema fields:

- **title** — "Belle-Ile & Brittany" (matches data.js, tests the override code path)
- **notes** — expanded version of the data.js blurb with a unique last sentence ("The western cliffs of Belle-Ile in evening light are the kind of view that stays with you.") — verifiably different from the data.js blurb
- **photos** — two entries (`001-clifftop.jpg`, `002-village.jpg`) referencing files the human will add to `media/bia/`

The `media/bia/` directory was also created (empty) to establish the expected path before the checkpoint.

## Status

Paused at Task 2: `checkpoint:human-verify` (blocking gate).

The human must:
1. Place two JPEG files in `media/bia/`: `001-clifftop.jpg` and `002-village.jpg`
2. Verify in browser that the carousel shows real images and the stats panel shows the extended notes text

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes. Static JSON data file only. Consistent with T-02-04 (accept) and T-02-05 (accept) in the plan's threat register.

## Self-Check: PASSED

- `data/bia/meta.json` exists and is valid JSON (verified with Python json.load)
- All 5 acceptance criteria passed: file exists, JSON valid, notes key present (×1), filename key present (×2), both photo filenames present
- `data/brittany/` untouched
- Commit `20f08b6` exists in git log
