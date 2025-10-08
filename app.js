// --- CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE ---
// Apenas acessa as variáveis globais necessárias (sem redeclaração de firebaseConfig)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// Usamos initialAuthToken para tentar login anônimo ou por token, se necessário.
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; 

// Inicializa Instâncias Globais (assumindo que foram inicializadas por firebase-config.js)
let auth = firebase.auth();
let db = firebase.firestore();

// Log level para debugging (recomendado)
if (db) {
    db.settings({ experimentalForceLongPolling: true }); // Para compatibilidade
    firebase.firestore.setLogLevel('debug');
}


// --- CORE APPLICATION STATE & DOM ELEMENTS ---
// O carrinho será sincronizado com o Firestore
let cart = []; 
let currentUserId = null;
let cartUnsubscribe = null; // Listener para atualizações em tempo real do carrinho

const productGrid = document.getElementById('productGrid');
const filterSocket = document.getElementById('filterSocket');
const navCartCount = document.getElementById('navCartCount');
const navMenu = document.getElementById('navMenu'); 

// --- UTILITY FUNCTIONS ---

/**
 * Escapa caracteres HTML para uso seguro em atributos (como onclick).
 */
function escapeHtml(s) { 
    return s ? s.replace(/"/g, '\\"').replace(/'/g, "\\'") : ''; 
}

/**
 * Substitui alert(): Exibe uma notificação temporária no canto da tela.
 */
function showNotification(message, isError = false) {
    let notification = document.getElementById('app-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'app-notification';
        notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 20px; border-radius: 8px; z-index: 1000; transition: opacity 0.3s, transform 0.3s; opacity: 0; transform: translateY(100%); font-weight: bold; box-shadow: 0 4px 12px rgba(0 0 0 / 20%);';
        document.body.appendChild(notification);
    }
    
    notification.innerText = message;
    notification.style.backgroundColor = isError ? '#dc3545' : '#198754';
    notification.style.color = 'white';
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100%)';
    }, 3000);
}


// --- CART & FIRESTORE LOGIC ---

/**
 * Saves the local cart state to Firestore.
 */
async function saveCartToFirestore() {
    // Certifique-se de que o usuário e o DB estão disponíveis antes de salvar
    if (!currentUserId || !db) return;
    
    try {
        // Caminho privado do usuário: /artifacts/{appId}/users/{userId}/cart/current
        const cartRef = db.collection('artifacts').doc(appId).collection('users').doc(currentUserId).collection('cart').doc('current');
        await cartRef.set({ items: cart, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        // showNotification("Carrinho sincronizado com sucesso.");
    } catch (error) {
        console.error("Erro ao salvar carrinho no Firestore:", error);
        showNotification("Erro ao sincronizar carrinho.", true);
    }
}

/**
 * Attaches a real-time listener to the user's cart in Firestore.
 */
function setupCartListener(userId) {
    if (cartUnsubscribe) cartUnsubscribe();
    
    // Caminho privado do usuário: /artifacts/{appId}/users/{userId}/cart/current
    const cartRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('cart').doc('current');
    
    cartUnsubscribe = cartRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
            const data = docSnapshot.data();
            cart = Array.isArray(data?.items) ? data.items : [];
        } else {
            cart = [];
        }
        updateNavCart();
        renderCartPage(); // Re-renderiza a página do carrinho se estiver aberta
    }, (error) => {
        console.error("Erro no listener do carrinho:", error);
    });
}

/**
 * Atualiza a contagem de itens no carrinho da barra de navegação.
 */
function updateNavCart() {
    if (navCartCount) {
        const totalItems = cart.reduce((s, i) => s + i.qty, 0);
        navCartCount.innerText = totalItems;
    }
}

/**
 * Adiciona um item ao carrinho (ou incrementa a quantidade) e salva no Firestore.
 */
window.addToCart = function(id, price, title) {
    if (!currentUserId || currentUserId === 'anonymous') {
        showNotification('Faça login ou crie uma conta para adicionar itens ao carrinho.', true);
        return;
    }
    
    const item = cart.find(x => x.id === id);
    if (item) {
        item.qty++;
    } else {
        cart.push({ id, price, title, qty: 1 });
    }
    
    saveCartToFirestore();
    showNotification('Produto adicionado ao carrinho!');
}

/**
 * Finaliza a compra e salva a ordem no Firestore.
 */
window.checkout = async function(paymentMethod) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
        return showNotification('Faça login com sua conta para finalizar a compra.', true);
    }
    if (cart.length === 0) {
        return showNotification('Carrinho vazio. Adicione produtos para finalizar.', true);
    }
    
    try {
        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const order = {
            userId: user.uid,
            userEmail: user.email,
            items: cart,
            total: total,
            paymentMethod: paymentMethod,
            status: 'pendente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Salva a ordem na coleção 'orders' (caminho público/compartilhado)
        const ordersRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('orders');
        await ordersRef.add(order);
        
        // Limpa o carrinho após a compra
        cart = [];
        await saveCartToFirestore(); // Sincroniza o carrinho vazio com o Firestore

        showNotification('Pedido criado com sucesso! Redirecionando...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error("Erro ao finalizar checkout:", error);
        showNotification("Erro ao processar o pedido. Tente novamente.", true);
    }
}


// --- PRODUCT DISPLAY LOGIC (omitted for brevity, assume correct) ---

function productCardHtml(p) { 
    return `
    <div class="col-md-3">
        <div class="card h-100 shadow-sm">
            <img src="${p.img || p.image || 'https://placehold.co/400x300/808080/FFF?text=Produto'}" class="card-img-top" style="height:160px;object-fit:cover" />
            <div class="card-body d-flex flex-column">
                <h6 class="card-title">${p.title || p.name}</h6>
                <p class="text-muted small">${p.socket}</p>
                <div class="mt-auto d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-success">R$ ${(p.price || 0).toFixed(2)}</span>
                    <button class="btn btn-sm btn-primary" onclick='addToCart("${p.id}", ${p.price}, "${escapeHtml(p.title)}")'>Adicionar</button>
                </div>
            </div>
        </div>
    </div>`;
}

// Implementação simplificada de loadProducts (para fins de exemplo)
async function loadProducts() {
    if (!db || !productGrid) return;
    productGrid.innerHTML = '<div class="col-12 text-center text-muted">Carregando produtos...</div>';
    
    try {
        const productsRef = db.collection('products'); 
        const snapshot = await productsRef.get();
        const productsHtml = [];
        
        snapshot.forEach(doc => {
            const p = { id: doc.id, ...doc.data() };
            productsHtml.push(productCardHtml(p));
        });

        if (productsHtml.length === 0) {
            productGrid.innerHTML = '<div class="col-12 text-center text-muted">Nenhum produto cadastrado.</div>';
        } else {
            productGrid.innerHTML = productsHtml.join('');
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productGrid.innerHTML = '<div class="col-12 text-center text-danger">Falha ao carregar produtos. (Verifique as regras do Firestore para a coleção \'products\')</div>';
    }
}


// --- FILTERING AND EVENT HANDLERS (omitted for brevity, assume correct) ---

document.getElementById('filterSocket')?.addEventListener('change', async () => {
    // Lógica de filtragem, re-executa loadProducts e filtra localmente/por query
    loadProducts(); 
});


// --- CART PAGE RENDERER (omitted for brevity, assume correct) ---

window.renderCartPage = function() { 
    const container = document.getElementById('cartItems'); 
    const summaryContainer = document.getElementById('cartTotalSummary');
    if (!container || !summaryContainer) return; 

    container.innerHTML = ''; 
    summaryContainer.innerHTML = '';
    let total = 0; 
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted">Seu carrinho está vazio.</div>';
        return;
    }

    let itemsHtml = '';
    cart.forEach(it => { 
        total += it.price * it.qty; 
        itemsHtml += `<div class='d-flex justify-content-between py-2 border-bottom'>
            <div>${it.title} <span class="badge bg-secondary me-2">x ${it.qty}</span></div>
            <div>R$ ${(it.price * it.qty).toFixed(2)}</div>
        </div>`; 
    }); 
    
    container.innerHTML = itemsHtml;
    
    summaryContainer.innerHTML = `
        <div class='text-end mt-3'>
            <strong>Total: R$ ${total.toFixed(2)}</strong>
            <div class='mt-4'>
                <button class='btn btn-primary me-2' onclick="checkout('pix')">Pagar com PIX</button>
                <button class='btn btn-outline-primary' onclick="checkout('card')">Cartão de Crédito</button>
            </div>
        </div>
    `;
}


// --- AUTHENTICATION STATE & UI UPDATES ---

/**
 * Handles the user logout process.
 */
window.handleLogout = async function() {
    if (!auth) return;
    try {
        if (cartUnsubscribe) cartUnsubscribe(); // Para de ouvir o carrinho
        await auth.signOut();
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showNotification("Falha ao sair. Tente novamente.", true);
    }
}

/**
 * Updates the navigation bar elements based on the user's logged-in state.
 */
function updateNavUI(user) {
    if (!navMenu) return; 
    
    let navItems = '';
    const navbarList = navMenu.querySelector('.navbar-nav');

    if (user) {
        currentUserId = user.uid;
        const displayName = user.email ? user.email.split('@')[0] : 'Usuário';

        navItems = `
            <li class="nav-item"><span class="nav-link text-white-50">Bem-vindo(a), ${displayName}!</span></li>
            <li class="nav-item"><a class="nav-link" href="cart.html">Carrinho <span id="navCartCount" class="badge bg-danger ms-1">${cart.reduce((s, i) => s + i.qty, 0)}</span></a></li>
            <li class="nav-item"><button class="btn btn-danger btn-sm ms-2" onclick="handleLogout()">Sair</button></li>
        `;
        
        setupCartListener(user.uid);
        
    } else {
        if (cartUnsubscribe) cartUnsubscribe(); 
        
        currentUserId = null;
        cart = []; 
        updateNavCart();

        navItems = `
            <li class="nav-item"><a class="nav-link" href="cart.html">Carrinho <span id="navCartCount" class="badge bg-danger ms-1">0</span></a></li>
            <li class="nav-item"><a class="nav-link" href="login.html">Entrar</a></li>
        `;
        
        // Se o usuário não está logado, tenta o login anônimo ou redireciona.
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            // Tenta logar anonimamente ou com token, para poder usar o Firestore anonimamente
            // Se falhar, o sistema Auth fará o redirecionamento quando necessário (ex: ao tentar checkout)
        }
    }
    
    navbarList.innerHTML = navItems;
}


// --- MAIN AUTHENTICATION LISTENER ---
if (auth) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            updateNavUI(user);
        } else {
            updateNavUI(null);

            // Se deslogado, tenta logar anonimamente para permitir a navegação (caso não haja token)
            try {
                 if (initialAuthToken) {
                    await auth.signInWithCustomToken(initialAuthToken);
                } else if (!auth.currentUser) {
                    await auth.signInAnonymously();
                }
            } catch(e) {
                console.warn("Falha no login anônimo/token, operando sem autenticação completa.", e);
            }
        }
        
        // Executa a lógica da loja após a resolução do estado de autenticação
        window.onload = function() {
            loadProducts();
            renderCartPage();
        };
    });
} else {
    // Fallback: Tenta carregar os produtos mesmo sem Firebase totalmente pronto 
    window.onload = function() {
        loadProducts();
        renderCartPage();
    };
}
