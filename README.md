# EQLabs.ai

The official website for EQLabs.ai — The Equator Intelligence Lab.

## About

EQLabs.ai is an AI research lab developing deterministic frameworks to evaluate and improve reasoning in large language models. We operate at the intersection of AI reasoning, evaluation, and alignment.

## Features

- Modern, responsive design built with Tailwind CSS
- Smooth scroll navigation
- Featured research: EQUATOR Evaluator paper
- Embedded video explainer
- Reasoning benchmark details
- Investor and contact information

## Research

Our paper, [EQUATOR Evaluator](https://arxiv.org/abs/2501.00257), formalizes a deterministic approach to judge open-ended reasoning beyond surface fluency.

Key features:
- Deterministic scoring beyond surface fluency
- Human-validated reference sets & semantic matching
- Cost-efficient local evaluators (small LLMs)

## Collaborations

- Columbia University
- Vector Institute

## Deployment

This site can be deployed on GitHub Pages or any static host.

### Custom Domain

To use a custom domain:

1. Add a `CNAME` file at the repo root containing your domain (already added: `eqlabs.ai`).
2. In your DNS provider, create these records:
   - A @ → 185.199.108.153
   - A @ → 185.199.109.153
   - A @ → 185.199.110.153
   - A @ → 185.199.111.153
   - CNAME www → `<your-username>.github.io` (or apex → `ALIAS/ANAME` to the same, if supported)
3. In the repository settings → Pages, set the custom domain to `eqlabs.ai` and enable Enforce HTTPS.

Propagation can take up to 24 hours.

## Local Development

Simply open `index.html` in a web browser. The site uses CDN-hosted Tailwind CSS, so no build process is required.

## Contact

- Email: info@eqlabs.ai
- Investors: invest@eqlabs.ai
- Paper: [EQUATOR Evaluator (arXiv)](https://arxiv.org/abs/2501.00257)

## License

Copyright © 2025 EQLabs.ai — The Equator Intelligence Lab

