import { useLiff } from "@/hooks/useLiff";
import { User, Copy, Check, Info, LogOut } from "lucide-react";
import { useState } from "react";
import { analytics } from "@/lib/analytics";

const SettingsPage = () => {
  const { profile, relogin } = useLiff();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (profile?.userId) {
      await navigator.clipboard.writeText(profile.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <User className="text-cafe-primary" size={24} />
        <h2 className="text-2xl font-bold text-cafe-text">設定</h2>
      </div>

      {profile ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            {profile.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full border-4 border-cafe-primary/10 shadow-md object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-cafe-primary/5 flex items-center justify-center border-4 border-cafe-primary/10 shadow-md">
                <User size={48} className="text-cafe-secondary" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-cafe-text">{profile.displayName}</h3>
              {profile.statusMessage && (
                <p className="text-xs text-cafe-secondary mt-1 px-4 italic">
                  &ldquo;{profile.statusMessage}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-cafe-secondary/10 pt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-cafe-secondary block mb-1">
                LINE ユーザーID
              </label>
              <div className="flex items-center justify-between bg-cafe-background p-3 rounded-xl border border-cafe-secondary/10">
                <span className="text-xs font-mono text-cafe-text select-all overflow-hidden text-ellipsis mr-2">
                  {profile.userId}
                </span>
                <button
                  onClick={() => void copyToClipboard()}
                  className="p-1.5 text-cafe-secondary hover:text-cafe-primary hover:bg-cafe-primary/5 rounded-lg active:scale-95 transition-all"
                  title="ユーザーIDをコピー"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm text-center">
          <p className="text-cafe-secondary text-sm">プロフィール情報が見つかりません。</p>
        </div>
      )}

      {analytics.configured && (
        <section className="rounded-2xl border border-cafe-secondary/20 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-cafe-text">利用状況の計測</h3>
          <p className="mt-1 text-xs text-cafe-secondary">
            {analytics.servicesLabel}
            による利用状況の計測を、改善のために利用します。入力内容やLINE
            IDをイベントとして送信しません。
          </p>
          <p className="mt-2 text-xs text-cafe-secondary">
            現在:{" "}
            {analytics.getConsent() === "enabled"
              ? "許可中"
              : analytics.getConsent() === "disabled"
                ? "許可しない"
                : "未選択"}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="min-h-11 flex-1 rounded-xl bg-cafe-primary px-3 text-sm font-semibold text-white"
              onClick={() => analytics.setConsent("enabled")}
            >
              許可する
            </button>
            <button
              type="button"
              className="min-h-11 flex-1 rounded-xl border border-cafe-secondary/30 px-3 text-sm"
              onClick={() => analytics.setConsent("disabled")}
            >
              許可しない
            </button>
          </div>
        </section>
      )}

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-cafe-secondary/20 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-cafe-secondary/10 pb-2">
          <Info size={18} className="text-cafe-primary" />
          <h4 className="font-bold text-cafe-text text-sm">アプリ情報</h4>
        </div>
        <div className="flex justify-between text-xs py-1">
          <span className="text-cafe-secondary">アプリ名</span>
          <span className="font-semibold text-cafe-text">Cafelog</span>
        </div>
        <div className="flex justify-between text-xs py-1">
          <span className="text-cafe-secondary">バージョン</span>
          <span className="font-semibold text-cafe-text">0.1.0</span>
        </div>
        <div className="flex justify-between text-xs py-1">
          <span className="text-cafe-secondary">スタック</span>
          <span className="text-cafe-text font-medium">React + Hono + Workers</span>
        </div>
      </div>

      <button
        onClick={relogin}
        className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold py-3 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
      >
        <LogOut size={18} />
        <span>ログアウト / 再ログイン</span>
      </button>
    </div>
  );
};

export default SettingsPage;
