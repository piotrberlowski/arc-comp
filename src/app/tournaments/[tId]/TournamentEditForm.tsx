'use client'
import { CheckCircleIcon, ExclamationCircleIcon, PencilSquareIcon, XCircleIcon } from "@heroicons/react/24/outline"
import { notFound } from "next/navigation"
import { useState } from "react"
import TournamentDayPicker from "../TournamentDayPicker"
import useTournamentContext, { TournamentEditController } from "./TournamentContext"

function TournamentDetailsDisplay({ onEdit }: { onEdit: () => void }) {
    const ctrl = useTournamentContext()
    if (!ctrl) {
        notFound()
    }

    return (
        <>
            <div className="grow hidden md:flex max-w-fit text-lg">
                {ctrl.getTournament().organizerClub}
            </div>
            <div className="flex-1 text-left md:text-center text-base md:text-2xl">
                {ctrl.getTournament().name}
            </div>
            <div className="flex-0 min-w-fit max-w-fit text-sm md:text-xl">
                {ctrl.getTournamentDate()}
                <PencilSquareIcon className="btn btn-sm btn-primary pr-0 mr-0 w-8 h-8 md:w-10 md:h-10" onClick={onEdit} />
            </div>
        </>
    )

}

function TournamentDetailsEdit({ onClose }: { onClose: (e?: string) => void }) {
    const ctrl = useTournamentContext()
    if (!ctrl) {
        notFound()
    }
    const [name, setName] = useState(ctrl.getTournament().name)
    const [date, setDate] = useState(ctrl.getTournament().date)
    const [updating, setUpdating] = useState(false)

    function onSave(c: TournamentEditController) {
        setUpdating(true)
        c.updateTournament(
            {
                name: name,
                date: date,
            },
            (e) => {
                setUpdating(false)
                onClose(e)
            }
        )
    }

    return (
        <>
            <div className="flex-1 text-left md:text-center h-full p-0 flex">
                <input type="text" className="input input-primary text-xl text-center items-center mx-auto h-full p-0" value={name} onChange={(evt) => setName(evt.target.value)} />
            </div>
            <div className="flex-0 w-fit text-xl flex items-center">
                <span className="w-fit items-center"><TournamentDayPicker date={date} onChange={setDate} /></span>
                {
                    updating ? (
                        <span className="loading loading-ring loading-md"></span>
                    ) : (
                        <>
                            <span className="flex-0"><CheckCircleIcon width={24} className="btn btn-md btn-primary flex-0 p-0 mx-2" onClick={() => onSave(ctrl)} /></span>
                            <span className="flex-0"><XCircleIcon width={24} className="btn btn-md btn-primary flex-0 p-0 mx-2 my-0" onClick={() => onClose()} /></span>
                        </>
                    )
                }
            </div>
        </>
    )
}

function TournamentDetailsHeader({ onError }: { onError: (e: string) => void }) {
    const [isEdittingHeader, setEdittingHeader] = useState(false)
    if (isEdittingHeader) {
        return (
            <TournamentDetailsEdit onClose={(e?: string) => {
                setEdittingHeader(false)
                if (!!e) {
                    onError(e)
                }
            }} />
        )
    } else {
        return (
            <TournamentDetailsDisplay onEdit={() => setEdittingHeader(true)} />
        )
    }


}

export default function TournamentEditForm() {
    const [error, setError] = useState<string | undefined>(undefined)
    const tEdit = useTournamentContext()
    return (

        <div className="mb-1">
            <div className="flex w-full">
                <h1 className="flex-1 mx-auto text-3xl bg-primary text-primary-content text-center p-4 mt-2 rounded-t-md justify-between flex">
                    <TournamentDetailsHeader onError={setError} />
                </h1>
            </div>
            <div role="alert" className={`alert alert-error ${!error && 'hidden'}`}>
                <ExclamationCircleIcon width={20} className="w-fit" />
                <span>{error}</span>
                <div>
                    <button className="btn btn-sm btn-error" onClick={() => setError(undefined)}><XCircleIcon width={20} className="w-fit" /></button>
                </div>
            </div>
        </div>
    )
}