# Architecture VPS — LibLeadIN
> Infrastructure de production. Derniere mise a jour : 9 mars 2026

---

## 1. Vue d'ensemble

```
                              INTERNET
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
       :22 (SSH)          :80/:443 (Traefik)    :8080-8084 (NGINX)
            │                    │                    │
       Fail2ban            ┌─────┴──────┐        Autres projets
       (3 max, 2h)         │  Traefik   │        (non LibLeadIN)
                           │  SSL auto  │
                           └─────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              PM2 :3001    Docker :5678  Docker :4000
              LibLeadIN       n8n         LiteLLM
                    │            │            │
                    │            ├── Google Sheets
                    │            ├── Gmail (OAuth2)
                    │            ├── Hunter.io
                    │            ├── Google Places
                    │            └── LiteLLM :4000
                    │                     │
                    │                ┌────┴────┐
                    │                │  LLMs   │
                    │                │ Gemini  │
                    │                │DeepSeek │
                    │                │  Groq   │
                    │                └─────────┘
                    │
              libleadin.duckdns.org
              (HTTPS Let's Encrypt)
```

---

## 2. Serveur

| Parametre | Valeur |
|-----------|--------|
| Fournisseur | Hostinger |
| Hostname | `srv1268950.hstgr.cloud` |
| IP publique | `72.62.186.157` |
| OS | Ubuntu 24.04.4 LTS |
| CPU | 2 vCPUs AMD EPYC |
| RAM | 8 Go |
| Stockage | 100 Go SSD |
| SSH | Port 22, mot de passe (cle SSH N/A — Mac gere par entreprise) |

---

## 3. Composants LibLeadIN sur le VPS

### 3.1 Application Next.js (PM2)

| Parametre | Valeur |
|-----------|--------|
| Chemin | `/var/www/LibLeadIN` |
| Process manager | PM2 |
| Port | 3001 (bloque par UFW, accessible via Traefik uniquement) |
| Node.js | 20+ |
| Auto-restart | `pm2 startup` (systemd) |
| Commande | `npm run start` |

**Deploiement** :
```bash
ssh root@72.62.186.157
cd /var/www/LibLeadIN
git pull origin main
npm ci
npm run build
pm2 restart LibLeadIN
```

**Logs** :
```bash
pm2 logs LibLeadIN          # Logs temps reel
pm2 logs LibLeadIN --lines 100  # Dernières 100 lignes
pm2 monit                   # Monitoring interactif
```

### 3.2 n8n (Docker)

| Parametre | Valeur |
|-----------|--------|
| Container | `n8n-n8n-1` |
| Image | `docker.n8n.io/n8nio/n8n` |
| Version | v2.35.5 |
| Port | 127.0.0.1:5678 (interne) |
| Volume | `n8n_data` (387 Mo — workflows, credentials, executions) |
| Timezone | Europe/Berlin |
| URL publique | https://n8n.srv1268950.hstgr.cloud |

**Workflows LibLeadIN actifs** :
| Workflow | ID | Webhook |
|----------|----|---------|
| B2B AI Prospecting Agent | `kg0pjtLQvy4bEdit` | POST `/webhook/api/search-leads` |
| Read Leads API | `0QDNW7mjBYTNpL5Z` | GET `/webhook/api/leads` |
| Email Preview API | `QGg3D9BTIokCArOB` | POST `/webhook/api/email-preview` |
| Email Send API | `Kpa3ddgh0PMhlm1Z` | POST `/webhook/api/send-email` |
| Error Handler | `kS0OBZXDM5Lc4jez` | Error trigger (inactif) |

**Gestion** :
```bash
cd /docker/n8n
docker compose ps              # Etat des containers
docker compose logs n8n -f     # Logs n8n
docker compose restart n8n     # Restart n8n
docker compose pull && docker compose up -d  # Mise a jour
```

### 3.3 LiteLLM (Docker)

| Parametre | Valeur |
|-----------|--------|
| Container | `n8n-litellm-1` |
| Image | `ghcr.io/berriai/litellm:main-latest` |
| Port | 4000 (Docker interne uniquement) |
| URL interne | `http://litellm:4000/v1` |
| URL externe | `https://litellm.srv1268950.hstgr.cloud` |
| Config | `/docker/n8n/litellm_config.yaml` |

**Modeles utilises par LibLeadIN** :
| Modele | Provider | Usage |
|--------|----------|-------|
| `gpt-4o-mini` | OpenAI (API directe) | Generation emails personnalises |
| `groq-llama` | Groq Llama 3.3 70B (via LiteLLM) | B2B Agent (scraping) |

**Gestion** :
```bash
cd /docker/n8n
docker compose logs litellm -f    # Logs
docker compose restart litellm    # Restart
cat litellm_config.yaml           # Config modeles
```

### 3.4 Traefik (Docker)

| Parametre | Valeur |
|-----------|--------|
| Container | `n8n-traefik-1` |
| Ports | 0.0.0.0:80, 0.0.0.0:443 |
| SSL | Let's Encrypt (ACME auto-renew) |
| Volume | `traefik_data` (certificats) |
| Config LibLeadIN | `/docker/n8n/traefik-dynamic/libleadin.yml` |

**Routing LibLeadIN** :
```yaml
# /docker/n8n/traefik-dynamic/libleadin.yml
# libleadin.duckdns.org → localhost:3001 (PM2)
```

---

## 4. Flux reseau LibLeadIN

```
Client (navigateur)
    │
    │ HTTPS (port 443)
    v
Traefik (Docker)
    │ libleadin.duckdns.org
    │ SSL termination
    v
PM2 :3001 (LibLeadIN Next.js)
    │
    ├── Pages SSR / Static
    │
    └── API Routes
         │
         ├── /api/auth/*     → JWT local (pas d'appel externe)
         │
         ├── /api/leads      → HTTP GET → n8n :5678 /webhook/api/leads
         │                                    └── Google Sheets API
         │
         ├── /api/stats      → HTTP GET → n8n :5678 /webhook/api/leads
         │                                    └── Calcul stats cote Next.js
         │
         ├── /api/search     → HTTP POST → n8n :5678 /webhook/api/search-leads
         │                                    ├── Google Places (scraping)
         │                                    ├── Hunter.io (email lookup)
         │                                    ├── Google Search (LinkedIn)
         │                                    └── Google Sheets (ecriture)
         │
         ├── /api/email/preview → HTTP POST → n8n :5678 /webhook/api/email-preview
         │                                       ├── Google Sheets (lookup)
         │                                       └── LiteLLM :4000 (Gemini Flash)
         │
         └── /api/email/send    → HTTP POST → n8n :5678 /webhook/api/send-email
                                                 ├── Gmail (OAuth2)
                                                 └── Google Sheets (update)
```

---

## 5. Fichiers de configuration sur le VPS

```
/var/www/LibLeadIN/
├── .env.local                     ← Variables d'environnement
├── .next/                         ← Build Next.js
├── node_modules/
├── package.json
└── (tout le code source)

/docker/n8n/
├── docker-compose.yml             ← 4 services (traefik, n8n, litellm, portfolio)
├── .env                           ← Cles API (GROQ, MISTRAL, GEMINI, DEEPSEEK, LITELLM)
├── litellm_config.yaml            ← Modeles LLM + alias + fallbacks
└── traefik-dynamic/
    ├── libleadin.yml              ← libleadin.duckdns.org → :3001
    └── fifafish.yml               ← fifafish.com → :3000
```

---

## 6. Securite specifique LibLeadIN

### Couche reseau
| Protection | Detail |
|------------|--------|
| UFW | Port 3001 **bloque** — acces uniquement via Traefik |
| UFW | Port 5678 **bloque** — n8n accessible via Traefik uniquement |
| Traefik | TLS auto (Let's Encrypt) pour `libleadin.duckdns.org` |
| Fail2ban | SSH : 3 tentatives max, ban 2h |

### Couche applicative
| Protection | Detail |
|------------|--------|
| JWT | Cookie HttpOnly `libleadin-auth`, expiration 24h |
| Middleware | Verifie structure + expiration JWT sur chaque requete |
| Validation | Input sanitise dans les API routes (longueur, champs requis) |
| CORS | Implicite (meme domaine, pas de CORS headers manuels) |
| Secrets | `.env.local` (pas dans le repo) |

### Couche Docker
| Protection | Detail |
|------------|--------|
| Reseau | `n8n_default` (172.18.0.0/16) — communication inter-containers |
| Exposition | n8n et LiteLLM sur localhost uniquement (pas 0.0.0.0) |
| Volumes | `n8n_data` et `traefik_data` persistent |

---

## 7. Monitoring et debug

### Verifier que tout fonctionne
```bash
# Etat PM2
pm2 status

# Etat Docker
cd /docker/n8n && docker compose ps

# Test endpoint LibLeadIN
curl -s https://libleadin.duckdns.org/api/auth/me | jq

# Test webhook n8n (lecture leads)
curl -s "https://n8n.srv1268950.hstgr.cloud/webhook/api/leads" | jq '.[0]'

# Certificat SSL
echo | openssl s_client -connect libleadin.duckdns.org:443 2>/dev/null | openssl x509 -dates -noout

# Logs combinees
pm2 logs LibLeadIN --lines 50
docker compose -f /docker/n8n/docker-compose.yml logs n8n --tail 50
```

### Problemes courants

| Symptome | Cause probable | Solution |
|----------|---------------|----------|
| 502 Bad Gateway | PM2 down ou build echoue | `pm2 restart LibLeadIN`, verifier logs |
| Webhook timeout | n8n down ou container restart | `docker compose restart n8n` |
| Email preview lent (>60s) | LiteLLM ou Gemini sature | Verifier logs litellm, changer fallback |
| Leads pas affiches | Google Sheets credential expiree | Reconnecter dans n8n UI > Credentials |
| SSL expire | Traefik ACME echoue | Verifier `docker compose logs traefik` |
| "Token expired" | JWT 24h depasse | Se reconnecter via /login |
| DuckDNS pas a jour | IP VPS changee | Mettre a jour sur duckdns.org |

---

## 8. DNS et domaine

| Element | Valeur |
|---------|--------|
| Domaine | `libleadin.duckdns.org` |
| Provider DNS | DuckDNS (gratuit, dynamique) |
| IP pointee | `72.62.186.157` |
| SSL | Let's Encrypt via Traefik (auto-renew) |
| Config Traefik | `/docker/n8n/traefik-dynamic/libleadin.yml` |

**Mise a jour IP DuckDNS** (si l'IP VPS change) :
```bash
curl "https://www.duckdns.org/update?domains=libleadin&token=<DUCKDNS_TOKEN>&ip=<NOUVELLE_IP>"
```

---

## 9. Sauvegardes

| Quoi | Ou | Frequence |
|------|----|-----------|
| Code source | GitHub `main` | A chaque push |
| Donnees n8n | Volume Docker `n8n_data` | Pas de backup auto |
| Google Sheets | Google Cloud (auto) | Versioning Google |
| Config Docker | `/docker/n8n/*.bak` | Backups manuels |

**Recommandation** : Ajouter un backup periodique de `n8n_data` :
```bash
docker run --rm -v n8n_data:/data -v /backups:/backup alpine \
  tar czf /backup/n8n_data_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 10. Cohabitation avec les autres projets

LibLeadIN partage le VPS avec 6 autres projets. Points de contact :

| Ressource partagee | Detail |
|--------------------|--------|
| Traefik | Reverse proxy commun (n8n, LiteLLM, FifaFish, LibLeadIN, Portfolio) |
| Docker network | `n8n_default` (n8n, LiteLLM, Traefik, Portfolio) |
| NGINX | Ports 8080-8084 pour les autres projets (pas LibLeadIN) |
| PM2 | FifaFish (:3000) + LibLeadIN (:3001) |
| UFW | Regles partagees (ports autorises/bloques) |
| RAM | 8 Go partages entre tous les process |

**Impact potentiel** : Si n8n ou LiteLLM sont utilises intensivement par LiBrain (5 agents IA), cela peut affecter les performances des webhooks LibLeadIN. Surveiller `htop` et `docker stats` en cas de lenteur.
