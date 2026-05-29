import Link from "next/link"
import { listPublicChampionships } from "./championshipResultsActions"

function formatDateRange(firstDate: Date | null, lastDate: Date | null): string {
    if (!firstDate || !lastDate) {
        return "Dates TBD"
    }

    const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })
    if (firstDate.getTime() === lastDate.getTime()) {
        return formatter.format(firstDate)
    }

    return `${formatter.format(firstDate)} – ${formatter.format(lastDate)}`
}

export default async function PublicChampionshipResultsIndexPage() {
    const championships = await listPublicChampionships()

    return (
        <div className="w-full p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Championship Results</h1>
                <p className="text-base-content/70 mb-6">
                    Multi-day championships with published combined standings and group allocations.
                </p>

                {championships.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-base-content/70">No published championship results available</p>
                        <p className="text-sm text-base-content/50 mt-2">Check back later for championship results</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {championships.map((championship) => (
                            <div key={championship.id} className="card shadow-md">
                                <div className="card-body bg-secondary/50 rounded-lg">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h2 className="card-title">{championship.name}</h2>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70">
                                                <span>{championship.organizerClub}</span>
                                                <span>
                                                    {championship.dayCount} day{championship.dayCount === 1 ? "" : "s"}
                                                </span>
                                                <span>{formatDateRange(championship.firstDate, championship.lastDate)}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/results/championships/${championship.id}`}
                                            className="btn btn-primary "
                                        >
                                            View results
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
