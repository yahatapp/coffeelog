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
import { CoffeeBeansIcon } from "./components/ui/CoffeeBeansIcon";
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
    { to: "/", paths: ["/"], label: "ホーム", icon: <HomeIcon size={20} /> },
    { to: "/beans", paths: ["/beans"], label: "豆", icon: <CoffeeBeansIcon size="sm" /> },
    { to: "/logs", paths: ["/logs"], label: "記録", icon: <ClipboardList size={20} /> },
    { to: "/settings", paths: ["/settings", "/stores"], label: "設定", icon: <User size={20} /> },
  ];

  return (
    <AppNavigation app="Brewlog">
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
              return {
                href: item.to,
                label: item.label,
                active: isTabActive(item.paths),
                icon: item.icon,
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
      { path: "/beans", element: <BeansPage />, handle: { title: "豆一覧" } },
      { path: "/beans/new", element: <AddBeanPage />, handle: { title: "豆を登録" } },
      { path: "/beans/:id", element: <BeanDetailPage />, handle: { title: "豆の詳細" } },
      { path: "/beans/:id/edit", element: <EditBeanPage />, handle: { title: "豆を編集" } },
      { path: "/logs", element: <LogsPage />, handle: { title: "抽出履歴" } },
      { path: "/logs/new", element: <AddLogPage />, handle: { title: "抽出を記録する" } },
      { path: "/logs/:id", element: <LogDetailPage />, handle: { title: "抽出記録詳細" } },
      { path: "/logs/:id/edit", element: <EditLogPage />, handle: { title: "抽出記録を編集" } },
      { path: "/stores", element: <StoresPage />, handle: { title: "お店" } },
      { path: "/stores/:id", element: <StoreDetailPage />, handle: { title: "お店の詳細" } },
      { path: "/settings", element: <SettingsPage />, handle: { title: "設定" } },
      {
        path: "/settings/drippers",
        element: <DrippersPage />,
        handle: { title: "ドリッパー管理" },
      },
      {
        path: "/settings/grinders",
        element: <GrindersPage />,
        handle: { title: "グラインダー管理" },
      },
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
