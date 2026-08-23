import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, Coffee, ClipboardList, User, Loader2 } from "lucide-react";
import { LiffProvider, useLiff } from "./hooks/useLiff";

// Pages
import HomePage from "./pages/Home";
import BeansPage from "./pages/Beans/BeansList";
import AddBeanPage from "./pages/Beans/AddBean";
import EditBeanPage from "./pages/Beans/EditBean";
import LogsPage from "./pages/Logs/LogsList";
import AddLogPage from "./pages/Logs/AddLog";
import LogDetailPage from "./pages/Logs/LogDetail";
import EditLogPage from "./pages/Logs/EditLog";
import SettingsPage from "./pages/Settings";
import DrippersPage from "./pages/Settings/Drippers";
import GrindersPage from "./pages/Settings/Grinders";
import NotFoundPage from "./pages/NotFound";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isTabActive = (paths: string[]) => {
    return paths.some((path) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    });
  };

  const navItems = [
    { to: "/", paths: ["/"], label: "ホーム", icon: HomeIcon },
    { to: "/beans", paths: ["/beans"], label: "豆", icon: Coffee },
    { to: "/logs", paths: ["/logs"], label: "記録", icon: ClipboardList },
    { to: "/settings", paths: ["/settings"], label: "設定", icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-coffee-background text-coffee-text">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-coffee-secondary/20 p-4">
        <h1 className="text-xl font-bold text-coffee-primary tracking-tight">Brewlog</h1>
      </header>

      <main className="flex-1 pb-24 p-4 max-w-md mx-auto w-full">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-coffee-secondary/15 flex justify-around items-center px-4 py-2 pb-8 z-20 shadow-lg shadow-coffee-primary/5">
        {navItems.map((item) => {
          const active = isTabActive(item.paths);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center w-16 transition-all duration-200"
            >
              <div
                className={`flex items-center justify-center p-2 w-12 h-8 rounded-full transition-all duration-300 ${
                  active
                    ? "bg-coffee-primary/15 text-coffee-primary scale-105"
                    : "text-coffee-secondary/80 hover:text-coffee-primary hover:bg-coffee-primary/5"
                }`}
              >
                <Icon size={20} />
              </div>
              <span
                className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                  active ? "text-coffee-primary font-bold scale-105" : "text-coffee-secondary/80"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const AppContent = () => {
  const { isLoading, error, relogin } = useLiff();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-coffee-background">
        <Loader2 className="animate-spin text-coffee-primary mb-4" size={48} />
        <p className="text-coffee-secondary font-medium animate-pulse">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    const isSessionExpired = error.includes("有効期限");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-coffee-background p-6 text-center">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-coffee-secondary/20 shadow-md max-w-sm w-full">
          <p className="text-red-500 font-bold mb-2">エラーが発生しました</p>
          <p className="text-coffee-secondary text-sm mb-6">{error}</p>
          {isSessionExpired && (
            <button
              onClick={relogin}
              className="w-full bg-coffee-primary text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-coffee-primary/90 active:scale-[0.98] transition-all"
            >
              LINEで再ログイン
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/beans" element={<BeansPage />} />
          <Route path="/beans/new" element={<AddBeanPage />} />
          <Route path="/beans/:id/edit" element={<EditBeanPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/logs/new" element={<AddLogPage />} />
          <Route path="/logs/:id" element={<LogDetailPage />} />
          <Route path="/logs/:id/edit" element={<EditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/drippers" element={<DrippersPage />} />
          <Route path="/settings/grinders" element={<GrindersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <LiffProvider>
      <AppContent />
    </LiffProvider>
  );
}

export default App;
