import { headers } from "next/headers"

export async function getRequestOrigin(): Promise<string> {
    const headerList = await headers()
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
    if (!host) {
        return "http://localhost:3000"
    }
    const protocol =
        headerList.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    return `${protocol}://${host}`
}
