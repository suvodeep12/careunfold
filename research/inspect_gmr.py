"""Audit the original GMR-PL archive without exporting review text or identities.

Run: python research/inspect_gmr.py
Uses only Python's standard library; does not extract or execute archive files.
"""
import csv
import hashlib
import io
import json
import re
import tempfile
import unicodedata
import zipfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "data/gmr-pl/source.zip"


def normalized_text(text):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", text).casefold()).strip()


def inspect(archive):
    expected = {"accounts.csv", "accounts.json", "reviews.csv", "reviews.json"}
    with zipfile.ZipFile(archive) as z:
        if set(z.namelist()) != expected or len(z.namelist()) != 4:
            raise ValueError("Unexpected archive contents")
        if sum(f.file_size for f in z.infolist()) > 50_000_000:
            raise ValueError("Archive exceeds expected inspection size")
        if z.testzip() is not None:
            raise ValueError("Archive CRC check failed")
        files = {name: z.read(name) for name in sorted(expected)}
    accounts = json.loads(files["accounts.json"])
    reviews = json.loads(files["reviews.json"])
    account_ids = [a["_id"]["$oid"] for a in accounts]
    review_ids = [r["_id"]["$oid"] for r in reviews]
    account_map = dict(zip(account_ids, accounts))
    if len(account_map) != len(accounts) or len(set(review_ids)) != len(reviews):
        raise ValueError("Duplicate account/review IDs")
    for row in accounts + reviews:
        if type(row["is_real"]) is not bool:
            raise ValueError("Invalid label type")
    for row in reviews:
        if type(row["rating"]) is not int or not 1 <= row["rating"] <= 5:
            raise ValueError("Invalid star rating")
        datetime.fromisoformat(row["date"]["$date"].replace("Z", "+00:00"))
    orphan_count = sum(r["account_id"]["$oid"] not in account_map for r in reviews)
    if orphan_count:
        raise ValueError(f"Found {orphan_count} orphan reviews")
    mismatches = sum(r["is_real"] != account_map[r["account_id"]["$oid"]]["is_real"] for r in reviews)
    csv_checks = {}
    for name, records, ids in (("accounts.csv", accounts, account_ids), ("reviews.csv", reviews, review_ids)):
        rows = list(csv.DictReader(io.StringIO(files[name].decode("utf-8-sig"))))
        if len(rows) != len(records) or [r["_id"] for r in rows] != ids:
            raise ValueError(f"CSV/JSON row or ID disagreement: {name}")
        if any(r["is_real"].lower() != str(j["is_real"]).lower() for r, j in zip(rows, records)):
            raise ValueError(f"CSV/JSON label disagreement: {name}")
        csv_checks[name] = {"rows": len(rows), "fields": list(rows[0]), "ids_and_labels_match_json": True}
    groups = defaultdict(list)
    for r in reviews:
        text = normalized_text(r["content"])
        if text:
            groups[text].append(r)
    repeated = [rows for rows in groups.values() if len(rows) > 1]
    per_class = {}
    for label, name in ((True, "labeled_real"), (False, "labeled_fake")):
        aa = [a for a in accounts if a["is_real"] == label]
        rr = [r for r in reviews if r["is_real"] == label]
        dates = sorted(r["date"]["$date"] for r in rr)
        per_class[name] = {
            "accounts": len(aa), "reviews": len(rr),
            "ratings": dict(sorted(Counter(r["rating"] for r in rr).items())),
            "empty_text": sum(not normalized_text(r["content"]) for r in rr),
            "photo_field_null": sum(r["photos_urls"] is None for r in rr),
            "photo_field_nonempty": sum(bool(r["photos_urls"]) for r in rr),
            "response_present": sum(bool(r["response_content"]) for r in rr),
            "flags": {k: sum(r[k] for r in rr) for k in
                      ("content_not_full", "content_translated", "not_in_poland", "localization_missing", "censored_text")},
            "date_min": dates[0], "date_max": dates[-1],
            "account_review_count_null": sum(a["number_of_reviews"] is None for a in aa),
            "account_review_count_1_or_2": sum(a["number_of_reviews"] in (1, 2) for a in aa),
            "accounts_private": sum(a["is_private"] for a in aa),
            "accounts_deleted": sum(a["is_deleted"] for a in aa),
        }
    # ponytail: normalized exact duplicates only; semantic similarity needs a separate validated experiment.
    return {
        "archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "files": {name: {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()} for name, raw in files.items()},
        "csv_checks": csv_checks,
        "accounts": len(accounts), "reviews": len(reviews),
        "orphan_reviews": orphan_count, "review_account_label_mismatches": mismatches,
        "accounts_without_review_rows": len(set(account_ids) - {r["account_id"]["$oid"] for r in reviews}),
        "per_class": per_class,
        "normalized_nonempty_duplicate_groups": len(repeated),
        "rows_in_duplicate_groups": sum(map(len, repeated)),
        "duplicate_groups_crossing_accounts": sum(len({r["account_id"]["$oid"] for r in rows}) > 1 for rows in repeated),
        "duplicate_groups_crossing_labels": sum(len({r["is_real"] for r in rows}) > 1 for rows in repeated),
        "cluster_counts_by_label": {cluster: {"labeled_real": sum(r["is_real"] for r in rows),
                                              "labeled_fake": sum(not r["is_real"] for r in rows)}
                                    for cluster in sorted({r["cluster"] for r in reviews})
                                    for rows in [[r for r in reviews if r["cluster"] == cluster]]},
        "photo_null_rule_agreement_with_fake_label": sum((r["photos_urls"] is None) == (not r["is_real"]) for r in reviews) / len(reviews),
        "business_identity_available": False,
        "limits": ["Labels are inherited account judgments, not verified experience truth.",
                   "No business identifier is exposed in the released schema.",
                   "CSV/JSON equivalence checked for rows, ordered IDs and labels only.",
                   "No semantic similarity, model evaluation or India-clinic validation performed."],
    }


def self_check():
    """One small check for joins, inherited labels, duplicate counts and CSV parity."""
    assert normalized_text("  GOOD\u00a0Clinic\n") == "good clinic"
    assert normalized_text(" \t\n") == ""
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "sample.zip"
        accounts = [{"_id": {"$oid": str(i)}, "is_real": label, "number_of_reviews": 1,
                     "is_private": False, "is_deleted": False} for i, label in ((1, True), (2, False))]
        reviews = [{"_id": {"$oid": str(i)}, "account_id": {"$oid": str(i)},
                    "is_real": label, "rating": 5, "content": text, "cluster": "Medical",
                    "date": {"$date": "2020-01-01T00:00:00Z"}, "photos_urls": [] if label else None,
                    "response_content": None, **{k: False for k in
                    ("content_not_full", "content_translated", "not_in_poland", "localization_missing", "censored_text")}}
                   for i, label, text in ((1, True, " GOOD Clinic "), (2, False, "good clinic"))]

        def write_archive():
            with zipfile.ZipFile(path, "w") as z:
                for stem, rows in (("accounts", accounts), ("reviews", reviews)):
                    z.writestr(stem + ".json", json.dumps(rows))
                    out = io.StringIO()
                    writer = csv.DictWriter(out, fieldnames=["_id", "is_real"])
                    writer.writeheader()
                    writer.writerows({"_id": row["_id"]["$oid"], "is_real": row["is_real"]} for row in rows)
                    z.writestr(stem + ".csv", out.getvalue())

        write_archive()
        result = inspect(path)
        assert result["reviews"] == 2 and result["orphan_reviews"] == 0
        assert result["duplicate_groups_crossing_accounts"] == 1
        assert result["duplicate_groups_crossing_labels"] == 1
        assert result["photo_null_rule_agreement_with_fake_label"] == 1
        reviews[0]["account_id"]["$oid"] = "missing"
        write_archive()
        try:
            inspect(path)
        except ValueError as error:
            assert "orphan" in str(error)
        else:
            raise AssertionError("Orphan review was accepted")


if __name__ == "__main__":
    self_check()
    report = inspect(ARCHIVE)
    target = ROOT / "research/gmr-inspection.json"
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
