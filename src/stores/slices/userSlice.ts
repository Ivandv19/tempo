export interface UserInfo {
	id: string;
	email: string;
	name: string;
}

export interface UserSlice {
	user: UserInfo | null;
	isLoggedIn: boolean;
	setUser: (session: { user: UserInfo } | null) => void;
}

export const crearSliceUsuario = (
	set: (
		partial:
			| Partial<UserSlice>
			| ((state: UserSlice) => Partial<UserSlice>),
	) => void,
): UserSlice => ({
	user: null,
	isLoggedIn: false,

	setUser: (session) => {
		if (!session) {
			set({ user: null, isLoggedIn: false });
			return;
		}
		set({
			user: {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
			},
			isLoggedIn: true,
		});
	},
});
