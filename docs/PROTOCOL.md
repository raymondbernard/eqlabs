# EQUATOR Benchmark Protocol (v1)

## Principles
- Blind adjudication: evaluators do not know model identity
- Binary criteria: correctness, completeness, groundedness, units/format (if applicable), safety
- Reproducibility: fixed seeds, manifest-locked datasets, hashable configs

## Dataset & Sampling
- Source: real-world, short problems LLMs often miss; no synthetic MCQs
- Manifest `manifest.json`: version, domains, sampling weights, splits
- Stratified sampling across domains (math/tool-use/retrieval/safety) and difficulty tiers
- Target size: ≥1,500 prompts (expanding); per-model n ≥ 400 for ±5% CI (Wilson)

## Generation Settings
- Deterministic seed schedule per prompt (seed list, retries ≤ 2 with backoff)
- Temperature/top-p fixed per task family; tool availability declared in advance
- Full prompt templates versioned; no manual edits after freeze

## Adjudication
- Stage 1: small local LLM judge with rubric prompts per criterion (binary)
- Stage 2: human tie-break on flagged cases (disagreements, low confidence)
- Evidence logging: references/quotes required for groundedness claims

## Scoring & Stats
- Per-criterion binary outcomes, plus overall pass if all required criteria pass
- Report per-domain rates with 95% Wilson intervals
- Multiple comparisons: Holm correction for pairwise deltas
- Report effect sizes and failure taxonomy counts

## Pre-registration
- Publicly post: tasks, metrics, seeds, analysis plan, exclusion rules
- Freeze dataset+configs; publish SHA256 of manifests and code bundle

## Outputs
- Summary report (HTML/PDF), raw per-trial logs (redacted), config bundle
- Reproduction guide and CLI to re-run on new models

## Ethics & Safety
- Remove harmful content; apply safety criterion; document exclusions

## Change Log
- v1.0 — initial public protocol
