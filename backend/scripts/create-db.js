require("dotenv/config");
const { Client } = require("pg");

function decode(v) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL manquant dans l'environnement.");

  const url = new URL(DATABASE_URL);
  const targetDb = decode(url.pathname.replace(/^\//, ""));
  if (!targetDb) throw new Error("Impossible de déterminer le nom de la base depuis DATABASE_URL.");

  const client = new Client({
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decode(url.username),
    ...(url.password ? { password: decode(url.password) } : {}),
    database: "postgres",
  });

  await client.connect();

  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
  if (exists.rowCount > 0) {
    console.log(`[db] Base "${targetDb}" déjà existante.`);
    await client.end();
    return;
  }

  // CREATE DATABASE ne supporte pas les paramètres SQL : on double-quote l'identifiant.
  const safeDb = targetDb.replace(/"/g, '""');
  await client.query(`CREATE DATABASE "${safeDb}"`);
  console.log(`[db] Base "${targetDb}" créée avec succès.`);

  await client.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[db] Erreur :", err);
  process.exit(1);
});

