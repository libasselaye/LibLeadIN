# CLAUDE.md — Instructions pour Claude Code sur LibLeadIN

---

## Projet

LibLeadIN est une plateforme de prospection B2B assistee par IA. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, n8n pour l'automatisation, Google Sheets comme BDD.

**Repo** : https://github.com/libasselaye/libleadin
**Production** : https://libleadin.duckdns.org
**Source de verite** : CONTEXT.md (lire en priorite)

---

## Commandes

```bash
npm run dev       # Dev local (port 3000)
npm run build     # Build production
npm run start     # Start production
npm run lint      # ESLint
```

Deploiement VPS :
```bash
ssh root@72.62.186.157
cd /var/www/LibLeadIN
git pull origin main
npm ci && npm run build
pm2 restart LibLeadIN
```

---

## Architecture du code

```
src/app/              # Pages + API Routes (App Router)
src/app/api/          # 8 endpoints REST (auth, leads, search, email, stats)
src/components/       # UI (ui/), layout/, prospects/, email/
src/hooks/            # useLeads, useSearch, useStats (SWR)
src/lib/              # auth, n8n-client, google-sheets, constants, cn, email-template
src/types/            # lead, search, api (interfaces TypeScript)
middleware.ts         # Protection JWT sur toutes les routes
```

---

## Conventions de code

### Style
- TypeScript strict, pas de `any`
- Tailwind CSS pour tout le styling (pas de CSS modules)
- Design glassmorphique : `bg-white/[0.05] backdrop-blur border-white/[0.08]`
- Composants UI dans `src/components/ui/` — reutilisables, avec variants
- Pages dans `src/app/(app)/` — protegees par auth
- Langue de l'interface : **francais**
- Langue du code (variables, fonctions, commentaires) : **anglais**

### Patterns
- Data fetching : SWR hooks dans `src/hooks/` (jamais fetch direct dans les composants)
- API routes : validation input → appel lib → reponse JSON standardisee `{ success, data?, error? }`
- n8n : tout passe par `src/lib/n8n-client.ts` (jamais d'appel webhook direct)
- Auth : JWT dans cookie HttpOnly, verifie par middleware
- Composants : client components (`'use client'`) pour interactivite, server par defaut
- Animations : Framer Motion (AnimatePresence, motion.div)
- Icones : Lucide React exclusivement
- Utilitaire CSS : `cn()` de `src/lib/cn.ts` (clsx + tailwind-merge)

### Nommage
- Fichiers composants : PascalCase (`ProspectCard.tsx`)
- Fichiers lib/hooks : camelCase (`useLeads.ts`, `n8n-client.ts`)
- Types/interfaces : PascalCase (`Lead`, `SearchFormData`, `DashboardStats`)
- Constantes : UPPER_SNAKE (`STATUS`, `COOKIE_NAME`, `SHEET_HEADERS`)
- API routes : `route.ts` dans des dossiers nommes (`api/email/send/route.ts`)

### Commits
- Format : `type: description` (feat, fix, docs, refactor, chore)
- En anglais
- Co-authored-by Claude quand applicable

---

## n8n — Integration

LibLeadIN communique avec n8n via des webhooks HTTP. Ne jamais appeler l'API n8n directement depuis le frontend.

### Webhooks actifs
| Endpoint | Methode | Workflow | ID |
|----------|---------|----------|----|
| `/webhook/api/search-leads` | POST | B2B AI Prospecting Agent | `kg0pjtLQvy4bEdit` |
| `/webhook/api/leads` | GET | Read Leads API | `0QDNW7mjBYTNpL5Z` |
| `/webhook/api/email-preview` | POST | Email Preview API | `QGg3D9BTIokCArOB` |
| `/webhook/api/send-email` | POST | Email Send API | `Kpa3ddgh0PMhlm1Z` |

### MCP n8n disponible
Le fichier `.mcp.json` configure le serveur MCP n8n pour Claude Code :
- URL : `https://n8n.srv1268950.hstgr.cloud`
- Permet : lister/lire/modifier/tester les workflows depuis Claude Code
- Utiliser les skills `n8n-*` pour configurer/debugger les workflows

### LLM — Generation emails
- Modele : `gpt-4o-mini` via OpenAI API directe (`https://api.openai.com/v1`)
- Credential n8n : "OpenAi account" (type OpenAI API)
- Output format : JSON Object (`{subject, body}`)
- Prompt personnalise par secteur, langage simple, lien portfolio https://libasse.tech/

### LLM via LiteLLM (B2B Agent)
- Proxy interne Docker : `http://litellm:4000/v1`
- `groq-llama` (Groq Llama 3.3 70B) pour le B2B Prospecting Agent

---

## Variables d'environnement

Fichier : `.env.local` (jamais commite)

```bash
AUTH_EMAIL                        # Email de connexion admin
AUTH_PASSWORD                     # Mot de passe admin
JWT_SECRET                        # Secret JWT (32+ chars)
N8N_BASE_URL                      # https://n8n.srv1268950.hstgr.cloud
N8N_SEARCH_WEBHOOK_PATH           # /webhook/api/search-leads
N8N_SEND_EMAIL_WEBHOOK_PATH       # /webhook/api/send-email
N8N_EMAIL_PREVIEW_WEBHOOK_PATH    # /webhook/api/email-preview
N8N_READ_LEADS_WEBHOOK_PATH       # /webhook/api/leads
NEXT_PUBLIC_APP_NAME              # LibLeadIN
```

---

## Infrastructure VPS

Voir `architecture_vps_libleadin.md` pour le detail complet.

Resume :
- **VPS** : Hostinger Ubuntu 24.04, 2 vCPU, 8 Go RAM
- **LibLeadIN** : PM2 port 3001 → Traefik HTTPS → `libleadin.duckdns.org`
- **n8n** : Docker port 5678 → Traefik HTTPS → `n8n.srv1268950.hstgr.cloud`
- **LiteLLM** : Docker port 4000 (interne uniquement)
- **Securite** : UFW (ports 3001/5678 bloques), Fail2ban SSH, Traefik TLS auto

---

## Google Sheets — Source de donnees

- **Sheet ID** : `1ll_gayBkTYNLcynm3Gue9YfG1fSzQxi7T1FFFNTN5YQ`
- **Feuille** : "Leads"
- **Colonnes** : Business Sector, Name, Website, Email, Phone, Address, Category, Rating, LinkedIn Company, LinkedIn Person, Decision Maker, Email Sent, Status
- **Acces** : Via n8n (credential Google Sheets OAuth2)
- **Mapping** : `HEADER_TO_KEY` dans `src/types/lead.ts`

---

## Points d'attention

1. **Mode production emails** : Les emails sont envoyes au vrai prospect (leadEmail)
2. **Single user** : Un seul compte admin (pas de registration)
3. **Pas de tests** : Aucun test unitaire/integration — a ajouter
4. **Pas de CI/CD** : Deploy manuel via SSH + git pull
5. **Google Sheets limites** : Pas de requetes complexes, quotas API Google
6. **Timeouts** : 30s par defaut, 60s pour generation AI — ajuster si necessaire
7. **Polling** : Le suivi de recherche poll toutes les 3s — surveiller la charge

---

## Fichiers cles a lire en premier

1. `CONTEXT.md` — Vue d'ensemble complete
2. `src/lib/n8n-client.ts` — Point d'entree vers n8n
3. `src/lib/google-sheets.ts` — Lecture/stats des leads
4. `src/app/api/search/route.ts` — Logique de recherche
5. `src/app/(app)/search/page.tsx` — UI de recherche + tracking live
6. `src/types/lead.ts` — Modele de donnees
7. `middleware.ts` — Securite JWT
8. `architecture_vps_libleadin.md` — Infra de production
