# CareUnfold

Evidence behind care decisions. A local-first desktop browser-extension prototype for people choosing doctors and clinics in India.

## What works today

**Strict suspicion filtering:** CareUnfold excludes all entries in qualifying full displayed-text duplicate groups (known original and unknown translation status kept separate; known translated text exempt), plus authors with 1–2 total reviews in known unedited same-day groups of at least four sample entries. The filter starts enabled, shows the original and estimated filtered sample ratings, and keeps every excluded original and reason available. Turn it off to restore the complete sample. It applies equally to positive and negative reviews and may exclude genuine experiences. Remaining reviews are **unverified**, not established as real. This changes the CareUnfold view only; Google's native reviews are unchanged. Relative Maps dates do not activate the exact-day rule.

The approved policy is verification first: imported and captured Maps reviews start unverified and contribute no verified votes. Both views retain **Verified experience rating: Insufficient evidence** separately from the requested suspicion-based sample estimate. Current acquisition routes provide no independently corroborated experiences, and imported verification flags cannot grant trust. No numerical verified rating or integrity penalty is produced from those inputs.

Expand **Unverified sample calculations** to compare the original sample average with the exact-wording sensitivity scenario. Each matching group contributes its mean stars as one sample vote; other reviews retain one sample vote. These calculations are separate from verification. The built-in example is entirely synthetic.

**This is a sample sensitivity scenario, not a recovered true rating, fraud detector or measure of clinical quality.** Reviewer totals and writing style do not reduce weights in the duplicate sensitivity calculation; the separate strict filter uses sparse history only together with an exact-day cluster. Signed-in installed Edge 0.2.3 testing captured multiple real listings, including 100-review samples; some listings stalled earlier. The 0.2.4 long-review traversal fix passes regression checks and still needs an installed live retest. See [the installed test record](research/edge-panel-verification.md) for scope and limitations.

## Run and install

Requires Node.js 22 or newer supported by the installed toolchain.

Packaged experimental builds are available from [GitHub Releases](https://github.com/suvodeep12/careunfold/releases). Download the extension ZIP under Assets, extract it, then load that folder as an unpacked extension. Release notes state the validation scope and remaining limitations.

```sh
npm ci
npm run check
npm test
npm run build
```

Open `chrome://extensions` or `edge://extensions`, enable Developer mode, choose **Load unpacked** and select `.output/chrome-mv3`. Click the extension's toolbar action to open its side panel. `npm run zip` creates a distribution ZIP in `.output`; marketplace publishing is a separate step.

To update an existing unpacked installation:

1. If you loaded `.output/chrome-mv3` from this project, run `npm run zip` to rebuild that folder. If you loaded an extracted ZIP instead, copy the new ZIP's contents into the same folder you originally loaded.
2. On the browser's extensions page, choose **Reload** for CareUnfold and confirm the displayed version matches the new build.
3. Open a Maps search, reopen CareUnfold, select a review depth and choose **Enable on this Maps tab**. Previous in-memory samples are not preserved through the reload.

For a collection retest, report the extension version, listing name, captured/listed counts and stop reason. Do not send patient review text or private account details. A partial sample or a selected 100-newest sample does not establish a full-listing true rating.

For browser-accessible testing, stop any existing session, check **Show testing diagnostics on Maps**, then enable the session. Expand **CareUnfold testing diagnostics** at the bottom-right of the source Maps page. It shows aggregate counts, original/filtered sample calculations and sorting/stop diagnostics; the filtered calculation always represents the exclusion rules enabled. It includes no review text or author details. The opt-in mirror is visible to Maps page scripts, uses no storage or server, and disappears on session disconnect.

## Development without repeated ZIP installs

Use the stable WXT development folder, rather than release ZIPs. No additional software or paid service is needed.

1. Start `npm run dev`. It binds only to `127.0.0.1:3000` and fails clearly if that port is occupied. The development server must remain running; the coding agent can restart it when development resumes.
2. Once, disable the old packaged CareUnfold installation and load `.output/chrome-mv3-dev` through Edge's **Load unpacked** control. Keep the browser automation connection enabled. Developer builds use WXT's automatic rebuild/reload support.
3. Once, open the development extension side panel on Maps, choose a review depth and enable Maps site access. Stop that session and close the side panel so the local console can own the next session.
4. Open [the local test console](http://127.0.0.1:3000/careunfold-test), refresh sources, select the intended Maps search and review limit, optionally enable **Rerun this test after development reloads**, and run. The agent can operate these page controls and inspect aggregate results directly.

The console remembers only selected tab, limit and test switches in that tab's session storage, separately for each extension ID. No review data is saved. Stop disables automatic reruns; closing the console ends its owned collection session. Missing source tabs, revoked site access and competing side panels require correcting that prerequisite before retrying. A disconnected extension reconnects while its script context remains valid; WXT replaces invalidated content scripts after development reloads. Browser restarts, disconnection of the automation connector and browser security prompts can still require user action. Installed Edge automatic-reload verification remains pending; synthetic tests do not establish it.

For interface checks without installation, [the synthetic console preview](http://127.0.0.1:3000/careunfold-preview) uses the same UI with an invented fixture and no browser-extension access. Production builds exclude the console entrypoint, localhost access and development control port; `npm run zip` checks these boundaries in CI. Release ZIPs remain the distribution route, not the development loop.

To preview production UI without installing the extension, serve `.output/chrome-mv3` locally and open `sidepanel.html`. This preview does not test extension installation or the toolbar action.

## Import format

The interface can download a complete synthetic example. Minimal valid input:

```json
{
  "name": "Invented clinic example",
  "source": "synthetic",
  "sampling": "complete",
  "totalReviews": 1,
  "reviews": [
    {
      "id": "example-1",
      "text": "The appointment started on time.",
      "rating": 4,
      "translated": false,
      "truncated": false,
      "edited": false
    }
  ]
}
```

For real imports, set `source` to `user-import`. `sampling` accepts `complete`, `selected` or `unknown`; these are file-supplied declarations, not verified provenance. `complete` requires `totalReviews` equal to sample size. Otherwise the total is optional, but must be at least the sample size. Reviews need unique nonempty IDs, integer stars from 1 to 5, text and all three flags (`true`, `false` or `null` for unknown). Optional `date` must be a real `YYYY-MM-DD`; optional `reviewerReviewCount` must be a positive integer. Omit unknown values. Limits: 2 MB, 1,000 reviews, 8,000 characters per text. Unknown fields are discarded. Invalid imports preserve the current sample.

Matching uses NFKC Unicode normalization, lowercase and collapsed whitespace. Only complete texts of at least 40 Unicode code points are grouped. Original, translated and unknown-translation entries are grouped separately. Unknown text completeness is excluded from grouping. A shared reported date among at least four known unedited entries appears as context and never changes the rating. These thresholds are experimental rules, not validated authenticity signals.

## Privacy and evidence

Processing runs locally. Imports stay in memory; reloading restores the demo. No backend, telemetry, uploads or review persistence. Review text is rendered as text.

For Maps comparison, open a Google Maps search, open CareUnfold, select **Google Maps**, choose the review depth and select **Enable on this Maps tab**. Grant the requested site access. Both `www.google.com` and `www.google.co.in` Maps pages are supported; other country domains remain unsupported. Version 0.2.5 adds the India domain, so an existing installation may request additional optional access when enabled. It watches only already-loaded search cards and reuses one temporary inactive tab sequentially to attempt their reviews; it never scrolls search results. Review depth starts blank. The 100-newest choice is an engineering limit, not a representative sample; attempt-all still stops on a stall or a 90-second collection deadline. Unavailable evidence produces no adjusted rating. The manifest declares `sidePanel`, `scripting` and optional `https://www.google.com/maps/*` and `https://www.google.co.in/maps/*` host access; both are requested from the Enable gesture before looking up the source tab. Site access is not granted automatically. Chrome host grants apply at origin level, while this code checks for Google Maps paths. No all-site, storage, debugger or network-interception permission is requested. Use **Stop** to end collection. Closing the panel or source tab, changing to Demo / import, or revoking site access also ends the session. Reconnect after a source-page reload. Activating the temporary tab hands it over to you and stops the batch. Native collection has partial verification; complete review coverage and unattended background reliability remain unverified. Installed India-domain collection still needs a live retest.

Read [the feasibility investigation](research/feasibility.md), [dataset audit](research/dataset-audit.md), and [GMR–PL inspection](research/gmr-inspection.md) before changing data acquisition or scoring. Raw downloaded data and generated builds are excluded from Git. No third-party dataset is redistributed here.

## Next validation gates

1. Establish a permitted data-access route and a representative Indian-clinic evaluation sample with independently justified labels and sampling coverage.
2. Validate patient-experience estimates against a defined target; assess selection bias, leakage, uncertainty and failure cases before claiming corrected listing ratings.
3. Add separate, attributable doctor-registration and specialty evidence, with identity matching and freshness checks. Add clinical-outcome evidence only where reliable and comparable sources exist.

The approved direction is evidence-based doctor comparison. Patient experience and clinical quality remain separate: systematic reviews report stronger links to patient experience than consistent links to clinical outcomes ([2022 review](https://pubmed.ncbi.nlm.nih.gov/34027743/), [2019 review](https://www.jmir.org/2019/4/e12521/)). The [NMC registry](https://nmr.nmc.org.in/search-doctor) is a candidate registration source, not an implemented integration.

See [AGENTS.md](AGENTS.md) for contributor workflow and claim boundaries. This repository currently provides no software license grant.

See [verification evidence](research/verification.md) for checked behavior and remaining gaps, and [doctor-source checks](research/doctor-evidence.md) for the registration pilot. GitHub Actions runs type checks, tests and ZIP packaging on pushes and pull requests; a successful run retains the extension ZIP as an artifact.

The final integration targets are Google Maps and/or Practo. Read [Practo access and score semantics](research/practo-feasibility.md) and [rating validation requirements](research/rating-validation.md) before implementing a live adapter. Practo recommendation percentages and Google star averages must retain their different meanings.
