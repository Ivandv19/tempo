import type { LogEntry } from "../stores/slices/pomodoroSlice";

export function getWeeklyStats(history: LogEntry[]) {
	const now = new Date();
	const distanceToMonday = (now.getDay() + 6) % 7;
	const monday = new Date(now);
	monday.setDate(now.getDate() - distanceToMonday);
	monday.setHours(0, 0, 0, 0);

	const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return dayNames.map((day) => {
		const dayIndex = dayNames.indexOf(day);
		const entries = history.filter((e) => {
			const d = new Date(e.endTime);
			return (
				d >= monday && d.getDay() === (dayIndex + 1) % 7 && e.type === "focus"
			);
		});
		return {
			day,
			minutes: entries.reduce((sum, e) => sum + e.minutes, 0),
			count: entries.length,
		};
	});
}

export function getTodaysStats(history: LogEntry[]) {
	const today = new Date().toLocaleDateString();
	const todaysHistory = history.filter(
		(e) =>
			new Date(e.endTime).toLocaleDateString() === today && e.type === "focus",
	);
	const totalMinutes = todaysHistory.reduce((sum, e) => sum + e.minutes, 0);

	return {
		history: todaysHistory,
		hours: Math.floor(totalMinutes / 60),
		minutes: totalMinutes % 60,
		sessionCount: todaysHistory.length,
	};
}
