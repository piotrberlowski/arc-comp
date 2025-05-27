import { auth } from "@/app/auth";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Navigation from "../components/Navigation";
import "./globals.css";


export const metadata: Metadata = {
  title: "Arc-Comp - Tournament Admin",
  description: "Archery Competition management solution",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()

  return (
    <html lang="en">
      <body className='h-dvh w-full flex flex-col px-2 relative'>
        <SessionProvider session={session}>
            <div className='flex-0 flex'>
              <Navigation className="flex-1" />
            </div>
            <main className="relative bg-base-100 align-top items-center w-full h-full">
              {children}
            </main>
        </SessionProvider>
      </body>
    </html>
  );
}
