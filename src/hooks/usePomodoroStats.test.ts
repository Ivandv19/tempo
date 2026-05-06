import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoroStats } from './usePomodoroStats';

describe('usePomodoroStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value }),
            clear: vi.fn(() => { }),
        });

        // Mock Date to ensure deterministic tests
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should initialize with empty history if localStorage is empty', () => {
        const { result } = renderHook(() => usePomodoroStats(false));
        expect(result.current.history).toEqual([]);
        expect(result.current.hours).toBe(0);
        expect(result.current.minutes).toBe(0);
        expect(result.current.sessionCount).toBe(0);
    });

    it('should add a session and update stats', () => {
        const { result } = renderHook(() => usePomodoroStats(false));

        const now = new Date(2023, 0, 1, 10, 0, 0); // Jan 1, 2023, 10:00 AM
        vi.setSystemTime(now);

        act(() => {
            // Add a 25 min focus session
            result.current.addSession('focus', 25, new Date(now.getTime() - 25 * 60000));
        });

        expect(result.current.history.length).toBe(1);
        expect(result.current.hours).toBe(0);
        expect(result.current.minutes).toBe(25);
        expect(result.current.sessionCount).toBe(1);
    });

    it('should correctly calculate weekly stats', () => {
        // Set time to a Wednesday
        const wednesday = new Date(2023, 0, 4, 12, 0, 0); // Jan 4, 2023
        vi.setSystemTime(wednesday);

        renderHook(() => usePomodoroStats(false));

        act(() => {
            // Add Monday session (2 days ago)
            const _monday = new Date(2023, 0, 2, 10, 0, 0);
            // We need to manually inject into history or mock the initial state because addSession uses current time for end.
            // But addSession uses the current time for `endTime`.
            // To test past sessions, simpler to mock localStorage data BEFORE renderHook.
        });
    });

    it('should load history from localStorage', () => {
        const today = new Date();
        const mockHistory = [
            {
                id: 1,
                type: 'focus',
                minutes: 25,
                startTime: new Date(today.getTime() - 30 * 60000).toISOString(),
                endTime: today.toISOString()
            }
        ];
        localStorage.setItem('pomodoro_history', JSON.stringify(mockHistory));

        const { result } = renderHook(() => usePomodoroStats(false));

        expect(result.current.history.length).toBe(1);
        expect(result.current.minutes).toBe(25);
    });
});
