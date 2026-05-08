# apps/app — Provenance dashboard (stub)

This directory is reserved for the Open-SaaS-derived dashboard that delivers post-purchase value: digests, eval logs, agent owner contact, retraining slot booking.

For Wave 2, the v1 ships only the landing + the NOWPayments hosted invoice flow under `/apps/landing/`. The dashboard is a follow-up wave.

When this is filled in:
- Fork `wasp-lang/open-saas` into this folder, keeping its Wasp project intact.
- Wire `landing` checkout success URL to `apps/app/` post-payment onboarding.
- Surface per-agent eval logs and retraining slot booking.

Until then, this README is the only file here besides `.gitkeep`.
