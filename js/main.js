// main.js —  (корзина с количеством, хиты, фильтры, поиск, отзывы, заказы)

let cart = JSON.parse(localStorage.getItem('bk_cart')) || [];
let stats = JSON.parse(localStorage.getItem('bk_stats')) || {};

// Один DOMContentLoaded для всего
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderHits();
    renderCart();
    initFilters();
    initPriceFilter();
    initGlobalSearch();

    if (window.location.pathname.includes('reviews.html')) {
        initReviewsWithTelegram();
    }

    initCheckoutModal(); 
});

// ==================== КОРЗИНА С КОЛИЧЕСТВОМ ====================
function updateCartCount() {
    const countEls = document.querySelectorAll('#cart-count');
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    countEls.forEach(el => el.textContent = totalQty);
}

window.addToCart = function(name, price) {
    price = parseInt(price);
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    stats[name] = (stats[name] || 0) + 1;
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    localStorage.setItem('bk_stats', JSON.stringify(stats));
    updateCartCount();
    renderHits();
    alert(`Добавлено: ${name} (всего: ${existingItem ? existingItem.quantity + 1 : 1})`);
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
};

window.changeQuantity = function(index, delta) {
    const item = cart[index];
    const newQty = item.quantity + delta;
    if (newQty < 1) {
        removeFromCart(index);
        return;
    }
    item.quantity = newQty;
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
};

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('total-price');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">Корзина пуста</p>';
        if (totalEl) totalEl.textContent = '0 ₽';
        return;
    }
    let total = 0;
    container.innerHTML = '';
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-left">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${item.price} ₽ / шт.</span>
                </div>
                <div class="cart-item-right">
                    <div class="quantity-controls-cart">
                        <button class="qty-btn-cart minus" onclick="changeQuantity(${index}, -1)">–</button>
                        <span class="cart-qty">${item.quantity}</span>
                        <button class="qty-btn-cart plus" onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                    <span class="item-total">${itemTotal} ₽</span>
                    <button class="btn-remove" onclick="removeFromCart(${index})">Удалить</button>
                </div>
            </div>
        `;
    });
    if (totalEl) totalEl.textContent = total + ' ₽';
}

window.openCart = function() {
    renderCart();
    const modal = document.getElementById('cart-modal');
    if (modal) modal.style.display = 'flex';
};

// Клик на иконку корзины и закрытие
document.addEventListener('click', (e) => {
    if (e.target.closest('.icon-cart')) {
        openCart();
    }
    if (e.target.classList.contains('close-cart')) {
        const modal = document.getElementById('cart-modal');
        if (modal) modal.style.display = 'none';
    }
});

// ==================== ХИТЫ ПРОДАЖ ====================
function renderHits() {
    const container = document.querySelector('.hits-grid');
    if (!container) return;

    const sorted = Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0,8);
    container.innerHTML = '';

    const hitImages = {
        "Бородинский":"borodinsky.jpg","Дарницкий":"darnitsky.jpg","Батон нарезной":"baton.jpg",
        "С отрубями":"otrubi.jpg","Чёрный хлеб":"cherniy.jpg","Белый хлеб":"beliy.jpg",
        "Сдобные булки":"bulki.jpg","Пончики":"ponchiki.jpg","Ватрушка":"vatrushka.jpg",
        "Плюшки":"plushki.jpg","Кекс":"keks.jpg","Картошка":"pirozhnoe.jpg",
        "Ванильные сухари":"suhari.jpg","Шоколадные сухари":"suhari-shokolad.jpg",
        "Сухари с изюмом":"suhari-izyum.jpg","Сухари с корицей":"suhari-korica.jpg",
        "Баранки простые":"baranki.jpg","Баранки с маком":"baranki-mak.jpg",
        "Бублики с кунжутом":"bubliki.jpg","Сушки в шоколаде":"sushki-shokolad.jpg"
    };

    const defaultHits = ["Бородинский","Дарницкий","Батон нарезной","Сдобные булки","Ватрушка","Баранки с маком"];
    const hits = sorted.length > 0 ? sorted.map(([n])=>({name:n,price:50})) : defaultHits.map(n=>({name:n,price:50}));

    hits.forEach(item => {
        const img = hitImages[item.name] ? `images/${hitImages[item.name]}` : 'images/default-hit.jpg';
        container.innerHTML += `
            <div class="hit-card">
                <div class="hit-img"><img src="${img}" onerror="this.src='images/default-hit.jpg'" alt="${item.name}"></div>
                <div class="hit-info">
                    <h3>${item.name}</h3>
                    <p class="hit-price">${item.price} ₽</p>
                    ${stats[item.name]>0?'<span class="popular-tag">Хит!</span>':''}
                </div>
            </div>`;
    });
}

// ==================== ФИЛЬТРЫ КАТАЛОГА ====================
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    if (buttons.length === 0) return;
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            document.querySelectorAll('.product-card').forEach(c => {
                c.style.display = (f === 'all' || c.dataset.category === f) ? 'block' : 'none';
            });
        });
    });
}

function initPriceFilter() {
    const from = document.getElementById('price-from');
    const to = document.getElementById('price-to');
    const apply = document.querySelector('.price-apply-btn');
    const reset = document.querySelector('.price-reset-btn');

    if (apply) {
        apply.addEventListener('click', () => {
            const min = from ? parseInt(from.value) || 0 : 0;
            const max = to ? parseInt(to.value) || Infinity : Infinity;
            document.querySelectorAll('.product-card').forEach(card => {
                const price = parseInt(card.querySelector('.price').textContent);
                card.style.display = (price >= min && price <= max) ? 'block' : 'none';
            });
        });
    }

    if (reset) {
        reset.addEventListener('click', () => {
            if (from) from.value = '';
            if (to) to.value = '';
            document.querySelectorAll('.product-card').forEach(c => c.style.display = 'block');
        });
    }
}

// ==================== ГЛОБАЛЬНЫЙ ПОИСК ====================
function initGlobalSearch() {
    const input = document.getElementById('site-search');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        document.querySelectorAll('.product-card, .hit-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(q) ? 'block' : 'none';
        });
    });
}

// ==================== ОТЗЫВЫ ====================
function initReviewsWithTelegram() {
    const BOT_TOKEN = '8514692639:AAGd8FPkt1Fqy5Z0JOmKnTuBxOFnTVHh3L8';
    const CHAT_ID = '-1003492673065';  // Твой ID для отзывов

    const form = document.getElementById('review-form');
    const container = document.getElementById('reviews-container');
    if (!form || !container) return;

    
    function loadReviews() {
        fetch('https://cdn.jsdelivr.net/gh/hlebbk/hlebbk/reviews.json?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                container.innerHTML = data.length === 0
                    ? '<p style="text-align:center;padding:80px;color:#888;">Отзывов пока нет</p>'
                    : data.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <strong>${r.name}</strong>
                                <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                            </div>
                            <p>${r.text.replace(/\n/g,'<br>')}</p>
                            <small>${r.date}</small>
                        </div>
                    `).join('');
            })
            .catch(() => {
                // Fallback localStorage
                const published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
                container.innerHTML = published.length === 0
                    ? '<p style="text-align:center;padding:80px;color:#888;">Отзывов пока нет</p>'
                    : published.map(r => `
                        <div class="review-card">
                            <div class="review-header">
                                <strong>${r.name}</strong>
                                <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                            </div>
                            <p>${r.text.replace(/\n/g,'<br>')}</p>
                            <small>${r.date}</small>
                        </div>
                    `).join('');
            });
    }

    loadReviews();

    // Отправка отзыва
    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('review-name').value.trim() || 'Аноним';
        const text = document.getElementById('review-text').value.trim();
        const rating = document.getElementById('review-rating').value || 5;

        if (!text) return alert('Напишите отзыв!');

        const reviewId = Date.now().toString();

        
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.unshift({ id: reviewId, name, rating, text });
        localStorage.setItem('pending_reviews', JSON.stringify(pending));

        const message = `Новый отзыв на модерацию\n\nИмя: ${name}\nОценка: ${rating} из 5\nОтзыв:\n${text}\n\nОпубликовать: https://hlebbk.github.io/hlebbk/reviews.html?approve=${reviewId}\nОтклонить: https://hlebbk.github.io/hlebbk/reviews.html?reject=${reviewId}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;

        fetch(url)
            .then(() => alert('Спасибо! Отзыв отправлен на модерацию'))
            .catch(() => alert('Ошибка отправки — попробуй ещё раз'));

        form.reset();
        document.getElementById('review-rating').value = '5';
    });

    // Модерация
    const params = new URLSearchParams(location.search);
    const approve = params.get('approve');
    const reject = params.get('reject');

    if (approve || reject) {
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        const index = pending.findIndex(r => r.id === (approve || reject));

        if (index !== -1) {
            if (approve) {
                let published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
                published.unshift({ ...pending[index], date: new Date().toLocaleDateString('ru-RU') });
                localStorage.setItem('published_reviews', JSON.stringify(published));
            }
            pending.splice(index, 1);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
        }
        history.replaceState({}, '', 'reviews.html');
        location.reload();
    }
}

// ==================== ОФОРМЛЕНИЕ ЗАКАЗА ====================
function initCheckoutModal() {
    document.querySelectorAll('.btn-checkout').forEach(btn => {
        btn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Корзина пуста!');
                return;
            }
            document.getElementById('cart-modal').style.display = 'none';
            document.getElementById('checkout-modal').style.display = 'flex';
        });
    });

    // Закрытие модалки
    document.querySelector('.close-checkout')?.addEventListener('click', () => {
        document.getElementById('checkout-modal').style.display = 'none';
    });

    document.querySelector('.btn-cancel')?.addEventListener('click', () => {
        document.getElementById('checkout-modal').style.display = 'none';
    });

    document.getElementById('checkout-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('checkout-modal')) {
            document.getElementById('checkout-modal').style.display = 'none';
        }
    });

    // Выбор оплаты
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Submit заказа с Telegram 
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const fio = document.getElementById('fio').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const payment = document.querySelector('.payment-btn.active').textContent;
        const total = document.getElementById('total-price').textContent;

        let itemsText = 'Товары:\n';
        if (cart.length > 0) {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                itemsText += `— ${item.name} × ${item.quantity} = ${itemTotal} ₽\n`;
            });
        } else {
            itemsText += 'Нет товаров\n';
        }

        const message = `Новый заказ!\n\n` +
            `ФИО: ${fio}\n` +
            `Телефон: ${phone}\n` +
            `Email: ${email}\n` +
            `Адрес доставки: ${address}\n` +
            `Оплата: ${payment}\n` +
            `Итого: ${total}\n\n` +
            `${itemsText}`;

        const token = '8547822464:AAGcn1MaI04QpDov0t1Isk1t5HWpRLmD3ts';
        const chatId = '-1003492673065';
        const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    alert('Заказ успешно отправлен!');
                    cart = [];
                    localStorage.removeItem('bk_cart');
                    updateCartCount();
                    renderCart();
                    document.getElementById('checkout-modal').style.display = 'none';
                    document.getElementById('checkout-form').reset();
                } else {
                    alert('Ошибка отправки: ' + (data.description || 'Неизвестная'));
                }
            })
            .catch(err => {
                alert('Ошибка сети: ' + err.message);
            });
    });
}
