/** @jsxImportSource react */
import { useState } from "react";
import { authClient } from "../../lib/auth-client";

interface Props {
	translations: {
		title: string;
		subtitle: string;
		sent: string;
		btn: string;
		emailLabel: string;
		emailPlaceholder: string;
		loading: string;
		backHome: string;
	};
	redirectPath: string;
}

export default function ForgotPasswordForm({
	translations: t,
	redirectPath,
}: Props) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const { error: err } = await authClient.requestPasswordReset({
			email,
			redirectTo: redirectPath.replace("/login", "/reset-password"),
		});

		setLoading(false);

		if (err) {
			setError(err.message || t.loading);
			return;
		}

		setSent(true);
	};

	if (sent) {
		return (
			<div className="max-w-md w-full mx-4 text-center space-y-6 animate-fade-in-up">
				<div className="text-6xl">📧</div>
				<h2 className="text-2xl font-bold">{t.title}</h2>
				<p className="text-sm opacity-70">{t.sent}</p>
				<a href={redirectPath} className="btn btn-primary">
					{t.backHome}
				</a>
			</div>
		);
	}

	return (
		<div className="max-w-md w-full mx-4">
			<div className="bg-base-100/50 backdrop-blur-sm border border-base-200 p-10 rounded-3xl shadow-2xl animate-fade-in-up">
				<div className="text-center space-y-2 mb-8">
					<div className="text-4xl">🔑</div>
					<h2 className="text-2xl font-bold">{t.title}</h2>
					<p className="text-sm opacity-70">{t.subtitle}</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-bold opacity-80 mb-2"
						>
							{t.emailLabel}
						</label>
						<input
							id="email"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t.emailPlaceholder}
							className="input input-bordered w-full h-12 rounded-xl"
						/>
					</div>

					{error && (
						<div className="text-sm text-error bg-error/10 border border-error/20 rounded-xl p-3 animate-fade-in">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={loading || !email}
						className="btn btn-primary w-full h-12 rounded-xl font-bold"
					>
						{loading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							t.btn
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
