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

This site is deployed on GitHub Pages at: https://raymondbernard.github.io/EQLabs.ai/

### Custom Domain Setup

To use the custom domain `eqlabs.ai`:

1. Add a `CNAME` file with your domain
2. Configure DNS records at your domain registrar:
   - Add an A record pointing to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Or add a CNAME record for `www` pointing to `raymondbernard.github.io`
3. Enable HTTPS in repository settings → Pages

## Local Development

Simply open `index.html` in a web browser. The site uses CDN-hosted Tailwind CSS, so no build process is required.

## Contact

- Email: info@eqlabs.ai
- Investors: invest@eqlabs.ai
- Paper: [EQUATOR Evaluator (arXiv)](https://arxiv.org/abs/2501.00257)

## License

Copyright © 2025 EQLabs.ai — The Equator Intelligence Lab

