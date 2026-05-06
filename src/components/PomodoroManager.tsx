/** @jsxImportSource react */
import { useState, useEffect } from "react";
import TimerSetup from "./TimerSetup";
import TimerRun from "./TimerRun"; 
import HeroSection from "./HeroSection"; 
import { authClient } from "../lib/auth-client";

interface Props {
  lang?: 'es' | 'en';
  isLoggedIn?: boolean; // Keep for compatibility but prioritize session
}

const STORAGE_KEY = 'pomodoro_active_session';

export default function PomodoroManager({ lang = 'es' }: Props) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  // 🔥 Check for saved session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Only check for ACTIVE running timer state
      const timerState = localStorage.getItem('pomodoro_timer_state');
      if (timerState) {
          const state = JSON.parse(timerState);
          // Only restore if there's actual progress (timeLeft is less than total duration)
          // This prevents auto-restoring when user just selected time but didn't start
          const hasProgress = state.currentSessionIndex > 0 || 
                             (state.timeLeft && state.timeLeft < (state.initialMinutes * 60));
          
          if (state.initialMinutes && !state.isSessionFinished && hasProgress) {
              setSelectedMinutes(state.initialMinutes);
              return;
          }
      }

      // If we reach here, there's no active timer, so clean up any old state
      localStorage.removeItem('pomodoro_timer_state');
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error loading saved session:', e);
      // Clean up on error
      localStorage.removeItem('pomodoro_timer_state');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <div className="w-full"> 
      <HeroSection lang={lang} mode={selectedMinutes === null ? 'default' : 'focus'} /> 
      
      {selectedMinutes === null ? (
        <TimerSetup 
            lang={lang}
            isLoggedIn={isLoggedIn}
            onStart={(minutes) => {
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ initialMinutes: minutes }));
              setSelectedMinutes(minutes);
            }}
          />
      ) : (
        <TimerRun
            lang={lang}
            initialMinutes={selectedMinutes}
            onReset={() => setSelectedMinutes(null)}
            isLoggedIn={isLoggedIn}
          />
      )}
      
    </div>
  );
}