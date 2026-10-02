# Free review acquisition for CareUnfold

Checked 2 October 2026. Read-only investigation: no signup, billing activation, scraper execution, review collection or external contact. Prices and capabilities below are published provider claims, not a verified extraction of these Indian doctors.

## Recommendation

User clarified that free means **no paid service dependency for the extension long term**, rather than a zero-payment pilot. The best technical fit is a **local browser reader inside CareUnfold using native content scripts**, with computation on the user's device and no commercial extraction API. Chrome documents that content scripts can read the page DOM and communicate with their extension, and can run automatically on matching pages. This is a no-service-fee architecture recommendation, not a verified live adapter or a content licence. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Observe only already-loaded doctor results and refresh the comparison when those results change. Search cards alone do not provide the review history needed for text analysis. The remaining workflow decision is whether to read only review pages the user opens, or obtain consent to reuse one temporary background tab sequentially for review pages of those already-loaded doctors. Chrome supports creating inactive tabs; that capability does not prove that a particular Maps review reader will work or be permitted. Do not auto-scroll to collect additional search results. Review completeness and access remain unresolved, and the reader must report missing evidence rather than invent ratings. [Chrome tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs), [Google review-reading instructions](https://support.google.com/maps/answer/6230175?hl=en)

No paid service, scraper plugin or third-party runtime is needed for this proposed extension architecture. It still uses the user's browser, network and computing resources.

### Local adapter preparation, 2 October 2026

User approved reusing one temporary background tab for review pages of already-loaded doctors. The review-loading depth remains an unanswered question; do not assume an unlimited load or claim a statistically justified sample size.

Read-only browser inspection observed eight loaded search cards with place links, aggregate ratings and counts. On the supplied Dr Akash Garg listing, the overview exposed three preview reviews while the full Reviews tab returned no review entries in the inspected session. Login was displayed, but the observation does not establish why the review tab was empty. Do not substitute previews for full-history evidence.

`lib/maps-dom.ts` reads only rendered search-feed cards and review-card markup. It validates place URLs, deduplicates listing/review identities, excludes owner replies and keeps relative date labels separate from calendar dates. Missing translation/edit markers remain unknown. English rating labels and the observed DOM classes are the current supported shape; other layouts/locales can remain unavailable. Synthetic DOM regression tests pass using the already-installed LinkeDOM package, now declared explicitly as a development dependency. No real review text is committed.

The parsers are preparation only: no automatic tab queue, Maps permission grant, review scrolling or live side-panel comparison is shipped yet. No installed-extension verification or complete review acquisition is claimed. Platform access and rating validation remain unresolved.

## Optional bounded cloud pilot, not the production dependency

For an initial zero-payment Indian-doctor review sample only, Apify's Free plan with its maintained Compass Google Maps Reviews Scraper is a reviewed alternative, bounded to the user's five existing place URLs. It combines no credit card, multiple known places, structured review output and a monthly credit ceiling. It does not meet an unlimited-service requirement and is not selected as CareUnfold's production data dependency.

Apify's official plan is $0 with $5 monthly usage credit, requires no credit card, and blocks Free-plan services when credit is exhausted until the next cycle. Credit does not roll over. Storage, compute and transfer can consume it too. [Apify pricing](https://apify.com/pricing)

The Actor accepts one or more place URLs/IDs and exports JSON. Documented fields include review text, stars, publication date, review/place IDs, reviewer review count, original/translated language and overall place review count. It is maintained by Apify. Those fields support doctor-separated samples; they are not authenticity labels. [Actor documentation](https://apify.com/compass/google-maps-reviews-scraper)

**Use the Free-plan price, not the headline lowest price:** $0.60 per 1,000 review events, plus Actor-start events ($0.00005, per GB with a minimum of one) and variable platform usage. Thus 500 review events cost $0.30 before other usage. The public table does not guarantee 500 successfully returned reviews within a particular account's remaining credit. Verify remaining credit and run limits before starting. [Actor pricing table](https://apify.com/compass/google-maps-reviews-scraper/pricing)

Proposed first experiment: one of the user's supplied places, at most 20 newest Google-origin reviews; check identity, fields, missingness, returned count and actual credit use before expanding to the five supplied URLs with a combined target of at most 500. These are deliberately bounded engineering samples, not statistically validated sample sizes. Preserve sort order, acquisition time, reported total and actual sample size. Stop if the account requires a paid upgrade or cannot enforce the intended bound. No experiment has run yet.

## What this does and does not unlock

This can supply real review samples without an upfront payment. Automatic refresh of already-loaded Maps results is a separate extension integration: observing loaded listings does not load their reviews. A cloud scraper also sends selected place URLs outside the browser, changing the approved local-only privacy scope. An API token should not be embedded in a distributed extension.

The existing CareUnfold JSON importer does **not** accept raw Apify/Outscraper exports unchanged. A conversion must preserve per-doctor grouping, coverage and the required translated/truncated/edited flags. Unknown flags must not silently become false. No converter is implemented by this investigation.

No tool output establishes purchased reviews, unbiased patient selection, complete review coverage or clinical competence. Even all public reviews cannot by themselves prove the requested true rating. Independent patient-experience validation remains necessary; see `rating-validation.md`.

## Other reviewed routes

| Route | Actual no-cost scope | Important limitation |
| --- | --- | --- |
| Google Places API (New) | Monthly free allowance with billing enabled | At most five relevance-selected texts per place; insufficient for a full-history analysis |
| Outscraper | First 500 reviews free; tiers reset every 30 days | Export is advertised; free API entitlement/card requirements need confirmation |
| Local browser observation | No extraction-service charge | Only loaded DOM content; no hidden review history, unstable selectors and separate rights question |
| Open-source local scraper | No software licence fee | Local hardware/runtime costs; more setup; completeness unverified |
| Voluntary original patient submissions | No purchased platform data | Recruitment effort, consent, identity/visit checks and selection bias |

### Google official API allowance

Requesting `reviews` triggers Place Details Enterprise + Atmosphere. [Place Details fields](https://developers.google.com/maps/documentation/places/web-service/place-details) The reviewed prices show 7,000 monthly free billable events for that India SKU, for accounts billed in India with a large majority of usage in India; global pricing lists 1,000. These are request allowances, not review counts. [India pricing](https://developers.google.com/maps/billing-and-pricing/india), [global pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

Billing must be enabled and requests need an API key or OAuth token; quota management is separate from a free allowance. [Usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) Returned reviews are relevance-ranked and capped at five per place. [Place resource](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places) Free requests therefore do not solve the coverage problem.

### Outscraper

The official price page lists the first 500 Google Maps reviews free, reset every 30 days, with CSV/XLSX and sorting. API access is listed under paid review tiers rather than the free tier. [Outscraper pricing](https://outscraper.com/pricing/) Its review API documents bounded requests and review text/rating/date/author output; a 402 response can indicate a payment method not connected. This is not proof every free export needs a card, but prevents promising a card-free API integration. [Review API reference](https://docs.outscraper.com/endpoints/google-maps-reviews/)

### Local extraction

Chrome content scripts can read page DOM and communicate with an extension, including automatic scripts on specified matching pages. A narrowly scoped script could observe already-loaded doctor cards at no per-request extraction-service cost. It cannot infer unloaded reviews. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

The MIT-licensed `gosom/google-maps-scraper` documents Playwright, direct Maps URL input, review text/rating/timestamps and an extended-review option up to approximately 300. This is an actual review-extraction project, rather than a listings-only tool advertising a review-count field. Its default search flow scrolls results, so it is not a drop-in implementation of the user's no-auto-scroll requirement. No runtime test, dependency installation or source security audit was performed. Software licensing does not license Google's content. [Project README](https://github.com/gosom/google-maps-scraper)

Do not add stealth, CAPTCHA bypass, account rotation or bulk crawling to this investigation. The reviewed technical routes are not a finding that all scraping is universally unlawful, nor a finding that CareUnfold's proposed use is authorized. Google Platform/end-user terms and third-party supplier rights are distinct questions; see `google-batch-access.md`. [Platform terms](https://cloud.google.com/maps-platform/terms), [Maps end-user terms](https://www.google.com/intl/en-GB_US/help/terms_maps/)

### Takeout and patient-owned evidence

Google Takeout exports the account user's own data. [Google account export guide](https://support.google.com/accounts/answer/3024190?hl=en) Google's Maps (your places) export schema documents **the user's own** reviews/ratings/comments, including published rating/text, place URL/name/location and last-created-or-modified date in GeoJSON. It does not export all other people's reviews of arbitrary clinics. Field presence varies; publication date versus modification date must not be conflated. A consented donor may supply their own review export, with unrelated places removed. [Official export schema](https://developers.google.com/data-portability/schema-reference/local_actions)

Collecting original voluntary patient-experience submissions is the strongest route to data CareUnfold can directly govern under explicit consent. It costs recruitment effort and does not produce immediate coverage of every loaded doctor. Independent visit evidence and balanced recruitment are design work, not properties guaranteed by Takeout or a positive submission.

Static Kaggle/Hugging Face research datasets can test parsing or research hypotheses when their provenance/licence supports that use. They do not provide current review sets keyed to these Indian doctors; the existing dataset audits remain applicable.
