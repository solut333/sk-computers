<div class="card h-100">
<img src="${p.img}" class="card-img-top" style="height:160px;object-fit:cover" />
<div class="card-body d-flex flex-column">
<h6 class="card-title">${p.title}</h6>
<p class="text-muted small">${p.socket}</p>
<div class="mt-auto d-flex justify-content-between align-items-center">
<span class="fw-bold">R$ ${p.price.toFixed(2)}</span>
<button class="btn btn-sm btn-primary" onclick='addToCart("${p.id}", ${p.price}, "${escapeHtml(p.title)}")'>Adicionar</button>
</div>
</div>
</div>
</div>`;
});
updateNavCart();
}


function escapeHtml(s){ return s.replace(/"/g,'\\"'); }


function updateNavCart(){ document.getElementById('navCartCount').innerText = cart.reduce((s,i)=>s+i.qty,0); }


function addToCart(id, price, title){ const item = cart.find(x=>x.id===id); if(item) item.qty++; else cart.push({id, price, title, qty:1}); localStorage.setItem('sk_cart',JSON.stringify(cart)); updateNavCart(); alert('Adicionado ao carrinho'); }



document.getElementById('filterSocket')?.addEventListener('change', ()=>{
const s = document.getElementById('filterSocket').value;
// Simples: recarrega mas apenas mostra os que combinam
db.collection('products').get().then(snapshot=>{
const container = document.getElementById('productGrid'); container.innerHTML='';
snapshot.forEach(doc=>{ const p={id:doc.id,...doc.data()}; if(!s||p.socket===s) container.innerHTML += productCardHtml(p); });
});
});


function productCardHtml(p){ return `
<div class="col-md-3">
<div class="card h-100">
<img src="${p.img}" class="card-img-top" style="height:160px;object-fit:cover" />
<div class="card-body d-flex flex-column">
<h6 class="card-title">${p.title}</h6>
<p class="text-muted small">${p.socket}</p>
<div class="mt-auto d-flex justify-content-between align-items-center">
<span class="fw-bold">R$ ${p.price.toFixed(2)}</span>
<button class="btn btn-sm btn-primary" onclick='addToCart("${p.id}", ${p.price}, "${escapeHtml(p.title)}")'>Adicionar</button>
</div>
</div>
</div>
</div>`;
}



async function checkout(paymentMethod){
const user = auth.currentUser; if(!user) return alert('Faça login para finalizar compra');
if(cart.length===0) return alert('Carrinho vazio');
const order = { userId:user.uid, userEmail:user.email, items:cart, total: cart.reduce((s,i)=>s+i.price*i.qty,0), paymentMethod, status:'pendente', createdAt: firebase.firestore.FieldValue.serverTimestamp() };
await db.collection('orders').add(order);
cart=[]; localStorage.setItem('sk_cart',JSON.stringify(cart)); updateNavCart(); alert('Pedido criado com sucesso'); window.location='index.html';
}



auth.onAuthStateChanged(user=>{ if(user) loadProducts(); else loadProducts(); });
loadProducts();



function renderCartPage(){ const container = document.getElementById('cartItems'); if(!container) return; container.innerHTML=''; let total=0; cart.forEach(it=>{ total += it.price*it.qty; container.innerHTML += `<div class='d-flex justify-content-between py-2 border-bottom'><div>${it.title} x ${it.qty}</div><div>R$ ${(it.price*it.qty).toFixed(2)}</div></div>`; }); container.innerHTML += `<div class='text-end mt-3'><strong>Total: R$ ${total.toFixed(2)}</strong><div class='mt-2'><button class='btn btn-primary me-2' onclick="checkout('pix')">Pagar com PIX</button><button class='btn btn-outline-primary' onclick="checkout('card')">Cartão</button></div></div>`; }



renderCartPage();