// ============================================
// El Khayati - MTDS Style Main JavaScript
// ============================================

// Loader
window.addEventListener('load', function () {
    setTimeout(function () {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            setTimeout(function () {
                loader.style.display = 'none';
            }, 600);
        }
    }, 1500);

    // Initialize all components
    initDarkMode();
    initLanguageSelector();
    initSlideshow();
    initCounters();
    initScrollAnimations();
    initGallery();
    initHeroParallax();
    initSiteChatbot();
});

// ============================================
// Language Selector
// ============================================
function initLanguageSelector() {
    const langSelector = document.getElementById('lang-selector');
    const langToggle = document.getElementById('lang-toggle');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!langSelector || !langToggle) return;

    const langData = {
        es: { flag: 'images/flags/es.svg', code: 'ES', name: 'Español' },
        en: { flag: 'images/flags/en.svg', code: 'EN', name: 'English' },
        de: { flag: 'images/flags/de.svg', code: 'DE', name: 'Deutsch' }
    };

    // Load saved language preference and apply
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const savedLang = urlLang || localStorage.getItem('language') || 'es';

    // Save to localStorage if it came from URL
    if (urlLang) {
        localStorage.setItem('language', urlLang);
    }

    updateLanguageDisplay(savedLang);
    applyTranslations(savedLang);

    // Toggle dropdown
    langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        langSelector.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!langSelector.contains(e.target)) {
            langSelector.classList.remove('active');
        }
    });

    // Language option click
    langOptions.forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            const lang = this.dataset.lang;

            // Update active state
            langOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');

            // Update toggle display
            updateLanguageDisplay(lang);

            // Apply translations
            applyTranslations(lang);

            // Save preference
            localStorage.setItem('language', lang);

            // Close dropdown
            langSelector.classList.remove('active');

            console.log('Language changed to:', langData[lang].name);
        });
    });

    function updateLanguageDisplay(lang) {
        const data = langData[lang];
        if (!data) return;

        const flagImg = langToggle.querySelector('.lang-flag-icon');
        const codeSpan = langToggle.querySelector('.lang-code');

        if (flagImg) flagImg.src = data.flag;
        if (codeSpan) codeSpan.textContent = data.code;

        // Update active state in dropdown
        langOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });

        // Update all internal links to include language param
        updateOutgoingLinks(lang);
    }

    function updateOutgoingLinks(lang) {
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            // Check if it's an internal link (relative path to .html or /)
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                try {
                    const url = new URL(href, window.location.origin + window.location.pathname);
                    // Only update if it points to an HTML file or root
                    if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
                        // Preserve hash if exists
                        const hash = url.hash;
                        url.hash = ''; // Clear hash to append param
                        url.searchParams.set('lang', lang);
                        link.href = url.toString() + hash;
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        });
    }
}

// ============================================
// Apply Translations
// ============================================
function applyTranslations(lang) {
    if (typeof translations === 'undefined') {
        console.warn('Translations not loaded');
        return;
    }

    const langStrings = translations[lang];
    if (!langStrings) return;

    // Translate all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        if (langStrings[key]) {
            // Check if it's an input placeholder
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = langStrings[key];
            } else {
                element.innerHTML = langStrings[key];
            }
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    console.log('Translations applied for:', lang);
}

// ============================================
// Dark Mode Toggle
// ============================================
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const html = document.documentElement;

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        html.setAttribute('data-theme', 'dark');
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function () {
            const currentTheme = html.getAttribute('data-theme');

            if (currentTheme === 'dark') {
                html.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                html.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }
}

// ============================================
// Hero Slideshow
// ============================================
function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slide-dot');
    const prevBtn = document.querySelector('.slide-arrow-prev');
    const nextBtn = document.querySelector('.slide-arrow-next');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let slideInterval;
    const intervalTime = 6000; // 6 seconds

    function goToSlide(index) {
        // Remove active from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Set new active
        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function startAutoPlay() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    function stopAutoPlay() {
        clearInterval(slideInterval);
    }

    // Event listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoPlay();
            nextSlide();
            startAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoPlay();
            prevSlide();
            startAutoPlay();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoPlay();
            goToSlide(index);
            startAutoPlay();
        });
    });

    // Start autoplay
    startAutoPlay();

    // Pause on hover
    const slideshowContainer = document.querySelector('.hero-slideshow');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', stopAutoPlay);
        slideshowContainer.addEventListener('mouseleave', startAutoPlay);
    }

}

// ============================================
// Hero Image Parallax on Scroll
// ============================================
function initHeroParallax() {
    const hero = document.querySelector('.hero-slideshow');
    if (!hero) return;

    const maxShift = 300;
    let ticking = false;

    function updateParallax() {
        const scrollY = window.scrollY || window.pageYOffset;
        const heroTop = hero.offsetTop;
        const heroHeight = hero.offsetHeight || 1;
        const rawShift = -(scrollY - heroTop) * 0.35;
        const shift = Math.max(-maxShift, Math.min(0, rawShift));
        hero.style.setProperty('--hero-parallax', `${shift}px`);
        ticking = false;
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateParallax);
    }

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
}

// ============================================
// Site Chatbot
// ============================================
function initSiteChatbot() {
    const widget = document.querySelector('.site-chatbot');
    if (!widget) return;

    const toggle = widget.querySelector('.chatbot-toggle');
    const panel = widget.querySelector('.chatbot-panel');
    const closeBtn = widget.querySelector('.chatbot-close');
    const form = widget.querySelector('.chatbot-form');
    const input = widget.querySelector('.chatbot-input');
    const messages = widget.querySelector('.chatbot-messages');
    const quick = widget.querySelector('.chatbot-quick');
    const actions = widget.querySelector('.chatbot-actions');
    const title = widget.querySelector('.chatbot-title');
    const subtitle = widget.querySelector('.chatbot-subtitle');
    const sendBtn = widget.querySelector('.chatbot-send');

    let greeted = false;
    const storageKey = 'siteChatbotMessages';

    function normalize(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    const contactInfo = {
        phone: '+34 696 312 578',
        email: 'info@elkhayati.com',
        address: 'Calle Orion 11, Grinon, Madrid',
        mapUrl: 'https://www.google.com/maps?q=Calle+Orion+11,+Grinon,+Madrid'
    };

    const i18n = {
        en: {
            title: 'Site assistant',
            subtitle: 'Ask about services, sectors, projects, or contact.',
            placeholder: 'Type your question',
            send: 'Send',
            quick: ['Services', 'Sectors', 'Projects', 'Contact'],
            greeting: 'Hi! I can answer about this website.',
            help: 'Topics: services, sectors, projects, contact.',
            fallback: 'I can only answer about this website. Try: Services, Sectors, Projects, Contact.',
            actions: { call: 'Call', email: 'Email', map: 'Map' },
            replies: [
                {
                    keys: ['services', 'service', 'solutions', 'servicios', 'soluciones', 'tabiqueria', 'drywall', 'aislamiento', 'acustico', 'termico', 'techos', 'fuego', 'proteccion'],
                    text: 'Services: drywall systems, thermal insulation, acoustic insulation, false ceilings, and passive fire protection.'
                },
                {
                    keys: ['sectors', 'sectores', 'industries', 'industry', 'hotels', 'hoteles', 'hospitals', 'hospitales', 'institutional', 'institucional', 'industrial'],
                    text: 'Sectors: hotels, hospitals, institutional buildings, and industrial projects.'
                },
                {
                    keys: ['projects', 'proyectos', 'portfolio', 'galeria', 'gallery'],
                    text: 'Projects: see the portfolio and gallery sections for recent work.'
                },
                {
                    keys: ['contact', 'contacto', 'email', 'telefono', 'phone', 'address', 'direccion'],
                    text: 'Contact: +34 696 312 578, info@elkhayati.com, Calle Orion 11, Grinon, Madrid. Use the buttons below for quick access.'
                },
                {
                    keys: ['about', 'nosotros', 'company', 'experience', 'years', 'anos', 'anios'],
                    text: 'About: 10+ years of experience, projects in multiple countries, and a highly qualified team.'
                }
            ]
        },
        es: {
            title: 'Asistente del sitio',
            subtitle: 'Pregunta por servicios, sectores, proyectos o contacto.',
            placeholder: 'Escribe tu pregunta',
            send: 'Enviar',
            quick: ['Servicios', 'Sectores', 'Proyectos', 'Contacto'],
            greeting: 'Hola. Puedo responder sobre este sitio.',
            help: 'Temas: servicios, sectores, proyectos, contacto.',
            fallback: 'Solo puedo responder sobre este sitio. Prueba: Servicios, Sectores, Proyectos, Contacto.',
            actions: { call: 'Llamar', email: 'Email', map: 'Mapa' },
            replies: [
                {
                    keys: ['servicios', 'servicio', 'soluciones', 'tabiqueria', 'drywall', 'aislamiento', 'acustico', 'termico', 'techos', 'fuego', 'proteccion'],
                    text: 'Servicios: tabiqueria seca, aislamiento termico, aislamiento acustico, falsos techos y proteccion pasiva contra fuego.'
                },
                {
                    keys: ['sectores', 'industrias', 'hoteles', 'hospitales', 'institucional', 'industrial'],
                    text: 'Sectores: hoteles, hospitales, institucional e industrial.'
                },
                {
                    keys: ['proyectos', 'portfolio', 'galeria'],
                    text: 'Proyectos: revisa el portfolio y la galeria para trabajos recientes.'
                },
                {
                    keys: ['contacto', 'email', 'telefono', 'direccion'],
                    text: 'Contacto: +34 696 312 578, info@elkhayati.com, Calle Orion 11, Grinon, Madrid. Usa los botones de acceso rapido.'
                },
                {
                    keys: ['nosotros', 'empresa', 'experiencia', 'anos', 'anios'],
                    text: 'Sobre nosotros: mas de 10 anos de experiencia y equipo altamente cualificado.'
                }
            ]
        },
        de: {
            title: 'Website Assistent',
            subtitle: 'Fragen zu Leistungen, Branchen, Projekten oder Kontakt.',
            placeholder: 'Frage eingeben',
            send: 'Senden',
            quick: ['Leistungen', 'Branchen', 'Projekte', 'Kontakt'],
            greeting: 'Hallo. Ich antworte nur uber diese Website.',
            help: 'Themen: Leistungen, Branchen, Projekte, Kontakt.',
            fallback: 'Ich kann nur uber diese Website antworten. Frage zu: Leistungen, Branchen, Projekte, Kontakt.',
            actions: { call: 'Anrufen', email: 'Email', map: 'Karte' },
            replies: [
                {
                    keys: ['leistungen', 'services', 'solutions', 'tabiqueria', 'drywall', 'isolation', 'akustik', 'thermisch', 'decken', 'feuer'],
                    text: 'Leistungen: Trockenbau, thermische und akustische Isolierung, abgehange Decken, passiver Brandschutz.'
                },
                {
                    keys: ['branchen', 'sektoren', 'hotels', 'hospitaler', 'institutionell', 'industrial'],
                    text: 'Branchen: Hotels, Krankenhauser, institutionell und industriell.'
                },
                {
                    keys: ['projekte', 'portfolio', 'galerie'],
                    text: 'Projekte: siehe Portfolio und Galerie fur aktuelle Arbeiten.'
                },
                {
                    keys: ['kontakt', 'email', 'telefon', 'adresse'],
                    text: 'Kontakt: +34 696 312 578, info@elkhayati.com, Calle Orion 11, Grinon, Madrid. Nutze die Schnellzugriffe unten.'
                },
                {
                    keys: ['uber uns', 'unternehmen', 'erfahrung', 'jahre'],
                    text: 'Uber uns: mehr als 10 Jahre Erfahrung und ein qualifiziertes Team.'
                }
            ]
        }
    };

    function getLang() {
        return localStorage.getItem('language') || document.documentElement.lang || 'es';
    }

    function getStrings() {
        const lang = getLang();
        return i18n[lang] || i18n.en;
    }

    function addMessage(text, type, save = true) {
        const msg = document.createElement('div');
        msg.className = `chatbot-msg chatbot-msg--${type}`;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        if (save) {
            saveMessage({ type, text });
        }
    }

    function showTyping() {
        const typing = document.createElement('div');
        typing.className = 'chatbot-msg chatbot-msg--bot chatbot-msg--typing';
        typing.textContent = '...';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
        return typing;
    }

    function saveMessage(msg) {
        try {
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existing.push(msg);
            localStorage.setItem(storageKey, JSON.stringify(existing));
        } catch (e) {
            // ignore storage errors
        }
    }

    function loadMessages() {
        try {
            return JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch (e) {
            return [];
        }
    }

    function clearMessages() {
        localStorage.removeItem(storageKey);
        messages.innerHTML = '';
        greeted = false;
    }

    function getReply(text) {
        const strings = getStrings();
        const clean = normalize(text);
        if (clean.includes('help') || clean.includes('ayuda') || clean.includes('hilfe')) {
            return strings.help;
        }
        if (clean === 'clear' || clean === 'reset') {
            clearMessages();
            return strings.help;
        }
        for (const item of strings.replies) {
            if (item.keys.some(key => clean.includes(key))) {
                return item.text;
            }
        }
        return strings.fallback;
    }

    function renderQuickReplies() {
        if (!quick) return;
        const strings = getStrings();
        quick.innerHTML = '';
        strings.quick.forEach(label => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chatbot-quick-btn';
            btn.textContent = label;
            btn.addEventListener('click', () => submitMessage(label));
            quick.appendChild(btn);
        });
    }

    function renderActions() {
        if (!actions) return;
        const strings = getStrings();
        const actionLabels = strings.actions;
        const actionLinks = {
            call: `tel:${contactInfo.phone.replace(/\s+/g, '')}`,
            email: `mailto:${contactInfo.email}`,
            map: contactInfo.mapUrl
        };

        actions.querySelectorAll('.chatbot-action').forEach(link => {
            const key = link.dataset.action;
            if (!key) return;
            link.textContent = actionLabels[key];
            link.setAttribute('href', actionLinks[key]);
        });
    }

    function openPanel() {
        const strings = getStrings();
        if (title) title.textContent = strings.title;
        if (subtitle) subtitle.textContent = strings.subtitle;
        if (input) input.placeholder = strings.placeholder;
        if (sendBtn) sendBtn.textContent = strings.send;
        renderQuickReplies();
        renderActions();
        panel.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        if (!greeted) {
            addMessage(strings.greeting, 'bot');
            greeted = true;
        }
        setTimeout(() => input.focus(), 50);
    }

    function closePanel() {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        if (panel.classList.contains('is-open')) {
            closePanel();
        } else {
            openPanel();
        }
    });

    closeBtn.addEventListener('click', closePanel);

    document.addEventListener('click', (e) => {
        if (!widget.contains(e.target) && panel.classList.contains('is-open')) {
            closePanel();
        }
    });

    widget.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePanel();
    });

    function submitMessage(text) {
        const cleaned = text.trim();
        if (!cleaned) return;
        addMessage(cleaned, 'user');
        const typing = showTyping();
        const reply = getReply(cleaned);
        setTimeout(() => {
            typing.remove();
            addMessage(reply, 'bot');
        }, 250);
        input.value = '';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitMessage(input.value);
    });

    const stored = loadMessages();
    if (stored.length) {
        stored.forEach(item => addMessage(item.text, item.type, false));
        greeted = true;
    }
}

// ============================================
// Counter Animation for Stats
// ============================================
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = 'true';
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count) || 0;
    let current = 0;
    const increment = target / 50;
    const stepTime = 30;

    const timer = setInterval(function () {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, stepTime);
}

// ============================================
// Scroll Animations
// ============================================
function initScrollAnimations() {
    // Header scroll effect
    const header = document.getElementById('header');
    const topBar = document.querySelector('.top-bar');

    window.addEventListener('scroll', function () {
        const scrollY = window.scrollY;

        // Top bar hide/show
        if (topBar) {
            if (scrollY > 50) {
                topBar.classList.add('hidden');
            } else {
                topBar.classList.remove('hidden');
            }
        }

        // Header background change
        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // Back to top button
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            if (scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    });

    // Back to top click
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Section animations
    const animateElements = document.querySelectorAll('.solution-card, .value-stat-item, .industry-card, .project-card, .certification-badge');

    const animationObserver = new IntersectionObserver(function (entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        animationObserver.observe(el);
    });
}

// ============================================
// Mobile Menu Toggle
// ============================================
const menuToggle = document.getElementById('menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
        nav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function () {
            nav.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            const headerHeight = document.getElementById('header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// Active Navigation Highlight
// ============================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', function () {
    let current = '';
    const headerHeight = document.getElementById('header')?.offsetHeight || 0;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// ============================================
// Gallery Filter & Lightbox
// ============================================
function initGallery() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Filter functionality
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            galleryItems.forEach((item, index) => {
                const category = item.dataset.category;

                if (filter === 'all' || category === filter) {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    }, 200);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 200);
                }
            });
        });
    });

    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCategory = document.getElementById('lightbox-category');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    if (!lightbox) return;

    let currentIndex = 0;
    let visibleItems = [];

    function updateVisibleItems() {
        visibleItems = Array.from(galleryItems).filter(item =>
            item.style.display !== 'none'
        );
    }

    function openLightbox(index) {
        updateVisibleItems();
        currentIndex = index;
        updateLightboxContent();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateLightboxContent() {
        const item = visibleItems[currentIndex];
        if (!item) return;

        const img = item.querySelector('img');
        const title = item.querySelector('.gallery-title');
        const category = item.querySelector('.gallery-category');

        if (lightboxImg) lightboxImg.src = img.src;
        if (lightboxImg) lightboxImg.alt = img.alt;
        if (lightboxTitle) lightboxTitle.textContent = title ? title.textContent : '';
        if (lightboxCategory) lightboxCategory.textContent = category ? category.textContent : '';
        if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${visibleItems.length}`;
    }

    function nextImage() {
        currentIndex = (currentIndex + 1) % visibleItems.length;
        updateLightboxContent();
    }

    function prevImage() {
        currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        updateLightboxContent();
    }

    // Event listeners
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            updateVisibleItems();
            const visibleIndex = visibleItems.indexOf(item);
            openLightbox(visibleIndex);
        });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
}

// ============================================
// Form Submission
// ============================================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        console.log('Form submitted:', data);

        // Show success message
        alert('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.');
        this.reset();
    });
}

// ============================================
// Console Log
// ============================================
console.log('El Khayati website loaded successfully - MTDS Style');
