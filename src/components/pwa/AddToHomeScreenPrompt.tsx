"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "garrincha-pwa-install-dismissed";

export default function AddToHomeScreenPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already dismissed
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Already running as installed standalone app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Only show on mobile / tablet (avoid cluttering desktop)
    const isMobileUA = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    if (!isMobileUA) return;

    const isIOSDevice =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !(window as any).MSStream;

    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS Safari has no beforeinstallprompt — show manual instructions
      setShow(true);
      return;
    }

    // Android/Chrome: capture the native install prompt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "1");
      setShow(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Add to Home Screen"
      className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="GARRINCHA"
              width={40}
              height={40}
              className="rounded-xl shrink-0"
            />
            <div>
              <p className="font-bold text-gray-900 text-sm leading-snug">
                Add GARRINCHA to your home screen
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Open predictions faster, just like an app.
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action area */}
        {isIOS ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
            On iPhone: tap{" "}
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
              {/* iOS Share icon approximated with text */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 inline"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </span>
            , then tap{" "}
            <span className="font-semibold">"Add to Home Screen"</span>.
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Add to Home Screen
          </button>
        )}

        <button
          onClick={dismiss}
          className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
