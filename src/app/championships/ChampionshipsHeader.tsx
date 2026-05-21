"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"
import CreateChampionshipForm from "./CreateChampionshipForm"

export default function ChampionshipsHeader({ clubs }: { clubs: string[] }) {
    const modalRef = useRef<FormModalHandle>(null)

    return (
        <div className="w-full flex flex-wrap items-center gap-4 mt-2 mb-4 bg-primary p-5 rounded-sm">
            <h1 className="text-2xl font-semibold flex-1">My Championships</h1>
            <button
                type="button"
                className="btn btn-success"
                onClick={() => modalRef.current?.open()}
            >
                <PlusCircleIcon width={24} />
                New championship
            </button>
            <FormModal ref={modalRef}>
                <CreateChampionshipForm clubs={clubs} />
            </FormModal>
        </div>
    )
}
