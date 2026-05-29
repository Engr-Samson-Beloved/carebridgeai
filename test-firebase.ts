import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

async function testConnection() {
  console.log("==========================================");
  console.log("CareBridge Firebase Connection Diagnostics");
  console.log("==========================================");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  console.log("API Key:", firebaseConfig.apiKey ? "PRESENT" : "MISSING");
  console.log("App ID:", firebaseConfig.appId);
  console.log("------------------------------------------");

  try {
    console.log("Initializing Firebase App...");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log("Attempting silent Anonymous Authentication...");
    const credential = await signInAnonymously(auth);
    console.log("Anonymous Auth success! UID:", credential.user.uid);

    console.log("Attempting to query Firestore 'assessments' collection...");
    const q = query(collection(db, 'assessments'), limit(1));
    const snapshot = await getDocs(q);
    console.log("Firestore query success!");
    console.log(`Successfully fetched ${snapshot.size} assessments documents.`);
    console.log("------------------------------------------");
    console.log("CONCLUSION: The new Firebase credentials are FULLY FUNCTIONAL and online!");
    process.exit(0);
  } catch (err: any) {
    console.error("------------------------------------------");
    console.error("DIAGNOSTICS FAILURE: Could not connect to Firebase/Firestore.");
    console.error("Error Code:", err.code || "N/A");
    console.error("Error Message:", err.message || err);
    console.error("------------------------------------------");
    console.error("Troubleshooting Recommendations:");
    console.error("1. Verify if 'Anonymous' sign-in is enabled in Firebase Console (Build -> Authentication).");
    console.error("2. Verify if the Firestore database with ID '" + (firebaseConfig.firestoreDatabaseId || "(default)") + "' has been initialized.");
    console.error("3. Verify if your current IP is blocked or if you are offline.");
    process.exit(1);
  }
}

testConnection();
