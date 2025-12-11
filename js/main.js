// main.js — РАБОЧАЯ ВЕРСИЯ ДЕКАБРЬ 2025 (ничего не сломано!)

let cart = JSON.parse(localStorage.getItem('bk_cart')) || [];
let stats = JSON.parse(localStorage.getItem('bk_stats')) || {};

document.addEventListener('DOMContentLoaded', initializeSite);

function initializeSite() {
    updateCartCount();
    renderHits();
    renderCart();
    initFilters();
    initPriceFilter();
    initGlobalSearch();

    // Только на странице отзывов подключаем систему модерации
    if (window.location.pathname.includes('reviews.html')) {
        initReviewsWithTelegram();
    }
}

// ==================== КОРЗИНА ====================
function updateCartCount() {
    document.querySelectorAll('#cart-count').forEach(el => el.textContent = cart.length);
}

window.addToCart = function(name, price) {
    cart.push({name, price});
    stats[name] = (stats[name] || 0) + 1;
    localStorage.setItem('bk_cart', JSON.stringify(cart));
    localStorage.setItem('bk_stats', JSON.stringify(stats));
    updateCartCount();
    renderHits();
    alert(`Добавлено: ${name}`);
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

document.addEventListener('click', e => {
    if (e.target.classList.contains('icon-cart')) {
        renderCart();
        const modal = document.getElementById('cart-modal');
        if (modal) modal.style.display = 'flex';
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

// ==================== ФИЛЬТРЫ, ПОИСК, ЦЕНА ====================
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            document.querySelectorAll('.product-card').forEach(c => {
                c.style.display = (f === 'all' || c.dataset.category === f) ? 'block' : 'none';
            });
        });
    });
}

function initPriceFilter() {
    const apply = document.querySelector('.price-apply-btn');
    const reset = document.querySelector('.price-reset-btn');
    const from = document.getElementById('price-from');
    const to = document.getElementById('price-to');

    if (apply) apply.onclick = () => {
        const min = parseInt(from.value) || 0;
        const max = parseInt(to.value) || Infinity;
        document.querySelectorAll('.product-card').forEach(card => {
            const price = parseInt(card.querySelector('.price').textContent);
            card.style.display = (price >= min && price <= max) ? 'block' : 'none';
        });
    };

    if (reset) reset.onclick = () => {
        from.value = ''; to.value = '';
        document.querySelectorAll('.product-card').forEach(c => c.style.display = 'block');
    };
}

function initGlobalSearch() {
    const input = document.getElementById('site-search');
    if (input) {
        input.addEventListener('input', () => {
            const q = input.value.toLowerCase();
            document.querySelectorAll('.product-card, .hit-card').forEach(card => {
                card.style.display = card.textContent.toLowerCase().includes(q) ? 'block' : 'none';
            });
        });
    }
}

// ==================== ОТЗЫВЫ + МОДЕРАЦИЯ В ТЕЛЕГРАМ ====================
function initReviewsWithTelegram() {
    const BOT_TOKEN = '8547822464:AAGcn1MaI04QpDov0t1Isk1t5HWpRLmD3ts';  // твой токен
    const CHAT_ID = '-5098369660';                                      // ID твоей приватной группы

    const form = document.getElementById('review-form');
    const container = document.getElementById('reviews-container');
    if (!form || !container) return;

    // Отправка отзыва → в группу с двумя кнопками
    form.addEventListener('submit', e => {
        e.preventDefault();

        const name   = document.getElementById('review-name').value.trim();
        const text   = document.getElementById('review-text').value.trim();
        const rating = document.getElementById('review-rating').value;

        if (!name || !text) return alert('Заполните имя и текст отзыва!');

        const reviewId = Date.now().toString();

        // Сохраняем в localStorage, чтобы потом можно было одобрить/отклонить
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.unshift({id: reviewId, name, rating, text});
        localStorage.setItem('pending_reviews', JSON.stringify(pending));

        const message = `Новый отзыв на модерацию\n\nИмя: ${name}\nОценка: ${rating} из 5\nОтзыв:\n${text}`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: "Опубликовать", url: `https://hlebbk.github.io/hlebbk/reviews.html?approve=${reviewId}` },
                    { text: "Отклонить",    url: `https://hlebbk.github.io/hlebbk/reviews.html?reject=${reviewId}` }
                ]
            ]
        };

        fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                reply_markup: keyboard
            })
        });

        alert('Спасибо! Отзыв отправлен на модерацию');
        form.reset();
        document.getElementById('review-rating').value = '5';
    });

    // Обработка нажатия на кнопки в Telegram
    const urlParams = new URLSearchParams(window.location.search);
    const approveId = urlParams.get('approve');
    const rejectId  = urlParams.get('reject');

    if (approveId || rejectId) {
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        const index = pending.findIndex(r => r.id === (approveId || rejectId));

        if (index !== -1) {
            if (approveId) {
                let published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
                published.unshift({
                    ...pending[index],
                    date: new Date().toLocaleDateString('ru-RU')
                });
                localStorage.setItem('published_reviews', JSON.stringify(published));
            }
            pending.splice(index, 1);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
        }

        // Убираем параметры из адресной строки и обновляем страницу
        history.replaceState({}, '', 'reviews.html');
        location.reload();
    }

    // Показ уже опубликованных отзывов
    const published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
    container.innerHTML = published.length === 0
        ? '<p style="text-align:center;padding:60px 20px;color:#888;">Пока нет опубликованных отзывов</p>'
        : published.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${r.name}</strong>
                    <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                </div>
                <p>${r.text.replace(/\n/g, '<br>')}</p>
                <small>${r.date}</small>
            </div>
        `).join('');
}
