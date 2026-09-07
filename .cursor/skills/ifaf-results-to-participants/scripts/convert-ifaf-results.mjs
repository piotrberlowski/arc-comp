#!/usr/bin/env node
/**
 * Convert an IFAF Results xlsx into an arc-comp participant import CSV.
 *
 * Usage (from arc-comp root):
 *   node .cursor/skills/ifaf-results-to-participants/scripts/convert-ifaf-results.mjs <input.xlsx> [output.csv]
 *
 * Default output: <input-basename>-participants.csv in the current working directory.
 */

import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"

const require = createRequire(path.resolve(process.cwd(), "package.json"))
const ExcelJS = require("exceljs")

const IFAF_TO_CATEGORY = {
    "BB-C": "BBC",
    "BB-R": "BBR",
    "BH-C": "BHC",
    "BH-R": "BHR",
    BL: "BL",
    BU: "BU",
    "FS-C": "FSC",
    "FS-R": "FSR",
    FU: "FU",
    LB: "LB",
    HB: "HB",
    TR: "TR",
    "TR-IFAA": "TR",
}

const AGE_GENDER = {
    "Senior Male": { ageGroupId: "S", gender: "M" },
    "Senior Female": { ageGroupId: "S", gender: "F" },
    "Veteran Male": { ageGroupId: "V", gender: "M" },
    "Veteran Female": { ageGroupId: "V", gender: "F" },
    "Adult Male": { ageGroupId: "A", gender: "M" },
    "Adult Female": { ageGroupId: "A", gender: "F" },
    "Young Adult Male": { ageGroupId: "YA", gender: "M" },
    "Young Adult Female": { ageGroupId: "YA", gender: "F" },
    "Junior Male": { ageGroupId: "J", gender: "M" },
    "Junior Female": { ageGroupId: "J", gender: "F" },
    "Cub Male": { ageGroupId: "C", gender: "M" },
    "Cub Female": { ageGroupId: "C", gender: "F" },
}

function cellVal(cell) {
    const v = cell?.value
    if (v == null) return ""
    if (typeof v === "object" && "text" in v) return String(v.text).trim()
    if (typeof v === "object" && "result" in v && v.result != null) return String(v.result).trim()
    return String(v).trim()
}

function slugClub(club) {
    return (
        club
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toUpperCase()
            .slice(0, 24) || "UNKNOWN"
    )
}

function isGuestMembership(value) {
    return /^guest\s*$/i.test(value.trim())
}

/** Matches "01. Barebow Compound (BB-C)" or "Barebow Compound (BB-C)". */
function extractBowStyleCode(row) {
    const a = cellVal(row.getCell(1))
    const match = a.match(/^(?:\d{2}\.\s+)?(.+)\(([^)]+)\)\s*$/)
    if (!match) return null
    const code = match[2].trim()
    if (!IFAF_TO_CATEGORY[code] && code !== "TR-IFAA") return null
    // Reject age/gender rows that happen to contain parentheses
    if (AGE_GENDER[a]) return null
    return code
}

function csvEscape(value) {
    const s = String(value)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
}

function resolveMembershipNo(rawMembership, club, clubGuestSeq) {
    if (!isGuestMembership(rawMembership)) return rawMembership.trim()
    const slug = slugClub(club)
    const next = (clubGuestSeq.get(slug) ?? 0) + 1
    clubGuestSeq.set(slug, next)
    return `GUEST-${slug}-${String(next).padStart(3, "0")}`
}

function defaultOutputPath(inputPath) {
    const base = path.basename(inputPath, path.extname(inputPath))
    const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
    return path.resolve(process.cwd(), `${safe}-participants.csv`)
}

async function convert(inputPath, outputPath) {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(inputPath)
    const ws = wb.getWorksheet("Results") ?? wb.worksheets[0]
    if (!ws) throw new Error("No worksheet found in workbook")

    let ifafBowCode = null
    const clubGuestSeq = new Map()
    const rows = []
    const warnings = []

    for (let r = 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r)
        const bowCode = extractBowStyleCode(row)
        if (bowCode) {
            ifafBowCode = bowCode
            continue
        }

        const divisionLabel = cellVal(row.getCell(1))
        const name = cellVal(row.getCell(2))
        const rawMembership = cellVal(row.getCell(3))
        const club = cellVal(row.getCell(4))

        if (!AGE_GENDER[divisionLabel] || !name) continue

        const categoryId = IFAF_TO_CATEGORY[ifafBowCode ?? ""]
        if (!categoryId) {
            warnings.push(`Row ${r}: missing/unknown bow style for ${name}`)
            continue
        }

        const clubName = club || "Independent"
        const { ageGroupId, gender } = AGE_GENDER[divisionLabel]
        const membershipNo = resolveMembershipNo(rawMembership, clubName, clubGuestSeq)

        rows.push({
            name,
            membershipNo,
            gender,
            ageGroupId,
            categoryId,
            club: clubName,
            wasGuest: isGuestMembership(rawMembership),
            sourceRow: r,
        })
    }

    const membershipNos = rows.map((x) => x.membershipNo)
    const dupes = [...new Set(membershipNos.filter((m, i) => membershipNos.indexOf(m) !== i))]
    if (dupes.length) {
        throw new Error(`Duplicate membership numbers remain: ${dupes.join(", ")}`)
    }

    const lines = rows.map((p) =>
        [p.name, p.membershipNo, p.gender, p.ageGroupId, p.categoryId, p.club].map(csvEscape).join(",")
    )
    fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8")

    return {
        outputPath,
        count: rows.length,
        guests: rows.filter((p) => p.wasGuest),
        warnings,
    }
}

const inputArg = process.argv[2]
if (!inputArg) {
    console.error(
        "Usage: node .cursor/skills/ifaf-results-to-participants/scripts/convert-ifaf-results.mjs <input.xlsx> [output.csv]"
    )
    process.exit(1)
}

const inputPath = path.resolve(inputArg)
const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutputPath(inputPath)

if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
}

const result = await convert(inputPath, outputPath)
console.log(`Wrote ${result.count} rows to ${result.outputPath}`)
if (result.guests.length) {
    console.log(`Guests remapped (${result.guests.length}):`)
    for (const g of result.guests) {
        console.log(`  ${g.name} -> ${g.membershipNo} (${g.club})`)
    }
}
if (result.warnings.length) {
    console.log("Warnings:")
    for (const w of result.warnings) console.log(`  ${w}`)
}
