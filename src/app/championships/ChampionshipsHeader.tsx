"use client"

import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"
import CreateChampionshipForm from "./CreateChampionshipForm"

export default function ChampionshipsHeader({ clubs }: { clubs: string[] }) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    return (
        <div className="w-full flex flex-wrap items-center gap-4 mt-2 mb-4 bg-primary p-5 rounded-sm">
            <h1 className="text-2xl font-semibold flex-1">My Championships</h1>
            <button
                type="button"
                className="btn btn-success"
                onClick={() => dialogRef.current?.showModal()}
            >
                <PlusCircleIcon width={24} />
                New championship
            </button>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box p-10">
                    <form method="dialog">
                        <button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                            ✕
                        </button>
                    </form>
                    <CreateChampionshipForm clubs={clubs} />
                </div>
            </dialog>
        </div>
    )
}
