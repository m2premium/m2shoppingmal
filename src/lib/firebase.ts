import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBR5uftNPBku__oW5wlgGgsBuRxz9fgdxI",
  authDomain: "studio-2819740942-bba36.firebaseapp.com",
  projectId: "studio-2819740942-bba36",
  storageBucket: "studio-2819740942-bba36.firebasestorage.app",
  messagingSenderId: "820709062618",
  appId: "1:820709062618:web:350006754a7106931d32e3"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with IndexedDB-based offline data persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, "ai-studio-m2shoppingmallma-c7eeb2dc-d50d-419a-af0b-1bb4741663a5");

export { db };
