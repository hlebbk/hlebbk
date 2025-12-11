// main.js — твой старый проверенный код, который РАБОТАЛ до всех экспериментов
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
    const countEls = document.querySelectorAll('#cart-count');
    countEls.forEach(el => el.textContent = cart.length);
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

// кнопки корзины
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('icon-cart')) {
        renderCart();
        document.getElementById('cart-modal').style.display = 'flex';
    }
    if (e.target.classList.contains('close-cart')) {
        document.getElementById('cart-modal').style.display = 'none';
    }
});

// ==================== ХИТЫ ПРОДАЖ ====================
function renderHits() {
    const container = document.querySelector('.hits-grid');
    if (!container) return;

    const sorted = Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0,8);
    container.innerHTML = '';

    const hitImages = {
        "Бородинский":"borodinsky.jpg",
        "Дарницкий":"darnitsky.jpg",
        "Батон нарезной":"baton.jpg",
        "С отрубями":"otrubi.jpg",
        "Чёрный хлеб":"cherniy.jpg",
        "Белый хлеб":"beliy.jpg",
        "Сдобные булки":"bulki.jpg",
        "Пончики":"ponchiki.jpg",
        "Ватрушка":"vatrushka.jpg",
        "Плюшки":"plushki.jpg",
        "Кекс":"keks.jpg",
        "Картошка":"pirozhnoe.jpg",
        "Ванильные сухари":"suhari.jpg",
        "Шоколадные сухари":"suhari-shokolad.jpg",
        "Сухари с изюмом":"suhari-izyum.jpg",
        "Сухари с корицей":"suhari-korica.jpg",
        "Баранки простые":"baranki.jpg",
        "Баранки с маком":"baranki-mak.jpg",
        "Бублики с кунжутом":"bubliki.jpg",
        "Сушки в шоколаде":"sushki-shokolad.jpg"
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

// ==================== ФИЛЬТРЫ ====================
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

    if (apply) apply.addEventListener('click', () => {
        const min = parseInt(from.value) || 0;
        const max = parseInt(to.value) || Infinity;
        document.querySelectorAll('.product-card').forEach(card => {
            const price = parseInt(card.querySelector('.price').textContent);
            card.style.display = (price >= min && price <= max) ? 'block' : 'none';
        });
    });

    if (reset) reset.addEventListener('click', () => {
        from.value = ''; to.value = '';
        document.querySelectorAll('.product-card').forEach(c => c.style.display = 'block');
    });
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

// ==================== ОТЗЫВЫ С КНОПКАМИ В ТЕЛЕГРАМ (новое, но без ошибок нет) ====================
// === ОТЗЫВЫ — ПРОСТО И НАДЁЖНО (2025) ===
function initReviewsWithTelegram() {
    const TOKEN = '8547822464:AAGcn1MaI04QpDov0t1Isk1t5HWpRLmD3ts';
    const CHAT_ID = '-5098369660';

    const form = document.getElementById('review-form');
    const container = document.getElementById('reviews-container');
    if (!form || !container) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('review-name').value.trim() || 'Аноним';
        const text = document.getElementById('review-text').value.trim();
        const rating = document.getElementById('review-rating').value || 5;

        if (!text) return alert('Напишите отзыв!');

        const id = Date.now().toString();

        // Сохраняем для модерации
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.unshift({id, name, rating, text});
        localStorage.setItem('pending_reviews', JSON.stringify(pending));

        const message = `Новый отзыв на модерацию\n\nИмя: ${name}\nОценка: ${rating} из 5\nОтзыв: ${text}\n\nОдобрить → /ok_${id}\nОтклонить → /no_${id}`;

        // АНТИ-CORS: 3 простых GET-запроса через <img> (НИКОГДА не блокируется)
        const url1 = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;
        const url2 = 'https://cors-anywhere.herokuapp.com/' + url1; // запасной прокси (если первый не сработает)
        const url3 = 'https://thingproxy.freeboard.io/fetch/' + url1; // третий прокси

        new Image().src = url1;
        new Image().src = url2;
        new Image().src = url3;

        // Тест: отправляем короткое сообщение для проверки
        new Image().src = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=ТЕСТ: Отзыв отправлен (ID: ${id})`;

        alert('Спасибо! Отзыв отправлен на модерацию (проверь группу через 5 сек)');
        form.reset();
        document.getElementById('review-rating').value = '5';
    });

    // Модерация по командам /ok_ и /no_
    const params = new URLSearchParams(location.search);
    const okId = params.get('ok');
    const noId = params.get('no');

    if (okId || noId) {
        const id = okId || noId;
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        const idx = pending.findIndex(r => r.id === id);

        if (idx > -1) {
            if (okId) {
                let pub = JSON.parse(localStorage.getItem('published_reviews') || '[]');
                pub.unshift({
                    name: pending[idx].name,
                    text: pending[idx].text,
                    rating: pending[idx].rating,
                    date: new Date().toLocaleDateString('ru-RU')
                });
                localStorage.setItem('published_reviews', JSON.stringify(pub));
            }
            pending.splice(idx, 1);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
        }
        history.replaceState(null, '', 'reviews.html');
        location.reload();
    }

    // Показ отзывов
    const published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
    container.innerHTML = published.length === 0
        ? '<p style="text-align:center;padding:80px;color:#888;">Отзывов пока нет</p>'
        : published.map(r => `
            <div style="background:#fff;padding:20px;margin:15px 0;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <strong>${r.name}</strong> — ${r.rating} из 5<br>
                <p style="margin:10px 0;">${r.text.replace(/\n/g,'<br>')}</p>
                <small style="color:#777;">${r.date}</small>
            </div>`).join('');
}

    // Показ опубликованных отзывов
    const published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
    container.innerHTML = published.length === 0
        ? '<p style="text-align:center;padding:80px;color:#888;">Отзывов пока нет</p>'
        : published.map(r => `
            <div style="background:#fff;padding:20px;margin:15px 0;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <strong>${r.name}</strong> — ${r.rating} из 5<br>
                <p style="margin:10px 0;">${r.text.replace(/\n/g,'<br>')}</p>
                <small style="color:#777;">${r.date}</small>
            </div>`).join('');
}

    function approveReview(id) {
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        const review = pending.find(r => r.id === id);
        if (review) {
            let published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
            published.unshift({
                name: review.name,
                text: review.text,
                rating: review.rating,
                date: new Date().toLocaleDateString('ru-RU')
            });
            localStorage.setItem('published_reviews', JSON.stringify(published));
            pending = pending.filter(r => r.id !== id);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
            renderReviews();
        }
    }

    function rejectReview(id) {
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending = pending.filter(r => r.id !== id);
        localStorage.setItem('pending_reviews', JSON.stringify(pending));
    }

    // запускаем проверку команд каждые 5 секунд
    setInterval(checkCommands, 5000);
    checkCommands(); // и сразу при загрузке

    // 3. Кнопки по ссылке (резервный способ)
    const params = new URLSearchParams(location.search);
    if (params.has('approve') || params.has('reject')) {
        const id = params.get('approve') || params.get('reject');
        if (params.has('approve')) approveReview(id);
        else rejectReview(id);
        history.replaceState(null, '', 'reviews.html');
        location.reload();
    }

    // 4. Показ отзывов
    function renderReviews() {
        const list = JSON.parse(localStorage.getItem('published_reviews') || '[]');
        container.innerHTML = list.length === 0
            ? '<p style="text-align:center;padding:80px;color:#888;">Отзывов пока нет</p>'
            : list.map(r => `
                <div style="background:#fff;padding:20px;margin:15px 0;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.1);text-align:left;">
                    <strong>${r.name}</strong> — ${r.rating} из 5<br>
                    <p style="margin:10px 0;">${r.text.replace(/\n/g,'<br>')}</p>
                    <small style="color:#777;">${r.date}</small>
                </div>`).join('');
    }

    renderReviews();
}

    // модерация
    const params = new URLSearchParams(location.search);
    if (params.has('approve') || params.has('reject')) {
        const id = params.get('approve') || params.get('reject');
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        const idx = pending.findIndex(r => r.id === id);
        if (idx > -1) {
            if (params.has('approve')) {
                let pub = JSON.parse(localStorage.getItem('published_reviews') || '[]');
                pub.unshift({...pending[idx], date: new Date().toLocaleDateString('ru-RU')});
                localStorage.setItem('published_reviews', JSON.stringify(pub));
            }
            pending.splice(idx, 1);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
        }
        history.replaceState(null, '', 'reviews.html');
        location.reload();
    }

    // показ отзывов
    const published = JSON.parse(localStorage.getItem('published_reviews') || '[]');
    container.innerHTML = published.length === 0
        ? '<p style="text-align:center;color:#888;padding:80px 0;">Пока нет опубликованных отзывов</p>'
        : published.map(r => `
            <div class="review-card">
                <strong>${r.name}</strong> ${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}<br>
                <p>${r.text.replace(/\n/g,'<br>')}</p>
                <small>${r.date}</small>
            </div>`).join('');
}
