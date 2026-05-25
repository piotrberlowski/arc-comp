"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import { nextChampionshipDayDefaultDate, nextChampionshipDayOrder } from "@/lib/championshipDayNaming"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useMemo, useRef, useState } from "react"
import AddChampionshipDayForm, { type ChampionshipRangeConfigSummary } from "./AddChampionshipDayForm"
import ChampionshipRoundsList, { type ChampionshipRoundRow } from "./ChampionshipRoundsList"

export default function ChampionshipDaysSection({
    championshipId,
    championshipName,
    organizerClub,
    rangeCount,
    rangeConfigs,
    rounds,
    readOnly = false,
}: {
    championshipId: string
    championshipName: string
    organizerClub: string
    rangeCount: number
    rangeConfigs: ChampionshipRangeConfigSummary[]
    rounds: ChampionshipRoundRow[]
    readOnly?: boolean
}) {
    const nextDayOrder = nextChampionshipDayOrder(rounds)
    const defaultAddDayDate = useMemo(
        () =>
            nextChampionshipDayDefaultDate(
                rounds.map((round) => ({ dayOrder: round.dayOrder, date: round.tournamentDate }))
            ),
        [rounds]
    )
    const modalRef = useRef<FormModalHandle>(null)
    const [addDayFormKey, setAddDayFormKey] = useState(0)

    function closeDialog() {
        modalRef.current?.close()
    }

    function openAddDayDialog() {
        setAddDayFormKey((key) => key + 1)
        modalRef.current?.open()
    }

    return (
        <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-medium">Days (by order)</h2>
                {!readOnly ? (
                    <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={openAddDayDialog}
                    >
                        <PlusCircleIcon width={20} />
                        Add day
                    </button>
                ) : null}
            </div>
            <ChampionshipRoundsList
                championshipId={championshipId}
                rounds={rounds}
                readOnly={readOnly}
            />
            {!readOnly ? (
                <FormModal ref={modalRef}>
                    <AddChampionshipDayForm
                        key={addDayFormKey}
                        championshipId={championshipId}
                        championshipName={championshipName}
                        nextDayOrder={nextDayOrder}
                        defaultDate={defaultAddDayDate}
                        rangeCount={rangeCount}
                        rangeConfigs={rangeConfigs}
                        organizerClub={organizerClub}
                        onClose={closeDialog}
                    />
                </FormModal>
            ) : null}
        </section>
    )
}
