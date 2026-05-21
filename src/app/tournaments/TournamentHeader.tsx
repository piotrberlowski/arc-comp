"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"
import CreateTournamentForm from "./CreateTournamentForm"

export default function TournamentHeader({ clubs }: { clubs: string[] }) {
    const modalRef = useRef<FormModalHandle>(null)

    return (
        <div className="w-full flex mt-5 bg-primary p-5 rounded-sm">
            <div className="w-40">{/** spacer */}</div>
            <h1 className="text-3xl flex flex-1 justify-center">
                <span>Managed Tournaments</span>
            </h1>
            <button
                type="button"
                className="btn btn-success w-40 text-lg"
                onClick={() => modalRef.current?.open()}
            >
                <PlusCircleIcon width={24} />
                Create New
            </button>
            <FormModal ref={modalRef}>
                <CreateTournamentForm clubs={clubs} />
            </FormModal>
        </div>
    )
}
