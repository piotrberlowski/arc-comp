"use client"

import ConfirmingButton from "@/components/ConfirmingButton"
import { Organizer, User } from "@/generated/prisma/browser"
import { HandThumbUpIcon, TrashIcon } from "@heroicons/react/24/outline"
import { removeOrganizer } from "./organizersActions"

function OrganizerClubItem({ role, revalidate }: { role: Organizer, revalidate?: string }) {
    return (
        <div className="btn btn-accent w-100 flex px-0">
            <span className="flex-1">{role.club}</span>
            <ConfirmingButton
                action={() => removeOrganizer(role, revalidate)}
                baseButton={{
                    className: "btn btn-error",
                    children: (
                        <span className="flex flex-row">
                            Remove
                            <TrashIcon width={18} height={18} />
                        </span>
                    )
                }}
                confirmButton={{
                    className: "btn btn-error",
                    children: (
                        <span className="flex flex-row">
                            <HandThumbUpIcon width={18} height={18} />
                            Confirm?
                        </span>
                    )
                }}
            />
        </div>
    )
}

export default function OrganizerCard({ to, revalidate }: { to: User & { organizerRoles: Organizer[] }, revalidate?: string }) {

    return (
        <li className="list-row bg-base-300 w-full">
            <div className="list-col-grow bg-secondary text-secondary-content text-xl p-1 px-4 rounded-sm">{to.name}</div>
            <div className="list-col-wrap text-xs flex gap-2 flex-wrap">
                {to.organizerRoles.map((role) => (<OrganizerClubItem key={`${to.id}-role-${role.club}`} role={role} revalidate={revalidate} />))}
            </div>
        </li>
    )
}
