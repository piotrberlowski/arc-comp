"use client"

import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"
import AddChampionshipDayForm from "./AddChampionshipDayForm"
import ChampionshipRoundsList, { type ChampionshipRoundRow } from "./ChampionshipRoundsList"

export default function ChampionshipDaysSection({
    championshipId,
    organizerClub,
    rounds,
}: {
    championshipId: string
    organizerClub: string
    rounds: ChampionshipRoundRow[]
}) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    function closeDialog() {
        dialogRef.current?.close()
    }

    return (
        <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-medium">Days (by order)</h2>
                <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => dialogRef.current?.showModal()}
                >
                    <PlusCircleIcon width={20} />
                    Add day
                </button>
            </div>
            <ChampionshipRoundsList championshipId={championshipId} rounds={rounds} />
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box max-w-lg p-10">
                    <form method="dialog">
                        <button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                            ✕
                        </button>
                    </form>
                    <AddChampionshipDayForm
                        championshipId={championshipId}
                        organizerClub={organizerClub}
                        onClose={closeDialog}
                    />
                </div>
            </dialog>
        </section>
    )
}
