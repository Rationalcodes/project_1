import React, { useEffect, useRef, useState } from 'react';
import './types/google.d';

export interface GoogleSignInButtonProps {
  clientId?: string;
  onSuccess: (credential: string) => void | Promise<any>;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  shape?: 'rectangular' | 'pill';
  size?: 'large' | 'medium' | 'small';
  width?: number | string;
  className?: string;
  disabled?: boolean;
  showDevBypass?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  clientId: propClientId,
  onSuccess,
  onError,
  text = 'signin_with',
  theme = 'outline',
  shape = 'rectangular',
  size = 'large',
  width = 280,
  className = '',
  disabled = false,
  showDevBypass = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGisReady, setIsGisReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const handleDevBypass = () => {
    const testPayload = {
      sub: 'usr-prabhat-01',
      email: 'prabhatshinde.ggv2024@gmail.com',
      name: 'Prabhat Shinde',
      picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    };
    const testToken = 'test-token:' + btoa(JSON.stringify(testPayload));
    onSuccess(testToken);
  };

  const copyOrigin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentOrigin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Read client ID from prop or Vite environment
  const effectiveClientId =
    propClientId ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
    '871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com';

  useEffect(() => {
    let isMounted = true;
    let intervalId: any = null;

    if (!effectiveClientId) {
      setInitError('Missing Google Client ID (VITE_GOOGLE_CLIENT_ID)');
      if (onError) onError('Missing Google Client ID');
      return;
    }

    const checkGisLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        if (isMounted) {
          setIsGisReady(true);
        }
        return true;
      }
      return false;
    };

    if (checkGisLoaded()) {
      return;
    }

    // Check every 150ms for up to 5 seconds
    let attempts = 0;
    intervalId = setInterval(() => {
      attempts++;
      if (checkGisLoaded() || attempts > 35) {
        clearInterval(intervalId);
        if (attempts > 35 && !checkGisLoaded() && isMounted) {
          setInitError('Google Identity Services SDK failed to load');
          if (onError) onError('GIS SDK load timeout');
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [effectiveClientId, onError]);

  // Render Google button once GIS is ready and container is present
  useEffect(() => {
    if (!isGisReady || !containerRef.current || !effectiveClientId || disabled) {
      return;
    }

    try {
      window.google!.accounts.id.initialize({
        client_id: effectiveClientId,
        callback: (response) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            const err = 'Google response did not contain credential';
            setInitError(err);
            if (onError) onError(err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any previous render inside container
      containerRef.current.innerHTML = '';

      window.google!.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme,
        size,
        text,
        shape,
        logo_alignment: 'left',
        width,
      });
    } catch (err) {
      const msg = `GIS initialization error: ${(err as Error).message}`;
      setInitError(msg);
      if (onError) onError(msg);
    }
  }, [isGisReady, effectiveClientId, text, theme, shape, size, width, disabled, onSuccess, onError]);

  if (initError) {
    return (
      <div className={`p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs ${className}`}>
        <div className="font-bold flex items-center gap-1.5">
          <span>⚠️</span>
          <span>Google Sign-In Error</span>
        </div>
        <p className="mt-1 text-[11px] text-red-400">{initError}</p>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      {!isGisReady && (
        <div
          style={{ width: typeof width === 'number' ? `${width}px` : width, height: '40px' }}
          className="rounded-lg bg-zinc-800/80 animate-pulse border border-zinc-700/60 flex items-center justify-center gap-2 text-zinc-400 text-xs"
        >
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Connecting Google...</span>
        </div>
      )}
      <div ref={containerRef} className={!isGisReady ? 'hidden' : 'block'} />

      {/* Origin Helper & Dev Sign-In for Immediate Testing */}
      {showDevBypass && (
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <button
            type="button"
            onClick={handleDevBypass}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>⚡</span>
            <span>Sign In as Prabhat (Dev Bypass)</span>
          </button>

          {currentOrigin && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <span>Google origin:</span>
              <code className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-amber-300 font-mono">
                {currentOrigin}
              </code>
              <button
                type="button"
                onClick={copyOrigin}
                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer ml-0.5"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
