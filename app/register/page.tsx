import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      
      {}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0"></div>

      {}
      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
        
        {}
        <div className="flex flex-col items-center mb-8">
          <Gamepad2 className="h-12 w-12 text-emerald-500 mb-2" />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Platinum<span className="text-emerald-500">Log</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Crea tu cuenta de completista</p>
        </div>

        {}
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">Username</Label>
            <Input id="username" type="text" placeholder="NinjaTrophy99" className="bg-slate-950/50 border-slate-700 text-white" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">E-mail</Label>
            <Input id="email" type="email" placeholder="tu@email.com" className="bg-slate-950/50 border-slate-700 text-white" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" className="bg-slate-950/50 border-slate-700 text-white" />
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-6">
            Register
          </Button>
        </form>

        {}
        <div className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}