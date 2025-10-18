import Link from "next/link";

export default function UnauthorizedOrganizer() {
    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content text-center">
                <div className="max-w-lg">
                    <h1 className="text-3xl font-bold">Become an Organizer!</h1>
                    <p className="py-6 flex flex-col">
                        <span className="w-full my-2">
                            {`You can't view this page, because you're not a Tournament Organizer.`}
                        </span>
                        <span className="w-full my-2">
                            Please send me an e-mail using the link below with your club name and your username to receive access.
                        </span>
                    </p>
                    <Link href={`mailto:piotr.berlowski@gmail.com`} className="btn btn-primary w-100">Reach Out!</Link>
                </div>
            </div>
        </div>
    )
}