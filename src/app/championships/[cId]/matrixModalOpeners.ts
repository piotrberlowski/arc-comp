import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import type { FormModalHandle } from "@/components/FormModal"
import type { Dispatch, SetStateAction } from "react"
import type { MatrixModalView } from "./useDivisionRangeMatrixState"

export function createMatrixModalOpeners({
    setModalView,
    participantsModalRef,
}: {
    setModalView: Dispatch<SetStateAction<MatrixModalView | null>>
    participantsModalRef: { current: FormModalHandle | null }
}) {
    const openModal = (view: MatrixModalView) => {
        setModalView(view)
        participantsModalRef.current?.open()
    }

    return {
        openDivisionParticipants: (abbrev: string, divisionKey: string) => {
            openModal({ kind: "division", abbrev, divisionKey })
        },
        openRangeDayParticipants: (dayOrder: number, rangeNumber: number) => {
            openModal({ kind: "rangeDay", dayOrder, rangeNumber })
        },
        openBowStyleParticipants: (categoryName: string, rows: DivisionRangeMatrixRow[]) => {
            openModal({ kind: "bowStyle", categoryName, rows })
        },
    }
}
