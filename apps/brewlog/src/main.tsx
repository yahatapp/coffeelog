import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NoticeProvider, createMutationNoticeCache } from "@yahatapp/ui";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  mutationCache: createMutationNoticeCache(),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NoticeProvider>
        <App />
      </NoticeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
