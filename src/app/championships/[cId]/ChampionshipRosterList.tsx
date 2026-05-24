"use client"

import ConfirmingButton from "@/components/ConfirmingButton"
import { TrashIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { removeChampionshipRegistration } from "../championshipActions"

export type ChampionshipRegistrationRow = {
    id: string
    name: string
    membershipNo: string
    competitorNumber: number
    ageGroupName: string
    categoryName: string
    club: string
    canRemove: boolean
}

function RemoveRegistrationButton({
    championshipId,
    registrationId,
    canRemove,
    readOnly,
}: {
    championshipId: string
    registrationId: string
    canRemove: boolean
    readOnly: boolean
}) {
    const router = useRouter()

    if (readOnly) {
        return null
    }

    if (!canRemove) {
        return <span className="text-xs text-base-content/50">Enrolled on a day — cannot remove</span>
    }

    return (
        <ConfirmingButton
            className="inline"
            action={() =>
                removeChampionshipRegistration(championshipId, registrationId).then(() => router.refresh())
            }
            baseButton={{
                className: "btn-error btn-xs",
                children: (
                    <>
                        <TrashIcon width={16} />
                        Remove
                    </>
                ),
            }}
            confirmButton={{
                className: "btn-warning btn-xs",
                children: <>Confirm remove</>,
            }}
        />
    )
}

export default function ChampionshipRosterList({
    championshipId,
    registrations,
    readOnly = false,
}: {
    championshipId: string
    registrations: ChampionshipRegistrationRow[]
    readOnly?: boolean
}) {
    if (registrations.length === 0) {
        return <p className="text-base-content/70">No competitors registered yet.</p>
    }

    return (
        <ul className="flex flex-col gap-2 w-full max-w-3xl">
            {registrations.map((registration) => (
                <li key={registration.id} className="card bg-base-200 shadow-sm">
                    <div className="card-body gap-2 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="badge badge-primary">#{registration.competitorNumber}</span>
                                    <span className="font-medium">{registration.name}</span>
                                </div>
                                <p className="text-sm text-base-content/70">
                                    {registration.membershipNo} · {registration.club}
                                </p>
                                <p className="text-sm text-base-content/70">
                                    {registration.ageGroupName} · {registration.categoryName}
                                </p>
                            </div>
                        <RemoveRegistrationButton
                            championshipId={championshipId}
                            registrationId={registration.id}
                            canRemove={registration.canRemove}
                            readOnly={readOnly}
                        />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}
