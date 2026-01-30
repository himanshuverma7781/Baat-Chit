import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAdxObDwTSEGkcNCDF3NvSvY07OIvMMLxI",
    authDomain: "baat-chitauth.firebaseapp.com",
    projectId: "baat-chitauth",
    storageBucket: "baat-chitauth.firebasestorage.app",
    messagingSenderId: "271371028969",
    appId: "1:271371028969:web:857f5e22c96d5b01612378"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { RecaptchaVerifier };
