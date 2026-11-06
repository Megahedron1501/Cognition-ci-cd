# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cognition is a suite of digital tools for ABA (Applied Behavior Analysis) therapy sessions — a token board, discrimination/DTT-style games, an emotion matcher, a visual schedule builder, and a choice board. It's a Create React App (react-scripts 5.0.1) TypeScript project, currently front-end only with no backend, no persistence, and no routing library.

The project exists because the author (a practicing RBT) found existing tools like Boom Cards clinically shallow. The differentiator is genuine ABA fidelity — reinforcement schedules, prompting hierarchies, trial-by-trial data, BCBA-usable output — not just gamified UI. When evaluating or proposing features, weigh clinical accuracy over visual polish; the current UI is intentionally rough/unstyled at this stage.

### Who this is for: a dual-depth model, not two products

Cognition is meant to serve two audiences at once rather than pick one: RBTs/BCBAs running real clinical sessions, and any parent/caregiver raising a child who just wants to hand over a tool (e.g. a sorting game) with zero setup and no clinical background. These are not separate products or separate modes to build — every tool should have a **low floor** (usable immediately with no configuration and no clinical knowledge required) and a **high ceiling** (real ABA depth - configurable reinforcement schedules, prompting hierarchies, trial-by-trial data collection - available to whoever wants to go looking for it).

`TokenBoard` is the working example of this: a parent can just click "Add Token" with zero setup and it behaves like a simple visual tracker. A clinician can open the same tool's `⚙️ Settings` panel and configure a real VR/FI/VI reinforcement schedule. Same code, same tool, two depths of use depending on who's holding it. Keep building this way - the base experience must never require clinical setup to be useful, but clinical depth should always be reachable for someone who wants to open the hood. Don't build a separate "simple mode" and "clinical mode" - build one tool that's simple by default and deep on demand.

### Long-term vision (aspirational, not current scope)

The natural endpoint of "real ABA fidelity" is a self-contained session-management tool: load it up to run a session and it has the DTT tools, trial-by-trial data collection, prompting hierarchy tracking, configurable reinforcement schedules, student profiles, and BCBA-ready reporting all in one place. This is a real end goal, but it emerged from planning discussion rather than being part of the original design — it was not part of the author's original scope and is a large, likely multi-person undertaking, not something to pursue in a single leap. The author is a solo builder with an IT (not clinical-software) background. Treat this vision as the direction to grow toward incrementally (see roadmap phases discussed in project history), not a spec to implement wholesale — don't let a single feature request balloon into building toward this end-to-end without the author explicitly asking for that scope.

**Hard constraint on how "customizable" gets built:** the end users configuring a treatment plan (BCBA/clinician) are non-technical and will never touch this repo, git, or npm. So any "make X configurable" work must land as a settings UI inside the running app itself — never a code change, config file, or environment variable. Hosting this on AWS (see Infrastructure section) is what makes that possible: the clinician gets a URL, not a `git clone`. When building configurability, prefer proving the pattern on one tool first rather than designing one universal config system upfront for every tool at once.

**First live instance of this pattern:** `TokenBoard` has an in-app `⚙️ Settings` panel (token goal + reinforcement schedule type/params), backed by the shared schedule model in `src/types/reinforcementSchedule.ts` (`ReinforcementSchedule` discriminated union: FR/VR/FI/VI, each with only the fields it needs; variable schedules cycle through an explicit value list via a shuffled-bag generator so the true average holds per cycle, rather than approximating it with random draws). `TokenBoard` also now distinguishes two previously-conflated concepts: the **reinforcement schedule** (when a token is delivered, via the new "Record Response" button) vs. the **exchange threshold** (`totalTokens` - how many tokens fill the board before trading for a backup reinforcer, via the existing "Add Token" manual-override button). Extend this same settings-panel pattern to other tools rather than inventing a new one.

## Commands

```
npm install       # install dependencies (fresh clone has no node_modules)
npm start         # dev server at http://localhost:3000, hot reload
npm run build     # production build to build/
npm test          # runs react-scripts test (Jest) in watch mode
```

Run a single test file: `npm test -- App.test.tsx` (still launches Jest's interactive watch mode; add `--watchAll=false` for a single non-watch run).

There is no lint script defined in `package.json`; linting comes from `eslintConfig` (`react-app`, `react-app/jest`) via `react-scripts`, which runs automatically during `npm start`/`npm run build`.

Note: `src/App.test.tsx` is still the default CRA boilerplate test (`getByText(/learn react/i)`) and will fail against the current `App.tsx` — it hasn't been updated to match the real app.

## CI

`.github/workflows/ci-cd.yml` runs on every branch push/PR: `npm ci` + `npm run build`, uploads `build/` as an artifact. It does not run `npm test`. Node 18 is pinned in CI via `actions/setup-node`, though local dev here uses Node 24 — keep that version gap in mind if a dependency behaves differently between CI and local.

## Infrastructure (AWS, IaC)

Hosting is intended to run on AWS, deployed via **AWS CDK (TypeScript)** in `infra/` — see [infra/README.md](infra/README.md) for commands. Current scope is deliberately narrow: an S3 bucket + CloudFront distribution serving the static `build/` output, matching the fact that this app has no backend today. Don't add ECS/Fargate or other compute — there is nothing to containerize until a real backend exists.

The target AWS account is an **ephemeral sandbox that resets periodically**, which is the reason everything here is IaC rather than console clicks: any change made manually in the AWS Console is lost on the next reset and cannot be reproduced. The stack is written to be fully disposable (`RemovalPolicy.DESTROY`, `autoDeleteObjects: true`) so `cdk deploy` / `cdk destroy` can run repeatedly from a blank account without leftover state or naming conflicts.

When the Phase 0 persistence work (see long-term vision above) eventually needs a real backend, the natural next step is serverless (Lambda + API Gateway + DynamoDB) rather than containers — it fits the same "must be trivially reproducible from code" constraint the sandbox imposes.

## Architecture

**Single-page, state-driven view switch, no router.** `src/App.tsx` holds one `currentView` union-type state value (`'tokenBoard' | 'shapeGame' | 'emotionGame' | 'scheduleBuilder' | 'sortByCategories' | 'choiceBoard' | 'behaviorTracker'`) and conditionally renders one top-level component per view. Switching views unmounts the previous tool and loses its state — the one exception is `BehaviorTracker`, which stays mounted and is only hidden with `display: none`, because behavior data runs all session alongside the other tools. Nav buttons in `App.tsx` just call `setCurrentView(...)`. There's also a `hasLaunched` boolean gate in front of everything that shows `LaunchScreen` until the user clicks through.

**Each tool is a self-contained component,** paired with its own co-located `.css` file, and holds its own local state via `useState` — there is no shared/global state (no Context, no Redux/Zustand). Cross-tool communication happens only through props/callbacks passed down from `App.tsx` (e.g. `TokenBoard`'s `onAllTokensEarned` callback drives `App.tsx` to switch `currentView` to `'choiceBoard'` once all tokens are earned — this is the one place today where completing one tool auto-navigates to another).

Component locations:
- `src/components/LaunchScreen/`, `src/components/ChoiceBoard/`, `src/components/TokenBoard/`, `src/components/VisualSchedule/` — non-game tools
- `src/games/` — `ShapeSorterGame`, `EmotionMatcherGame`, `SortByCategories` (flat files, not one-per-folder like `components/`)

**Sound playback** is done ad hoc with `new Audio('/sounds/coin.mp3')` inline at the call site (see `TokenBoard.tsx`), not through a shared audio utility — if adding sound elsewhere, either follow this pattern or factor out a shared helper, but don't assume one currently exists.

**No persistence layer**: nothing is saved across reloads/sessions yet (no localStorage, no API calls, no backend). Any feature requiring saved state (student profiles, cross-session progress, BCBA data export) needs this built from scratch.

**Client names/PII**: `TokenBoard` takes a `clientName` prop; treat any real client-identifying data as sensitive — the running app currently passes a placeholder (`"REDACTED"`) from `App.tsx` rather than a real name.
