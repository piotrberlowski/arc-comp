'use client'

import { providerMap } from "@/app/auth"
import { useSearchParams } from "next/navigation"
import Image from 'next/image'
import { providerLogIn } from "@/app/api/auth/actions"

const SIGNIN_ERROR_URL = "/api/auth/error"
const PROVIDER_IMG_PATH = "https://authjs.dev/img/providers";

function ProviderButton({ providerId, providerName }: { providerId: string, providerName: string }) {
    const params = useSearchParams()
    return (
        <form className="w-full" action={async () => providerLogIn(providerId, params.get("callbackUrl") || undefined, SIGNIN_ERROR_URL)}>
            <button className="btn btn-secondary w-full">Sign in with {providerName}<Image src={`${PROVIDER_IMG_PATH}/${providerId}.svg`} alt={`${providerName} logo`} width={15} height={15} /></button>
        </form>
    )
}

export default function LoginProviderForm() {

    return (
        <div className="flex flex-col gap-2">
            {
                Object
                    .values(providerMap)
                    .map(
                        (provider) => (<ProviderButton key={`frm-login-${provider.id}`} providerId={provider.id} providerName={provider.name} />)
                    )
            }
        </div>
    )
}