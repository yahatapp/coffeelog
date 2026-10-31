import { AppShell, BottomNavigation, ConsentNotice, SessionState } from "@yahatapp/ui";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, Coffee, ClipboardList, User } from "lucide-react";
import { LiffProvider, useLiff } from "./hooks/useLiff";
import { analytics } from "./lib/analytics";

// Pages
import HomePage from "./pages/Home";
import BeansPage from "./pages/Beans/BeansList";
import AddBeanPage from "./pages/Beans/AddBean";
import BeanDetailPage from "./pages/Beans/BeanDetail";
import EditBeanPage from "./pages/Beans/EditBean";
import LogsPage from "./pages/Logs/LogsList";
import AddLogPage from "./pages/Logs/AddLog";
import LogDetailPage from "./pages/Logs/LogDetail";
import EditLogPage from "./pages/Logs/EditLog";
import SettingsPage from "./pages/Settings";
import StoresPage, { StoreDetailPage } from "./pages/Stores";
import DrippersPage from "./pages/Settings/Drippers";
import GrindersPage from "./pages/Settings/Grinders";
import NotFoundPage from "./pages/NotFound";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPage(location.pathname);
  }, [location.pathname]);

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
    { to: "/settings", paths: ["/settings", "/stores"], label: "設定", icon: User },
  ];

  return (
    <AppShell
      banner={
        analytics.configured && analytics.getConsent() === null ? (
          <ConsentNotice
            servicesLabel={analytics.servicesLabel}
            onAccept={() => analytics.setConsent("enabled")}
            onDecline={() => analytics.setConsent("disabled")}
          />
        ) : undefined
      }
      navigation={
        <BottomNavigation
          items={navItems.map((item) => {
            const Icon = item.icon;
            return {
              href: item.to,
              label: item.label,
              active: isTabActive(item.paths),
              icon: <Icon size={20} />,
            };
          })}
          renderLink={(item, props) => <Link to={item.href} {...props} />}
        />
      }
    >
      {children}
    </AppShell>
  );
};

const AppContent = () => {
  const { isLoading, error, relogin } = useLiff();

  if (isLoading) return <SessionState status="loading" />;
  if (error)
    return (
      <SessionState
        status="error"
        message={error}
        onRelogin={error.includes("有効期限") ? relogin : undefined}
      />
    );

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/beans" element={<BeansPage />} />
          <Route path="/beans/new" element={<AddBeanPage />} />
          <Route path="/beans/:id" element={<BeanDetailPage />} />
          <Route path="/beans/:id/edit" element={<EditBeanPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/logs/new" element={<AddLogPage />} />
          <Route path="/logs/:id" element={<LogDetailPage />} />
          <Route path="/logs/:id/edit" element={<EditLogPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/stores/:id" element={<StoreDetailPage />} />
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
