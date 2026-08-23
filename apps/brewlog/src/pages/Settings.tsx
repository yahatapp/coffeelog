import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronRight, Settings2 } from "lucide-react";
import { useLiff } from "../hooks/useLiff";
import { Card, CardContent } from "../components/ui/card";
import { api } from "@/lib/api";

interface Dripper {
  id: string;
  name: string;
}

interface Grinder {
  id: string;
  name: string;
  fineMax: number;
  mediumFineMax: number;
  mediumMax: number;
  mediumCoarseMax: number;
}

const Settings = () => {
  const { profile, liff } = useLiff();
  const navigate = useNavigate();
  const [drippers, setDrippers] = useState<Dripper[]>([]);
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEquipment = async () => {
    try {
      const [drippersRes, grindersRes] = await Promise.all([
        api.api.drippers.$get(),
        api.api.grinders.$get(),
      ]);

      if (drippersRes.ok) setDrippers(await drippersRes.json());
      if (grindersRes.ok) setGrinders(await grindersRes.json());
    } catch (err) {
      console.error("Failed to fetch equipment settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchEquipment();
  }, []);

  const handleLogout = () => {
    if (liff?.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
      <h2 className="text-xl font-bold text-coffee-primary">設定</h2>

      {/* User profile */}
      <Card className="border border-coffee-secondary/15">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-coffee-secondary/20 overflow-hidden border-2 border-white shadow-sm">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User size={32} className="text-coffee-secondary" />
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-lg text-coffee-primary">
              {profile?.displayName || "ゲストユーザー"}
            </p>
            <p className="text-xs text-coffee-secondary">LINE連携済み</p>
          </div>
        </CardContent>
      </Card>

      {/* Equipment manager section */}
      <section className="space-y-2">
        <div className="flex items-center space-x-1 ml-1">
          <Settings2 size={16} className="text-coffee-primary" />
          <h3 className="text-sm font-bold text-coffee-primary uppercase tracking-wider">
            器具マスタ管理
          </h3>
        </div>
        <Card className="border border-coffee-secondary/15">
          <div className="divide-y divide-coffee-secondary/10">
            <button
              onClick={() => navigate("/settings/drippers")}
              className="w-full p-4 flex items-center justify-between text-sm hover:bg-coffee-secondary/5 transition-colors text-left"
            >
              <span className="font-medium text-coffee-text">ドリッパー管理</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-coffee-secondary/60 bg-coffee-secondary/5 px-2.5 py-0.5 rounded-full border border-coffee-secondary/10">
                  {isLoading ? "-" : drippers.length}個
                </span>
                <ChevronRight size={16} className="text-coffee-secondary/40" />
              </div>
            </button>
            <button
              onClick={() => navigate("/settings/grinders")}
              className="w-full p-4 flex items-center justify-between text-sm hover:bg-coffee-secondary/5 transition-colors text-left"
            >
              <span className="font-medium text-coffee-text">グラインダー管理</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-coffee-secondary/60 bg-coffee-secondary/5 px-2.5 py-0.5 rounded-full border border-coffee-secondary/10">
                  {isLoading ? "-" : grinders.length}個
                </span>
                <ChevronRight size={16} className="text-coffee-secondary/40" />
              </div>
            </button>
          </div>
        </Card>
      </section>

      {/* About and logout */}
      <section className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-coffee-secondary uppercase tracking-wider ml-1">
          アプリについて
        </h3>
        <Card className="border border-coffee-secondary/15">
          <div className="divide-y divide-coffee-secondary/10">
            <button className="w-full p-4 flex items-center justify-between text-sm hover:bg-coffee-secondary/5 transition-colors text-left">
              <span className="text-coffee-text">利用規約</span>
              <ChevronRight size={16} className="text-coffee-secondary/40" />
            </button>
            <button className="w-full p-4 flex items-center justify-between text-sm hover:bg-coffee-secondary/5 transition-colors text-left">
              <span className="text-coffee-text">プライバシーポリシー</span>
              <ChevronRight size={16} className="text-coffee-secondary/40" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center space-x-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        </Card>
      </section>

      <div className="text-center">
        <p className="text-[10px] text-coffee-secondary/40">Brewlog v0.1.0</p>
      </div>
    </div>
  );
};

export default Settings;
