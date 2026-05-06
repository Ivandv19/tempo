/** @jsxImportSource react */
import { Icon } from '@iconify/react';
import { authClient } from '../lib/auth-client';

interface Props {
  loginText: string;
  logoutText: string;
  loginUrl: string;
}

export default function AuthButton({ loginText, logoutText, loginUrl }: Props) {
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  if (isPending) {
    return (
      <div className="btn btn-ghost btn-sm loading">
        <span className="loading loading-spinner loading-xs"></span>
      </div>
    );
  }

  if (session) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="btn btn-ghost btn-sm gap-2 px-3 group"
      >
        <Icon icon="lucide:log-out" className="w-4 h-4 group-hover:text-primary transition-colors" />
        <span>{logoutText}</span>
      </button>
    );
  }

  return (
    <a href={loginUrl} className="btn btn-ghost btn-sm gap-2 px-3 group">
      <Icon icon="lucide:log-in" className="w-4 h-4 group-hover:text-primary transition-colors" />
      <span>{loginText}</span>
    </a>
  );
}
