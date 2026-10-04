# Physician-model evaluation audit

Checked 4 October 2026. No dataset download, training or scoring change.

The previously unreliable publisher page has a readable [PMC full-text copy of Zhao et al. (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11367699/). This resolves article access, not dataset access.

The study uses 4,000 platform reviews labeled true and 400 commissioned fabrications, oversampling the latter. It reports ten-fold review-level validation; the inspected description does not establish oversampling only within training folds or doctor/writer-disjoint splits. Leakage is therefore unresolved, not proven. Fake texts were screened for minimum length; review length was the leading random-forest feature. Inference: collection instructions can become a classification shortcut rather than real-world authenticity evidence. No supplementary dataset or data-availability link appeared in the inspected article.

Do not adopt its reported BERT performance as CareUnfold accuracy. Require original-example grouping before splitting, training-only resampling and feature fitting, independent doctor/author holdouts, and length-matched sensitivity analysis before evaluating an accessed corpus. These checks supplement the existing label, licence and India-transfer gates in [medical-benchmark-followup.md](medical-benchmark-followup.md); they do not authorize training on live Maps reviews.
