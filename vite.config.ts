import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import path from "path";
import { cloudflare } from "@cloudflare/vite-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数をロード (VITE_ プレフィックスの付いた変数を読み込む)
  const env = loadEnv(mode, process.cwd());

  // 環境変数 VITE_ALLOWED_HOSTS からカンマ区切りでホストリストを取得
  const envAllowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : [];

  return {
    staged: {
      "*": "vp check --fix",
    },
    plugins: [react(), tailwindcss(), cloudflare()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      allowedHosts: ["localhost", ...envAllowedHosts],
    },
  };
});
