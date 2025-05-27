import { Bars3CenterLeftIcon } from "@heroicons/react/24/outline";
import getConfig from 'next/config';
import Link from "next/link";
import { SignIn } from "./login";
const { publicRuntimeConfig } = getConfig();

export default function Navigation({ className }: { className?: string }) {
    return (
        <div className={`navbar bg-base-300 ${className}`}>
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <Bars3CenterLeftIcon className="h-4 w-4" />
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link href="/">My Tournaments</Link></li>
                    </ul>
                </div>
                <Link className="btn btn-ghost text-sm" href="/">Arc-Comp<span className="p-0 m-0 hidden lg:inline">: Tournament Admin ({publicRuntimeConfig?.version})</span></Link>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link href="/">My Tournaments</Link></li>
                </ul>
            </div>
            <div className="navbar-end">
                <SignIn />
            </div>
        </div>
    )
}
