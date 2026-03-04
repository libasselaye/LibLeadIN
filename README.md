# LibLeadIN

Plateforme de prospection B2B assistée par IA, conçue pour accélérer la recherche de leads, la qualification des contacts et la préparation d'emails personnalisés dans un flux de travail unifié.

## Vue d'ensemble

LibLeadIN centralise les étapes clés de la prospection:
- recherche ciblée de prospects,
- enrichissement des données de contact,
- génération assistée d'emails,
- envoi et suivi des statuts,
- pilotage via un dashboard opérationnel.

Le projet est construit pour un usage réel (production), avec une séparation claire entre interface, API applicative et automatisations externes.

## Fonctionnalités principales

- Authentification sécurisée via token et cookie HttpOnly.
- Tableau de bord avec indicateurs de performance (volumétrie, progression, activité récente).
- Moteur de recherche de prospects avec suivi en temps réel.
- Gestion des prospects (filtres, statut, fiche détaillée).
- Prévisualisation d'email personnalisé avant envoi.
- Envoi d'email manuel et traçable.
- Synchronisation des données avec une base tabulaire externe.

## Architecture (haut niveau)

Flux fonctionnel:

`Utilisateur -> Frontend Next.js -> API Routes -> Workflows d'automatisation -> Services externes -> Stockage`

Organisation logique:

- `src/app`: pages et routes API.
- `src/components`: UI et composants métier.
- `src/lib`: intégrations, sécurité, clients de services.
- `src/hooks`: logique de récupération et synchronisation des données.
- `src/types`: contrats TypeScript.

## Stack technique

- Frontend: Next.js (App Router), React, Tailwind CSS.
- Backend applicatif: API Routes Next.js.
- Automatisation: orchestrateur de workflows (webhooks).
- IA: génération de contenu email via fournisseurs LLM.
- Données: stockage tabulaire externe (lecture/écriture via API).
- Monitoring applicatif: métriques métier affichées dans l'interface.

## Sécurité et confidentialité

Ce dépôt **n'expose pas**:
- secrets d'authentification,
- clés API,
- tokens d'automatisation,
- identifiants de service,
- URLs privées d'infrastructure.

Bonnes pratiques à respecter:
- utiliser des variables d'environnement en production,
- ne jamais versionner de secrets,
- faire tourner l'application derrière un reverse proxy HTTPS,
- restreindre l'accès administrateur et renouveler les secrets périodiquement.

## Prérequis

- Node.js 20+
- npm 10+

## Installation locale

```bash
git clone https://github.com/<votre-compte>/LibLeadIN.git
cd LibLeadIN
npm ci
```

## Configuration

Créer un fichier d'environnement local à partir de l'exemple:

```bash
cp .env.example .env.local
```

Renseigner uniquement les variables nécessaires à votre environnement (auth, intégrations externes, configuration applicative).

## Lancement

```bash
npm run dev
```

Application accessible ensuite sur `http://localhost:3000`.

## Scripts utiles

```bash
npm run dev      # développement
npm run build    # build production
npm run start    # démarrage production
npm run lint     # vérification statique
```

## Déploiement (résumé)

Exemple d'approche recommandée:
- build applicatif via `npm run build`,
- exécution via un process manager (ex: PM2),
- reverse proxy Nginx,
- terminaison TLS (Let's Encrypt),
- synchronisation via Git (`main` comme branche de référence).

## Branches et versionning

- `main` porte la version stable de référence.
- chaque évolution fonctionnelle est tracée par commit explicite.
- le déploiement doit rester aligné avec le commit de `origin/main`.

## Limites connues

- La qualité des résultats dépend des fournisseurs externes (données, email, IA).
- Les temps de réponse peuvent varier selon la charge des workflows.
- Le volume de traitement doit être calibré selon les quotas des services connectés.

## Licence

Projet privé. Tous droits réservés, sauf accord explicite.
