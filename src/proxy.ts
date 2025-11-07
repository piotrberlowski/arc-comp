import authConfig from "@/app/auth.config"
import NextAuth from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const { auth } = NextAuth(authConfig)

export async function proxy(request: NextRequest) {
  const session = await auth()
  
  // Add your middleware logic here
  // For now, just pass through
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|results).*)"],
}

