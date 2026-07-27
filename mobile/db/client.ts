import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

export const expoDb = openDatabaseSync('users.db'); 
export const db = drizzle(expoDb);