import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../../utils/safeStorage';
import { RefreshCw, AlertTriangle, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Partner OS Unhandled React Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleHardReset = () => {
    safeStorage.removeItem('kumbhakaran_partner_token');
    safeStorage.removeItem('kumbhakaran_partner_user');
    safeStorage.removeItem('kumbhakaran_partner_active_salon');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500/30">
          <div className="max-w-lg w-full bg-[#14141c] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              <img
                src="/logo-white.png"
                alt="Kumbhkaran Salons"
                className="h-10 w-auto object-contain drop-shadow-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Partner OS • Self-Healing Mode
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white font-['Syne',sans-serif]">
                Studio Dashboard Session Restored
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                We encountered an unexpected display sync issue while loading your studio records. Click below to refresh your live queue.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Studio</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Reset & Re-login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
