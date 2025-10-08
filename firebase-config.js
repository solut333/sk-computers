// Se o SDK for carregado via CDN (compat.js), não use 'import'.
// A variável 'firebase' já estará disponível globalmente.

// Seus dados de configuração
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

// Inicialize o Firebase usando a sintaxe global 'firebase'
// Esta linha torna o objeto 'firebase' utilizável em todo o seu código.
const app = firebase.initializeApp(firebaseConfig);

// Opcionalmente, se você usar Analytics, inicialize assim (mas não é obrigatório para o login)
// const analytics = firebase.analytics(); 

// Nota: A inicialização das instâncias de 'auth' e 'firestore' deve vir no seu 'login.html'
// APÓS o carregamento deste script, como já fizemos no código anterior.
