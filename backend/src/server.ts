import { env } from "./env";
import { createApp } from "./app";
import { ensureUploadDir } from "./shared/ensureUploadDir";

async function main() {
  ensureUploadDir();

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
