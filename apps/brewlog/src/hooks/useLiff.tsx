import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import liff from "@line/liff";
import type { Liff } from "@line/liff";
import { api, setApiToken } from "@/lib/api";

interface BackendProfile {
  lineUserId: string;
  householdId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface Household {
  id: string;
  name: string;
  createdAt: string;
}

// モジュールレベルで初期化Promiseを管理して、React 18の二重初期化を防ぐ
let liffInitPromise: Promise<void> | null = null;

interface LiffContextType {
  liff: Liff | null;
  isLoggedIn: boolean;
  profile: Awaited<ReturnType<Liff["getProfile"]>> | null;
  backendProfile: BackendProfile | null;
  household: Household | null;
  error: string | null;
  isLoading: boolean;
  relogin: () => void;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isLoggedIn: false,
  profile: null,
  backendProfile: null,
  household: null,
  error: null,
  isLoading: true,
  relogin: () => {},
});

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [liffState, setLiffState] = useState<Liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<Awaited<ReturnType<Liff["getProfile"]>> | null>(null);
  const [backendProfile, setBackendProfile] = useState<BackendProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
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

          // URLパラメータに code や state が残っている場合、初期化成功後に速やかに除去する（二重リロード・二重処理対策）
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

            // Initialize backend profile
            const res = await api.api.auth.init.$post({
              json: {
                displayName: userProfile.displayName,
                avatarUrl: userProfile.pictureUrl,
              },
            });

            if (res.ok) {
              const data = await res.json();
              setBackendProfile(data.profile);
              setHousehold(data.household);
            } else {
              console.error("Backend init failed", res.status, await res.text());
              if (res.status === 401) {
                setError("セッションの有効期限が切れました。もう一度ログインしてください。");
              } else if (res.status === 403) {
                setError(
                  "アクセス権限がありません。許可されたLINEアカウントでログインしてください。",
                );
              } else {
                setError(
                  "セッションの初期化に失敗しました。通信状況を確認し、再度お試しください。",
                );
              }
            }
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err: unknown) {
        console.error("LIFF init error", err);
        setError(err instanceof Error ? err.message : "LIFFの初期化に失敗しました。");
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
        household,
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
