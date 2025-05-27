/**
 * IndexedDB-based cache for storing analysis results
 * This helps reduce processing load by caching previous analyses
 */

// Cache constants
const DB_NAME = 'mitr_ai_cache';
const DB_VERSION = 1;
const ANALYSIS_STORE = 'analysis_results';
const MESSAGE_STORE = 'message_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Initialize the database
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error opening IndexedDB', event);
      reject('Failed to open database');
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create analysis results store
      if (!db.objectStoreNames.contains(ANALYSIS_STORE)) {
        const store = db.createObjectStore(ANALYSIS_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create message cache store
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
        const store = db.createObjectStore(MESSAGE_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Store analysis result in cache
export async function storeAnalysisResult(key: string, data: any): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction(ANALYSIS_STORE, 'readwrite');
    const store = transaction.objectStore(ANALYSIS_STORE);
    
    // Store the data with timestamp
    await store.put({
      id: key,
      data,
      timestamp: Date.now()
    });
    
    // Cleanup old entries
    cleanupExpiredEntries();
  } catch (error) {
    console.error('Failed to store analysis result', error);
  }
}

// Get analysis result from cache
export async function getAnalysisResult(key: string): Promise<any | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction(ANALYSIS_STORE, 'readonly');
    const store = transaction.objectStore(ANALYSIS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        
        // Return null if not found or expired
        if (!result || Date.now() - result.timestamp > CACHE_EXPIRY) {
          resolve(null);
          return;
        }
        
        resolve(result.data);
      };
      
      request.onerror = () => {
        reject(null);
      };
    });
  } catch (error) {
    console.error('Failed to get analysis result', error);
    return null;
  }
}

// Store message in cache
export async function storeMessage(id: string, message: any): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction(MESSAGE_STORE, 'readwrite');
    const store = transaction.objectStore(MESSAGE_STORE);
    
    // Store the message with timestamp
    await store.put({
      id,
      data: message,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to store message', error);
  }
}

// Get messages from cache
export async function getMessages(): Promise<any[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction(MESSAGE_STORE, 'readonly');
    const store = transaction.objectStore(MESSAGE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const results = (event.target as IDBRequest).result;
        
        // Filter out expired messages
        const validMessages = results
          .filter(result => Date.now() - result.timestamp < CACHE_EXPIRY)
          .map(result => result.data)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        resolve(validMessages);
      };
      
      request.onerror = () => {
        reject([]);
      };
    });
  } catch (error) {
    console.error('Failed to get messages', error);
    return [];
  }
}

// Clean up expired entries
async function cleanupExpiredEntries(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([ANALYSIS_STORE, MESSAGE_STORE], 'readwrite');
    const analysisStore = transaction.objectStore(ANALYSIS_STORE);
    const messageStore = transaction.objectStore(MESSAGE_STORE);
    
    // Get all keys from analysis store
    const analysisRequest = analysisStore.index('timestamp').openCursor();
    analysisRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (Date.now() - cursor.value.timestamp > CACHE_EXPIRY) {
          analysisStore.delete(cursor.value.id);
        }
        cursor.continue();
      }
    };
    
    // Get all keys from message store
    const messageRequest = messageStore.index('timestamp').openCursor();
    messageRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (Date.now() - cursor.value.timestamp > CACHE_EXPIRY) {
          messageStore.delete(cursor.value.id);
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Failed to cleanup expired entries', error);
  }
}
