# Working on CareUnfold

## Read before changing behavior

Read `PRODUCT.md` for approved scope and product claims. For data acquisition, model training, or live Maps integration, read `research/feasibility.md` and the relevant dataset audit first. Read the implementation and its callers before editing.

## Decisions and execution

- Give the user one best recommendation, with the evidence and tradeoff that matter.
- Ask one concise question before coding when intent, scoring, architecture, privacy, or external publication is materially unclear. Continue independent authorized work while awaiting the answer. In an explicitly unattended run, record the reasonable interpretation and proceed with reversible work.
- Keep changes within the request. Surface unrelated defects separately. Prefer native browser APIs and existing dependencies; add a dependency only for a demonstrated need.
- Use current technology deliberately: verify official documentation, compatibility, maintenance and security before adopting or upgrading it. A newer release alone is not a quality argument. Preserve the lockfile and test the resulting build.
- After three failed fixes, stop and identify the doubtful assumption before trying another approach.

## Evidence and ratings

- Keep patient-experience estimates separate from registration, specialty and clinical-outcome evidence. Reviews cannot establish medical competence or guarantee a correct medical decision.
- Show the rating formula, sample coverage, affected entries and uncertainty beside every adjusted result. Call the current duplicate adjustment a sample sensitivity scenario.
- Treat repeated text, sparse reviewer history, posting concentration and writing style as observations with alternative explanations. They are not fraud labels. Preserve missing values as unknown.
- Use representative, independently justified labels and leakage checks before claiming authenticity detection or calibrated performance. Record provenance, licensing, selection bias and evaluation limitations.
- Clearly label synthetic examples; use invented clinics. Claims about real providers require attributable evidence and careful scope.

## Privacy and input boundaries

Keep the approved prototype local: imported reviews stay in memory, with no upload, telemetry or persistence. Validate untrusted input, render it as text and request only necessary extension permissions. Revisit consent, retention and data-source permissions before expanding access. Keep credentials and raw third-party datasets out of Git.

## Interface work

Use exactly one design skill: `impeccable` for this product interface; `design-taste-frontend` only for a separate marketing surface. If unavailable, report that limitation and follow the existing design contract. Preserve keyboard access, visible focus, readable contrast, narrow-panel layout and explicit loading, empty and error states.

## Completion gate

Run the applicable `package.json` checks, tests and production build. Rating or parser changes need a meaningful runnable regression check. Inspect working screens for UI changes. Run `git diff --check`; inspect staged files for secrets, raw datasets and generated output. State separately what was verified in code, browser preview and an installed extension. Report remaining limitations without claiming perfect or untested behavior.

Commit with a concise Conventional Commit subject. Push only to the user-approved destination and visibility; verify the remote commit after pushing.

## Communication

Lead with the result or next action. Number bounded steps when needed, cap lists at five items, and state progress during ongoing work. Use concrete time estimates when known. After changes, say what works and how it was checked. End with one action the user can complete in under two minutes.
