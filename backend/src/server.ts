import { env } from "./env";
import { createApp } from "./app";
import { ensureClientAuthSchema } from "./prisma/ensureClientAuthSchema";
import { ensureUploadDir } from "./shared/ensureUploadDir";

async function main() {
  ensureUploadDir();
  await ensureClientAuthSchema();

  const app = createApp();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] Listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
