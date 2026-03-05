"use sign";
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos, bro. ¡Revisa esos dedos!");
      setLoading(false);
      return;
    }

    router.push("/"); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900/80 border border-border shadow-2xl backdrop-blur-md rounded-none">
        
        <div className="flex flex-col items-center mb-8">
          <Gamepad2 className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Continúa tu camino hacia el 100%</p>
        </div>

        {}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" 
              className="bg-background/50 border-input text-foreground rounded-none" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-muted-foreground">Password</Label>
              <Link href="#" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="bg-background/50 border-input text-foreground rounded-none" 
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full font-bold mt-6 rounded-none">
            {loading ? "Entrando a la Matrix..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="text-primary hover:brightness-110 hover:underline transition-all">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}