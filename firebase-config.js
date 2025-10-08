// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdigHfvpP5ya5WYRWukCBn-IkGNlvIbXs",
  authDomain: "hell-lost.firebaseapp.com",
  databaseURL: "https://hell-lost-default-rtdb.firebaseio.com",
  projectId: "hell-lost",
  storageBucket: "hell-lost.appspot.com",
  messagingSenderId: "534079861205",
  appId: "1:534079861205:web:123dace0a54b2adbbbcd5c",
  measurementId: "G-F54KHB6107"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);