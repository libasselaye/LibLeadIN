# CONTEXT.md — LibLeadIN
> Source de verite du projet. Derniere mise a jour : 9 mars 2026

---

## 1. Identite du projet

| Champ | Valeur |
|-------|--------|
| Nom | **LibLeadIN** |
| Type | Plateforme de prospection B2B assistee par IA |
| Auteur | Mame Libasse MBOUP — AI Engineer / Data Scientist |
| Repo | https://github.com/libasselaye/libleadin (public) |
| Production | https://libleadin.duckdns.org |
| Branche stable | `main` (7 commits, 1 contributeur) |
| Licence | Tous droits reserves |

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React + Tailwind CSS | 19.2.3 / 4.x |
| Language | TypeScript | 5.x |
| Animations | Framer Motion | 12.34.3 |
| Data fetching | SWR | 2.4.0 |
| Charts | Recharts | 3.7.0 |
| Icons | Lucide React | 0.575.0 |
| Auth | JWT (jsonwebtoken) + cookie HttpOnly | 9.0.3 |
| CSS utils | clsx + tailwind-merge | 2.1.1 / 3.5.0 |
| Automatisation | n8n (webhooks) | v2.35.5 |
| LLM proxy | LiteLLM | via Docker |
| Donnees | Google Sheets (source of truth) | API v4 |
| Process manager | PM2 | production |

---

## 3. Architecture fonctionnelle

```
Utilisateur
    |
    v
Frontend Next.js (App Router)
    |
    v
API Routes (/api/*)
    |
    ├── /api/auth/*          → JWT local (email/password vs env vars)
    ├── /api/leads            → n8n webhook → Google Sheets (lecture)
    ├── /api/stats            → Calcule depuis leads
    ├── /api/search           → n8n webhook → B2B Prospecting Agent
    ├── /api/email/preview    → n8n webhook → AI Agent (Gemini Flash)
    └── /api/email/send       → n8n webhook → Gmail + Google Sheets (update)
```

---

## 4. Structure du code

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Geist fonts, ToastProvider, lang=fr)
│   ├── page.tsx                      # Redirect → /dashboard
│   ├── login/page.tsx                # Formulaire email/password
│   ├── (app)/                        # Groupe protege par auth
│   │   ├── layout.tsx                # AppShell wrapper
│   │   ├── dashboard/page.tsx        # Stats, secteurs, activite recente (refresh 15s)
│   │   ├── search/page.tsx           # Formulaire recherche + suivi live (poll 3s)
│   │   └── prospects/page.tsx        # Grille prospects + filtres + modals
│   └── api/
│       ├── auth/login/route.ts       # POST → JWT cookie
│       ├── auth/logout/route.ts      # POST → clear cookie
│       ├── auth/me/route.ts          # GET → session check
│       ├── search/route.ts           # POST → triggerSearch()
│       ├── leads/route.ts            # GET → getAllLeads() + filtres
│       ├── stats/route.ts            # GET → getStats()
│       ├── email/preview/route.ts    # POST → generateEmailPreview()
│       └── email/send/route.ts       # POST → triggerEmailSend()
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Layout principal (sidebar responsive)
│   │   ├── Sidebar.tsx               # Navigation + logout
│   │   └── AppFooter.tsx             # Credit developpeur
│   ├── prospects/
│   │   ├── ProspectCard.tsx          # Carte lead dans la grille
│   │   └── ProspectDetailModal.tsx   # Fiche detaillee lead
│   ├── email/
│   │   └── EmailConfirmModal.tsx     # Preview + edit + send email (AI)
│   └── ui/
│       ├── Button.tsx                # Variants: primary, secondary, ghost, danger
│       ├── Input.tsx                 # Input avec icone
│       ├── Select.tsx                # Dropdown select
│       ├── Modal.tsx                 # Dialog anime (Framer Motion)
│       ├── GlassCard.tsx             # Carte glassmorphique
│       ├── Badge.tsx                 # Badges statut (success, warning, danger, info)
│       ├── StatCard.tsx              # Affichage metrique dashboard
│       ├── Spinner.tsx               # Loader anime
│       └── Toast.tsx                 # Notifications (context provider, auto-dismiss 4s)
├── hooks/
│   ├── useLeads.ts                   # SWR → /api/leads (polling configurable)
│   ├── useSearch.ts                  # POST /api/search + etat isSearching
│   └── useStats.ts                   # SWR → /api/stats (polling configurable)
├── lib/
│   ├── auth.ts                       # signToken(), verifyToken(), validateCredentials()
│   ├── constants.ts                  # STATUS enum, COOKIE_NAME, COOKIE_MAX_AGE
│   ├── cn.ts                         # clsx + tailwind-merge
│   ├── email-template.ts             # buildHtmlEmail() — template HTML pro + signature
│   ├── n8n-client.ts                 # triggerSearch(), generateEmailPreview(), triggerEmailSend()
│   └── google-sheets.ts              # getAllLeads(), getLeadByName(), getStats()
├── types/
│   ├── api.ts                        # ApiResponse<T>, DashboardStats, ActivityItem
│   ├── lead.ts                       # Lead interface, SHEET_HEADERS, HEADER_TO_KEY
│   └── search.ts                     # SearchFormData, LANGUAGES, TONES, COUNTRIES
└── globals.css                       # Styles Tailwind de base
```

---

## 5. Workflows n8n (production)

Google Sheet partage : `1ll_gayBkTYNLcynm3Gue9YfG1fSzQxi7T1FFFNTN5YQ` (feuille "Leads")

### 5.1 B2B AI Prospecting Agent (`kg0pjtLQvy4bEdit`)
- **Trigger** : Webhook POST `/api/search` + Form trigger
- **Noeuds** : 15 (scrape Google Places → visite sites → Hunter.io → LinkedIn → Google Sheets)
- **Flux** : Recoit (sector, city, country, maxLeads, language) → scrape → enrich → append sheet
- **Status** : Actif

### 5.2 Read Leads API (`0QDNW7mjBYTNpL5Z`)
- **Trigger** : Webhook GET `/api/leads`
- **Noeuds** : 3 (Webhook → Google Sheets read → Respond)
- **Flux** : Lit toutes les lignes de la sheet et retourne JSON
- **Status** : Actif

### 5.3 Email Preview API (`QGg3D9BTIokCArOB`)
- **Trigger** : Webhook POST `/api/email-preview`
- **Noeuds** : 7 (Webhook → Sheets lookup → Prepare Context → Build Prompt → OpenAI gpt-4o-mini → Parse JSON → Respond)
- **LLM** : gpt-4o-mini via OpenAI API directe (JSON Object output format)
- **Flux** : Recoit (leadName, leadEmail) → lookup sheet → construit prompt personnalise → genere email IA → parse JSON → retourne {subject, body}
- **Prompt** : Email B2B personnalise, langage simple (pas de jargon), benefices concrets adaptes au secteur, lien portfolio https://libasse.tech/
- **Error workflow** : `kS0OBZXDM5Lc4jez`
- **Status** : Actif

### 5.4 Email Send API (`Kpa3ddgh0PMhlm1Z`)
- **Trigger** : Webhook POST `/api/send-email`
- **Noeuds** : 5 (Webhook → Set → Gmail → Sheets update → Respond)
- **Flux** : Recoit (leadName, leadEmail, subject, htmlBody) → Gmail → update status "SENT"
- **Destinataire** : Email reel du prospect (production)
- **Error workflow** : `kS0OBZXDM5Lc4jez`
- **Status** : Actif

### 5.5 Error Handler (`kS0OBZXDM5Lc4jez`)
- **Trigger** : Error Trigger (referencé par Email Send + Email Preview)
- **Noeuds** : 3 (Error Trigger → Format → Sheets append "FAILED")
- **Status** : Inactif (declenche uniquement sur erreur)

### 5.6 Templates importes (inactifs, reference)
| Workflow | ID | Description |
|----------|----|-------------|
| Google Maps Email Scraper | `7Dg451Lv6ub5ir8y` | Scrape Maps + extract emails (26 noeuds) |
| AI Lead Generation (GPT-4o) | `AEfy7V4avuj798Nj` | Agent IA + SerpAPI + Maps (8 noeuds) |
| Unlimited Leads Scraper | `y1B1qPTob91lxrMn` | Form → Maps → site scraping avance (22 noeuds) |

---

## 6. Modele de donnees

### Interface Lead (TypeScript)
```typescript
interface Lead {
  rowIndex: number;
  businessSector: string;
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: string;
  linkedinCompany: string;
  linkedinPerson: string;
  decisionMaker: string;
  emailSent: string;       // "true" | ""
  status: string;           // "PENDING" | "SENT - dd/MM/yyyy HH:mm" | "NO_EMAIL" | "FAILED"
}
```

### Colonnes Google Sheets
```
Business Sector | Name | Website | Email | Phone | Address | Category | Rating |
LinkedIn Company | LinkedIn Person | Decision Maker | Email Sent | Status
```

### SearchFormData
```typescript
interface SearchFormData {
  businessSector: string;
  city: string;
  address: string;     // optionnel
  country: string;
  maxLeads: number;
  emailLanguage: string;  // English, French, Spanish, German, Italian
  emailTone: string;      // Professional, Casual, Direct, Friendly, Persuasive
}
```

### DashboardStats
```typescript
interface DashboardStats {
  totalProspects: number;
  emailsSent: number;
  pending: number;
  noEmail: number;
  sendRate: number;         // pourcentage
  bySector: Record<string, { total: number; sent: number }>;
  recentActivity: ActivityItem[];  // 10 derniers SENT
}
```

---

## 7. Variables d'environnement

```bash
# Auth
AUTH_EMAIL=admin@libleadin.com
AUTH_PASSWORD=<mot-de-passe>
JWT_SECRET=<secret-32-chars-minimum>

# n8n Webhooks
N8N_BASE_URL=https://n8n.srv1268950.hstgr.cloud
N8N_SEARCH_WEBHOOK_PATH=/webhook/api/search-leads
N8N_SEND_EMAIL_WEBHOOK_PATH=/webhook/api/send-email
N8N_EMAIL_PREVIEW_WEBHOOK_PATH=/webhook/api/email-preview
N8N_READ_LEADS_WEBHOOK_PATH=/webhook/api/leads

# App
NEXT_PUBLIC_APP_NAME=LibLeadIN
```

---

## 8. Flux utilisateur

### Connexion
1. `/login` → email + password → `POST /api/auth/login`
2. Validation vs `AUTH_EMAIL` / `AUTH_PASSWORD` → JWT 24h → cookie HttpOnly `libleadin-auth`
3. Middleware verifie cookie sur toutes les routes protegees

### Recherche de prospects
1. `/search` → formulaire (secteur, ville, pays, nb leads, langue, ton)
2. `POST /api/search` → n8n B2B Prospecting Agent
3. n8n scrape Google Places → enrichit (email, LinkedIn, tel) → ecrit Google Sheets
4. Frontend poll `/api/leads` toutes les 3s → affichage live des leads trouves
5. Arret quand maxLeads atteint ou 60s de stabilite

### Envoi d'email
1. `/prospects` → clic "Envoyer email" sur un lead
2. Modal s'ouvre → `POST /api/email/preview` → n8n AI Agent genere email personalise
3. Utilisateur edite sujet/corps → clic "Envoyer"
4. `POST /api/email/send` → n8n Gmail + update sheet status "SENT"

### Dashboard
1. `/dashboard` → `GET /api/stats` (refresh 15s)
2. Affiche : total, envoyes, en attente, taux, repartition secteurs, activite recente

---

## 9. Design system

| Element | Valeur |
|---------|--------|
| Police | Geist Sans (default), Geist Mono |
| Couleurs primaires | Blue (#2563eb, #1e40af, #0ea5e9) |
| Succes | Emerald (#10b981) |
| Warning | Amber (#f59e0b) |
| Danger | Red (#ef4444) |
| Style | Glassmorphique (backdrop blur, bordures subtiles, opacites) |
| Animations | Framer Motion (enter/exit, hover) |
| Responsive | Mobile-first (sm: 640, md: 768, lg: 1024) |
| Sidebar | Fixe desktop, drawer hamburger mobile |

---

## 10. Securite

- JWT 24h dans cookie HttpOnly (`libleadin-auth`)
- Middleware verifie structure + expiration JWT
- Routes publiques : `/login`, `/`, `/api/auth/*`, `/_next`, `/favicon`, `/logo.svg`
- API retourne 401 si non authentifie
- Pas de secrets dans le repo (env vars uniquement)
- Production derriere Traefik HTTPS (Let's Encrypt)
- UFW bloque port 3001 (acces via Traefik uniquement)

---

## 11. Deploiement

| Element | Detail |
|---------|--------|
| VPS | Hostinger `srv1268950.hstgr.cloud` (72.62.186.157) |
| OS | Ubuntu 24.04.4 LTS, 2 vCPU, 8 Go RAM, 100 Go SSD |
| Chemin | `/var/www/LibLeadIN` |
| Process | PM2 sur port 3001 |
| Proxy | Traefik (Docker) → `:3001` via `traefik-dynamic/libleadin.yml` |
| Domaine | `libleadin.duckdns.org` (DuckDNS + Let's Encrypt) |
| n8n | Docker `n8n-n8n-1` port interne 5678 |
| LiteLLM | Docker `n8n-litellm-1` port interne 4000 |
| Build | `npm run build` → `pm2 restart LibLeadIN` |

---

## 12. Services externes

| Service | Usage | Endpoint |
|---------|-------|----------|
| Google Sheets | Stockage leads (source of truth) | sheets.googleapis.com |
| n8n | Orchestration workflows (webhooks) | n8n.srv1268950.hstgr.cloud |
| LiteLLM | Proxy LLM unifie | litellm:4000 (Docker interne) |
| Gemini Flash | LLM generation emails | via LiteLLM |
| OpenAI (gpt-4o-mini) | Generation emails personnalises | api.openai.com/v1 |
| Gmail | Envoi emails (OAuth2) | via n8n |
| Hunter.io | Recherche emails (principal) | via n8n B2B Agent |
| RocketReach | Recherche emails (fallback) | via n8n B2B Agent |
| Google Places | Scraping commerces | via n8n B2B Agent |
| DuckDNS | DNS dynamique | duckdns.org |

---

## 13. Limites connues

- Authentification single-user (un seul compte, pas de registration)
- Google Sheets comme BDD (pas de requetes complexes, limites API)
- Temps de scraping variable selon charge Google Places
- Quotas LLM : Groq 6000 req/jour, 12k TPM sur 70B
- Emails envoyes au vrai prospect (mode production actif)
- Pas de tests unitaires / integration
- Pas de CI/CD pipeline

---

## 14. TODO / Roadmap

| Priorite | Tache | Detail |
|----------|-------|--------|
| Haute | Envoi email reel | Desactiver mode test, envoyer au vrai leadEmail |
| Haute | Gestion erreurs enrichie | Retry logic sur webhooks n8n + feedback UI |
| Normale | Multi-utilisateur | Ajouter registration + roles (admin/user) |
| Normale | Migration BDD | Google Sheets → PostgreSQL ou Supabase |
| Normale | Tests | Jest + React Testing Library |
| Normale | CI/CD | GitHub Actions (lint, build, deploy) |
| Basse | Analytics avancees | Graphiques Recharts sur le dashboard |
| Basse | Export CSV | Telecharger la liste de prospects |
