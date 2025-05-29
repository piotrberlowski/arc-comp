import { redirect } from "next/navigation";
import { auth } from "../auth";
import OrganizerCard from "./OrganizerCard";
import CreateOrganizerForm from "./CreateOrganizerForm";


export default async function OrganizersPage() {
    const session = await auth()
    if (!session?.externalAccount || !session?.isAdmin) {
        return redirect("/")
    }
    const res = await prisma?.user.findMany({
        where: {
            organizerRoles: {
                some: {}
            },
        },
        include: {
            organizerRoles: true,
        },
    }).then(
        organizers => { return { organizers: organizers, error: null } }
    ).catch(
        e => { return { organizers: [], error: e } }
    )

    if (res?.error) {
        return (
            <div role="alert" className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error! Failed to find any TOs: {res?.error}</span>
            </div>
        )
    }

    const organizers = res?.organizers

    return (
        <div className="bg-base-100">
            <ul className="mt-2 list rounded-box shadow-md gap-3">
                <li className="p-2 pb-2 text-2xl opacity-60 tracking-wide bg-primary text-primary-content rounded-sm">Tournament Organizers</li>
                <li className="list-row bg-base-300 w-full">
                    <div className="list-col-grow bg-accent text-accent-content text-xl p-1 px-4 rounded-sm">Add new Organizer</div>
                    <div className="list-col-wrap text-xs flex gap-2 flex-wrap">
                        <CreateOrganizerForm revalidate="/organizers" />
                    </div>
                </li>
                {organizers && organizers.map((to) => (<OrganizerCard key={`organizer-${to.id}`} to={to} revalidate="/organizers" />))}
            </ul>
        </div>
    )
}