import { QueryClient } from "@tanstack/react-query";
import { createMutationNoticeCache } from "@yahatapp/ui";

export const queryClient = new QueryClient({
  mutationCache: createMutationNoticeCache(),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});
