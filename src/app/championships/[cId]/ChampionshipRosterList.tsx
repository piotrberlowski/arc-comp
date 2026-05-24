"use client"

import ConfirmingButton from "@/components/ConfirmingButton"
import { InformationCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { removeChampionshipRegistration } from "../championshipActions"
import ChampionshipRosterDayCheckbox from "./ChampionshipRosterDayCheckbox"
import ChampionshipRosterDayEnrollAllButton from "./ChampionshipRosterDayEnrollAllButton"
import ChampionshipRosterEnrollAllDaysButton from "./ChampionshipRosterEnrollAllDaysButton"
import { championshipDetailContentClass } from "./championshipDetailLayout"

export type ChampionshipRegistrationRow = {
    id: string
    name: string
    membershipNo: string
    competitorNumber: number
    ageGroupId: string
    categoryId: string
    genderGroup: "F" | "M"
    ageGroupName: string
    categoryName: string
    club: string
    canRemove: boolean
}

export type ChampionshipRosterDayColumn = {
    dayOrder: number
    label: string
}

function EditRegistrationButton({
    readOnly,
    onEdit,
}: {
    readOnly: boolean
    onEdit: () => void
}) {
    if (readOnly) {
        return null
    }

    return (
        <button type="button" className="btn btn-info btn-xs" onClick={onEdit}>
            <PencilIcon width={16} />
            Edit
        </button>
    )
}

function RosterRowActions({
    championshipId,
    registration,
    canRemove,
    readOnly,
    onEdit,
}: {
    championshipId: string
    registration: ChampionshipRegistrationRow
    canRemove: boolean
    readOnly: boolean
    onEdit: () => void
}) {
    return (
        <div className="flex flex-wrap justify-end gap-1">
            <EditRegistrationButton readOnly={readOnly} onEdit={onEdit} />
            <RemoveRegistrationButton
                championshipId={championshipId}
                registrationId={registration.id}
                canRemove={canRemove}
                readOnly={readOnly}
            />
        </div>
    )
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
        return <span className="text-xs text-base-content/50">Enrolled — cannot remove</span>
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

function RosterEnrollmentHeader({
    championshipId,
    days,
    membershipNos,
    readOnly,
}: {
    championshipId: string
    days: ChampionshipRosterDayColumn[]
    membershipNos: string[]
    readOnly: boolean
}) {
    return (
        <tr className="text-xs text-base-content/70">
            <th className="font-normal">Competitor</th>
            {days.map((day) => (
                <th key={day.dayOrder} className="font-normal text-center min-w-12" title={day.label}>
                    <div className="flex flex-col items-center gap-0.5">
                        <span>D{day.dayOrder}</span>
                        <ChampionshipRosterDayEnrollAllButton
                            championshipId={championshipId}
                            dayOrder={day.dayOrder}
                            membershipNos={membershipNos}
                            readOnly={readOnly}
                        />
                    </div>
                </th>
            ))}
            <th className="font-normal text-right">Actions</th>
        </tr>
    )
}

function RosterEnrollmentRow({
    championshipId,
    registration,
    days,
    enrolledDayOrders,
    readOnly,
    onEditRegistration,
}: {
    championshipId: string
    registration: ChampionshipRegistrationRow
    days: ChampionshipRosterDayColumn[]
    enrolledDayOrders: Set<number>
    readOnly: boolean
    onEditRegistration: (registration: ChampionshipRegistrationRow) => void
}) {
    return (
        <tr className="align-top">
            <td>
                <div className="flex flex-col gap-1 py-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className="badge badge-primary badge-sm">#{registration.competitorNumber}</span>
                        <span className="font-medium">{registration.name}</span>
                    </div>
                    <p className="text-sm text-base-content/70">
                        {registration.membershipNo} · {registration.club}
                    </p>
                    <p className="text-sm text-base-content/70">
                        {registration.ageGroupName} · {registration.categoryName}
                    </p>
                </div>
            </td>
            {days.map((day) => (
                <td key={day.dayOrder} className="text-center">
                    <ChampionshipRosterDayCheckbox
                        championshipId={championshipId}
                        dayOrder={day.dayOrder}
                        membershipNo={registration.membershipNo}
                        isEnrolled={enrolledDayOrders.has(day.dayOrder)}
                        readOnly={readOnly}
                    />
                </td>
            ))}
            <td className="text-right">
                <RosterRowActions
                    championshipId={championshipId}
                    registration={registration}
                    canRemove={registration.canRemove}
                    readOnly={readOnly}
                    onEdit={() => onEditRegistration(registration)}
                />
            </td>
        </tr>
    )
}

export default function ChampionshipRosterList({
    championshipId,
    registrations,
    days,
    enrollmentByMembership,
    readOnly = false,
    onEditRegistration,
}: {
    championshipId: string
    registrations: ChampionshipRegistrationRow[]
    days: ChampionshipRosterDayColumn[]
    enrollmentByMembership: Record<string, number[]>
    readOnly?: boolean
    onEditRegistration?: (registration: ChampionshipRegistrationRow) => void
}) {
    if (registrations.length === 0) {
        return <p className="text-base-content/70">No competitors registered yet.</p>
    }

    if (days.length === 0) {
        return (
            <ul className={`flex flex-col gap-2 ${championshipDetailContentClass}`}>
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
                                <RosterRowActions
                                    championshipId={championshipId}
                                    registration={registration}
                                    canRemove={registration.canRemove}
                                    readOnly={readOnly}
                                    onEdit={() => onEditRegistration?.(registration)}
                                />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        )
    }

    const membershipNos = registrations.map((registration) => registration.membershipNo)

    return (
        <div className={`overflow-x-auto ${championshipDetailContentClass}`}>
            {!readOnly ? (
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div role="note" className="alert alert-info alert-soft py-2 flex-1 min-w-0">
                        <InformationCircleIcon className="w-5 h-5 shrink-0" />
                        <span className="text-sm">
                            Use All under a day column to enroll the full roster on that day, or use the checkboxes per competitor.
                        </span>
                    </div>
                    <ChampionshipRosterEnrollAllDaysButton
                        championshipId={championshipId}
                        days={days}
                        membershipNos={membershipNos}
                        readOnly={readOnly}
                    />
                </div>
            ) : null}
            <table className="table table-sm">
                <thead>
                    <RosterEnrollmentHeader
                        championshipId={championshipId}
                        days={days}
                        membershipNos={membershipNos}
                        readOnly={readOnly}
                    />
                </thead>
                <tbody>
                    {registrations.map((registration) => (
                        <RosterEnrollmentRow
                            key={registration.id}
                            championshipId={championshipId}
                            registration={registration}
                            days={days}
                            enrolledDayOrders={new Set(enrollmentByMembership[registration.membershipNo] ?? [])}
                            readOnly={readOnly}
                            onEditRegistration={onEditRegistration ?? (() => undefined)}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
