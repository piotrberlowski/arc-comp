'use client'

import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { DialogHTMLAttributes, useRef } from "react"

export default function TournamentHeader() {
    const dialogRef = useRef<HTMLDialogElement>(null)
    return (
        <div className="w-full flex mt-5 bg-primary p-5 rounded-sm">
            <div className="w-40">{/** spacer */}</div>
            <h1 className="text-3xl flex flex-1 justify-center"><span>Managed Tournaments</span></h1>
            <button className="btn btn-success w-40 text-lg" onClick={() => dialogRef?.current?.showModal()}><PlusCircleIcon width={24} />Create New</button>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                </div>
            </dialog>
        </div>
    )
}