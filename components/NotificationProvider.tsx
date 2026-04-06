"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { X } from "lucide-react";

type NotificationType = { titulo: string; mensaje: string } | null;
type NotificationContextType = {
  showNotification: (titulo: string, mensaje: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificacion, setNotificacion] = useState<NotificationType>(null);
  const [isClosing, setIsClosing] = useState(false);

  const showNotification = (titulo: string, mensaje: string) => {
    setNotificacion({ titulo, mensaje });
    setIsClosing(false);
    
    setTimeout(() => {
      cerrarNotificacion();
    }, 3000);
  };

  const cerrarNotificacion = () => {
    setIsClosing(true);
    setTimeout(() => {
      setNotificacion(null);
      setIsClosing(false);
    }, 500);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {notificacion && (
        <div 
          style={{ 
            position: "fixed", top: "80px", left: "20px", 
            zIndex: 999999, opacity: isClosing ? 0 : 1, transition: "opacity 0.5s ease-in-out", 
          }}
        >
          <div role="tooltip" style={{ position: "relative", width: "660px", maxWidth: "90vw" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px", color: "#000" }}>
                {notificacion.titulo}
              </span>
              
              <button 
                onClick={cerrarNotificacion}
                style={{ minWidth: "20px", height: "20px", padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
              {notificacion.mensaje}
            </p>

          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("Falta envolver la app en el NotificationProvider");
  return context;
};