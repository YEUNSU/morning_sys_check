import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =================================================================================
// 중요: 여기에 본인의 Firebase 프로젝트 웹 앱 설정 정보를 붙여넣어 주세요.
// This information can be found in your Firebase project settings.
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDTLE0nJYhTqYchpP0vLUQ4v80r8tu30xI",
  authDomain: "morning-sys-check.firebaseapp.com",
  projectId: "morning-sys-check",
  storageBucket: "morning-sys-check.appspot.com",
  messagingSenderId: "878507583078",
  appId: "1:878507583078:web:9f1d0d5b177a4f382b2fa7",
  measurementId: "G-YJ2YPFY039"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
