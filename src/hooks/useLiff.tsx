import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import liff from "@line/liff";
import type { Liff } from "@line/liff";
import { api, setApiToken } from "@/lib/api";

interface BackendProfile {
  lineUserId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

// モジュールレベルで初期化Promiseを管理して、React 18の二重初期化を防ぐ
let liffInitPromise: Promise<void> | null = null;
let backendInitPromise: Promise<BackendProfile> | null = null;

interface LiffContextType {
  liff: Liff | null;
  isLoggedIn: boolean;
  profile: Awaited<ReturnType<Liff["getProfile"]>> | null;
  backendProfile: BackendProfile | null;
  error: string | null;
  isLoading: boolean;
  relogin: () => void;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isLoggedIn: false,
  profile: null,
  backendProfile: null,
  error: null,
  isLoading: true,
  relogin: () => {},
});

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [liffState, setLiffState] = useState<Liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<Awaited<ReturnType<Liff["getProfile"]>> | null>(null);
  const [backendProfile, setBackendProfile] = useState<BackendProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const relogin = () => {
    // URLから古い認可パラメータを除去してクリーンなURLにする
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    if (liffState) {
      if (liffState.isLoggedIn()) {
        liffState.logout();
      }
      liffState.login();
    } else {
      window.location.href = cleanUrl;
    }
  };

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID || "";

        // すでに実行中の初期化処理があればそれを待つ
        if (!liffInitPromise) {
          liffInitPromise = liff.init({
            liffId,
            withLoginOnExternalBrowser: true,
          });
        }
        await liffInitPromise;
        setLiffState(liff);

        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          const userProfile = await liff.getProfile();
          setProfile(userProfile);

          // URLパラメータに code や state が残っている場合、初期化成功後に速やかに除去する
          if (
            typeof window !== "undefined" &&
            (window.location.search.includes("code=") || window.location.search.includes("state="))
          ) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }

          // Get ID Token for backend auth
          const idToken = liff.getIDToken();
          if (idToken) {
            setApiToken(idToken);

            // Initialize backend profile (deduplicated)
            if (!backendInitPromise) {
              backendInitPromise = (async () => {
                const res = await api.api.auth.init.$post({
                  json: {
                    displayName: userProfile.displayName,
                    avatarUrl: userProfile.pictureUrl,
                  },
                });
                if (!res.ok) {
                  const errorText = await res.text();
                  throw { status: res.status, message: errorText };
                }
                const data = await res.json();
                return data.profile as BackendProfile;
              })();
            }

            try {
              const profileData = await backendInitPromise;
              setBackendProfile(profileData);
            } catch (err: any) {
              backendInitPromise = null; // Allow retry on failure
              console.error("Backend init failed", err.status, err.message);
              if (err.status === 401) {
                setError(
                  `セッションの有効期限が切れました。もう一度ログインしてください。 (${err.message})`,
                );
              } else if (err.status === 403) {
                setError(
                  `アクセス権限がありません。許可されたLINEアカウントでログインしてください。 (${err.message})`,
                );
              } else {
                setError(
                  `セッションの初期化に失敗しました。通信状況を確認し、再度お試しください。 (${err.message})`,
                );
              }
            }
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err: any) {
        console.error("LIFF init error", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    void initLiff();
  }, []);

  return (
    <LiffContext
      value={{
        liff: liffState,
        isLoggedIn,
        profile,
        backendProfile,
        error,
        relogin,
        isLoading,
      }}
    >
      {children}
    </LiffContext>
  );
};

export const useLiff = () => useContext(LiffContext);
