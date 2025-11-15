'use client'

import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"
import CreateTournamentForm from "./CreateTournamentForm"

export default function TournamentHeader({ clubs }: { clubs: string[] }) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    return (
        <div className="w-full flex mt-5 bg-primary p-5 rounded-sm">
            <div className="w-40">{/** spacer */}</div>
            <h1 className="text-3xl flex flex-1 justify-center"><span>Managed Tournaments</span></h1>
            <button className="btn btn-success w-40 text-lg" onClick={() => {
                try {
                    dialogRef?.current?.showModal()
                } catch (error) {
                    console.error(error)
                }
            }
            }><PlusCircleIcon width={24} />Create New</button>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box p-10">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <CreateTournamentForm clubs={clubs} />
                </div>
            </dialog>
        </div>
    )
}