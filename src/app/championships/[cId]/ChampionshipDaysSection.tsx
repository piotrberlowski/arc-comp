"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import { nextChampionshipDayDefaultDate, nextChampionshipDayOrder } from "@/lib/championshipDayNaming"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useMemo, useRef, useState } from "react"
import AddChampionshipDayForm, { type ChampionshipRangeConfigSummary } from "./AddChampionshipDayForm"
import AddChampionshipShootoffForm from "./AddChampionshipShootoffForm"
import ChampionshipRoundsList, { type ChampionshipRoundRow } from "./ChampionshipRoundsList"

function DaysSectionActions({
    canAddDay,
    canAddShootoff,
    onAddDay,
    onAddShootoff,
}: {
    canAddDay: boolean
    canAddShootoff: boolean
    onAddDay: () => void
    onAddShootoff: () => void
}) {
    if (!canAddDay) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2">
            {canAddShootoff ? (
                <button type="button" className="btn btn-outline btn-sm" onClick={onAddShootoff}>
                    <PlusCircleIcon width={20} />
                    Add shootoff
                </button>
            ) : null}
            <button type="button" className="btn btn-success btn-sm" onClick={onAddDay}>
                <PlusCircleIcon width={20} />
                Add day
            </button>
        </div>
    )
}

export default function ChampionshipDaysSection({
    championshipId,
    championshipName,
    organizerClub,
    rangeCount,
    rangeConfigs,
    rounds,
    hasShootoff,
    readOnly = false,
}: {
    championshipId: string
    championshipName: string
    organizerClub: string
    rangeCount: number
    rangeConfigs: ChampionshipRangeConfigSummary[]
    rounds: ChampionshipRoundRow[]
    hasShootoff: boolean
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
    const addDayModalRef = useRef<FormModalHandle>(null)
    const shootoffModalRef = useRef<FormModalHandle>(null)
    const [addDayFormKey, setAddDayFormKey] = useState(0)
    const [shootoffFormKey, setShootoffFormKey] = useState(0)

    function openAddDayDialog() {
        setAddDayFormKey((key) => key + 1)
        addDayModalRef.current?.open()
    }

    function openShootoffDialog() {
        setShootoffFormKey((key) => key + 1)
        shootoffModalRef.current?.open()
    }

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-medium">Days (by order)</h2>
                <DaysSectionActions
                    canAddDay={!readOnly}
                    canAddShootoff={!readOnly && !hasShootoff && rounds.length > 0}
                    onAddDay={openAddDayDialog}
                    onAddShootoff={openShootoffDialog}
                />
            </div>
            <ChampionshipRoundsList
                championshipId={championshipId}
                rounds={rounds}
                readOnly={readOnly}
            />
            {!readOnly ? (
                <>
                    <FormModal ref={addDayModalRef}>
                        <AddChampionshipDayForm
                            key={addDayFormKey}
                            championshipId={championshipId}
                            championshipName={championshipName}
                            nextDayOrder={nextDayOrder}
                            defaultDate={defaultAddDayDate}
                            rangeCount={rangeCount}
                            rangeConfigs={rangeConfigs}
                            organizerClub={organizerClub}
                            onClose={() => addDayModalRef.current?.close()}
                        />
                    </FormModal>
                    <FormModal ref={shootoffModalRef}>
                        <AddChampionshipShootoffForm
                            key={shootoffFormKey}
                            championshipId={championshipId}
                            championshipName={championshipName}
                            defaultDate={defaultAddDayDate}
                            organizerClub={organizerClub}
                            onClose={() => shootoffModalRef.current?.close()}
                        />
                    </FormModal>
                </>
            ) : null}
        </section>
    )
}
