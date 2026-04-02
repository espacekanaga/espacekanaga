import fs from "fs";
import path from "path";

import { env } from "../env";

export function ensureUploadDir() {
  const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
