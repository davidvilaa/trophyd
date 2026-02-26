import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      
      {}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-0"></div>

      {}
      <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900/80 border border-border shadow-2xl backdrop-blur-md rounded-none">
        
        <div className="flex flex-col items-center mb-8">
          <Gamepad2 className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Continúa tu camino hacia el 100%</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-muted-foreground">Username or E-mail</Label>
            <Input id="identifier" type="text" placeholder="tu@email.com" className="bg-background/50 border-input text-foreground rounded-none" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-muted-foreground">Password</Label>
              <Link href="#" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" className="bg-background/50 border-input text-foreground rounded-none" />
          </div>

          <Button className="w-full font-semibold mt-6 rounded-none">
            Login
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="text-primary hover:text-blue-400 hover:underline transition-colors">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}