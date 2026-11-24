(function () {
  const nav = document.currentScript?.previousElementSibling?.matches?.('nav')
    ? document.currentScript.previousElementSibling
    : document.querySelector('nav.navbar');
  if (!nav) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'assets/css/header.css';
  document.head.appendChild(stylesheet);

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isActive = (...files) => (files.includes(page) ? ' is-active' : '');

  nav.className = 'mca-header';
  nav.removeAttribute('data-bs-theme');
  nav.innerHTML = `
    <div class="mca-header__inner">
      <div class="logo-zone">
        <a class="mca-header__brand" href="index.html" aria-label="MCA Pièces Autos 38">
          <span class="mca-header__logo"><i class="fa-solid fa-car-side"></i></span>
          <span>MCA PIÈCES AUTOS 38</span>
        </a>
      </div>
      <button class="mca-header__toggle" type="button" aria-expanded="false" aria-controls="mcaHeaderCenter mcaHeaderRight" aria-label="Ouvrir le menu">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="menu-zone" id="mcaHeaderCenter">
        <ul class="mca-header__links">
          <li><a class="mca-header__link${isActive('index.html')}" href="index.html">Accueil</a></li>
          <li><a class="mca-header__link${isActive('services.html')}" href="services.html">Services</a></li>
          <li><a class="mca-header__link${isActive('galerie.html')}" href="galerie.html">Galerie</a></li>
          <li><a class="mca-header__link${isActive('contact.html')}" href="contact.html">Contact</a></li>
          <li><a class="mca-header__link${isActive('catalogue.html')}" href="catalogue.html">Catalogue</a></li>
        </ul>
      </div>
      <div class="user-zone" id="mcaHeaderRight">
        <div class="mca-header__actions">
          <div class="mca-header__guest" data-mca-auth="out">
            <a class="mca-header__btn mca-header__btn--ghost${isActive('login.html')}" href="login.html">Connexion</a>
            <a class="mca-header__btn mca-header__btn--solid${isActive('register.html')}" href="register.html">Inscription</a>
          </div>
          <a class="mca-header__cart${isActive('panier.html')}" href="panier.html" data-mca-auth="in" hidden>
            <i class="fa-solid fa-bag-shopping"></i><span>Panier</span>
            <span class="mca-header__badge" data-cart-count hidden>0</span>
          </a>
          <div class="mca-header__dropdown" data-mca-auth="in" hidden>
            <button class="mca-header__user" type="button" aria-haspopup="true" aria-expanded="false">
              <i class="fa-solid fa-user"></i>
              <span data-mca-username></span>
              <i class="fa-solid fa-chevron-down mca-header__chevron"></i>
            </button>
            <div class="mca-header__dropdown-menu" role="menu">
              <a role="menuitem" href="compte.html"><i class="fa-regular fa-id-card"></i> Mon profil</a>
              <a role="menuitem" href="compte.html#orders-title"><i class="fa-solid fa-box"></i> Mes commandes</a>
              <button role="menuitem" type="button" data-mca-logout><i class="fa-solid fa-right-from-bracket"></i> Déconnexion</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const toggle = nav.querySelector('.mca-header__toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  const dropdown = nav.querySelector('.mca-header__dropdown');
  const userButton = nav.querySelector('.mca-header__user');
  const setDropdown = (open) => {
    dropdown.classList.toggle('is-open', open);
    userButton.setAttribute('aria-expanded', String(open));
  };
  userButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setDropdown(!dropdown.classList.contains('is-open'));
  });
  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) setDropdown(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setDropdown(false);
  });

  nav.querySelector('[data-mca-logout]').addEventListener('click', async () => {
    try {
      if (window.mcaAuth?.signOut) await window.mcaAuth.signOut();
    } catch (error) {
      console.error('Déconnexion impossible:', error);
    }
    window.location.href = 'login.html';
  });

  function updateCartBadge() {
    let count = 0;
    try {
      const items = JSON.parse(localStorage.getItem('mca_cart') || localStorage.getItem('mca_panier') || '[]');
      count = (Array.isArray(items) ? items : []).reduce((sum, item) => sum + (Number(item.quantite ?? item.quantity) || 0), 0);
    } catch (error) {
      count = 0;
    }
    nav.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  }

  function displayName(user) {
    const meta = user.user_metadata || {};
    const full = String(meta.first_name || meta.prenom || meta.full_name || meta.name || '').trim();
    if (!full) return user.email || '';
    const first = full.split(/\s+/)[0];
    return first.charAt(0).toLocaleUpperCase('fr-FR') + first.slice(1).toLocaleLowerCase('fr-FR');
  }

  function applySession(session) {
    const user = session?.user || null;
    nav.querySelectorAll('[data-mca-auth="in"]').forEach((el) => { el.hidden = !user; });
    nav.querySelectorAll('[data-mca-auth="out"]').forEach((el) => { el.hidden = Boolean(user); });
    nav.querySelector('[data-mca-username]').textContent = user ? displayName(user) : '';
    if (!user) setDropdown(false);
  }

  async function initSession() {
    if (!window.mcaAuth?.isConfigured?.()) return;
    try {
      const { data } = await window.mcaAuth.getSession();
      applySession(data?.session);
      window.supabaseClient?.auth.onAuthStateChange((_event, session) => applySession(session));
    } catch (error) {
      console.error('Session indisponible:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', initSession);

  updateCartBadge();
  window.addEventListener('storage', updateCartBadge);
  window.addEventListener('load', updateCartBadge);
})();