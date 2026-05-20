import Link from "next/link"

export default function UnauthorizedChampionshipOrganizer() {
    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content text-center">
                <div className="max-w-lg">
                    <h1 className="text-3xl font-bold">Championship access required</h1>
                    <p className="py-6 flex flex-col">
                        <span className="w-full my-2">
                            You need the Championship Organizer upgrade for at least one club to use My Championships.
                        </span>
                        <span className="w-full my-2">
                            You must already be a Tournament Organizer for that club. Ask an admin to enable the upgrade on the TOs page.
                        </span>
                    </p>
                    <Link href="/tournaments" className="btn btn-primary">My Tournaments</Link>
                </div>
            </div>
        </div>
    )
}
