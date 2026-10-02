# Installed Edge panel verification, 2 October 2026

Native Edge testing independently opened CareUnfold's installed side panel, switched to Maps and selected up to 100 newest reviews. The panel reported a disconnected session while Enable remained available; clicking Enable produced no permission prompt or startup transition. The component returned early when its port was null. A React DOM regression with mocked extension APIs reproduced the silent failure before the fix.

Version 0.2.3 reconnects on an explicit Enable action using the existing message handlers. Stop, panel unmount and disconnect invalidate pending startup so later permission/query completion cannot start collection. The regression exercises reconnect, Stop during pending permission and unmount during pending tab lookup. All 23 tests and TypeScript pass. These are runnable component/API-mock checks; the updated installed extension still requires reload and a live collection test. The observed idle disconnect's underlying browser cause has not been established. No authenticity or clinical accuracy is claimed.

The existing research/verification.md contains invalid UTF-8 bytes. This supplemental record preserves that file pending separate encoding cleanup.

## Installed 0.2.3 retest

The user reloaded the extension and granted its requested Google site access. Native Edge observation confirmed installed version 0.2.3; Enable reached the permission prompt even after an idle disconnect. The panel subsequently showed a batch of 11 loaded listings. Eight completed rows were observed with zero captured ratings, unknown sort and unavailable/unsupported results. The batch was still labelled loading at that observation; completion for every listing is not established.

Separate public Edge probes found full-review cards on Ram Kishori Clinic and on the Pradeep Prakash listing. Sorting on the first page and review-tab/sort actions on the second produced Maps' visible `Unavailable` notice. The second page explicitly said it was a limited view. Its `See more` recovery control opened a visible sign-in dialog stating that review/photo access includes reading and searching through every review. This supports testing a signed-in session next; it does not establish that sign-in fixes collection, that all failed listings have the same cause, or that the parser is correct on every captured layout.

No authentication was automated, no access restriction was bypassed and no raw patient reviews were saved or committed. Signed-in collection, background timing, complete review coverage, adjusted-rating accuracy and clinical decision usefulness remain unverified.

## Signed-in collection and traversal regression

After the user signed in, a native installed 0.2.3 batch collected real ratings with newest sorting confirmed. An initial Piyush Varshney sample contained 10 of 968 Google-listed ratings, averaging 4.60. A later run contained 20 ratings averaging 4.80, then stalled. These changing partial samples must not be described as the doctor's true rating or as evidence of fabrication.

The later 11-listing batch visibly completed 100-rating samples for Mayank Gupta (313 listed; sample and adjusted 4.80), Shailendra Kumar Goel (249 listed; sample 4.68, adjusted 4.72; one exact-text group containing two entries) and Rahul Gupta (243 listed; sample and adjusted 4.76). Native screenshots verified the displayed values and limit outcomes. No review-text files were exported. Completion of all 11 listings was not observed at this checkpoint.

One temporary review tab was attached to the browser diagnostic tool for read-only geometry observations during Mayank Gupta's collection. That tab reported visible document state despite being an inactive native tab; diagnostic attachment may affect background scheduling. Its 100-rating result cannot establish performance in an unattached background tab. The Shailendra and Rahul results were observed in the native panel without attaching to their review pages. An independent Pradeep Prakash page loaded 20 cards after scrolling from an initial ten, showing that ten is not a universal page limit.

A deterministic synthetic regression separately reproduced early termination while traversing long loaded reviews: a 200-pixel viewport needed 20 advances to reach the next pagination boundary, but the old 10-second review-only progress timer stopped it before reaching that boundary. This is a proven defect, not an established explanation for every observed live stall. Version 0.2.4 counts actual forward scrolling as progress; it retains the 90-second collection deadline and still stops after no progress at the list's end. Both reaching the next page and stopping at a non-advancing end are regression checked. TypeScript, all 25 tests and production ZIP build pass. Installed 0.2.4 live retest remains pending.

Complete coverage, unattended background reliability, authenticity detection, integrity attribution, rating accuracy and medical decision usefulness remain unverified. The user requested integrity penalties but chose to discuss the evidence threshold; no new scoring rule has been approved or implemented.
