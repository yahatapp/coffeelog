import {
  AppNavigation,
  AppShell,
  BottomNavigation,
  ConsentNotice,
  SessionState,
} from "@yahatapp/ui";
import { useEffect, useSyncExternalStore } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  useLocation,
  type RouteObject,
} from "react-router-dom";
import { Home as HomeIcon, ClipboardList, User } from "lucide-react";
import { LiffProvider, useLiff } from "./hooks/useLiff";
import { analytics } from "./lib/analytics";

// Pages
import HomePage from "./pages/Home";
import NotFoundPage from "./pages/NotFound";
import LogsPage from "./pages/Logs";
import CreateLogPage from "./pages/CreateLog";
import LogDetailPage from "./pages/LogDetail";
import SettingsPage from "./pages/Settings";
import StoresPage, { StoreDetailPage } from "./pages/Stores";

const Layout = () => {
  const consent = useSyncExternalStore(analytics.subscribe, analytics.getConsent);
  const location = useLocation();

  useEffect(() => {
    analytics.trackPage(location.pathname);
  }, [location.pathname, consent]);

  const isTabActive = (paths: string[]) => {
    return paths.some((path) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    });
  };

  const navItems = [
    { to: "/", paths: ["/"], label: "ホーム", icon: HomeIcon },
    { to: "/logs", paths: ["/logs"], label: "記録", icon: ClipboardList },
    { to: "/settings", paths: ["/settings", "/stores"], label: "設定", icon: User },
  ];

  return (
    <AppNavigation app="Cafelog">
      <AppShell
        textTone={location.pathname === "/" ? "neutral" : "default"}
        banner={
          analytics.configured && consent === null ? (
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
        <Outlet />
      </AppShell>
    </AppNavigation>
  );
};

const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage />, handle: { title: "ホーム" } },
      { path: "/logs", element: <LogsPage />, handle: { title: "記録一覧" } },
      { path: "/logs/new", element: <CreateLogPage />, handle: { title: "記録を追加" } },
      { path: "/logs/:id", element: <LogDetailPage />, handle: { title: "記録の詳細" } },
      { path: "/stores", element: <StoresPage />, handle: { title: "お店" } },
      { path: "/stores/:id", element: <StoreDetailPage />, handle: { title: "お店の詳細" } },
      { path: "/settings", element: <SettingsPage />, handle: { title: "設定" } },
      { path: "*", element: <NotFoundPage />, handle: { title: "ページが見つかりません" } },
    ],
  },
];

// LIFF can update the address during initialization. Read it after authentication.
let router: ReturnType<typeof createBrowserRouter> | undefined;
const getRouter = () => (router ??= createBrowserRouter(routes));

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

  return <RouterProvider router={getRouter()} />;
};

function App() {
  return (
    <LiffProvider>
      <AppContent />
    </LiffProvider>
  );
}

export default App;
