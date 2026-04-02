# Guide de Déploiement - Espace Kanaga

Ce guide explique comment déployer l'application Espace Kanaga (backend + frontend) sur Render et Netlify.

## 📁 Structure du Projet

```
Espace Kanaga/
├── backend/          # API Express + Prisma
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/         # React + Vite
│   ├── src/
│   └── package.json
└── DEPLOYMENT.md     # Ce fichier
```

---

## 🔧 PARTIE 1: Backend sur Render

### 1.1 Prérequis

- Compte Render (https://render.com)
- Base de données PostgreSQL (Render PostgreSQL ou externe)

### 1.2 Configuration Render

#### Étape 1: Créer une Web Service

1. Connectez-vous à Render
2. Cliquez sur **"New"** → **"Web Service"**
3. Choisissez **"Build and deploy from a Git repository"**
4. Connectez votre repo GitHub/GitLab

#### Étape 2: Configuration du service

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `espace-kanaga-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

#### Étape 3: Variables d'environnement

Ajoutez ces variables dans l'onglet **Environment**:

```
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=votre_secret_jwt_complexe_ici
JWT_REFRESH_SECRET=votre_secret_refresh_complexe
API_URL=https://espace-kanaga-api.onrender.com
PORT=10000
```

> **Note**: Si vous utilisez Render PostgreSQL, l'URL sera fournie automatiquement.

### 1.3 Fichier `render.yaml` (Alternative)

Créez un fichier `render.yaml` à la racine du projet:

```yaml
services:
  - type: web
    name: espace-kanaga-api
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: espace-kanaga-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000

databases:
  - name: espace-kanaga-db
    databaseName: espacekanaga
    user: espacekanaga
```

Pour déployer avec ce fichier:
```bash
# Dans Render Dashboard, utilisez "Blueprint" pour importer ce fichier
```

### 1.4 Correction du Build (IMPORTANT)

Le problème `Cannot find module '.prisma/client/default'` se produit car Prisma Client n'est pas généré. Le `package.json` du backend inclut déjà un script `postinstall` qui exécute `prisma generate` après chaque `npm install`.

Vérifiez que votre `backend/package.json` contient:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
```

### 1.5 Migrations Prisma

Pour exécuter les migrations sur Render:

**Option A - Manuelle (CLI Render)**:
```bash
render ssh --service espace-kanaga-api
cd backend
npx prisma migrate deploy
```

**Option B - Script de démarrage** (déconseillé en production):
Modifiez `startCommand`:
```bash
npx prisma migrate deploy && npm start
```

---

## 🌐 PARTIE 2: Frontend sur Netlify

### 2.1 Prérequis

- Compte Netlify (https://netlify.com)
- Repo GitHub/GitLab connecté

### 2.2 Configuration Netlify

#### Étape 1: Nouveau site

1. Connectez-vous à Netlify
2. Cliquez sur **"Add new site"** → **"Import an existing project"**
3. Choisissez GitHub/GitLab et votre repo

#### Étape 2: Configuration du build

| Paramètre | Valeur |
|-----------|--------|
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` |

#### Étape 3: Variables d'environnement

Ajoutez dans **Site settings** → **Environment variables**:

```
VITE_API_URL=https://espace-kanaga-api.onrender.com/api
```

> **Important**: Remplacez par l'URL réelle de votre backend Render.

### 2.3 Fichier `netlify.toml`

Créez un fichier `netlify.toml` à la racine du projet:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "frontend/dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2.4 Configuration CORS (Backend)

Assurez-vous que le backend accepte les requêtes du frontend. Dans `backend/src/app.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',                    // Dev
    'https://votre-site.netlify.app',           // Production Netlify
    'https://espace-kanaga.netlify.app'         // Votre domaine
  ],
  credentials: true
}));
```

---

## 🔒 Sécurité Post-Déploiement

### 1. Créer le Super Admin

Après le déploiement, créez le super administrateur:

```bash
# Via Render CLI
render ssh --service espace-kanaga-api
cd backend
node scripts/seed-super-admin.js
```

Ou exécutez directement:
```bash
# Dans Render Dashboard → Shell
node dist/scripts/seed-super-admin.js
```

### 2. Vérifier la connexion DB

```bash
# Dans Render Shell
npx prisma studio
```

---

## 🐛 Dépannage

### Erreur: `Cannot find module '.prisma/client/default'`

**Cause**: Prisma Client n'est pas généré.

**Solution**:
1. Vérifiez que `postinstall` est dans `package.json`
2. Redéployez avec "Clear build cache & deploy"

### Erreur: `DATABASE_URL` non définie

**Solution**: Ajoutez la variable d'environnement dans Render Dashboard.

### Erreur CORS

**Solution**: Mettez à jour `backend/src/app.ts` avec l'URL Netlify correcte.

### Build TypeScript échoue

**Solution**:
```bash
# En local, vérifiez le build
npm run build
# Corrigez les erreurs TypeScript
```

---

## 📋 Checklist de Déploiement

### Backend (Render)
- [ ] Repo Git connecté à Render
- [ ] `DATABASE_URL` configurée
- [ ] `JWT_SECRET` et `JWT_REFRESH_SECRET` définis
- [ ] `postinstall: prisma generate` dans package.json
- [ ] Migrations exécutées
- [ ] Super Admin créé
- [ ] CORS configuré avec URL Netlify

### Frontend (Netlify)
- [ ] Repo Git connecté à Netlify
- [ ] `VITE_API_URL` pointe vers Render
- [ ] Build réussit
- [ ] Redirection SPA configurée (netlify.toml)

---

## 🔗 URLs Importantes

| Service | URL Locale | URL Production |
|---------|-----------|----------------|
| Backend API | http://localhost:4000 | https://espace-kanaga-api.onrender.com |
| Frontend | http://localhost:5173 | https://espace-kanaga.netlify.app |
| Prisma Studio | http://localhost:5555 | N/A |

---

## 📞 Support

En cas de problème:
1. Vérifiez les logs dans Render Dashboard → Logs
2. Vérifiez les logs dans Netlify Dashboard → Functions
3. Testez l'API avec Postman/curl
4. Vérifiez les variables d'environnement
