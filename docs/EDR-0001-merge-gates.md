# EDR-0001: Human-reviewed merge gates

Status: proposed.

Represent checks, scores, and provenance as separate evidence. A failing provenance check prevents the merge even if other checks pass. Do not automate a merge into the main branch from this dashboard. The sample blocked PR in the UI illustrates that boundary.