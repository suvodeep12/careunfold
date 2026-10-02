# Prototype verification

## Verified locally

TypeScript check, five rating/parser tests and Chrome MV3 production build passed. ZIP packaging passed again after the final UI fix. The production manifest requests only `sidePanel`.

The production UI preview showed 4.29 adjusted versus 4.58 original for the invented 12-entry example. Switching off adjustment restored 4.58. Supporting wording entries expanded with original vote weights when adjustment was off. Clear sample displayed the import empty state. A synthetic one-review JSON import produced 4.00; Hindi and `<script>alert(1)</script>` rendered literally, with zero script elements inside review entries. A malformed JSON import produced a recovery message and retained the prior sample. Reload restored the demo. No warning/error logs were recorded in this bounded preview session.

Captures at 400px and 320px showed readable panel layouts without horizontal overflow. The design detector returned no findings before the final inline-category fix. Independent finish review initially requested that fix and provenance disclosure; its verdict pass scored both resolved, with the provenance limitation still explicit. This supports the reviewed fixes and captured scopes only.

## Unverified or incomplete

The user supplied a screenshot of CareUnfold 0.1.0 installed and enabled in Chromium, with its real extension side panel showing 4.29 adjusted and 4.58 original. The user subsequently confirmed that unchecking the adjustment changes the main rating to 4.58. This is user-supplied installed-extension evidence; it does not independently verify the toolbar-action path, Edge, imports or every other control in an installed extension.

The browser automation download event timed out; example JSON download completion is not verified. Screen-reader behavior, complete keyboard traversal and physical-device testing are not verified. GitHub's Linux runner passed checks, tests, packaging and artifact upload for commit `ae50baf`; this CI evidence is separate from browser and clinical validation.

The duplicate adjustment is a deterministic sensitivity scenario. There is no evidence yet of rating accuracy against representative independent patient experience, fraud-detection accuracy, clinical-quality prediction or improved doctor-selection outcomes. These remain requirements of the broader active goal.

## Maps comparison implementation, 2 October 2026

TypeScript, 19 tests and the production build pass. Required review depth has no default; the live view requests optional Google site access only on an explicit Enable action. Capture messages are validated at the extension boundary. Synthetic rendered comparisons verify separate Google listing, sample and adjusted values, unknown metadata and unavailable outcomes.

Browser previews at 320 and 400 pixels showed the controls and synthetic waiting/captured/unavailable rows without horizontal overflow. The preview correctly rejects live collection outside an installed extension. These checks do not verify successful real Maps review collection, installed permission prompts, worker lifetime or background-tab behavior. Previous installed evidence above applies only to the earlier demo version.

### Cancellation cleanup regression, 2 October 2026

An asynchronous mock of native tab removal reproduced a race: cancellation could finish the batch while its owned tab was still closing. Cleanup now awaits the same removal promise on both abort and finalization, preserving sequential cleanup before replacement batches. The regression failed before the fix and passes after it; all 20 tests, TypeScript and production build pass. GitHub CI separately passed for the preceding UI commit `65f68e8`.

Current browser inventory exposes only the Codex in-app browser and MCP Apps, not the user’s installed Chromium extension. Successful native Maps collection remains unverified and requires that installed session; synthetic and mocked checks do not substitute for it.
