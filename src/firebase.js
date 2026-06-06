import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// TODO: Replace with your actual Firebase config
// Bạn cần thay thế object này bằng thông tin cấu hình từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app, db;

try {
  // Bỏ comment dòng dưới đây khi bạn đã có cấu hình thật
  // app = initializeApp(firebaseConfig);
  // db = getFirestore(app);
  console.log("Firebase not fully initialized yet. Need valid config.");
} catch (error) {
  console.error("Firebase init error", error);
}

// Function to save highscore
export async function saveHighscore(playerName, score) {
  if (!db) {
    console.warn("Cannot save score, Firebase is not configured.");
    return;
  }
  try {
    await addDoc(collection(db, "highscores"), {
      name: playerName || "Player",
      score: score,
      date: new Date()
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Function to get highscores
export async function getHighscores() {
  if (!db) {
    return [{name: "Local Player", score: 100}];
  }
  try {
    const q = query(collection(db, "highscores"), orderBy("score", "desc"), limit(5));
    const querySnapshot = await getDocs(q);
    const scores = [];
    querySnapshot.forEach((doc) => {
      scores.push(doc.data());
    });
    return scores;
  } catch (e) {
    console.error("Error getting scores: ", e);
    return [];
  }
}
