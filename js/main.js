// main.js — ПОЛНЫЙ РАБОЧИЙ ФАЙЛ (2025 год)

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
});

// ==================== КОРЗИНА ====================
function updateCartCount() {
    document.querySelectorAll('#cart-count').forEach(el => el && (el.textContent = cart.length));
}

window.addToCart = function(name, price) {
    cart.push({name, price});
    stats[name] = (stats[name] || 0) + 1;
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    localStorage.setItem('bk_stats', JSON.stringify(stats));
    updateCartCount();
    renderHits();
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
        sum += item.price;
        c.innerHTML += `<div class="cart-item"><span>${item.name} — ${item.price} ₽</span><button onclick="removeFromCart(${i})">Удалить</button></div>`;
    });
    if (t) t.textContent = sum + ' ₽';
}

document.querySelectorAll('.icon-cart').forEach(el => el.onclick = () => {
    renderCart();
    document.getElementById('cart-modal').style.display = 'flex';
});
document.querySelectorAll('.close-cart').forEach(el => el.onclick = () => {
    document.getElementById('cart-modal').style.display = 'none';
});

// ==================== ХИТЫ ПРОДАЖ ====================
function renderHits() {
    const container = document.querySelector('.hits-grid');
    if (!container) return;

    const sorted = Object.entries(stats).sort((a,b) => b[1]-a[1]).slice(0,8);
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

// ==================== ФИЛЬТРЫ, ЦЕНА, ПОИСК ====================
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            document.querySelectorAll('.product-card').forEach(c => {
                c.style.display = (f==='all' || c.dataset.category===f) ? 'block' : 'none';
            });
        });
    });
}

function initPriceFilter() {
    const from = document.getElementById('price-from');
    const to = document.getElementById('price-to');
    const apply = document.querySelector('.price-apply-btn');
    const reset = document.querySelector('.price-reset-btn');

    const filter = () => {
        const min = from.value ? +from.value : 0;
        const max = to.value ? +to.value : Infinity;
        document.querySelectorAll('.product-card').forEach(card => {
            const price = parseInt(card.querySelector('.price').textContent);
            card.style.display = (price >= min && price <= max) ? 'block' : 'none';
        });
    };

    apply?.addEventListener('click', filter);
    reset?.addEventListener('click', () => { from.value = to.value = ''; filter(); });
}

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

// ==================== ОТЗЫВЫ С МОДЕРАЦИЕЙ В TELEGRAM ====================
function initReviewsWithTelegram() {
    const BOT_TOKEN = '8547822464:AAGcn1MaI04QpDov0t1Isk1t5HWpRLmD3ts';
    const CHAT_ID = '-5098369660';

    const form = document.getElementById('review-form');
    const container = document.getElementById('reviews-container');
    if (!form || !container) return;

    // 1. ОТПРАВКА ОТЗЫВА
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('review-name').value.trim();
        const text = document.getElementById('review-text').value.trim();
        const rating = document.getElementById('review-rating').value;

        if (!name || !text) return alert('Заполните имя и отзыв!');

        const reviewId = Date.now().toString();

        // Сохраняем в очередь
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.unshift({ id: reviewId, name, rating, text });
        localStorage.setItem('pending_reviews', JSON.stringify(pending));

        // Правильная ссылка для одобрения
        const base = location.href.split('?')[0]; // чистый URL без параметров
        const message = `Новый отзыв на модерацию

Имя: ${name}
Оценка: ${rating} из 5
Отзыв:
${text}

Опубликовать: ${base}?approve=${reviewId}
Удалить: ${base}?reject=${reviewId}`;

        // Отправка через <img> — работает везде
        new Image().src = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;

        alert('Спасибо! Отзыв отправлен на модерацию');
        form.reset();
        document.getElementById('review-rating').value = '5';
    });

    // 2. ОДОБРЕНИЕ И ПУБЛИКАЦИЯ
    const params = new URLSearchParams(window.location.search);
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
        history.replaceState({}, '', location.pathname);
        location.reload();
    }

    // 3. ПОКАЗ ОПУБЛИКОВАННЫХ ОТЗЫВОВ
        // === ПОКАЗ ОПУБЛИКОВАННЫХ ОТЗЫВОВ + КНОПКА УДАЛЕНИЯ ===
    const published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
    container.innerHTML = published.length === 0
        ? '<p style="text-align:center;color:#888;padding:80px 0;font-size:1.5rem;">Пока нет опубликованных отзывов</p>'
        : published.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${r.name}</strong>
                    <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                </div>
                <p>${r.text.replace(/\n/g, '<br>')}</p>
                <small>${r.date}</small>
                <button class="delete-review-btn" data-id="${r.id}" style="
                    margin-top: 12px;
                    padding: 8px 16px;
                    background: #a00;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                ">Удалить отзыв</button>
            </div>
        `).join('');

    // Включаем возможность удаления
    enableReviewDeletion();
// ==================== УДАЛЕНИЕ ОПУБЛИКОВАННЫХ ОТЗЫВОВ ====================
function enableReviewDeletion() {
    // Находим все кнопки удаления
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!confirm('Удалить этот отзыв навсегда?')) return;

            const reviewId = this.dataset.id;

            let published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
            published = published.filter(r => r.id !== reviewId);
            localStorage.setItem('published_reviews', JSON.stringify(published));

            // Обновляем отображение
            const container = document.getElementById('reviews-container');
            if (published.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#888;padding:80px 0;font-size:1.5rem;">Пока нет опубликованных отзывов</p>';
            } else {
                container.innerHTML = published.map(r => createReviewHTML(r)).join('');
            }

            enableReviewDeletion(); // перепривязываем кнопки
        });
    });
}
// ==================== УДАЛЕНИЕ ОТЗЫВОВ ====================
function enableReviewDeletion() {
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.onclick = function() {
            if (confirm('Удалить этот отзыв навсегда?')) {
                const id = this.dataset.id;
                let published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
                published = published.filter(r => r.id !== id);
                localStorage.setItem('published_reviews', JSON.stringify(published));
                location.reload(); // обновляем страницу
            }
        };
    });
}
// Вспомогательная функция для HTML отзыва
function createReviewHTML(r) {
    return `
        <div class="review-card">
            <div class="review-header">
                <strong>${r.name}</strong>
                <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
            </div>
            <p>${r.text.replace(/\n/g, '<br>')}</p>
            <small>${r.date}</small>
            <button class="delete-review-btn" data-id="${r.id}" style="
                margin-top: 12px;
                padding: 8px 16px;
                background: #8b0000;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
            ">Удалить отзыв</button>
        </div>
    `;
}
