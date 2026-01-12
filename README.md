# Backend – Application de sondage

Ce projet représente la partie **backend** d’une application de sondage.
Il fournit une API **GraphQL** permettant de gérer les sondages et les votes.

Le backend est utilisé par le frontend pour :
- récupérer les sondages,
- envoyer les votes des utilisateurs,
- gérer le vote anonyme.

---

## Technologies utilisées

- Node.js
- TypeScript
- Express
- Apollo Server
- GraphQL
- Prisma

---

## Prérequis

Avant de lancer le projet, il faut avoir :

- Node.js installé
- npm installé
- Une base de données configurée avec Prisma

---

## Installation

Dans le dossier **backend**, exécuter :

```bash
npm install

Lancer le serveur

Pour démarrer le serveur en mode développement :

npm run dev


Le serveur GraphQL sera disponible à l’adresse suivante :

http://localhost:4000/graphql
