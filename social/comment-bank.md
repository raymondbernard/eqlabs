## High-signal comment bank (copy/paste, customize in 15–30 seconds)

Principles: add net-new insight; ask one specific question; avoid links unless invited; be human.

Evaluation/benchmarks
- "Curious how you score beyond ROUGE/BLEU. We’ve had better signal using binary checks: Correctness, Completeness, Groundedness. What’s your gating criterion before you ship?"
- "Have you tried logging per‑criterion outcomes per prompt version? It surfaces regressions instantly without eyeballing long outputs."

Hallucinations/groundedness
- "Hallucinations often drop when you enforce a groundedness gate (no unsupported claims). Do you track groundedness% per dataset slice?"
- "We’ve seen smaller LLMs beat larger ones on grounded answers when prompts are audited. What’s your best small‑model setup?"

Agents/tool use
- "For agent steps, do you require a pass on completeness before tool execution? A simple binary gate cuts dead‑end branches."
- "If you had to add one binary check to your agent today, which would move your MTTR most?"

MLOps/process
- "How reproducible are your eval runs week to week? Dataset versioning + flags per trial has helped us debug drift faster."
- "What’s your policy/safety criterion before greenlighting a response in regulated flows?"

Founders/investors
- "As an investor, where do you see defensibility in evaluation—data, schema, or infra? What evidence would you want pre‑seed?"
- "If a startup showed you a ‘failure taxonomy’ with blind studies, does that change your conviction vs leaderboard screenshots?"

Invitations (no hard sell)
- "We’re hosting a small FB group on deterministic AI evaluation (binary criteria, blind studies). Want an invite?"
- "We’re running an AMA next week on benchmarking open‑ended reasoning—happy to add you to the thread."

Disagreeing respectfully
- "I read it differently: multiple‑choice proxies miss open‑ended reasoning. A binary, groundedness‑first check caught issues we’d missed. Interested in a counterexample?"


