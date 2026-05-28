/** @jsxImportSource react */
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("[ErrorBoundary]", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center min-h-[200px]">
						<div className="text-center space-y-4 p-8">
							<div className="text-4xl">💥</div>
							<h2 className="text-xl font-bold">Algo salió mal</h2>
							<p className="text-sm opacity-70">
								Recarga la página o intenta de nuevo.
							</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="btn btn-primary"
							>
								Recargar
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
