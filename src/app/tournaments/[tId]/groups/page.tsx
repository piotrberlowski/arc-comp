import { ErrorContextProvider } from "@/components/errors/ErrorContext"
import { getTournamentGroups } from "../groupActions"
import { TournamentEditContextProvider } from "../TournamentContext"
import TournamentEditForm from "../TournamentEditForm"
import TournamentNavigation from "../TournamentNavigation"
import GroupAssignmentView from "./GroupAssignmentView"

export default async function TournamentGroupsPage({
    params
}: {
    params: Promise<{ tId: string }>
}) {
    const { tId } = await params
    const groupsData = await getTournamentGroups(tId)

    return (
        <div className="w-full min-h-max">
            <TournamentEditContextProvider tournament={groupsData.tournament}>
                <ErrorContextProvider>
                    <TournamentEditForm />
                    <TournamentNavigation tournamentId={tId} />
                    <div className="border border-secondary border-solid w-full min-h-max">
                        <GroupAssignmentView
                            groupsData={groupsData}
                        />
                    </div>
                </ErrorContextProvider>
            </TournamentEditContextProvider>
        </div>
    )
}
