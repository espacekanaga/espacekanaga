require("dotenv/config");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "espacekanaga@gmail.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "espacekanaga";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant dans l'environnement.");
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    console.log(`[seed] Utilisateur ${email} existe déjà (role=${existingByEmail.role}).`);
    return;
  }

  const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
  if (superAdminCount > 0) {
    throw new Error(
      "[seed] Un SUPER_ADMIN existe déjà. Refus de créer un autre super admin via seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`[seed] SUPER_ADMIN créé: ${user.email} (${user.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
