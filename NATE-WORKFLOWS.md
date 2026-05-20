Each is concrete: the first prompt, what the agent produced, what was good and what missed, the follow-up prompts, what was kept versus thrown out, and what they would prompt differently. "I prompted X, got Y, kept Z because…" — not a vague paragraph.

---

# Workflow: Movie API UI

**First prompt:** "make a ui for this api"

**What the agent produced:** A movie API wrapper UI that essentially mimicked the api-docs — a form per endpoint (search, etc.) with inputs mapped to the API parameters and a response panel. No opinionated layout, just a 1:1 reflection of the spec.

**What was good:** The search form worked end-to-end against the API and was simple/clean. Easy to read and easy to extend.

**What missed:** It wasn't actually a UI — it was a thin docs mirror. No real user-facing feature, no purpose beyond "click each endpoint." Nothing the end user would actually want to use.

**Follow-up prompt:** "bug reporter"

**What the agent produced:** A bug reporter UI on top of the existing scaffolding. The search/api forms from the first pass were still rendered alongside it.

**Kept vs. thrown out:**

- **Kept** the leftover search/api form because it was simple enough that it didn't get in the way, and I figured it could be repurposed later — cheaper to leave than to re-prompt for a deletion.
- **Kept** the unused status dots that showed up across multiple prompts. Tempted to remove them, but they weren't critical and pulling on that thread risked breaking layout for no real gain.
- **Thrown out:** nothing explicitly — I leaned toward keeping low-cost leftovers rather than aggressively pruning.

**What I would prompt differently next time:**

- Lead with the actual feature ("build a bug reporter UI for this API"), not "make a ui for this api" — the first prompt was too generic and got me a docs mirror instead of a product.
- Explicitly say "remove anything not used by the bug reporter flow" in the follow-up, so leftovers like the search form and status dots don't accumulate.
- Ask for the component inventory up front so I know what's actually wired vs. dead before I decide what to keep.
