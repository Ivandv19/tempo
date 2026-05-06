/** @jsxImportSource react */
import { signOut } from '../lib/auth-client';

interface Props {
    label: string;
}

export default function LogoutButton({ label }: Props) {
    const handleLogout = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                   window.location.href = '/';
                }
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost btn-sm text-primary hover:text-primary-focus"
        >
            {label}
        </button>
    );
}
