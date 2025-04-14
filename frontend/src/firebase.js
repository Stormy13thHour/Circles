import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAcsJYzjLOi0wAiP6bKIySYSAda0hmU-EQ",
    authDomain: "circles-f08c2.web.app",
    projectId: "circles-f08c2",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged, signOut };
