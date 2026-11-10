import React, { useEffect, useRef, useState } from 'react';
import './types/google.d';

// Global GIS singleton registry across all mounted button instances
// Google Identity Services warns when google.accounts.id.initialize() is called multiple times
let globalGsiInitializedClientId: string | null = null;
const activeGsiListeners = new Set<(credential: string, clientId?: string) => void>();

export interface GoogleSignInButtonProps {
  clientId?: string;
  onSuccess: (credential: string, clientId?: string) => void | Promise<any>;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  shape?: 'rectangular' | 'pill';
  size?: 'large' | 'medium' | 'small';
  width?: number | string;
  className?: string;
  disabled?: boolean;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGisReady, setIsGisReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Register this button's success listener in the global GIS dispatcher
  useEffect(() => {
    const listener = (credential: string, clientId?: string) => {
      if (onSuccessRef.current) {
        onSuccessRef.current(credential, clientId);
      }
    };
    activeGsiListeners.add(listener);
    return () => {
      activeGsiListeners.delete(listener);
    };
  }, []);

  // Read client ID from prop, Vite environment, or standard process.env
  const effectiveClientId =
    propClientId ||
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
       (import.meta as any).env?.GOOGLE_CLIENT_ID)) ||
    (typeof process !== 'undefined' &&
      (process.env?.VITE_GOOGLE_CLIENT_ID ||
       process.env?.GOOGLE_CLIENT_ID)) ||
    '871471875670-l7e7llt3kviigohqmtip7t13kpp59nre.apps.googleusercontent.com';

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
      // Initialize GIS exactly ONCE globally to prevent "[GSI_LOGGER]: google.accounts.id.initialize() is called multiple times"
      if (globalGsiInitializedClientId !== effectiveClientId) {
        window.google!.accounts.id.initialize({
          client_id: effectiveClientId,
          callback: (response) => {
            if (response?.credential) {
              activeGsiListeners.forEach((cb) => {
                try {
                  cb(response.credential, effectiveClientId);
                } catch (e) {
                  console.error('Error in GSI listener callback:', e);
                }
              });
            } else {
              const err = 'Google response did not contain credential';
              setInitError(err);
              if (onErrorRef.current) onErrorRef.current(err);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        globalGsiInitializedClientId = effectiveClientId;
      }

      // Clear any previous render inside container
      containerRef.current.innerHTML = '';

      // Constrain button width so it never exceeds available screen on small mobile devices
      const screenMaxWidth = typeof window !== 'undefined' ? Math.max(200, window.innerWidth - 48) : 280;
      const targetWidth = typeof width === 'number' ? Math.min(width, screenMaxWidth) : width;

      window.google!.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme,
        size,
        text,
        shape,
        logo_alignment: 'left',
        width: targetWidth,
      });
    } catch (err) {
      const msg = `GIS initialization error: ${(err as Error).message}`;
      setInitError(msg);
      if (onErrorRef.current) onErrorRef.current(msg);
    }
  }, [isGisReady, effectiveClientId, text, theme, shape, size, width, disabled]);

  if (initError) {
    return (
      <div className={`p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs ${className}`}>
        <div className="font-bold flex items-center gap-1.5">
          <span>⚠️</span>
          <span>Google Sign-In Error</span>
        </div>
        <p className="mt-1 text-[11px] text-rose-600">{initError}</p>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center max-w-full overflow-hidden ${className}`}>
      {!isGisReady && (
        <div
          style={{ width: typeof width === 'number' ? `${width}px` : width, maxWidth: '100%', height: '40px' }}
          className="rounded-lg bg-stone-100 animate-pulse border border-stone-200 flex items-center justify-center gap-2 text-stone-500 text-xs"
        >
          <div className="w-4 h-4 border-2 border-[#FF6422] border-t-transparent rounded-full animate-spin" />
          <span>Connecting Google...</span>
        </div>
      )}
      <div ref={containerRef} className={`max-w-full ${isGisReady ? 'block' : 'hidden'}`} />
    </div>
  );
};
