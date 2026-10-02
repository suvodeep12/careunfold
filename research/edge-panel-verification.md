# Installed Edge panel verification, 2 October 2026

Native Edge testing independently opened CareUnfold's installed side panel, switched to Maps and selected up to 100 newest reviews. The panel reported a disconnected session while Enable remained available; clicking Enable produced no permission prompt or startup transition. The component returned early when its port was null. A React DOM regression with mocked extension APIs reproduced the silent failure before the fix.

Version 0.2.3 reconnects on an explicit Enable action using the existing message handlers. Stop, panel unmount and disconnect invalidate pending startup so later permission/query completion cannot start collection. The regression exercises reconnect, Stop during pending permission and unmount during pending tab lookup. All 23 tests and TypeScript pass. These are runnable component/API-mock checks; the updated installed extension still requires reload and a live collection test. The observed idle disconnect's underlying browser cause has not been established. No authenticity or clinical accuracy is claimed.

The existing research/verification.md contains invalid UTF-8 bytes. This supplemental record preserves that file pending separate encoding cleanup.
