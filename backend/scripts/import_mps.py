"""Convert data-source/MP Contact List.csv into a Postgres SQL script for Supabase.

Usage (from the repo root, after import_combined_db.py has loaded `postcodes`):
    python3 backend/scripts/import_mps.py > /tmp/mps.sql
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f /tmp/mps.sql

Pass --replace to drop the existing table first.
"""

import argparse
import csv
import sys
from pathlib import Path

DEFAULT_CSV = Path(__file__).resolve().parents[2] / "data-source" / "MP Contact List.csv"

SCHEMA = """
create table mps (
    constituency        text primary key,
    constituency_code   text unique,
    full_name           text not null,
    first_name          text,
    surname             text,
    title               text,
    formal_salutation   text,
    party               text,
    email               text
);
"""

POST_LOAD = """
-- The CSV has constituency names only; take the ONS code from the postcode data.
update mps set constituency_code = p.constituency_code
from (select distinct constituency, constituency_code from postcodes where constituency_code is not null) p
where p.constituency = mps.constituency;

create index mps_constituency_lower on mps (lower(constituency));

alter table mps enable row level security;
"""

# CSV column -> table column
COLUMNS = {
    "Constituency": "constituency",
    "FullName": "full_name",
    "FirstName": "first_name",
    "Surname": "surname",
    "Title": "title",
    "FormalSalutation": "formal_salutation",
    "Party": "party",
    "ParliamentEmail": "email",
}


def copy_value(value: str) -> str:
    value = value.strip()
    if not value:
        return r"\N"
    return value.replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "\\r")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--replace", action="store_true", help="drop the existing table first")
    args = parser.parse_args()

    out = sys.stdout
    if args.replace:
        out.write("drop table if exists mps;\n")
    out.write(SCHEMA)

    out.write(f"\ncopy mps ({', '.join(COLUMNS.values())}) from stdin;\n")
    with args.csv.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            out.write("\t".join(copy_value(row[source]) for source in COLUMNS) + "\n")
    out.write("\\.\n")

    out.write(POST_LOAD)


if __name__ == "__main__":
    main()
