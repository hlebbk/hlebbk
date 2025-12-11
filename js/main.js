let cart = JSON.parse(localStorage.getItem('bk_cart')) || [];
let stats = JSON.parse(localStorage.getItem('bk_stats')) || {};

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderHits();
    renderCart();
    initFilters();
    initPriceFilter();
    initGlobalSearch();
    if (location.pathname.includes('reviews.html')) initReviewsWithTelegram();
});

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
    alert('Добавлено: ' + name);
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
    c.innerHTML = cart.length === 0 ? '<p style="text-align:center;padding:50px;color:#999;">Корзина пуста</p>' : '';
    let sum = 0;
    cart.forEach((item, i) => {
        sum += item.price;
        c.innerHTML += `<div style="padding:12px;border-bottom:1px solid #eee;"><span>${item.name} — ${item.price} ₽</span><button onclick="removeFromCart(${i})" style="float:right;color:#c33;">Удалить</button></div>`;
    });
    if (t) t.textContent = sum + ' ₽';
}

document.addEventListener('click', e => {
    if (e.target.closest('.icon-cart')) { renderCart(); document.getElementById('cart-modal')?.style.display = 'flex'; }
    if (e.target.matches('.close-cart')) document.getElementById('cart-modal').style.display = 'none';
});

function renderHits() {
    const container = document.querySelector('.hits-grid');
    if (!container) return;
    const sorted = Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0,8);
    container.innerHTML = '';
    const hitImages = { "Бородинский":"borodinsky.jpg","Дарницкий":"darnitsky.jpg","Батон нарезной":"baton.jpg","С отрубями":"otrubi.jpg","Чёрный хлеб":"cherniy.jpg","Белый хлеб":"beliy.jpg","Сдобные булки":"bulki.jpg","Пончики":"ponchiki.jpg","Ватрушка":"vatrushka.jpg","Плюшки":"plushki.jpg","Кекс":"keks.jpg","Картошка":"pirozhnoe.jpg","Ванильные сухари":"suhari.jpg","Шоколадные сухари":"suhari-shokolad.jpg","Сухари с изюмом":"suhari-izyum.jpg","Сухари с корицей":"suhari-korica.jpg","Баранки простые":"baranki.jpg","Баранки с маком":"baranki-mak.jpg","Бублики с кунжутом":"bubliki.jpg","Сушки в шоколаде":"sushki-shokolad.jpg" };
    const defaultHits = ["Бородинский","Дарницкий","Батон нарезной","Сдобные булки","Ватрушка","Баранки с маком"];
    const hits = sorted.length > 0 ? sorted.map(([n])=>({name:n,price:50})) : defaultHits.map(n=>({name:n,price:50}));
    hits.forEach(item => {
        const img = hitImages[item.name] ? `images/${hitImages[item.name]}` : 'images/default-hit.jpg';
        container.innerHTML += `<div class="hit-card"><div class="hit-img"><img src="${img}" onerror="this.src='images/default-hit.jpg'" alt="${item.name}"></div><div class="hit-info"><h3>${item.name}</h3><p class="hit-price">${item.price} ₽</p>${stats[item.name]>0?'<span class="popular-tag">Хит!</span>':''}</div></div>`;
    });
}

function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            document.querySelectorAll('.product-card').forEach(c => c.style.display = (f==='all' || c.dataset.category===f) ? 'block' : 'none');
        };
    });
}

function initPriceFilter() {
    const apply = document.querySelector('.price-apply-btn');
    const reset = document.querySelector('.price-reset-btn');
    const from = document.getElementById('price-from');
    const to = document.getElementById('price-to');
    if (apply) apply.onclick = () => {
        const min = +from.value || 0;
        const max = +to.value || Infinity;
        document.querySelectorAll('.product-card').forEach(card => {
            const p = parseInt(card.querySelector('.price').textContent);
            card.style.display = (p >= min && p <= max) ? 'block' : 'none';
        });
    };
    if (reset) reset.onclick = () => { from.value = to.value = ''; document.querySelectorAll('.product-card').forEach(c => c.style.display = 'block'); };
}

function initGlobalSearch() {
    const input = document.getElementById('site-search');
    if (input) input.oninput = () => {
        const q = input.value.toLowerCase();
        document.querySelectorAll('.product-card, .hit-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(q) ? 'block' : 'none';
        });
    };
}

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

        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pending.unshift({id, name, rating, text});
        localStorage.setItem('pending_reviews', JSON.stringify(pending));

        const message = `Новый отзыв на модерацию\n\nИмя: ${name}\nОценка: ${rating} из 5\nОтзыв: ${text}\n\nОдобрить → /ok_${id}\nОтклонить → /no_${id}`;

        new Image().src = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;

        alert('Спасибо! Отзыв отправлен на модерацию');
        form.reset();
        document.getElementById('review-rating').value = '5';
    });

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
                pub.unshift({name: pending[idx].name, text: pending[idx].text, rating: pending[idx].rating, date: new Date().toLocaleDateString('ru-RU')});
                localStorage.setItem('published_reviews', JSON.stringify(pub));
            }
            pending.splice(idx, 1);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
        }
        history.replaceState(null, '', 'reviews.html');
        location.reload();
    }

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
