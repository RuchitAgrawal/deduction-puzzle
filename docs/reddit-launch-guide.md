# Reddit Launch Guide

This document covers the subreddit targets, post formats, engagement approach, and UTM tracking setup for the Reddit distribution strategy.

---

## Target Subreddits

Read each subreddit's rules before posting. Many ban or shadowban posts that read as promotion, even if the content itself is good.

| Subreddit | Audience | Notes |
|---|---|---|
| r/riddles | Puzzle solvers, broad base | High volume, competitive. Post case text directly in the body. |
| r/puzzles | Logic and deduction fans | Closer match to the case format. Engagement tends to be more analytical. |
| r/mysteries | True crime and whodunit readers | Verify whether game/puzzle content is allowed before the first post. |
| r/HowDidIGetHere | Lateral and tricky thinkers | Different format; use only if the case fits their style. |

Check each subreddit's self-promo policy before posting. When in doubt, make a comment-only engagement first to establish presence before posting a case link.

---

## Post Formats

Test these three formats in the first two weeks to see which performs best.

### Format A: Text-only case post

Lay the full case out as formatted text in the post body. Include the flavor intro, suspect list, and clues. End with a link to the timed version on site.

```
Title: Can you solve this in 2 minutes?

[Scene intro]

Suspects:
- Name: one-line description
- Name: one-line description
- Name: one-line description

Evidence:
1. Clue one
2. Clue two
3. Clue three

Post your answer in the comments. I will reveal the solution in 24 hours.
Play the timed version: [link]
```

### Format B: Reveal-in-comments post

Post the case, invite guesses, and reply to every guess with a "right track" or "not quite" (no spoilers). After 24 hours, post the solution as a top-level comment with the full explanation.

This format keeps all engagement on Reddit instead of sending people to the site, which typically performs better in subreddits that deprioritize external links.

### Format C: Image card post

A clean image showing the case (title, suspects, clues in a formatted layout). The image is designed to be readable at glance. The link to the site is in the comments, not the title.

Produces more upvotes than a text wall in visually oriented communities, but requires having the image template ready.

---

## Posting Cadence

- Start with one post per week in one or two subreddits
- Do not post the same case to multiple subreddits within 24 hours
- Vary the posting time; weekday evenings in US Eastern time tend to see higher engagement
- Do not automate posting. Manual posting with genuine engagement in comments is the difference between organic growth and a ban

---

## Comment Engagement Rules

- Respond to every guess in the first two hours after posting
- Do not confirm or deny answers until the 24-hour reveal
- Let debates between commenters happen without moderating them; this is the organic engagement that drives upvotes
- If a commenter finds a flaw in the case logic, acknowledge it. Do not get defensive. Rework the case and note the fix

---

## UTM Tracking by Subreddit

Use distinct UTM campaign values per subreddit so you can measure which community converts best.

| Source | UTM campaign value |
|---|---|
| r/riddles | reddit-riddles |
| r/puzzles | reddit-puzzles |
| r/mysteries | reddit-mysteries |

Base URL format:

```
https://yourdomain.com/?id=case-NNN&utm_source=reddit&utm_medium=post&utm_campaign=reddit-riddles
```

Check the `cta_clicked` events in your analytics logs weekly to see which subreddit drives the most TLQ clickthroughs.

---

## Pre-launch Checklist

- [ ] All target subreddits read and rules noted
- [ ] Two weeks of posts drafted in advance (Format A or B per sub)
- [ ] Image card template designed and tested for readability
- [ ] UTM links generated for each subreddit
- [ ] At least 4 weeks of reviewed cases in the buffer before first post
