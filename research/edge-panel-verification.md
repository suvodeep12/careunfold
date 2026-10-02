# Installed Edge panel verification, 2 October 2026

Native Edge testing independently opened CareUnfold's installed side panel, switched to Maps and selected up to 100 newest reviews. The panel reported a disconnected session while Enable remained available; clicking Enable produced no permission prompt or startup transition. The component returned early when its port was null. A React DOM regression with mocked extension APIs reproduced the silent failure before the fix.

Version 0.2.3 reconnects on an explicit Enable action using the existing message handlers. Stop, panel unmount and disconnect invalidate pending startup so later permission/query completion cannot start collection. The regression exercises reconnect, Stop during pending permission and unmount during pending tab lookup. All 23 tests and TypeScript pass. These are runnable component/API-mock checks; the updated installed extension still requires reload and a live collection test. The observed idle disconnect's underlying browser cause has not been established. No authenticity or clinical accuracy is claimed.

The existing research/verification.md contains invalid UTF-8 bytes. This supplemental record preserves that file pending separate encoding cleanup.

## Installed 0.2.3 retest

The user reloaded the extension and granted its requested Google site access. Native Edge observation confirmed installed version 0.2.3; Enable reached the permission prompt even after an idle disconnect. The panel subsequently showed a batch of 11 loaded listings. Eight completed rows were observed with zero captured ratings, unknown sort and unavailable/unsupported results. The batch was still labelled loading at that observation; completion for every listing is not established.

Separate public Edge probes found full-review cards on Ram Kishori Clinic and on the Pradeep Prakash listing. Sorting on the first page and review-tab/sort actions on the second produced Maps' visible `Unavailable` notice. The second page explicitly said it was a limited view. Its `See more` recovery control opened a visible sign-in dialog stating that review/photo access includes reading and searching through every review. This supports testing a signed-in session next; it does not establish that sign-in fixes collection, that all failed listings have the same cause, or that the parser is correct on every captured layout.

No authentication was automated, no access restriction was bypassed and no raw patient reviews were saved or committed. Signed-in collection, background timing, complete review coverage, adjusted-rating accuracy and clinical decision usefulness remain unverified.
