import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900/80 border border-border shadow-2xl backdrop-blur-md rounded-none">
        
        <div className="flex flex-col items-center mb-8">
          <Gamepad2 className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Platinum<span className="text-primary">Log</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Crea tu cuenta de completista</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground">Username</Label>
            <Input id="username" type="text" placeholder="NinjaTrophy99" className="bg-background/50 border-input text-foreground rounded-none" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">E-mail</Label>
            <Input id="email" type="email" placeholder="tu@email.com" className="bg-background/50 border-input text-foreground rounded-none" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" className="bg-background/50 border-input text-foreground rounded-none" />
          </div>

          <Button className="w-full font-semibold mt-6 rounded-none">
            Register
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-primary hover:text-blue-400 hover:underline transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}