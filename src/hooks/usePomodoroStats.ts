import { useState, useEffect } from "react";

export type SessionType = "focus" | "short" | "long";

export interface Session {
    type: SessionType;
    duration: number; // segundos
    label: string;
}

export interface LogEntry {
  id: number;
  type: SessionType;
  minutes: number;
  startTime: string;
  endTime: string;
}

export function usePomodoroStats(isLoggedIn: boolean = false) {
  // 🔥 CAMBIO: Inicialización "Lazy"
  // En lugar de arrancar vacío, leemos localStorage DIRECTAMENTE en el estado inicial.
  // Así no hay "parpadeo" de datos vacíos.
  // Estado que guarda TODO el historial reciente (últimos 30 días)
  const [fullHistory, setFullHistory] = useState<LogEntry[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem("pomodoro_history");
      if (!saved) return [];

      const allHistory: LogEntry[] = JSON.parse(saved);
      const now = new Date();
      // 🔥 CAMBIO: Limitamos a 7 días por defecto (Plan Free/Guest)
      const daysToKeep = 7; 
      const cutOffDate = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);

      // Filtramos solo entradas de los últimos 7 días
      return allHistory.filter(
        (entry) => new Date(entry.endTime) >= cutOffDate,
      );
    } catch (error) {
      console.error("Error leyendo historial:", error);
      return [];
    }
  });

  // Cargar desde la Nube
  useEffect(() => {
    if (typeof window === "undefined" || !isLoggedIn) return;

    fetch('/api/pomodoros')
      .then(res => {
          if (res.ok) return res.json();
          return []; // Fallback a vacio si hay error o no autorizado
      })
      .then((cloudHistory: LogEntry[]) => {
          if (cloudHistory && Array.isArray(cloudHistory)) {
             setFullHistory(cloudHistory);
          }
      })
      .catch(() => {
          console.log("Modo Offline o Invitado: Usando historial local.");
      });
  }, [isLoggedIn]);

  const addSession = (type: SessionType, minutes: number, startTime: Date) => {
    const now = new Date();
    const newEntry: LogEntry = {
      id: Date.now(),
      type,
      minutes,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
    };

    const updatedHistory = [newEntry, ...fullHistory]; // Ponemos el nuevo al principio
    setFullHistory(updatedHistory);

    try {
      const existingRaw = localStorage.getItem("pomodoro_history");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem(
        "pomodoro_history",
        JSON.stringify([...existing, newEntry]),
      );
    } catch (e) {
      console.error("No se pudo guardar en localStorage", e);
    }

    if (isLoggedIn) {
        fetch('/api/pomodoros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                minutes,
                createdAt: now.getTime() // ✅ Usa endTime (cuando terminó), igual que localStorage
            })
        }).catch(err => console.log("No se pudo sincronizar con la nube:", err));
    }
  };

  // 1. Datos de HOY (Para compatibilidad con lo existente)
  const today = new Date().toLocaleDateString();
  const todaysHistory = fullHistory.filter(
    (entry) => new Date(entry.endTime).toLocaleDateString() === today
  );

  const totalFocusMinutes = todaysHistory
    .filter((h) => h.type === "focus")
    .reduce((acc, curr) => acc + curr.minutes, 0);

  // 2. Datos de la SEMANA (Lunes - Domingo)
  const getWeeklyStats = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)
      const distanceToMonday = (currentDay + 6) % 7; // Cuantos días atrás está el lunes
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() - distanceToMonday);
      mondayDate.setHours(0, 0, 0, 0);

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const stats = days.map(day => ({ day, minutes: 0, count: 0 }));

      fullHistory.forEach(entry => {
          const entryDate = new Date(entry.endTime);
          // Verificar si está en la semana actual (desde el Lunes 00:00)
          if (entryDate >= mondayDate && entry.type === 'focus') { // Solo contamos Focus para stats
              const dayIndex = (entryDate.getDay() + 6) % 7; // Convertir 0 (Sun) -> 6, 1 (Mon) -> 0
              if (stats[dayIndex]) {
                  stats[dayIndex].minutes += entry.minutes;
                  stats[dayIndex].count += 1;
              }
          }
      });
      return stats;
  };

  return {
    history: todaysHistory, // Mantenemos el nombre para no romper nada
    addSession,
    hours: Math.floor(totalFocusMinutes / 60),
    minutes: totalFocusMinutes % 60,
    sessionCount: todaysHistory.filter((h) => h.type === "focus").length,
    weeklyStats: getWeeklyStats() // ¡Nuevo!
  };
}
