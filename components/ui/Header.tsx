import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-100">
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <span className="mr-2">
                <img src="/icons/android-chrome-512x512.png" alt="Wedding Invite Builder" width={32} height={32} />
            </span>
            <span className="text-sm sm:text-xl font-semibold">
                Wedding Invite Builder
            </span>
          </div>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link 
            href="/" 
            className="text-gray-500 hover:text-indigo-600 transition-colors mr-4"
          >
            Home
          </Link>
          <Link 
            href="/form" 
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Create
          </Link>
        </div>
      </nav>
    </header>
  );
} 