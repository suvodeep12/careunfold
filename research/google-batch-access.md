# Google Maps automatic batch comparison: access decision

Checked 2 October 2026 against official sources. This supplements `feasibility.md` for the newly approved requirement: automatically compare doctors in search results already loaded by the user, without scrolling or fetching further search results. It records access uncertainty, not a legal determination.

## Result

No reviewed public documentation establishes a self-service permission route for CareUnfold's complete workflow: observe loaded Google Maps search cards, obtain sufficient review evidence for each doctor, derive adjusted ratings and display the comparison. An ordinary Places API subscription is not evidence that this specific analysis is permitted. The next access action is a narrowly described enquiry through Google's published Maps Platform sales channel, asking for the appropriate licensing/product-policy owner and written scope clarification. Availability of a bespoke agreement is unconfirmed.

## Batch access is not batch evidence

The Places resource exposes an aggregate `rating` and `userRatingCount`; the latter includes reviews without text. Its `reviews` array contains at most five reviews, selected by relevance. This is a selected sample, not a complete history or independently sampled patient population. Requesting details for several doctors does not change the per-place limitation. An API search is also a separate acquisition route; these fields do not establish an API that mirrors the user's existing browser result cards. [Place resource reference](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)

Product implication: a loaded card is an identity/listing observation, not proof that its underlying reviews are available. Keep each doctor's identity, source, review sample and coverage separate. Missing evidence must remain missing; neither the aggregate average nor a handful of selected texts can identify the user's desired true rating. This is an inference from the documented data limits, not a claim that all browser cards have identical layouts.

## Restrictions relevant to the proposed interface

Maps Platform terms §3.2.3 restrict extraction/export, review copying and caching. Subsection (c) restricts creating content based on Maps Content and expressly covers improving ML/AI models through training, testing, validation or fine-tuning. Subsection (g) prohibits modifying Core Services search results. A recalculated rating therefore needs specific scope clarification; billing activation alone is insufficient. A distinct side panel that preserves Google's original results avoids designing around their alteration, but is not an established exception for derived content. [Maps Platform terms](https://cloud.google.com/maps-platform/terms)

Browser-page access has a separate terms context. Maps end-user terms restrict creating products based on Maps, copying except permitted uses or applicable law, and mass downloads/bulk feeds. Limiting observation to already-loaded results and local memory does not establish an exemption. Applicability and permission for this precise extension remain unresolved. [Maps end-user terms](https://www.google.com/intl/en-GB_US/help/terms_maps/)

The linked Geo Guidelines permit links and ordinary embeds and direct more integrated commercial uses to Maps Platform APIs. They do not establish permission to analyze review sets or issue adjusted doctor ratings. [Geo Guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/)

If API review display is ultimately authorized, author attribution and access to individual source reviews are required. Ordering/filtering must be disclosed. Those presentation requirements are not an analysis license. [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies)

## Published contact route and concrete enquiry scope

Google publishes a Maps Platform sales form accepting project details. It requires business/contact information; those facts must come from the user rather than invented company particulars. This is a verified general commercial route, not a dedicated review-licensing inbox or guaranteed approval process. [Contact sales](https://mapsplatform.google.com/contact-us/)

Maps Platform support case creation requires a valid billing account, an enabled Maps API and a suitable project role. The support documentation explicitly says escalation managers cannot grant policy or terms exceptions. Do not create a billable project just to ask unless the user separately authorizes it. [Official support guide](https://developers.google.com/maps/support)

The enquiry should request clarification on these exact activities:

1. Automatic observation of already-loaded Google Maps doctor results after extension/site-access consent; no auto-scroll or additional result collection.
2. Matching each loaded listing to an authorized review source, and whether a supported route supplies sufficient review coverage beyond five selected reviews.
3. Local, deterministic duplicate-text sensitivity calculations displayed alongside the original rating in a separate panel, including cross-provider comparison.
4. Allowed retention, attribution, redistribution and evaluation of the proposed deterministic rule against independently justified reference evidence; any model evaluation or inference requires separate clarification. Neither training rights nor clinical-quality claims are presumed.
5. Whether an explicit written agreement or other documented authorization can cover this scope, and its eligibility/cost requirements.

No form was submitted, account created, billing activated or permission obtained during this investigation.

## Browser engineering is a separate permission layer

Chrome's `activeTab` grants temporary access following user invocation; it does not bootstrap access automatically on every new Maps tab. It can support observation within an already-authorized session, including same-origin navigation. [Chrome activeTab documentation](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

For automatic operation across Maps visits, scoped site access and statically or dynamically registered content scripts are the documented mechanisms. Automatic scripts specify matching pages; programmatic injection needs host permission or temporary `activeTab` authorization. Design any future grant narrowly for the required Maps pages, with explicit user control. This is a conditional engineering recommendation; Chrome's ability to read a page does not grant Google content rights. The current prototype's `sidePanel`-only manifest supplies no such live observation capability. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
