# CareUnfold

Evidence behind care decisions. A local-first desktop browser-extension prototype for people choosing doctors and clinics in India.

## What works today

Import a JSON review sample, compare its original average with an exact-wording adjustment, toggle the adjustment and inspect every affected entry. Each matching group contributes its mean stars as one vote. Other reviews keep one vote. The built-in example is entirely synthetic.

**This is a sample sensitivity scenario, not a recovered true rating, fraud detector or measure of clinical quality.** Reviewer totals and writing style do not reduce weights. No live Google Maps integration is included.

## Run and install

Requires Node.js 22 or newer supported by the installed toolchain.

```sh
npm ci
npm run check
npm test
npm run build
```

Open `chrome://extensions` or `edge://extensions`, enable Developer mode, choose **Load unpacked** and select `.output/chrome-mv3`. Click the extension's toolbar action to open its side panel. `npm run zip` creates a distribution ZIP in `.output`; marketplace publishing is a separate step.

`npm run dev` starts WXT without launching a browser. Load `.output/chrome-mv3-dev` manually for extension development. To preview production UI without installing the extension, serve `.output/chrome-mv3` locally and open `sidepanel.html`. This preview does not test extension installation or the toolbar action.

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

For real imports, set `source` to `user-import`. `sampling` accepts `complete`, `selected` or `unknown`; these are file-supplied declarations, not verified provenance. `complete` requires `totalReviews` equal to sample size. Otherwise the total is optional, but must be at least the sample size. Reviews need unique nonempty IDs, integer stars from 1 to 5, text and all three boolean flags. Optional `date` must be a real `YYYY-MM-DD`; optional `reviewerReviewCount` must be a positive integer. Omit unknown values. Limits: 2 MB, 1,000 reviews, 8,000 characters per text. Unknown fields are discarded. Invalid imports preserve the current sample.

Matching uses NFKC Unicode normalization, lowercase and collapsed whitespace. Only complete texts of at least 40 Unicode code points are grouped. Original and translated entries are grouped separately. A shared reported date among at least four unedited entries appears as context and never changes the rating. These thresholds are experimental rules, not validated authenticity signals.

## Privacy and evidence

Processing runs locally. Imports stay in memory; reloading restores the demo. No backend, telemetry, uploads or review persistence. The production manifest requests only `sidePanel`, with no host permissions. Review text is rendered as text.

Read [the feasibility investigation](research/feasibility.md), [dataset audit](research/dataset-audit.md), and [GMR–PL inspection](research/gmr-inspection.md) before changing data acquisition or scoring. Raw downloaded data and generated builds are excluded from Git. No third-party dataset is redistributed here.

## Next validation gates

1. Establish a permitted data-access route and a representative Indian-clinic evaluation sample with independently justified labels and sampling coverage.
2. Validate patient-experience estimates against a defined target; assess selection bias, leakage, uncertainty and failure cases before claiming corrected listing ratings.
3. Add separate, attributable doctor-registration and specialty evidence, with identity matching and freshness checks. Add clinical-outcome evidence only where reliable and comparable sources exist.

The approved direction is evidence-based doctor comparison. Patient experience and clinical quality remain separate: systematic reviews report stronger links to patient experience than consistent links to clinical outcomes ([2022 review](https://pubmed.ncbi.nlm.nih.gov/34027743/), [2019 review](https://www.jmir.org/2019/4/e12521/)). The [NMC registry](https://nmr.nmc.org.in/search-doctor) is a candidate registration source, not an implemented integration.

See [AGENTS.md](AGENTS.md) for contributor workflow and claim boundaries. This repository currently provides no software license grant.
