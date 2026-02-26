import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2, Search } from "lucide-react";

export default function Navbar() {
  const user = null; 

  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {}
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 className="h-8 w-8 text-emerald-500 group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-xl tracking-tight">
              Platinum<span className="text-emerald-500">Log</span>
            </span>
          </Link>

          {}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/games" className="hover:text-white transition-colors">Juegos</Link>
            <Link href="/guides" className="hover:text-white transition-colors">Guías</Link>
            <Link href="/community" className="hover:text-white transition-colors">Comunidad</Link>
          </div>

          {}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <div className="h-8 w-8 bg-emerald-500 rounded-full"></div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="hover:text-emerald-400">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}