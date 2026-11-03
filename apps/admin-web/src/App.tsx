import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminApp } from './components/admin/AdminApp';
import { NotificationToast } from './components/common/NotificationToast';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import {
  ShieldCheck,
  ExternalLink,
  Lock,
  AlertTriangle,
  LogOut,
  User,
  ShieldAlert,
} from 'lucide-react';

const AdminMainContent: React.FC = () => {
  const { adminUser, isAuthenticated, isAdmin, loginWithGoogle, logout } = useAdmin();

  return (
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Central Platform Admin Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-slate-100 uppercase text-[13px] font-['Syne',sans-serif]">
                  Kumbhakaran HQ Console
                </span>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                  Central Admin
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:block">
                Platform oversight, verification authority & moderation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <a
              href={import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5173'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Customer App</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
            <a
              href={import.meta.env.VITE_PARTNER_APP_URL || 'http://localhost:5174'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <span>Partner OS</span>
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </a>

            {isAuthenticated && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  {adminUser?.avatarUrl ? (
                    <img
                      src={adminUser.avatarUrl}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="font-semibold text-white max-w-[120px] truncate hidden md:inline">
                    {adminUser?.name}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
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

      {/* Main Admin Console or Authentication Gate */}
      <main className="flex-1 w-full px-3 py-6 sm:px-6 max-w-7xl mx-auto">
        {!isAuthenticated ? (
          // GATE 1: Unauthenticated -> Google Sign In
          <div className="max-w-md mx-auto my-16 p-8 bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c10] border border-amber-500/30 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Restricted Access
              </span>
              <h1 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                Kumbhakaran HQ Console
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Platform administration, partner verification, review moderation, and system telemetry.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center">
              <GoogleSignInButton
                onSuccess={(cred) => loginWithGoogle(cred)}
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
          <div className="max-w-lg mx-auto my-16 p-8 bg-gradient-to-b from-[#241414] via-[#1a1212] to-[#0c0c10] border border-red-500/30 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-xl shadow-red-500/10">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Access Denied
              </span>
              <h1 className="text-2xl font-black text-white font-['Syne',sans-serif]">
                Administrative Authorization Required
              </h1>
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-left space-y-1">
                <div><span className="text-zinc-500 font-semibold">Signed in as:</span> <span className="text-white font-bold">{adminUser?.email}</span></div>
                <div><span className="text-zinc-500 font-semibold">Assigned Role:</span> <span className="text-amber-400 font-bold">{adminUser?.role}</span></div>
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto pt-2">
                This account does not have platform administrative privileges. In accordance with platform security invariants, Google sign-ins do not grant admin access automatically.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs space-y-2 text-zinc-300">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>How to Provision Admin Access:</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                The platform owner must execute the following stored procedure in the Supabase SQL Editor:
              </p>
              <pre className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono text-amber-300 overflow-x-auto select-all">
                CALL promote_user_to_admin('{adminUser?.email}');
              </pre>
            </div>

            <button
              onClick={() => logout()}
              className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-500 text-xs text-red-400 font-bold transition-all flex items-center gap-2 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Try Another Account</span>
            </button>
          </div>
        ) : (
          // UNLOCKED: Authenticated as ADMIN
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
