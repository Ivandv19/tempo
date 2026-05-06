/** @jsxImportSource react */

interface Theme {
  color: string;
  stroke: string;
  bgButton: string;
  border: string;
}

interface ClockFaceProps {
  timeLeft: number;
  totalDuration: number;
  currentLabel: string;
  isActive: boolean;
  isSessionFinished: boolean;
  theme: Theme;
  formatTime: (seconds: number) => string;
  onTogglePause: () => void;
  onReset: () => void;
  pauseLabel: string;
  resumeLabel: string;
  newPlanLabel: string;
  finishedLabel: string;
}

export default function ClockFace({
  timeLeft,
  totalDuration,
  currentLabel,
  isActive,
  isSessionFinished,
  theme,
  formatTime,
  onTogglePause,
  onReset,
  pauseLabel,
  resumeLabel,
  newPlanLabel,
  finishedLabel,
}: ClockFaceProps) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(timeLeft / totalDuration, 1);
  const dashOffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="text-center">
        <span className="text-sm font-bold opacity-50 tracking-widest uppercase">
          {currentLabel}
        </span>
        <h2 className={`text-4xl font-black mt-2 ${theme.color} drop-shadow-sm`}>
          {currentLabel}
        </h2>
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280" role="img" aria-label="Pomodoro Timer">
          <title>Pomodoro Timer</title>
          <circle
            cx="140" cy="140" r={radius}
            stroke="currentColor" strokeWidth="12" fill="none"
            className="text-base-300 dark:text-base-content/10"
          />
          <circle
            cx="140" cy="140" r={radius}
            stroke="currentColor" strokeWidth="12" fill="none"
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${theme.stroke}`}
            style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
          />
          <circle cx="140" cy="20" r="4" className="fill-base-content/30" />
          <circle cx="260" cy="140" r="4" className="fill-base-content/30" />
          <circle cx="140" cy="260" r="4" className="fill-base-content/30" />
          <circle cx="20" cy="140" r="4" className="fill-base-content/30" />
        </svg>

        <div className="absolute flex flex-col items-center z-10">
          <span className={`text-7xl font-mono font-bold tracking-tighter ${theme.color}`}>
            {formatTime(timeLeft)}
          </span>
          {isSessionFinished && (
            <span className="text-sm mt-2 uppercase font-bold animate-pulse text-base-content">
              {finishedLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-center">
        {!isSessionFinished ? (
          <button
            type="button"
            className={`btn btn-lg h-16 px-10 rounded-full border-none shadow-xl hover:scale-105 transition-transform ${isActive ? 'bg-base-200 text-base-content' : theme.bgButton}`}
            onClick={onTogglePause}
          >
            <span className="text-lg font-bold flex items-center gap-2">
              {isActive ? pauseLabel : resumeLabel}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn-lg h-16 px-10 rounded-full border-none shadow-xl animate-bounce text-white ${theme.bgButton}`}
            onClick={onReset}
          >
            {newPlanLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="btn btn-circle btn-ghost opacity-60 hover:opacity-100 tooltip"
          data-tip="Cancel"
          aria-label="Cancel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
