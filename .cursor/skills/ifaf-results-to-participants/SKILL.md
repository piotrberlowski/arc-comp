---
name: ifaf-results-to-participants
description: >-
  Convert an IFAF Results .xlsx into an arc-comp participant import CSV in the
  repo root. Use when the user provides an IFAF results workbook, asks to build
  a participant/registration import list from IFAF results, or mentions guest
  membership numbers that must be uniquified.
---

# IFAF Results → Participant Import CSV

## When to use

User has an IFAF Results Excel file (sheet usually named `Results`) and needs a CSV for championship/tournament participant import.

## Output location

Write the CSV to the **arc-comp repository root** (cwd when running from the project). Default filename: `<input-basename>-participants.csv`.

## Run the converter

From arc-comp root (requires project `exceljs` via `node_modules`):

```bash
node .cursor/skills/ifaf-results-to-participants/scripts/convert-ifaf-results.mjs "<path-to.xlsx>" [optional-output.csv]
```

Windows paths under WSL: `/mnt/c/Users/.../file.xlsx`.

Report: row count, guest remaps, warnings, and output path. Fail if duplicate membership numbers remain after guest remapping.

## CSV format (no header)

Columns match `src/lib/participantCsvImport.ts`:

1. Full name
2. Membership number
3. Gender (`M` / `F`)
4. Age group ID (`S`, `V`, `A`, `YA`, `J`, `C`)
5. Equipment category ID (`BBC`, `BBR`, …)
6. Club name

## Source layout assumptions

- Worksheet: `Results` (else first sheet)
- Bow-style section headers in column A, either:
  - `01. Barebow Compound (BB-C)`, or
  - `Barebow Compound (BB-C)` (number prefix optional)
- Competitor rows: A = age/gender label (`Adult Male`, …), B = name, C = membership #, D = club
- Scores and other columns are ignored

## Mappings

### Age / gender → IDs

| Label | ageGroupId | gender |
|-------|------------|--------|
| Senior Male / Female | S | M / F |
| Veteran Male / Female | V | M / F |
| Adult Male / Female | A | M / F |
| Young Adult Male / Female | YA | M / F |
| Junior Male / Female | J | M / F |
| Cub Male / Female | C | M / F |

### IFAF bow code → equipment category ID

| IFAF code in header | categoryId |
|---------------------|------------|
| BB-C | BBC |
| BB-R | BBR |
| BH-C | BHC |
| BH-R | BHR |
| BL | BL |
| BU | BU |
| FS-C | FSC |
| FS-R | FSR |
| FU | FU |
| LB | LB |
| HB | HB |
| TR / TR-IFAA | TR |

Aligns with `prisma/seed.ts` IFAF bow-style mappings.

## Guest membership numbers

Membership values matching `/^guest\s*$/i` (including trailing spaces) collide on import (`membershipNo` uniqueness).

Replace each with a mock ID:

```text
GUEST-{CLUB-SLUG}-{NNN}
```

- `CLUB-SLUG`: club name uppercased, non-alphanumeric → `-`, max 24 chars
- `NNN`: sequential **per club slug**, zero-padded to 3 digits (`001`, `002`, …)
- Empty club → treat as `Independent` for display; slug from that club string

Do **not** invent mock IDs for real numeric membership numbers.

## After conversion

1. Confirm guest remaps look correct (especially multiple guests from the same club).
2. User imports via championship/tournament CSV import UI.
3. Age group / category names in CSV use **IDs** (`A`, `BHR`), which the importer accepts; names also work if present in DB.
