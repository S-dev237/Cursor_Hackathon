/**
 * Configuration de l'API.
 *
 * En développement avec Expo Go sur un téléphone physique, `localhost` ne
 * fonctionne PAS : il faut l'IP LAN de la machine qui exécute le backend.
 *
 * Définissez l'URL via la variable d'environnement EXPO_PUBLIC_API_URL
 * (dans un fichier .env à la racine de mobile/) :
 *
 *   EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
 *
 * À défaut, la valeur par défaut ci-dessous est utilisée — pensez à
 * remplacer l'IP par celle de votre machine.
 */
const DEFAULT_API_URL = 'http://192.168.1.10:8000';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const API_BASE = `${API_URL}/api/v1`;
