# Rating validation gate

The final goal is useful, accurate doctor selection on Google Maps and/or Practo. The existing sample adjustment does not prove that goal. This document records the evidence needed before promoting it to an estimated real-world rating.

## What the current input can establish

The parser and tests establish correct arithmetic for the declared sample and rule. They cannot establish which experiences occurred, why language matches, whether patients were pressured to post, who did not post, or whether treatment was appropriate.

Consider six identical five-star texts and one distinct one-star text. The original mean is 31/7; the duplicate-adjusted mean is 3. Those same observations could come from six satisfied patients using a template, or from fabricated praise plus one genuine dissatisfied patient. In the first case, combining loses six independent experiences; in the second, keeping one praise vote still includes fabricated evidence. The observable text does not decide which case occurred. This is a mathematical counterexample, not a claim about a real provider.

Even confirmed genuine feedback describes respondents, whose experience may differ from patients who did not respond. A visit-verification badge establishes only what its issuer actually checked; it does not prove independence, satisfaction, truthfulness, treatment success or representativeness.

## Required target and evidence

### Approved target, 2 October 2026

The user approved **patient experience with the individual doctor**, covering communication, time and follow-up, while keeping clinical quality separate. This resolves the intended subject of validation, not its measurement or evidence source. Registration is credential evidence; independently substantiated fabricated reviews are integrity evidence. Neither is a patient-experience response or a clinical-outcome measure.

Before collecting or calculating an estimate, specify the eligible population, consultation period, exact experience questions and handling of unavailable follow-up. A patient who has not needed follow-up must not receive an invented follow-up score. Keep the three dimensions separate until their measurement and combination are agreed and evaluated; no weighting formula is approved yet. Google stars and Practo recommendation percentages remain comparators, not interchangeable reference answers.

For each future reference release, require individual-doctor identity resolution, recruitment/invitation/completion counts, collection period, evidence provenance, applicable consent and reuse permission. Hold out doctors and periods before evaluating any candidate. Report sample selection and nonresponse alongside dimension errors and ranking uncertainty. No patient recruitment, uploaded evidence, new data retention or verification badge is authorized by this specification.

1. **Define the target.** Keep platforms' native metrics separate: Google stars and Practo recommendation responses express different questions. Specify whose experience, which period and which clinical context an estimate covers. Doctor-level clinical outcomes are a separate target.
2. **Establish access and coverage.** Obtain a supported, permitted route with source, sorting, missingness, filtering and total/denominator semantics recorded. A selected handful of displayed reviews is insufficient for a listing-wide corrected claim.
3. **Obtain independent reference evidence.** Use a consented, representative patient-experience sample with a documented recruitment frame and response rate. Record the evidence behind any manipulation labels independently of the features a detector sees. Appointment proof alone is insufficient for either target.
4. **Evaluate the actual decision.** Compare native ratings, the unchanged-sample baseline and candidate adjustments against the declared reference target. Hold out entire doctors and collection periods; assess error, uncertainty calibration, language/translation differences and whether rankings improve. Test legitimate templates and coordinated negative reviews as well as positive manipulation.
5. **Control claims at release.** Display target, source, coverage, uncertainty and unresolved evidence alongside each result. If evidence cannot distinguish providers, say so. An adjustment that is numerically different is not automatically more correct.

No numerical accuracy threshold or recruitment count is set here: those require a defined target, acceptable error and feasible collection design. This gate is not a substitute for acquiring or evaluating the evidence. The current duplicate rule remains a sensitivity scenario until it passes that work.
