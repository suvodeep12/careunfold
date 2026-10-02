# Practo integration: access and rating feasibility

Checked 2 October 2026. Scope: CareUnfold's desktop extension for choosing doctors in India. This is a bounded technical/product assessment, not a legal conclusion. No accounts, partner applications, review scraping, patient datasets, or access-control workarounds were used.

## Recommendation

**Keep Practo live extraction disabled; pursue a specifically authorized data partnership before building its adapter.** Preserve the local synthetic/import prototype meanwhile. A public booking-partner program exists, but the material reviewed does not establish permission or sufficient data for CareUnfold's adjusted patient-experience analysis. User activation and in-memory processing are useful privacy controls, not evidence of a content license.

## Access, licensing and coverage

Practo's published partner terms describe a credentialed API for searching, booking and managing physical OPD appointments. They define Practo Content to include reviews, but that definition is not an endpoint specification or a promise of complete review access. License use is tied to the agreed services. Sections 2.2 and 3 restrict content copying/modification/derivatives, competing databases or services, and require branding; the document asserts Practo's content/IP rights. These are material constraints for independently adjusting and comparing ratings. An agreed exception or separate license would need to cover the actual workflow. API keys, rate limits and deletion after termination are also contractual considerations. [Practo API Program terms](https://help.practo.com/partner-api/practo-api-program-terms-and-conditions/)

The official help site's Partner API category exposes the terms document. Searches of official Practo domains and that category did not locate public review endpoint documentation, schemas, pagination, history coverage, independent analysis permissions, or a self-service developer enrollment flow. **Documentation was not found; this does not mean no API exists.** The contract references partner-provided documentation and annexures that were not available in this review. [Official Partner API category](https://help.practo.com/category/partner-api/)

The main India website terms URL returned HTTP 403 in the parent investigation. That remains an unresolved evidence gap; USA/UAE terms and older PDFs should not be substituted as confirmed current India website terms. A readable public profile, a user-provided file, or a DOM adapter alone does not resolve authorization to reuse underlying content. No verified open-data license for a Practo review corpus was found.

**Enquiry route:** no dedicated partner-program application/contact was found on the reviewed API/help pages; the terms mention designated support channels without publishing one. The patient feedback help page publishes `support@practo.com` as general support. That is a verified general routing option for asking who handles data/API permission, not a verified API licensing inbox. No enquiry was sent. [Official feedback support contact](https://help.practo.com/practo-feedback/guidelines-for-patients/)

## Recommendation votes are not written-story coverage

Practo documents recommendation score as the percentage of all recommendations that are positive. It displays the score after at least ten recommendations, with a threshold that may change. Its appointment-experience score instead aggregates no-shows, wait time, cancellations/rescheduling and clinic ratings; display begins after five clinic feedback responses. Neither metric is a clinical-outcome score. [Official score definitions](https://help.practo.com/practo-feedback/recommendation-score-and-appointment-experience-score/)

Practo separately collects a recommend decision, wait time, written appointment feedback and reason for visiting. Those distinct fields do not establish that every counted recommendation has an accessible written story. [Patient feedback guidelines](https://help.practo.com/practo-feedback/guidelines-for-patients/)

**Implementation implication:** preserve recommendation votes, accessible written stories and any platform clinic-star measure as separate quantities. Do not apply CareUnfold's existing 1–5-star duplicate adjustment to yes/no recommendations, convert a recommendation percentage into stars, or replace the platform denominator with the number of extracted stories. If written-story coverage is incomplete or the total vote denominator is unknown, label it unknown. An authorized subset can support a clearly labeled subset analysis; it cannot establish an adjusted platform-wide score.

## What “verified” establishes—and what remains unknown

Practo describes post-appointment outreach through SMS/WhatsApp/email, one feedback per appointment, automated flagging and human moderation. It also accepts appointment details from providers before contacting patients and describes SMS re-verification when investigating non-compliance. These are platform-reported process safeguards, not independently evaluated fraud labels. The reviewed guidance does not provide their measured false-positive/false-negative rates or a per-story audit trail available to CareUnfold. [Provider feedback guidelines](https://help.practo.com/practo-feedback/practo-feedback-guidelines-for-healthcare-service-providers/)

Another documented route permits providers to submit patient contact lists for feedback requests, with phone compliance checks and a prior-consultation requirement. The article reports a 2–5% response rate. Inference: provider-selected invitations and voluntary response can create selection/nonresponse bias; verification alone does not make respondents representative of every patient. [Get More Feedback documentation](https://help.practo.com/practo-feedback/get-more-feedback-feature/)

Practo Prime integration can mark a patient checked in after manual check-in, billing, prescription creation or file sharing. This documents operational events, not a universally independent proof of attendance. It does not establish which event, if any, supports a particular public review's badge. [Prime integration documentation](https://help.practo.com/practo-prime/prime-integration/)

For credentials, Practo says it validates medical registration and degrees across Prime and non-Prime profiles. Attribute that claim to Practo; independently checking the relevant register is a separate evidence step. The badge does not guarantee a successful diagnosis or treatment. [Prime patient FAQ](https://help.practo.com/practo-prime/faqs-for-practo-prime-patients/)

Practo describes blurring public feedback about medical ability and treatment outcomes because substantiating such claims requires medical evaluation. Inference: visible narrative is moderated patient-experience evidence, not a complete outcomes dataset or a sound clinical-quality training target. Repetition, missing text and publication status must not become fraud ground truth. [Feedback Blur documentation](https://help.practo.com/practo-feedback/feedback-blur-feature/)

## Questions that gate a live adapter

1. Will Practo expressly authorize this extension's local analysis, derived experience estimates, cross-platform comparisons and display, including any required attribution and deletion?
2. Which endpoints expose recommendations versus written stories, their complete denominators, timestamps, pagination, withheld/deleted records and doctor–establishment associations?
3. What field-level verification provenance and credential identifiers are available, and what measured limitations accompany them?
4. What enrollment, commercial terms, request limits and data-retention rules apply? Can credentials be used safely without exposing a partner secret in a distributed extension?
5. What independently authorized, representative Indian healthcare dataset can evaluate patient-experience estimates without treating platform badges or moderation as truth labels?

Until those answers exist, CareUnfold can truthfully demonstrate transparent sample analysis and separate credential evidence. It cannot promise accurate clinical-quality rankings or a permission-cleared Practo-wide revised rating.
