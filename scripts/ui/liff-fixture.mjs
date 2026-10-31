// Only imported by the isolated UI verification server, never by production.
const liff = {
  init: async () => {
    const state = new URLSearchParams(window.location.search).get("uiAuth");
    if (state === "loading") await new Promise(() => {});
    if (state === "error") throw new Error("検証用の認証エラー");
  },
  isLoggedIn: () => true,
  getProfile: async () => ({ userId: "fixture-user", displayName: "確認用ユーザー", pictureUrl: "https://example.com/avatar.svg" }),
  getIDToken: () => "fixture-token",
  login: () => {
    globalThis.__uiLoginCount = (globalThis.__uiLoginCount ?? 0) + 1;
  },
  logout: () => {sessionStorage.setItem("fixture.logout","called");},
  isInClient: () => false,
};
export default liff;
