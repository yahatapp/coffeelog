import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./app-navigation.module.css";
import { useLocation, useMatches, useNavigate, useNavigationType } from "react-router-dom";

const PreviousEntry = createContext<string | undefined>(undefined);
const PageTitle = createContext("");

export function AppNavigation({ app, children }: { app: string; children: ReactNode }) {
  const location = useLocation();
  const { key, pathname } = location;
  const navigationType = useNavigationType();
  const match = useMatches().at(-1);
  const title = (match?.handle as { title: string } | undefined)?.title ?? app;
  const entries = useRef(new Map<number, { key: string; pathname: string }>());
  const cards = useRef(new Map<string, string>());
  const previousPath = useRef<string>(null);
  const index = Number(window.history.state?.idx ?? 0);
  const previousEntry = entries.current.get(index - 1)?.pathname;

  useLayoutEffect(() => {
    if (navigationType === "PUSH") {
      for (const entry of entries.current.keys()) {
        if (entry >= index) {
          const stale = entries.current.get(entry);
          if (stale) cards.current.delete(stale.key);
          entries.current.delete(entry);
        }
      }
    } else if (navigationType === "REPLACE") {
      const oldKey = entries.current.get(index)?.key;
      const card = oldKey ? cards.current.get(oldKey) : undefined;
      if (oldKey && oldKey !== key) cards.current.delete(oldKey);
      if (card && entries.current.get(index)?.pathname === pathname) cards.current.set(key, card);
    }
    entries.current.set(index, { key, pathname });

    const rememberCard = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>("[data-return-card]");
      if (card?.dataset.returnCard) cards.current.set(key, card.dataset.returnCard);
      else cards.current.delete(key);
    };
    document.addEventListener("click", rememberCard, true);
    return () => document.removeEventListener("click", rememberCard, true);
  }, [index, key, navigationType, pathname]);

  useLayoutEffect(() => {
    const restoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = restoration;
    };
  }, []);

  useLayoutEffect(() => {
    document.title = `${title} | ${app}`;
  }, [app, title]);

  useLayoutEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    if (previous === null || previous === pathname) return;

    const cardId = navigationType === "POP" ? cards.current.get(key) : undefined;
    const heading = document.querySelector<HTMLElement>("main h1");
    const restoreCard = () => {
      if (!cardId) return false;
      const card = document.querySelector<HTMLElement>(
        `[data-return-card="${CSS.escape(cardId)}"]`,
      );
      if (!card) return false;
      card.focus({ preventScroll: true });
      card.scrollIntoView({ block: "center" });
      return true;
    };
    if (restoreCard()) return;
    heading?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    const main = document.querySelector("main");
    if (main?.querySelector('[role="status"]')) {
      const observer = new MutationObserver(() => {
        if (document.activeElement !== heading && document.activeElement !== document.body) {
          observer.disconnect();
        } else if (restoreCard()) {
          observer.disconnect();
        } else if (!main.contains(heading)) {
          main.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
          observer.disconnect();
        }
      });
      observer.observe(main, { subtree: true, childList: true });
      return () => observer.disconnect();
    }
  }, [key, navigationType, pathname]);

  return (
    <PreviousEntry value={previousEntry}>
      <PageTitle value={title}>{children}</PageTitle>
    </PreviousEntry>
  );
}

export function useAppBack(fallback: string) {
  const navigate = useNavigate();
  const previousEntry = useContext(PreviousEntry);
  return () => {
    if (previousEntry) void navigate(-1);
    else void navigate(fallback, { replace: true });
  };
}

export function usePreviousAppPath() {
  return useContext(PreviousEntry);
}

export function PageHeading({ children, className }: { children?: ReactNode; className?: string }) {
  const title = useContext(PageTitle);
  return (
    <h1 tabIndex={-1} className={className ?? styles.heading}>
      {children ?? title}
    </h1>
  );
}

export function PageStatus({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeading />
      {children}
    </>
  );
}
