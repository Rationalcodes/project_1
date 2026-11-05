import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminApp } from './components/admin/AdminApp';
import { NotificationToast } from './components/common/NotificationToast';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import {
  ShieldCheck,
  ExternalLink,
  LogOut,
  User,
  Lock,
  ShieldAlert,
} from 'lucide-react';

const AdminMainContent: React.FC = () => {
  const { adminUser, isAuthenticated, isAdmin, loginWithGoogle, logout } =
    useAdmin();

  return (
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300 w-full max-w-full overflow-x-hidden">
      {/* Central Platform Admin Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 py-2.5 sm:py-3 transition-all w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink group">
            <img
              src="/logo-white.png"
              alt="SLOON - Unisex Grooming Network"
              className="h-7 sm:h-8 md:h-9 w-auto max-w-[145px] sm:max-w-[185px] md:max-w-[215px] object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
            <span className="hidden sm:inline text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0 self-center">
              Admin HQ
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <a
                href={import.meta.env.VITE_CUSTOMER_APP_URL || 'https://customer-web-inky.vercel.app/'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                <span>Customer App</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
              <a
                href={import.meta.env.VITE_PARTNER_APP_URL || 'https://project-1-xq1k.vercel.app/'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <span>Partner OS</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-zinc-800 shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  {adminUser?.avatarUrl ? (
                    <img
                      src={adminUser.avatarUrl}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="font-semibold text-white max-w-[100px] truncate hidden md:inline">
                    {adminUser?.name}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {adminUser?.role}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Sign out of HQ Console"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Content / Security Access Gates */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 overflow-x-hidden">
        {!isAuthenticated ? (
          // GATE 1: Unauthenticated -> Sign in with Google
          <div className="max-w-md mx-auto my-12 sm:my-16 p-5 sm:p-8 bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c10] border border-amber-500/30 rounded-3xl shadow-2xl text-center space-y-5 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Restricted Access
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
                Kumbhkaran Salons HQ
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Platform administration, partner verification, review moderation, and system telemetry.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center max-w-full">
              <GoogleSignInButton
                onSuccess={(cred, clientId) => loginWithGoogle(cred, clientId)}
                text="signin_with"
                theme="outline"
                width={280}
              />
            </div>

            <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 text-left space-y-1">
              <div className="font-semibold text-zinc-400">Security Invariant Notice:</div>
              <div>
                Public Google authentication defaults to CUSTOMER role. Platform ADMIN privileges must be granted through an out-of-band administrative stored procedure.
              </div>
            </div>
          </div>
        ) : !isAdmin ? (
          // GATE 2: Authenticated as non-ADMIN -> Access Denied Gate
          <div className="max-w-lg mx-auto my-12 sm:my-16 p-5 sm:p-8 bg-gradient-to-b from-[#241414] via-[#1a1212] to-[#0c0c10] border border-red-500/30 rounded-3xl shadow-2xl text-center space-y-5 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-xl shadow-red-500/10">
              <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Access Denied
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
                Administrative Privileges Required
              </h1>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Your authenticated account (<span className="text-amber-400 font-semibold">{adminUser?.email}</span>) holds the role <span className="text-red-400 font-bold">{adminUser?.role}</span>. Only users with the explicit <span className="text-amber-400 font-bold">ADMIN</span> global role can access this administration portal.
              </p>
            </div>

            <div className="bg-black/50 border border-red-900/40 rounded-2xl p-4 text-left text-xs text-zinc-400 space-y-2">
              <div className="font-bold text-zinc-200">How to authorize an Administrator:</div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
                <li>Log in to your Supabase PostgreSQL console.</li>
                <li>Execute: <code className="text-amber-400 bg-zinc-900 px-1 py-0.5 rounded">CALL promote_user_to_admin('{adminUser?.email}');</code></li>
                <li>Sign out below and sign back in to refresh your administrative session token.</li>
              </ol>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => logout()}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Try Another Account</span>
              </button>
            </div>
          </div>
        ) : (
          // GATE 3: Authenticated as ADMIN -> Full Admin Dashboard
          <AdminApp />
        )}
      </main>

      <NotificationToast />
    </div>
  );
};

export function App() {
  return (
    <AdminProvider>
      <AdminMainContent />
    </AdminProvider>
  );
}

export default App;
