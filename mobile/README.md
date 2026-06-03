# AcaDoc — Application mobile

Application mobile **React Native + Expo (Expo Go)** pour la bibliothèque
académique intelligente AcaDoc. Design minimaliste, palette **verte & blanche**.

## Fonctionnalités

- **Accueil attractif** : bannière, actions rapides, ajouts récents.
- **Connexion / inscription** (JWT, stocké de façon sécurisée via `expo-secure-store`).
- **Liste des documents** avec catégorisation (type, niveau d'accès, année),
  recherche et filtre « Mes documents ».
- **Import de PDF** (`expo-document-picker`) avec choix du type
  (cours, TD, TP, mémoire, thèse, article…) et du niveau d'accès
  (PUBLIC / CAMPUS / PRIVÉ).
- **Menu contextuel au long-press** : ouvrir, discuter, et **supprimer**
  (réservé à l'auteur du document).
- **Lecture de PDF** intégrée (WebView) avec ouverture dans le navigateur.
- **Chat sur le contexte d'un document** (onglet « Discuter »).
- **Assistant IA global** : poser des questions sur l'ensemble des documents
  accessibles (RAG du backend).

## Prérequis

- Node.js ≥ 18
- Application **Expo Go** installée sur votre téléphone
- Le backend FastAPI démarré et accessible depuis le téléphone

## Configuration

Créez un fichier `.env` (voir `.env.example`) et renseignez l'URL du backend.
Sur un téléphone physique, utilisez l'**IP LAN** de votre machine (pas `localhost`) :

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
```

## Démarrage

```bash
cd mobile
npm install
npx expo start
```

Scannez ensuite le QR code avec Expo Go.

## Notes

- Le rendu PDF utilise le WebView natif (iOS) ou la visionneuse Google Docs
  (Android). L'URL présignée MinIO doit être joignable depuis le téléphone :
  configurez `MINIO_ENDPOINT` côté backend avec l'IP LAN si nécessaire.
- L'architecture est volontairement simple : `src/lib` (API, auth, thème),
  `src/components` (UI réutilisable), `src/app` (routes expo-router).
