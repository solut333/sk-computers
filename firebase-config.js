

const firebaseConfig = {
    apiKey: "PLACEHOLDER_V_FIREBASE_API_KEY", 
    authDomain: "PLACEHOLDER_V_FIREBASE_AUTH_DOMAIN", 
    databaseURL: "https://hell-lost-default-rtdb.firebaseio.com", 
    projectId: "PLACEHOLDER_V_FIREBASE_PROJECT_ID",
    storageBucket: "hell-lost.appspot.com",
    messagingSenderId: "534079861205",
    appId: "1:534079861205:web:b787b502aae76b8abbcd5c",
    measurementId: "G-QP0V109MQC" 
};

// Inicializa o Firebase App de forma global (Sintaxe compatível).
// Esta chamada é crucial para que o 'firebase.auth()' e 'firebase.firestore()' funcionem.
firebase.initializeApp(firebaseConfig);
