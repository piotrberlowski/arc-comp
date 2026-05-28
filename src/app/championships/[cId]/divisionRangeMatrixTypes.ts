import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import type { DivisionParticipantEntry } from "./DivisionParticipantsModal"

export type ChampionshipMatrixRegistration = DivisionParticipantEntry & {
    divisionKey: string
}

export type MatrixModalView =
    | { kind: "division"; abbrev: string; divisionKey: string }
    | { kind: "rangeDay"; dayOrder: number; rangeNumber: number }
    | { kind: "bowStyle"; categoryName: string; rows: DivisionRangeMatrixRow[] }
