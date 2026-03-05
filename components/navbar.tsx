"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Gamepad2, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {}
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <span className="font-bold text-2xl tracking-tighter text-foreground">
              Trophy<span className="text-primary font-black">d</span>
            </span>
          </Link>

          {}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-10 opacity-0"></div>
            ) : !user ? (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-none hover:text-primary">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-none font-bold">
                    Registro
                  </Button>
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 rounded-full bg-zinc-800 border-2 border-primary flex items-center justify-center overflow-hidden hover:scale-105 transition-transform">
                    {}
                    <User className="text-primary h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="rounded-none border-border bg-zinc-900 w-48 mt-2">
                  {}
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <hr className="border-zinc-800 my-1" />
                  
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-primary focus:text-white">
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-primary focus:text-white">
                    <Settings className="h-4 w-4" />
                    <span>Ajustes</span>
                  </DropdownMenuItem>
                  
                  <hr className="border-zinc-800 my-1" />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 text-red-500 focus:bg-red-500 focus:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}