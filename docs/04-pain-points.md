# 04 — Pain Points

## Specific failures of the current alternatives

### "Build it yourself with a framework"
- LangChain, LlamaIndex, or a custom agent loop. The buyer ends up owning prompt sprawl, eval harnesses, and a quarterly maintenance bill they never planned for.
- **Root cause.** Nobody scoped the agent as a product with a price tag and an SLO; it was scoped as a project.

### "Use a generic agent marketplace (agent.ai, Replit Agents, Lovable)"
- Hundreds of cards, none of them with named-customer outcomes. The cards are usually just prompt wrappers around the same three model APIs.
- **Root cause.** Marketplaces optimize for breadth, not provenance. The buyer cannot tell which cards have ever been deployed in production.

### "Hire a one-off dev shop or fractional"
- The shop ships a custom agent in 8 weeks for $40k. It works for the first month, then drift starts. Nobody owns retraining.
- **Root cause.** No standing operator on the agent. No provenance record to point a successor to.

### "Big-co AI suite (Salesforce Agentforce, ServiceNow Now Assist)"
- Long sales cycles, large floors, contract-bound to one platform. The buyer can only afford it if they have already standardized on the suite.
- **Root cause.** Pricing and contract motion are designed for enterprise, not for an operator at $7M ARR.

### "Use ChatGPT/Claude with custom instructions"
- A single human pasting prompts. Works once; doesn't scale beyond the human.
- **Root cause.** No agent runtime, no eval, no provenance.

## What the buyer is actually paying for

When they buy from us, they are buying:
1. **StampedAgents.** A named record of who trained the agent, what it has shipped, when it was last audited.
2. **A price tag.** Not a quote, not "contact us." A number on the page.
3. **An SLO.** A retrain cadence and an outcome target written into the tier.
4. **An owner.** A real human who runs the agent for the cohort, not a model API.

That set is the wedge. Nobody else lists all four on a public page.
