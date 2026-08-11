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
    lint: {
      categories: {
        correctness: "error",
      },
      plugins: ["typescript", "unicorn", "oxc", "react"],
      rules: {
        "no-eval": "error",
        "no-new-func": "error",
        "react/jsx-no-script-url": "error",
        "react/no-danger": "error",
        "react/no-danger-with-children": "error",
        "react/react-in-jsx-scope": "off",
        "typescript/no-implied-eval": "error",
        "unicorn/no-abusive-eslint-disable": "error",
      },
      options: {
        typeAware: true,
        typeCheck: true,
      },
    },
    // Vitest runs in Node. The Cloudflare plugin rejects Vitest's Node externals.
    plugins: [react(), tailwindcss(), ...(mode === "test" ? [] : [cloudflare()])],
    test: {
      globals: true,
      passWithNoTests: true,
    },
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
