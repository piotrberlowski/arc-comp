"use client"

import MedalIcon from "@/app/tournaments/[tId]/components/MedalIcon"
import FormModal, { type FormModalHandle } from "@/components/FormModal"
import type { ChampionshipMedalCount } from "@/lib/championshipMedalCount"
import { TrophyIcon } from "@heroicons/react/24/outline"
import { useRef } from "react"

function MedalCountRow({
    place,
    label,
    count,
}: {
    place: number
    label: string
    count: number
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <span className="flex items-center gap-2 text-base">
                <MedalIcon place={place} />
                {label}
            </span>
            <span className="font-mono text-2xl font-semibold">{count}</span>
        </div>
    )
}

function ChampionshipMedalCountBody({ medalCount }: { medalCount: ChampionshipMedalCount }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Medals needed</h2>
            <p className="text-sm text-base-content/70">
                Combined standings: one gold per occupied category, silver only with 2+ competitors, bronze only
                with 3+.
            </p>
            <div className="divide-y divide-base-300">
                <MedalCountRow place={1} label="Gold" count={medalCount.gold} />
                <MedalCountRow place={2} label="Silver" count={medalCount.silver} />
                <MedalCountRow place={3} label="Bronze" count={medalCount.bronze} />
            </div>
        </div>
    )
}

export default function ChampionshipMedalCountButton({
    medalCount,
}: {
    medalCount: ChampionshipMedalCount
}) {
    const modalRef = useRef<FormModalHandle>(null)

    return (
        <>
            <button type="button" className="btn btn-primary btn-sm gap-1" onClick={() => modalRef.current?.open()}>
                <TrophyIcon className="w-4 h-4" />
                Medals
            </button>
            <FormModal ref={modalRef}>
                <ChampionshipMedalCountBody medalCount={medalCount} />
            </FormModal>
        </>
    )
}
