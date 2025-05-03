'use client';

import Header from "@/components/ui/Header";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInvitePage = pathname.startsWith("/invite");

  if (isInvitePage) {
    return children;
  }

  return (
    <>
      {/* <Header /> */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </>
  );
} 