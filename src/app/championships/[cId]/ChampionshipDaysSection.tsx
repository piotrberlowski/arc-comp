"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import { nextChampionshipDayOrder } from "@/lib/championshipDayNaming"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"
import AddChampionshipDayForm from "./AddChampionshipDayForm"
import ChampionshipRoundsList, { type ChampionshipRoundRow } from "./ChampionshipRoundsList"

export default function ChampionshipDaysSection({
    championshipId,
    championshipName,
    organizerClub,
    rounds,
}: {
    championshipId: string
    championshipName: string
    organizerClub: string
    rounds: ChampionshipRoundRow[]
}) {
    const nextDayOrder = nextChampionshipDayOrder(rounds)
    const modalRef = useRef<FormModalHandle>(null)

    function closeDialog() {
        modalRef.current?.close()
    }

    return (
        <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-medium">Days (by order)</h2>
                <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => modalRef.current?.open()}
                >
                    <PlusCircleIcon width={20} />
                    Add day
                </button>
            </div>
            <ChampionshipRoundsList championshipId={championshipId} rounds={rounds} />
            <FormModal ref={modalRef}>
                <AddChampionshipDayForm
                    championshipId={championshipId}
                    championshipName={championshipName}
                    nextDayOrder={nextDayOrder}
                    organizerClub={organizerClub}
                    onClose={closeDialog}
                />
            </FormModal>
        </section>
    )
}
