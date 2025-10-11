import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, getDocs, doc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const adminPanel = document.getElementById("adminPanel");
const productsContainer = document.getElementById("productsContainer");
const logoutBtn = document.getElementById("logoutBtn");
const addProductForm = document.getElementById("addProductForm");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDocs(collection(db, "admins"));
  const isAdmin = adminSnap.docs.some((doc) => doc.id === user.uid);

  if (!isAdmin) {
    alert("Acesso negado!");
    window.location.href = "index.html";
    return;
  }

  adminPanel.style.display = "block";
  carregarProdutos();
});

async function carregarProdutos() {
  productsContainer.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "product-item";
    div.innerHTML = `
      <h4>${data.name}</h4>
      <p>R$${data.price}</p>
      <button class="btn btn-danger btn-sm" data-id="${docSnap.id}">Excluir</button>
    `;
    div.querySelector("button").addEventListener("click", async () => {
      await deleteDoc(doc(db, "products", docSnap.id));
      carregarProdutos();
    });
    productsContainer.appendChild(div);
  });
}

addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const price = parseFloat(document.getElementById("price").value);
  const image = document.getElementById("image").value;
  const category = document.getElementById("category").value;

  if (!name || !price || !image) return alert("Preencha todos os campos.");

  const id = name.toLowerCase().replace(/\s+/g, "-") + Date.now();
  await setDoc(doc(db, "products", id), { name, price, image, category });

  addProductForm.reset();
  carregarProdutos();
});

logoutBtn.addEventListener("click", () => signOut(auth));
