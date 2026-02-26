import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, BookOpen, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      
      {}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-background via-zinc-900 to-background border-b border-border">
        
        {}
        <div className="mb-6 inline-flex items-center rounded-none border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-none bg-primary mr-2 animate-pulse"></span>
          Proyecto TFG 2025
        </div>

        {}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Tu viaje hacia el <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300">
            100% Completado
          </span>
        </h1>

        {}
        <p className="max-w-2xl text-lg text-muted-foreground mb-8 leading-relaxed">
          La plataforma definitiva para completistas. Fusionamos el seguimiento social 
          de tus juegos favoritos con las guías de trofeos más detalladas.
        </p>

        {}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/games">
            {}
            <Button size="lg" className="w-full sm:w-auto font-semibold h-12 px-8 text-base">
              Explorar Juegos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/login">
            {}
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
              Crear Cuenta
            </Button>
          </Link>
        </div>
      </section>

      {}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {}
          <div className="flex flex-col items-center text-center p-6 rounded-none bg-muted/40 border border-border hover:border-primary/50 transition-colors duration-300">
            <div className="h-14 w-14 bg-primary/10 rounded-none flex items-center justify-center mb-6">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Trackea tu Progreso</h3>
            <p className="text-muted-foreground">
              Olvida las hojas de cálculo. Lleva un registro visual de tus Platinos, 100% y juegos "dropped".
            </p>
          </div>

          {}
          <div className="flex flex-col items-center text-center p-6 rounded-none bg-muted/40 border border-border hover:border-primary/50 transition-colors duration-300">
            <div className="h-14 w-14 bg-primary/10 rounded-none flex items-center justify-center mb-6">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Guías Interactivas</h3>
            <p className="text-muted-foreground">
              Marca casillas en tiempo real. Guías creadas por la comunidad con detección de trofeos perdibles.
            </p>
          </div>

          {}
          <div className="flex flex-col items-center text-center p-6 rounded-none bg-muted/40 border border-border hover:border-primary/50 transition-colors duration-300">
            <div className="h-14 w-14 bg-primary/10 rounded-none flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Comunidad Social</h3>
            <p className="text-slate-400">
              Sigue a los mejores cazadores de trofeos, lee reseñas y comparte tus hazañas con amigos.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}