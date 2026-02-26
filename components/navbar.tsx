import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2, Search } from "lucide-react";

export default function Navbar() {
  const user = null; 

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {}
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-xl tracking-tight">
              Platinum<span className="text-primary">Log</span>
            </span>
          </Link>

          {}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/games" className="hover:text-foreground transition-colors">Juegos</Link>
            <Link href="/guides" className="hover:text-foreground transition-colors">Guías</Link>
            <Link href="/community" className="hover:text-foreground transition-colors">Comunidad</Link>
          </div>

          {}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-none">
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <div className="h-8 w-8 bg-primary rounded-none"></div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="hover:text-primary rounded-none">Log In</Button>
                </Link>
                <Link href="/register">
                  {}
                  <Button className="rounded-none">
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