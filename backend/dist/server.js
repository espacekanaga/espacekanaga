"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const app_1 = require("./app");
const ensureUploadDir_1 = require("./shared/ensureUploadDir");
async function main() {
    (0, ensureUploadDir_1.ensureUploadDir)();
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`[api] Listening on :${env_1.env.PORT}`);
    });
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
