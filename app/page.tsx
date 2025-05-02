import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wedding Invite Builder - Create Beautiful Digital Invitations",
  description: "Create and share beautiful wedding invitations online—customize names, dates, venues, and download as an image with QR codes.",
};

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center flex-1 px-6 py-12 md:py-24 text-center max-w-4xl mx-auto pt-0 mb-4">
      {/* <h1 className="text-4xl md:text-5xl font-bold mb-6 text-indigo-600">
        Welcome to Wedding Invite Builder
      </h1> */}
      <img src="/icons/main.png" alt="Wedding Invite Builder" className="w-1/2 h-1/2" />
      
      <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl">
        Create and share beautiful wedding invitations online—customize names, dates, venues, and download as an image with QR codes.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto mb-4">
        <Link
          href="/form"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex-1 text-center"
        >
          Start Creating
        </Link>
        
      </div>
    </section>
  );
}
