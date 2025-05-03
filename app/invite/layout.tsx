import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Invitation",
  description: "A beautiful wedding invitation",
};

export default function InviteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
} 