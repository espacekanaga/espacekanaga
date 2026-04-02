require("dotenv/config");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Données des utilisateurs par défaut
const defaultUsers = [
  {
    prenom: "Super",
    nom: "Admin",
    telephone: "+22370000001",
    email: "espacekanaga@gmail.com",
    password: "espacekanaga",
    role: "SUPER_ADMIN",
    adresse: "Bamako, Mali",
  },
  {
    prenom: "Admin",
    nom: "Principal",
    telephone: "+22370000002",
    email: "admin@kanaga.com",
    password: "admin123",
    role: "ADMIN",
    adresse: "Bamako, Mali",
  },
  {
    prenom: "Employé",
    nom: "Test",
    telephone: "+22370000003",
    email: "employe@kanaga.com",
    password: "employe123",
    role: "EMPLOYEE",
    adresse: "Bamako, Mali",
  },
  {
    prenom: "Mohamed",
    nom: "Guindo",
    telephone: "+22370000004",
    email: "mohamed@kanaga.com",
    password: "mohamed123",
    role: "EMPLOYEE",
    adresse: "Bamako, Mali",
  },
];

// Données des clients par défaut
const defaultClients = [
  {
    nom: "Diallo",
    prenom: "Fatima",
    telephone: "+22370001001",
    adresse: "Hamdallaye ACI 2000",
    notes: "Cliente VIP - Préfère les retouches rapides",
  },
  {
    nom: "Traoré",
    prenom: "Bakary",
    telephone: "+22370001002",
    adresse: "Kalaban Coura",
    notes: "Client pressing régulier",
  },
  {
    nom: "Koné",
    prenom: "Mariam",
    telephone: "+22370001003",
    adresse: "Badalabougou",
    notes: "Couture sur mesure",
  },
  {
    nom: "Touré",
    prenom: "Amadou",
    telephone: "+22370001004",
    adresse: "Sogoniko",
    notes: null,
  },
  {
    nom: "Coulibaly",
    prenom: "Aminata",
    telephone: "+22370001005",
    adresse: "Médina Coura",
    notes: "Préfère les livraisons à domicile",
  },
];

async function seedUsers() {
  console.log("[seed] Création des utilisateurs par défaut...");
  
  for (const userData of defaultUsers) {
    const existing = await prisma.user.findUnique({
      where: { telephone: userData.telephone },
    });
    
    if (existing) {
      console.log(`[seed] Utilisateur ${userData.prenom} ${userData.nom} existe déjà.`);
      continue;
    }
    
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
      data: {
        prenom: userData.prenom,
        nom: userData.nom,
        telephone: userData.telephone,
        email: userData.email,
        adresse: userData.adresse,
        passwordHash,
        role: userData.role,
        isActive: true,
      },
      select: { id: true, prenom: true, nom: true, role: true },
    });
    
    console.log(`[seed] ✅ ${userData.role} créé: ${userData.prenom} ${userData.nom} (${userData.telephone})`);
  }
}

async function seedClients() {
  console.log("\n[seed] Création des clients par défaut...");
  
  for (const clientData of defaultClients) {
    const existing = await prisma.client.findUnique({
      where: { telephone: clientData.telephone },
    });
    
    if (existing) {
      console.log(`[seed] Client ${clientData.prenom} ${clientData.nom} existe déjà.`);
      continue;
    }
    
    const client = await prisma.client.create({
      data: clientData,
      select: { id: true, prenom: true, nom: true, telephone: true },
    });
    
    console.log(`[seed] ✅ Client créé: ${clientData.prenom} ${clientData.nom} (${clientData.telephone})`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant dans l'environnement.");
  }

  console.log("=== Espace Kanaga - SEED ===\n");
  
  await seedUsers();
  await seedClients();
  
  console.log("\n[seed] ✅ Seed terminé avec succès!");
  console.log("\nUtilisateurs créés:");
  console.log("  - SUPER_ADMIN: espacekanaga@gmail.com / espacekanaga");
  console.log("  - ADMIN: admin@kanaga.com / admin123");
  console.log("  - EMPLOYEE: employe@kanaga.com / employe123");
  console.log("  - EMPLOYEE: mohamed@kanaga.com / mohamed123");
  console.log("\nClients créés: 5 clients de test");
}

main()
  .catch((err) => {
    console.error("[seed] ❌ Erreur:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
