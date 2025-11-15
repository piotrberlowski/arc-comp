'use client'
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Account() {
    const {data: session} = useSession()
    const router = useRouter()
    
    const isAdmin = session?.isAdmin

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                {session?.user?.name || "Unauthenticated"}
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] shadow bg-base-200 rounded-box w-52">
                {isAdmin && (<li className="w-full p-0"><Link className="btn btn-neutral btn-sm btn-ghost" href="/organizers">TOs</Link></li>)}
                <li className="w-full p-0"><button className="btn btn-neutral btn-sm btn-ghost" onClick={() => {
                    signOut().then(() => router.refresh()).catch(e => {
                        console.error("Failed to sign out:", e)
                    });
                }
                }>Sign Out</button></li>
            </ul>
        </div>

    )
}