import ConfirmingButton from "@/components/ConfirmingButton";
import { RoundFormat, Tournament } from "@/generated/prisma/browser";
import { ArchiveBoxArrowDownIcon, HandThumbUpIcon, PencilSquareIcon, ShareIcon } from "@heroicons/react/24/outline";
import { format } from 'date-fns';
import Form from "next/form";
import { useState } from "react";
import { getTournamentWithScoresStatus } from "./[tId]/scoreActions";
import SharingDrawer from "./[tId]/scores/SharingDrawer";
import { archiveTournament } from "./tournamentActions";

export default function TournamentCard({ tournament, onArchived }: { tournament: Tournament & { format: RoundFormat }, onArchived: (id: string) => void }) {
    const [data, setData] = useState(tournament)
    const [isSharingDrawerOpen, setIsSharingDrawerOpen] = useState(false)
    const [sharingData, setSharingData] = useState<{ tournament: { id: string, isPublished: boolean, isShared: boolean }, allScoresComplete: boolean } | null>(null)
    const [isLoadingSharing, setIsLoadingSharing] = useState(false)

    const handleOpenSharing = async () => {
        setIsLoadingSharing(true)
        try {
            const sharingInfo = await getTournamentWithScoresStatus(data.id)
            setSharingData(sharingInfo)
            setIsSharingDrawerOpen(true)
        } catch (error) {
            console.error("Failed to load sharing data:", error)
        } finally {
            setIsLoadingSharing(false)
        }
    }

    const handleSharingUpdated = async (updatedTournament: { id: string, isPublished: boolean, isShared: boolean }) => {
        // Update local tournament state
        setData(prev => ({
            ...prev,
            isPublished: updatedTournament.isPublished,
            isShared: updatedTournament.isShared
        }))

        // Refresh sharing data to get latest state
        try {
            const sharingInfo = await getTournamentWithScoresStatus(updatedTournament.id)
            setSharingData(sharingInfo)
        } catch (error) {
            console.error("Failed to refresh sharing data:", error)
        }
    }

    return (
        <div className="card w-96 bg-base-300 card-md shadow-sm">
            <div className="card-body">

                <div className="flex justify-between">
                    <span className="badge badge-sm badge-info">{data.format.name}</span>
                    {data.isArchive && (<span className="badge badge-sm badge-warning">Archived</span>)}
                </div>
                <div className="flex justify-between p-3 bg-secondary text-secondary-content rounded-md">
                    <h2 className="card-title text-xl">{data.name}</h2>
                    <span className="text-xl">{format(data.date, "yyyy-MM-dd")}</span>
                </div>
                {!data.isArchive && (
                    <div className="justify-end card-actions">
                        <Form action={`/tournaments/${data.id}`}>
                            <button className="btn btn-success btn-sm"><PencilSquareIcon width={24} />Manage</button>
                        </Form>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleOpenSharing}
                            disabled={isLoadingSharing}
                        >
                            <ShareIcon width={24} />
                            Sharing
                        </button>
                        <ConfirmingButton
                            action={() => archiveTournament(data.id)
                                .then(t => {
                                    setData(t)
                                    onArchived(t.id)
                                })}
                            baseButton={{
                                className: "btn btn-warning btn-sm",
                                children: (
                                    <>
                                        <ArchiveBoxArrowDownIcon width={24} />
                                        Archive
                                    </>
                                )
                            }}
                            confirmButton={{
                                className: "btn btn-warning btn-sm",
                                children: (
                                    <>
                                        <HandThumbUpIcon width={24} />
                                        Confirm?
                                    </>
                                )
                            }}
                        />
                    </div>
                )}
            </div>
            {sharingData && (
                <SharingDrawer
                    isOpen={isSharingDrawerOpen}
                    onClose={() => setIsSharingDrawerOpen(false)}
                    allScoresComplete={sharingData.allScoresComplete}
                    tournament={sharingData.tournament}
                    onSharingUpdated={handleSharingUpdated}
                />
            )}
        </div>
    )
}