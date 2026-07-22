# Case Generation Template

This document contains the prompt template and quality checklist used to generate new cases for the rotation buffer.

---

## LLM Prompt Template

Use the following prompt verbatim. Adjust the THEME variable only.

```
Write a deduction puzzle case following these strict rules:

THEME: [pick one: theft, deception, alibi, murder]

OUTPUT FORMAT: valid JSON only, no commentary, matching this exact schema:

{
  "id": "case-XXX",
  "title": "Short, evocative case name",
  "intro": "Two to three sentences setting the scene. State what happened and when. Do not reveal the culprit.",
  "suspects": [
    { "name": "Full Name", "description": "One sentence. A fact about their role or motive." },
    { "name": "Full Name", "description": "One sentence. A fact about their role or motive." },
    { "name": "Full Name", "description": "One sentence. A fact about their role or motive." }
  ],
  "clues": [
    "Clue 1. A specific, verifiable fact.",
    "Clue 2. A specific, verifiable fact.",
    "Clue 3. A specific, verifiable fact.",
    "Clue 4. A specific, verifiable fact."
  ],
  "solution": "Exact name of the culprit, matching one suspect name exactly",
  "explanation": "Two to three sentences explaining why the clues point to the culprit and eliminate the others.",
  "hint": "One sentence pointing toward a productive line of reasoning without naming the culprit.",
  "difficulty": "easy",
  "category": "[theme]"
}

RULES (follow all of them):
1. The clues must be logically sufficient to eliminate all suspects except one. A reader who works through each clue carefully must arrive at the same answer.
2. Do not use lateral thinking, trick wording, or riddle-style reasoning. Clues are facts, not puzzles within puzzles.
3. The scenario must be solvable by a careful reader in under two minutes.
4. No clue should be ambiguous. Every clue has a clear, singular implication.
5. Suspects must be 3 to 4 people. Clues must be 3 to 4 items.
6. The solution must be the ONLY suspect logically supported by the full set of clues combined.
7. Names must sound realistic. Avoid clichés like "Dr. Evil" or placeholder names.
8. Keep the tone grounded and serious. No humor.
9. The explanation must reference specific clues, not just restate the conclusion.
10. Do not use em dashes. Use commas or restructure the sentence instead.
```

---

## Quality Check Rubric

Run every generated case through this checklist before marking it ready to publish.

### Logic
- [ ] The culprit is the only suspect that all clues together support
- [ ] Each non-culprit suspect is eliminated by at least one specific clue
- [ ] No clue is redundant (each one does work in the elimination chain)
- [ ] The explanation references at least two distinct clues, not just a conclusion

### Clarity
- [ ] Every clue states a concrete fact, not an inference or opinion
- [ ] No clue requires outside knowledge to interpret
- [ ] The intro does not accidentally hint at the solution
- [ ] The hint points toward a reasoning direction without naming the answer

### Format
- [ ] The solution field exactly matches one of the suspect names (including capitalization)
- [ ] All four fields (intro, suspects, clues, explanation) are present and non-empty
- [ ] No em dashes anywhere in the text
- [ ] The case can be read start to finish in under 30 seconds

### Time check
- [ ] Manually solve the case yourself. If it takes you more than 90 seconds on a fresh read, the case is too hard or too ambiguous. Rewrite or discard.

---

## Buffer Management

- Target: 2 to 4 weeks of reviewed, unpublished cases in the buffer at all times
- Generate in batches of 5 to 10 at a time
- After generation, run through the quality checklist before adding to `cases.json`
- Assign `published_at` dates in sequence, starting from the last scheduled date in `schedule`

## Adding a New Case to the Schedule

1. Add the case object to the `cases` array in `data/cases.json`
2. Add the date-to-id mapping in `schedule`
3. Make sure the `id` field is unique and follows the `case-NNN` format

```json
"schedule": {
  "2026-08-01": "case-004",
  "2026-08-02": "case-005"
}
```
