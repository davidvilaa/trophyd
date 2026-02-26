import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
        
        <div className="flex flex-col items-center mb-8">
          <Gamepad2 className="h-12 w-12 text-emerald-500 mb-2" />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-slate-400 text-sm mt-2">Continúa tu camino hacia el 100%</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-slate-300">Username or E-mail</Label>
            <Input id="identifier" type="text" placeholder="tu@email.com" className="bg-slate-950/50 border-slate-700 text-white" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
            </div>
            <Input id="password" type="password" placeholder="••••••••" className="bg-slate-950/50 border-slate-700 text-white" />
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-6">
            Login
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}