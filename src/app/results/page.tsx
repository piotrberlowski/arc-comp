import Link from "next/link"
import { prismaOrThrow } from "../../../lib/prisma"

export default async function ResultsPage() {
    const publishedTournaments = await prismaOrThrow("get published tournaments").tournament.findMany({
        where: {
            isPublished: true
        },
        include: {
            format: true
        },
        orderBy: {
            date: 'desc'
        }
    })

    return (
        <div className="w-full p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Tournament Results</h1>

                {publishedTournaments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-base-content/70">No published results available</p>
                        <p className="text-sm text-base-content/50 mt-2">Check back later for tournament results</p>
                        <p className="text-xs text-base-content/40 mt-4">
                            Tournament results are published here once all scores are submitted and finalized.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {publishedTournaments.map((tournament) => (
                            <div key={tournament.id} className="card bg-base-100 shadow-md">
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="card-title">{tournament.name}</h2>
                                            <div className="flex items-center gap-4 text-sm text-base-content/70">
                                                <span>{tournament.date.toLocaleDateString()}</span>
                                                <span>{tournament.organizerClub}</span>
                                                <span>{tournament.format.name}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/results/${tournament.id}`}
                                            className="btn btn-primary"
                                        >
                                            View Results
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
