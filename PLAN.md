# Deduction Puzzle — Implementation Plan

## 1. Purpose

A standalone, quick-play deduction game with no visible connection to The Last Question. Each case gives 3-4 suspects and 3-4 clues upfront, with a 2-3 minute timer to pick the culprit. It's built to spread organically on Reddit and similar communities, and to bridge solvers into TLQ once they've already engaged with the core "figure out who did it" fantasy.

## 2. Product Scope (MVP)

- Single case per session: suspects and clues shown together, one timer, one accusation, instant result (correct/incorrect + short explanation of the actual solution)
- 2-3 minute hard timer, visible and running, creates urgency
- No login required to play. Mobile-first layout, playable one-handed
- 20-30 premade cases at launch, rotating on a daily or weekly schedule so there's always a "new one today" to point people at
- Each case includes a short flavor intro (2-3 sentences of scene-setting), the suspects with a one-line description each, the clues, and the timer/accuse UI

## 3. Case Structure and Format

Standardize every case to the same template so both the writing and the generation pipeline stay consistent:

```json
{
  "id": "case-014",
  "title": "The Missing Ledger",
  "intro": "Two sentences setting the scene.",
  "suspects": [
    { "name": "...", "description": "one line" },
    { "name": "...", "description": "one line" },
    { "name": "...", "description": "one line" }
  ],
  "clues": [
    "clue 1",
    "clue 2",
    "clue 3"
  ],
  "solution": "suspect name",
  "explanation": "2-3 sentences on how the clues point to the answer"
}
```

- Clues should be solvable through elimination logic, not lateral or trick-based reasoning. The whole appeal is "I can solve this in 2 minutes," not "this required a riddle brain."
- Keep difficulty roughly consistent across the initial 20-30 cases. Once you have a rotation running and player data, you can start varying difficulty and labeling cases as such (quick/tricky) to add variety.

## 4. Content Pipeline

Hand-writing 20-30 cases gets you launched, but a rotating library that stays fresh indefinitely needs a repeatable process, not one-off writing every time.

- Build a generation template/prompt that produces a full case (intro, suspects, clues, solution, explanation) in the JSON structure above, following strict rules: clues must be logically sufficient to eliminate all but one suspect, no ambiguity in the solution, consistent tone and length
- Every generated case gets a human quality pass before publishing: check the logic actually holds (no case where two suspects are equally supported by the clues), check tone, check it's solvable in the target time
- This overlaps directly with the deduction game content pipeline already scoped for TLQ's Academy section, worth building this as one shared generator that serves both rather than two separate systems
- Target a buffer of at least 2-4 weeks of unpublished, quality-checked cases at all times so the rotation never runs dry

## 5. Reddit Distribution Strategy

This is the primary growth channel, so it needs more care than just posting a link.

- **Target communities**: r/riddles, r/mysteries, r/puzzles, and true-crime-adjacent subs that explicitly allow game/puzzle content. Read each subreddit's self-promo rules before posting, many will remove or shadowban anything that reads as a growth play.
- **Post format**: lay the actual case out as text (or a clean image) directly in the Reddit post, not just a link. People should be able to start engaging in the comments immediately without leaving Reddit. Link to the playable/timed version for people who want the full experience.
- **Cadence**: post consistently but not aggressively, and vary accounts/timing naturally. A pattern that looks like a bot posting the same content across ten subs on the same day gets flagged fast.
- **Community-first posture**: engage genuinely in comments, respond to people's guesses, let the "well actually the killer was X" arguments happen organically. That thread activity is the actual marketing, not the post itself.

## 6. Result Screen and Bridge

- On accusation (correct or wrong), show the outcome, the full explanation of the solution, and a single CTA card: something like "You had 4 clues and 3 minutes. What if you could interrogate the suspect yourself?" linking to TLQ.
- This bridge is stronger than most funnel CTAs because the core loop (suspects, clues, figuring out who's lying) is literally what TLQ does at a deeper level. No need to oversell it, the connection is obvious once stated.
- Below the CTA, show a "next case" button pointing to tomorrow's/this week's case, to encourage return visits independent of the TLQ click.

## 7. Technical Architecture

- **Frontend**: static site, single case view with timer logic client-side, minimal JS needed
- **Backend**: lightweight API to serve the current rotating case (or a specific case by ID for shared links), log attempts/results, and serve the case archive if you want a "browse past cases" page later
- **Database**: cases table (matching the JSON structure above), attempts table (case_id, correct/incorrect, timestamp) for basic analytics, no user accounts needed for MVP
- **Case rotation**: scheduled job that publishes the next case from the buffer on a daily/weekly cadence, simple date-based lookup rather than anything complex
- **Hosting**: same consideration as the IQ test, expect sudden traffic spikes from Reddit posts hitting the front page or a big subreddit, so pick infrastructure that scales without manual intervention

## 8. Build Phases

**Phase 1 — Core game (week 1-2)**
- Case data structure, timer/accusation UI, result screen, mobile polish

**Phase 2 — Content pipeline + initial case bank (week 2-3)**
- Build the generation template, produce and quality-check the first 20-30 cases, set up the rotation buffer

**Phase 3 — Bridge + tracking (week 3)**
- TLQ CTA placement and copy, UTM tracking on the TLQ link, archive/past-cases page if desired

**Phase 4 — Reddit launch (week 4 onward)**
- Start posting into 1-2 subreddits, learn what format/timing performs, then expand cadence and community list based on what's working

## 9. Metrics to Track

- Play rate per Reddit post (upvotes/comments as a proxy, plus actual site visits via UTM)
- Completion rate (started case vs made an accusation before timer ran out)
- Correct vs incorrect accusation rate per case (helps catch cases with ambiguous logic)
- Return rate (players coming back for a new case)
- Click-through rate on the TLQ bridge CTA, and downstream conversion into a TLQ session

## 10. Risks and Notes

- The biggest risk is Reddit mods flagging this as spam/self-promotion. Read and follow each community's rules exactly, and lean into genuine participation over pure posting volume.
- Keep case logic airtight. A case where the "correct" suspect isn't actually the only one supported by the clues will get called out immediately in comments and undercuts the "quick and satisfying" appeal.
- Same branding separation rule as the IQ test: no shared visual identity or obvious link to TLQ beyond the single bridge CTA on the result screen.
