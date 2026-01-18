/**
 * Utility to handle SQLite concurrency issues (SQLITE_BUSY)
 * Wraps database operations with a retry mechanism.
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  description: string = 'DB Operation', 
  maxRetries: number = 5
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (e: any) {
      lastError = e;
      
      // Check for SQLite locking errors
      if (
        e.message?.includes('SQLITE_BUSY') || 
        e.code === 'SQLITE_BUSY' ||
        e.message?.includes('database is locked')
      ) {
        const delay = 1000 * (i + 1); // Exponential backoff-ish (1s, 2s, 3s...)
        console.warn(`[DB Lock] ⚠️ ${description} bloqueada. Reintentando en ${delay}ms (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a lock error, throw immediately
      throw e;
    }
  }
  
  console.error(`[DB Lock] ❌ Falló ${description} después de ${maxRetries} intentos.`);
  throw lastError;
}
