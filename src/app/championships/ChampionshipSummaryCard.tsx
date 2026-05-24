"use client"

import ConfirmingButton from "@/components/ConfirmingButton"
import Link from "next/link"
import {
    ArchiveBoxArrowDownIcon,
    ArrowUturnUpIcon,
    HandThumbUpIcon,
} from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { archiveChampionship, unarchiveChampionship, type ChampionshipShellRow } from "./championshipActions"
import { competitorsRegisteredLabel } from "./competitorsRegisteredLabel"

export default function ChampionshipSummaryCard({
    row,
    isAdmin,
    onArchived,
    onUnarchived,
}: {
    row: ChampionshipShellRow
    isAdmin: boolean
    onArchived: (id: string) => void
    onUnarchived: (row: ChampionshipShellRow) => void
}) {
    const router = useRouter()
    const [data, setData] = useState(row)
    const dayCount = data.rounds.length
    const regCount = data._count.registrations

    return (
        <div className="card w-full max-w-md bg-base-300 shadow-sm">
            <div className="card-body gap-2">
                <div className="flex flex-wrap gap-2">
                    <span className="badge badge-info badge-outline">{data.organizerClub}</span>
                    {data.isArchive ? <span className="badge badge-warning">Archived</span> : null}
                </div>
                <h2 className="card-title text-base md:text-lg">{data.name}</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                    <span className="badge badge-ghost">{dayCount} day{dayCount === 1 ? "" : "s"}</span>
                    <span className="badge badge-ghost">{competitorsRegisteredLabel(regCount)}</span>
                </div>
                <div className="card-actions justify-end flex-wrap gap-2">
                    <Link className="btn btn-primary btn-sm" href={`/championships/${data.id}`}>
                        Open
                    </Link>
                    {!data.isArchive ? (
                        <ConfirmingButton
                            className="inline"
                            action={() =>
                                archiveChampionship(data.id).then((updated) => {
                                    setData(updated)
                                    onArchived(updated.id)
                                    router.refresh()
                                })
                            }
                            baseButton={{
                                className: "btn btn-warning btn-sm",
                                children: (
                                    <>
                                        <ArchiveBoxArrowDownIcon width={16} />
                                        Archive
                                    </>
                                ),
                            }}
                            confirmButton={{
                                className: "btn btn-warning btn-sm",
                                children: (
                                    <>
                                        <HandThumbUpIcon width={16} />
                                        Confirm?
                                    </>
                                ),
                            }}
                        />
                    ) : null}
                    {data.isArchive && isAdmin ? (
                        <ConfirmingButton
                            className="inline"
                            action={() =>
                                unarchiveChampionship(data.id).then((updated) => {
                                    setData(updated)
                                    onUnarchived(updated)
                                    router.refresh()
                                })
                            }
                            baseButton={{
                                className: "btn btn-info btn-sm",
                                children: (
                                    <>
                                        <ArrowUturnUpIcon width={16} />
                                        Unarchive
                                    </>
                                ),
                            }}
                            confirmButton={{
                                className: "btn btn-info btn-sm",
                                children: (
                                    <>
                                        <HandThumbUpIcon width={16} />
                                        Confirm?
                                    </>
                                ),
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    )
}
