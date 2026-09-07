import { expoDb } from './client';

export function logFullDatabase() {

  if (!__DEV__) {
    return;
  }

  console.log('\n==================== STAN BAZY DANYCH ====================');
  
  const tables = expoDb.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_drizzle%';"
  );

  if (tables.length === 0) {
    console.log('Baza jest pusta (brak tabel).');
    console.log('=========================================================\n');
    return;
  }

  for (const { name } of tables) {
    console.log(`\n------------------------------------------------------ TABELA: ${name} ------------------------------------------------------`);
    const rows = expoDb.getAllSync(`SELECT * FROM ${name};`);
    
    if (rows.length === 0) {
      console.log('(brak wierszy)');
    } else {
      // Czytelne formatowanie wierszy w terminalu
      rows.forEach((row, index) => {
        console.log(`[${index}]`, JSON.stringify(row, null, 2));
      });
    }
  }
  console.log('\n=========================================================');
}