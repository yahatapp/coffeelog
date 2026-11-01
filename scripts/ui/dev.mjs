import { startUIServer } from "./server.mjs";
const servers = [];
for (const [index, app] of ["brewlog", "cafelog"].entries()) {
  const port = Number(process.env.UI_PORT_BASE || 5271) + index;
  servers.push(await startUIServer({ app, port, testing: false }));
  console.log(`${app}: http://127.0.0.1:${port}/__catalog`);
}
const close = async () => {
  await Promise.all(servers.map((server) => server.close()));
  process.exit(0);
};
process.once("SIGINT", close);
process.once("SIGTERM", close);
