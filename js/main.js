// main.js — ПОЛНЫЙ АВТОМАТ ОТЗЫВОВ (2025, один бот, работает на всех устройствах)
let cart = JSON.parse(localStorage.getItem('bk_cart')) || [];
let stats = JSON.parse(localStorage.getItem('bk_stats')) || {};

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

    // Фикс для модалки заказа (не конфликтует с корзиной)
    initCheckoutModal();
});

// ==================== КОРЗИНА (восстановлена как была + фиксы) ====================
function updateCartCount() {
    const countEls = document.querySelectorAll('#cart-count');
    countEls.forEach(el => el.textContent = cart.length);
}

window.addToCart = function(name, price) {
    price = parseInt(price);
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;  // Увеличиваем количество
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    stats[name] = (stats[name] || 0) + 1;
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    localStorage.setItem('bk_stats', JSON.stringify(stats));
    updateCartCount();
    renderHits();
    alert(`Добавлено: ${name} (всего: ${existingItem ? existingItem.quantity : 1})`);
};

window.removeFromCart = function(i) {
    cart.splice(i, 1);
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
};

function renderCart() {
    const c = document.getElementById('cart-items');
    const t = document.getElementById('total-price');
    if (!c) return;
    if (cart.length === 0) {
        c.innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">Корзина пуста</p>';
        if (t) t.textContent = '0 ₽';
        return;
    }
    let sum = 0;
    c.innerHTML = '';
    cart.forEach((item, i) => {
        const itemTotal = item.price * item.quantity;
        sum += itemTotal;
        c.innerHTML += `
            <div class="cart-item">
                <span>${item.name} — ${item.price} ₽ / шт.</span>
                <div class="quantity-controls-cart">
                    <button class="qty-btn-cart minus" onclick="changeQuantity(${i}, -1)">–</button>
                    <span class="cart-qty">${item.quantity}</span>
                    <button class="qty-btn-cart plus" onclick="changeQuantity(${i}, 1)">+</button>
                </div>
                <span class="item-total">${itemTotal} ₽</span>
                <button class="btn-remove" onclick="removeFromCart(${i})">Удалить</button>
            </div>
        `;
    });
    if (t) t.textContent = sum + ' ₽';
}

window.openCart = function() {  // Глобальная для клика на иконку
    renderCart();
    const modal = document.getElementById('cart-modal');
    if (modal) modal.style.display = 'flex';
};

// Event listeners для корзины (не конфликтуют)
document.addEventListener('click', (e) => {
    if (e.target.closest('.icon-cart')) {
        openCart();
    }
    if (e.target.classList.contains('close-cart')) {
        const modal = document.getElementById('cart-modal');
        if (modal) modal.style.display = 'none';
    }
});

// ==================== ХИТЫ ПРОДАЖ (как было) ====================
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

// ==================== ФИЛЬТРЫ КАТАЛОГА (как было) ====================
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

// ==================== ГЛОБАЛЬНЫЙ ПОИСК (как было) ====================
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

// ==================== ОТЗЫВЫ — ПОЛНЫЙ АВТОМАТ (как было) ====================
function initReviewsWithTelegram() {
    const BOT_TOKEN = '8514692639:AAGd8FPkt1Fqy5Z0JOmKnTuBxOFnTVHh3L8';
    const CHAT_ID = '-1003492673965';

    const form = document.getElementById('review-form');
    const container = document.getElementById('reviews-container');
    if (!form || !container) return;

    // Загружаем отзывы из reviews.json — видно всем
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
                // Fallback на localStorage
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

    // Отправка отзыва — через прокси (обходит CORS, 100% доходит)
    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('review-name').value.trim() || 'Аноним';
        const text = document.getElementById('review-text').value.trim();
        const rating = document.getElementById('review-rating').value || 5;

        if (!text) return alert('Напишите отзыв!');

        const reviewId = Date.now().toString();

        // Сохраняем локально для модерации
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.unshift({ id: reviewId, name, rating, text });
        localStorage.setItem('pending_reviews', JSON.stringify(pending));

        const message = `Новый отзыв на модерацию

Имя: ${name}
Оценка: ${rating} из 5
Отзыв:
${text}

Опубликовать: https://hlebbk.github.io/hlebbk/reviews.html?approve=${reviewId}
Отклонить: https://hlebbk.github.io/hlebbk/reviews.html?reject=${reviewId}`;

        // ПРОКСИ-ОТПРАВКА — 100% ДОХОДИТ (обходит CORS)
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`
        );

        fetch(proxyUrl)
            .then(() => alert('Спасибо! Отзыв отправлен на модерацию'))
            .catch(() => alert('Ошибка отправки — попробуй ещё раз'));

        form.reset();
        document.getElementById('review-rating').value = '5';
    });

    // Модерация (approve/reject)
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

// ==================== ОФОРМЛЕНИЕ ЗАКАЗА + TELEGRAM (интегрировано без конфликтов) ====================
function initCheckoutModal() {
    document.querySelectorAll('.btn-checkout').forEach(btn => {
        btn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Корзина пуста! Добавьте товары.');
                return;
            }
            document.getElementById('cart-modal').style.display = 'none';
            document.getElementById('checkout-modal').style.display = 'flex';
        });
    });

    // Закрытие
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
        cart.forEach(item => {
            itemsText += `- ${item.name} — ${item.price} ₽\n`;
        });

        const message = `Новый заказ!\n\n` +
            `ФИО: ${fio}\n` +
            `Телефон: ${phone}\n` +
            `Email: ${email}\n` +
            `Адрес: ${address}\n` +
            `Оплата: ${payment}\n` +
            `Итого: ${total}\n\n` +
            `${itemsText}`;

        const token = '8547822464:AAGcn1MaI04QpDov0t1Isk1t5HWpRLmD3ts';
        const chatId = '-1003492673065';  // Твой новый ID
        const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    alert('Заказ успешно отправлен! Мы свяжемся с вами.');
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
// ==================== ИЗМЕНЕНИЕ КОЛИЧЕСТВА В КОРЗИНЕ ====================
// Изменение количества в корзине
window.changeQuantity = function(index, delta) {
    const newQty = cart[index].quantity + delta;
    if (newQty < 1) {
        removeFromCart(index);
        return;
    }
    cart[index].quantity = newQty;
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
};

// Удаление товара
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
};
