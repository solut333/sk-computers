

const firebaseConfig = {
    apiKey: "$V_FIREBASE_API_KEY", 
    authDomain: "$V_FIREBASE_AUTH_DOMAIN", 
    databaseURL: "https://hell-lost-default-rtdb.firebaseio.com", 
    projectId: "$V_FIREBASE_PROJECT_ID",
    storageBucket: "hell-lost.appspot.com",
    messagingSenderId: "534079861205",
    appId: "$V_FIREBASE_APP_ID",
    measurementId: "$V_FIREBASE_MEASUREMENT_ID" 
};

// Inicializa o Firebase App de forma global (Sintaxe compatível).
firebase.initializeApp(firebaseConfig);
