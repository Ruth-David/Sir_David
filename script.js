// Mobile Navigation
function initMobileNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }
}

/* ===========================
   LIGHTBOX: In-page image viewer
   =========================== */
function ensureLightboxDOM() {
    if (document.getElementById('lightbox')) return;

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', 'Image viewer');

    lb.innerHTML = `
      <div class="lb-inner">
        <button class="lb-close" id="lbClose" aria-label="Close" type="button">×</button>
        <button class="lb-btn lb-prev" id="lbPrev" aria-label="Previous" type="button">‹</button>
        <img class="lb-img" id="lbImg" alt="" />
        <button class="lb-btn lb-next" id="lbNext" aria-label="Next" type="button">›</button>
        <div class="lb-caption" id="lbCaption"></div>
      </div>
    `;
    document.body.appendChild(lb);
}

function initLightbox() {
    ensureLightboxDOM();

    const overlay = document.getElementById('lightbox');
    const imgEl = document.getElementById('lbImg');
    const captionEl = document.getElementById('lbCaption');
    const closeBtn = document.getElementById('lbClose');
    const prevBtn = document.getElementById('lbPrev');
    const nextBtn = document.getElementById('lbNext');

    // Collect all clickable images (content images only)
    const clickableImages = Array.from(document.querySelectorAll('img'))
        .filter(img => !img.closest('.logo') && !img.classList.contains('lb-img'));

    // Assign an index for navigation
    clickableImages.forEach((img, idx) => img.dataset.lbIndex = String(idx));

    let currentIndex = -1;
    let lastActive = null;

    function isImageURL(url) {
        return /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
    }

    function getFullSrcFor(img) {
        // Priority: data-full -> anchor href if image -> img.src
        if (img.dataset.full) return img.dataset.full;
        const anchor = img.closest('a[href]');
        if (anchor && isImageURL(anchor.href)) return anchor.href;
        return img.currentSrc || img.src;
    }

    function openLightbox(index) {
        if (index < 0 || index >= clickableImages.length) return;

        lastActive = document.activeElement;

        const img = clickableImages[index];
        const fullSrc = getFullSrcFor(img);
        showInLightbox(fullSrc, img.alt || '');
        currentIndex = index;

        overlay.classList.add('open');
        overlay.style.display = 'flex'; // ensure visible before focus
        document.body.classList.add('lb-open');
        overlay.setAttribute('aria-hidden', 'false');
        closeBtn.focus({ preventScroll: true });

        // Preload neighbors for faster nav
        preloadImage(getNeighborIndex(1));
        preloadImage(getNeighborIndex(-1));
    }

    function closeLightbox() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lb-open');
        setTimeout(() => {
            if (!overlay.classList.contains('open')) {
                overlay.style.display = 'none';
            }
        }, 300);
        if (lastActive && typeof lastActive.focus === 'function') {
            lastActive.focus({ preventScroll: true });
        }
        currentIndex = -1;
    }

    function getNeighborIndex(delta) {
        if (currentIndex < 0) return -1;
        const len = clickableImages.length;
        return (currentIndex + delta + len) % len;
    }

    function showPrev() {
        const idx = getNeighborIndex(-1);
        if (idx >= 0) openLightbox(idx);
    }

    function showNext() {
        const idx = getNeighborIndex(1);
        if (idx >= 0) openLightbox(idx);
    }

    function showInLightbox(src, caption) {
        imgEl.src = '';
        imgEl.alt = caption || '';
        captionEl.textContent = caption || '';
        imgEl.src = src;
    }

    function preloadImage(idx) {
        if (idx < 0) return;
        const img = clickableImages[idx];
        const src = getFullSrcFor(img);
        const pre = new Image();
        pre.src = src;
    }

    // Event delegation for any IMG click in main content
    document.addEventListener('click', (e) => {
        const targetImg = e.target instanceof Element ? e.target.closest('img') : null;
        if (!targetImg || targetImg.classList.contains('lb-img')) return;

        // Skip lightbox for order links (so clicking goes to booking)
        const orderAnchor = targetImg.closest('a.order-link');
        if (orderAnchor) return;

        // Only open for content images; skip icons etc
        const isContentImg =
            !!targetImg.closest('main, .hero, .portfolio-item, .service-gallery, .gallery-grid, .gallery-masonry, .about-image, .story-images');

        if (!isContentImg) return;

        const full = getFullSrcFor(targetImg);
        if (full) {
            e.preventDefault(); // prevent opening links if wrapped in <a>
            const idx = Number(targetImg.dataset.lbIndex ?? clickableImages.indexOf(targetImg));
            openLightbox(idx);
        }
    });

    // Controls
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    // Close when clicking outside the inner container
    overlay.addEventListener('click', (e) => {
        const inner = e.target instanceof Element ? e.target.closest('.lb-inner') : null;
        if (!inner) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });
}
/* ============================
   PRODUCT QUICK VIEW (PQV)
   ============================ */
function initProductQuickView() {
  // Build the modal once
  if (!document.getElementById('pqv')) {
    const wrap = document.createElement('div');
    wrap.id = 'pqv';
    wrap.className = 'pqv-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.style.display = 'none';

    wrap.innerHTML = `
      <div class="pqv-dialog">
        <div class="pqv-left">
          <div class="pqv-stage">
            <img class="pqv-img" alt="">
          </div>
          <div class="pqv-zoombar">
            <button type="button" class="pqv-zoom-out" aria-label="Zoom out">−</button>
            <span class="pqv-zoom-label">100%</span>
            <button type="button" class="pqv-zoom-in" aria-label="Zoom in">+</button>
            <button type="button" class="pqv-zoom-reset" aria-label="Reset zoom">Reset</button>
          </div>
        </div>
        <div class="pqv-right">
          <button type="button" class="pqv-close" aria-label="Close">×</button>
          <h3 class="pqv-title"></h3>
          <div class="pqv-price"></div>
          <div class="pqv-actions">
            <a href="#" class="cta-btn primary pqv-order">Order / Book</a>
            <button type="button" class="cta-btn secondary pqv-close2">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  const overlay  = document.getElementById('pqv');
  const img      = overlay.querySelector('.pqv-img');     // IMPORTANT: pqv-img
  const stage    = overlay.querySelector('.pqv-stage');   // IMPORTANT: pqv-stage
  const leftPane = overlay.querySelector('.pqv-left');    // IMPORTANT: pqv-left

  const titleEl  = overlay.querySelector('.pqv-title');
  const priceEl  = overlay.querySelector('.pqv-price');
  const orderBtn = overlay.querySelector('.pqv-order');
  const closeBtn = overlay.querySelector('.pqv-close');
  const closeBtn2= overlay.querySelector('.pqv-close2');

  const zoomIn   = overlay.querySelector('.pqv-zoom-in');
  const zoomOut  = overlay.querySelector('.pqv-zoom-out');
  const zoomReset= overlay.querySelector('.pqv-zoom-reset');
  const zoomLbl  = overlay.querySelector('.pqv-zoom-label');

  // ---- Zoom / Pan state ----
  let baseScale = 1;     // “fit to stage” scale
  let scale     = 1;
  let tx = 0, ty = 0;    // translate

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const pct = Math.round((scale / baseScale) * 100);
    zoomLbl.textContent = `${isFinite(pct) ? pct : 100}%`;
  }

  // Fit image fully inside the stage and center it
  function fitToStage() {
    const r  = stage.getBoundingClientRect();
    const iw = img.naturalWidth  || 1;
    const ih = img.naturalHeight || 1;
    baseScale = Math.min(r.width / iw, r.height / ih);
    scale = baseScale;
    tx = 0; ty = 0;
    applyTransform();
  }

  // Refit when the image loads or the window resizes
  img.addEventListener('load', fitToStage);
  window.addEventListener('resize', () => {
    if (overlay.style.display !== 'none') fitToStage();
  });

  // Zoom controls
  function zoom(delta) {
    scale = scale * (delta > 0 ? 1.15 : 1 / 1.15);
    applyTransform();
  }
  zoomIn.addEventListener('click', () => zoom(+1));
  zoomOut.addEventListener('click', () => zoom(-1));
  zoomReset.addEventListener('click', fitToStage);

  // Keyboard shortcuts while modal is open
  overlay.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(+1); }
    if (e.key === '-')                 { e.preventDefault(); zoom(-1); }
    if (e.key === '0')                 { e.preventDefault(); fitToStage(); }
    if (e.key === 'Escape')            { e.preventDefault(); close(); }
  });

  // Drag to pan
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  stage.style.cursor = 'grab';
  stage.addEventListener('mousedown', (e) => {
    dragging = true; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty; stage.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener('mouseup', () => { dragging = false; stage.style.cursor = 'grab'; });

  // Open/close
  function openFromAnchor(a) {
    const imgEl  = a.querySelector('img');
    const src    = imgEl?.currentSrc || imgEl?.src || '';
    const title  = a.querySelector('.order-caption')?.textContent?.trim() || 'Item';
    const price  = a.querySelector('.order-price-badge')?.textContent?.trim() || '';
    const bookH  = a.getAttribute('href') || '#';

    titleEl.textContent = title;
    priceEl.textContent = price || '';
    orderBtn.href = bookH;

    img.src = src;
overlay.style.display = 'flex';
overlay.classList.add('open');
document.body.classList.add('lb-open');                 // prevent page scroll
overlay.tabIndex = -1;
setTimeout(() => overlay.focus({ preventScroll: true }), 0); // avoid scroll jump

  }
  function close() {
    overlay.classList.remove('open');
overlay.style.display = 'none';
document.body.classList.remove('lb-open');

  }
  closeBtn.addEventListener('click', close);
  closeBtn2.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Intercept clicks on product cards
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a.order-link') : null;
    if (!a) return;
    // open quick view instead of jumping to contact
    e.preventDefault();
    openFromAnchor(a);
  });
}

// ============================
// WhatsApp Notifications (NEW)
// ============================

// Target number for notifications (international format, no '+')
const WHATSAPP_NOTIFY_NUMBER = '254725991286';

/**
 * Opens WhatsApp Web / App with a prefilled message to the given number.
 * Works on desktop (WhatsApp Web) and mobile (WhatsApp app).
 * @param {string} number E.g. '254712132268'
 * @param {string} text Message body
 */
function openWhatsApp(number, text) {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    // Using target=_blank to avoid navigation away from the page
    window.open(url, '_blank', 'noopener');
}

/**
 * Builds the WhatsApp message for Appointment form submissions.
 * Includes any selected item information (service/title/price/image).
 * @param {object} data Key/value pairs from the appointment form
 */
function buildAppointmentMessage(data) {
    const lines = [
        '🗓️ *New Appointment Request*',
        '',
        `• *Name:* ${data.appointmentName || ''}`,
        `• *Phone:* ${data.appointmentPhone || ''}`,
        `• *Email:* ${data.appointmentEmail || ''}`,
        `• *Date:* ${data.appointmentDate || ''}`,
        `• *Time:* ${data.appointmentTime || ''}`,
        `• *Service:* ${data.appointmentService || ''}`,
    ];

    // Extra context if prefilled from a product click
    if (data.selectedTitle || data.selectedPrice || data.selectedImage) {
        lines.push('');
        lines.push('• *Selected Item Details*');
        if (data.selectedTitle) lines.push(`   - Title: ${data.selectedTitle}`);
        if (data.selectedPrice) lines.push(`   - Price: KSH ${data.selectedPrice}`);
        if (data.selectedImage) lines.push(`   - Image: ${data.selectedImage}`);
    }

    if (data.appointmentNotes) {
        lines.push('', `• *Notes:* ${data.appointmentNotes}`);
    }

    lines.push('', 'Source: Sir David Bespoke website');
    return lines.join('\n');
}

/**
 * Builds the WhatsApp message for general Contact form submissions.
 * @param {object} data Key/value pairs from the contact form
 */
function buildContactMessage(data) {
    return [
        '✉️ *New Website Enquiry*',
        '',
        `• *Name:* ${data.fullName || ''}`,
        `• *Phone:* ${data.phone || ''}`,
        `• *Email:* ${data.email || ''}`,
        `• *Service Interest:* ${data.service || '—'}`,
        '',
        `• *Message:*\n${data.message || ''}`,
        '',
        'Source: Sir David Bespoke website'
    ].join('\n');
}

// Hero Carousel
function initHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let timer = null;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        slides[index].classList.add('active');
        if (indicators[index]) indicators[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    function startAuto() {
        stopAuto();
        timer = setInterval(nextSlide, 5000);
    }

    function stopAuto() {
        if (timer) clearInterval(timer);
        timer = null;
    }
    
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAuto(); });
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            startAuto();
        });
    });

    // Pause on hover/focus for accessibility
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mouseenter', stopAuto);
        hero.addEventListener('mouseleave', startAuto);
        hero.addEventListener('focusin', stopAuto);
        hero.addEventListener('focusout', startAuto);
    }

    // Start autoplay
    showSlide(currentSlide);
    startAuto();
}

/* ---------- Build Featured Collections under hero (no HTML change) ---------- */
function buildFeaturedCollections() {
  // Only on the homepage (has .hero and .services-preview)
  const hero = document.querySelector('.hero');
  const services = document.querySelector('.services-preview .services-grid');
  if (!hero || !services) return;

  // Collect up to 4 sources from existing service cards
  const cards = Array.from(services.querySelectorAll('.service-card')).slice(0, 4);
  if (!cards.length) return;

  // Create strip
  const section = document.createElement('section');
  section.className = 'featured-strip reveal';

  section.innerHTML = `
    <div class="container">
      <div class="featured-header">
        <div class="featured-title">Featured Collections</div>
        <a class="featured-cta" href="services.html">View All Collections</a>
      </div>
      <div class="featured-grid"></div>
    </div>
  `;

  const grid = section.querySelector('.featured-grid');

  // Build compact cards from existing service cards
  cards.forEach((c) => {
    const img = c.querySelector('img');
    const title = c.querySelector('h3')?.textContent?.trim() || 'Collection';
    const desc  = c.querySelector('p')?.textContent?.trim() || '';
    const link  = c.querySelector('a.link-btn')?.getAttribute('href') || 'services.html';

    const item = document.createElement('article');
    item.className = 'featured-card';

    item.innerHTML = `
      <img src="${img?.src || ''}" alt="${img?.alt || title}">
      <div class="featured-body">
        <div class="featured-name">${title}</div>
        <div class="featured-meta">${desc}</div>
      </div>
      <a class="view-btn" href="${link}" aria-label="View ${title}">View ${title}</a>
    `;

    grid.appendChild(item);
  });

  // Insert after hero
  hero.insertAdjacentElement('afterend', section);
}


// Gallery Filter
function initGalleryFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterBtns.length === 0 || galleryItems.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(button => button.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 250);
                }
            });
        });
    });
}

// FAQ Accordion
function initFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            
            faqQuestions.forEach(q => {
                if (q !== question) {
                    q.setAttribute('aria-expanded', 'false');
                    q.nextElementSibling.classList.remove('active');
                }
            });
            
            question.setAttribute('aria-expanded', String(!isExpanded));
            answer.classList.toggle('active');
        });
    });
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            if (!targetId) return;
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;

            e.preventDefault();
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

// Search Functionality (non-destructive highlighting)
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const scope = document.querySelector('main') || document.body;
    if (!searchInput || !searchBtn) return;

    const HIGHLIGHT_CLASS = 'search-highlight';

    function clearHighlights() {
        const marks = scope.querySelectorAll('mark.' + HIGHLIGHT_CLASS);
        marks.forEach(mark => {
            const parent = mark.parentNode;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
            parent.normalize();
        });
    }

    function highlight(term) {
        if (!term) return;
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                // Skip inside scripts/styles and hidden elements
                if (!node.parentElement) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                const isHidden = window.getComputedStyle(parent).display === 'none';
                if (isHidden) return NodeFilter.FILTER_REJECT;
                if (['SCRIPT','STYLE','NOSCRIPT','MARK'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
                if (!node.nodeValue || !regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
                // Reset lastIndex because TreeWalker calls multiple times
                regex.lastIndex = 0;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach(textNode => {
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            const text = textNode.nodeValue;
            text.replace(regex, (match, offset) => {
                const prev = text.slice(lastIndex, offset);
                if (prev) frag.appendChild(document.createTextNode(prev));
                const mark = document.createElement('mark');
                mark.className = HIGHLIGHT_CLASS;
                mark.textContent = match;
                frag.appendChild(mark);
                lastIndex = offset + match.length;
                return match;
            });
            const rest = text.slice(lastIndex);
            if (rest) frag.appendChild(document.createTextNode(rest));
            textNode.parentNode.replaceChild(frag, textNode);
        });
    }

    function performSearch(query) {
        clearHighlights();
        const q = query.trim();
        if (q) highlight(q);
    }
    
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
}

// Prefill Booking form on contact.html from services image links
function prefillBookingFromHash() {
    // Expect hash like: #booking?service=mens-suits&title=...&price=...&img=...
    if (!(location.hash && location.hash.startsWith('#booking'))) return;

    const query = location.hash.split('?')[1] || '';
    const params = new URLSearchParams(query);

    const service  = params.get('service') || '';
    const title    = params.get('title') || '';
    const price    = params.get('price') || '';
    const img      = params.get('img') ? decodeURIComponent(params.get('img')) : '';

    const serviceSelect = document.getElementById('appointmentService');
    const notes = document.getElementById('appointmentNotes');

    // Hidden fields (add these inputs inside #appointmentForm in contact.html)
    const hService = document.getElementById('selectedService');
    const hTitle   = document.getElementById('selectedTitle');
    const hPrice   = document.getElementById('selectedPrice');
    const hImage   = document.getElementById('selectedImage');

    if (serviceSelect && service) {
        serviceSelect.value = service;
    }

    // Build a friendly prefill note
    const lines = [];
    if (title) lines.push(`Selected item: ${title}`);
    if (price) lines.push(`Listed price: KSH ${price}`);
    if (img)   lines.push(`Image: ${img}`);

    if (notes && lines.length) {
        const existing = notes.value ? notes.value + '\n\n' : '';
        notes.value = existing + lines.join('\n');
    }

    // Store to hidden fields
    if (hService) hService.value = service;
    if (hTitle)   hTitle.value   = title;
    if (hPrice)   hPrice.value   = price;
    if (hImage)   hImage.value   = img;

    // Smooth-scroll into view
    const booking = document.getElementById('booking');
    const header = document.querySelector('.header');
    const headerH = header ? header.offsetHeight : 0;
    if (booking) {
        const top = booking.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// Contact Form Validation and Submission (+ WhatsApp notify)
function initContactForms() {
    const contactForm = document.getElementById('contactForm');
    const appointmentForm = document.getElementById('appointmentForm');
    
    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        
        requiredFields.forEach(field => {
            const errorElement = document.getElementById(field.name + '-error');
            
            if (!String(field.value).trim()) {
                if (errorElement) errorElement.textContent = 'This field is required';
                isValid = false;
            } else {
                if (field.type === 'email' && !isValidEmail(field.value)) {
                    if (errorElement) errorElement.textContent = 'Please enter a valid email address';
                    isValid = false;
                }
                if (field.type === 'tel' && !isValidPhone(field.value)) {
                    if (errorElement) errorElement.textContent = 'Please enter a valid phone number';
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    function submitForm(form, successElementId) {
        // Gather data
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) data[key] = value;

        // --- WhatsApp notify ---
        try {
            if (form.id === 'appointmentForm') {
                const text = buildAppointmentMessage(data);
                openWhatsApp(WHATSAPP_NOTIFY_NUMBER, text);
            } else if (form.id === 'contactForm') {
                const text = buildContactMessage(data);
                openWhatsApp(WHATSAPP_NOTIFY_NUMBER, text);
            }
        } catch (err) {
            console.warn('WhatsApp notification failed to open:', err);
        }

        // UI success state
        console.log('Form submitted:', data);
        form.style.display = 'none';
        const ok = document.getElementById(successElementId);
        if (ok) ok.style.display = 'block';

        // Example server request (disabled):
        // fetch('/submit-form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(contactForm)) submitForm(contactForm, 'formSuccess');
        });
    }
    
    if (appointmentForm) {
        const dateInput = appointmentForm.querySelector('#appointmentDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }
        
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(appointmentForm)) submitForm(appointmentForm, 'appointmentSuccess');
        });
    }
}

// Testimonial Carousel
function initTestimonialCarousel() {
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    if (testimonialSlides.length === 0) return;
    
    let currentTestimonial = 0;

    function showTestimonial(index) {
        testimonialSlides.forEach(slide => slide.classList.remove('active'));
        testimonialSlides[index].classList.add('active');
    }
    
    function nextTestimonial() {
        currentTestimonial = (currentTestimonial + 1) % testimonialSlides.length;
        showTestimonial(currentTestimonial);
    }
    
    showTestimonial(currentTestimonial);
    setInterval(nextTestimonial, 4000);
}

// FAQ Category Navigation
function initFAQCategoryNavigation() {
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
    }, observerOptions);
    
    const animateElements = document.querySelectorAll(
        '.service-card, .testimonial-card, .mission-card, .team-member, .portfolio-item, .gallery-item'
    );
    animateElements.forEach(el => observer.observe(el));
}

// Add CSS for scroll animations and search highlight
function addScrollAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .service-card,
        .testimonial-card,
        .mission-card,
        .team-member,
        .portfolio-item,
        .gallery-item {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease-out;
        }
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        .search-highlight {
            background-color: var(--primary-gold);
            color: var(--white);
            padding: 2px 4px;
            border-radius: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
            .service-card,
            .testimonial-card,
            .mission-card,
            .team-member,
            .portfolio-item,
            .gallery-item {
                opacity: 1;
                transform: none;
                transition: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// Back to Top Button
function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    
    const style = document.createElement('style');
    style.textContent = `
        .back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 50px;
            height: 50px;
            background: var(--primary-gold);
            color: var(--white);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 1000;
            font-size: 1.2rem;
            box-shadow: var(--shadow-lg);
        }
        .back-to-top.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .back-to-top:hover {
            background: var(--primary-gold-dark);
            transform: translateY(-5px);
        }
        @media (max-width: 768px) {
            .back-to-top {
                bottom: 1rem;
                right: 1rem;
                width: 45px;
                height: 45px;
                font-size: 1rem;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Loading Animation
function initLoadingAnimation() {
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        const style = document.createElement('style');
        style.textContent = `
            body:not(.loaded) { overflow: hidden; }
            body:not(.loaded)::before {
                content: '';
                position: fixed;
                inset: 0;
                background: var(--white);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            body.loaded::before {
                opacity: 0;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    initHeroCarousel();

    buildFeaturedCollections();

    initGalleryFilter();
    initFAQAccordion();
    initSmoothScrolling();
    initSearch();
    initContactForms();        // includes WhatsApp notifications
    initTestimonialCarousel();
    initFAQCategoryNavigation();
    initScrollAnimations();
    addScrollAnimationStyles();
    initBackToTop();
    initLoadingAnimation();
    initLightbox();

    initProductQuickView();

    prefillBookingFromHash();  // NEW: prefill booking from services image links
if (window.__initProductsFromJSON) window.__initProductsFromJSON();

    console.log('Sir David Couture website initialized successfully!');
});

/* =========================================================
   PRODUCTS FROM JSON (non-destructive, per-section)
   ========================================================= */
(function () {
  // ---- CONFIG ----
  const JSON_URL = 'data/products.json';  // relative path

 
    const SECTIONS = [
  { key: 'mens-suits',   gridId: 'mensGrid'   },
  { key: 'womens-suits', gridId: 'womensGrid' },
  { key: 'bridal',       gridId: 'bridalGrid' },
  { key: 'african',      gridId: 'africanGrid'},
  { key: 'ties',         gridId: 'tiesGrid'   },        // NEW
  { key: 'materials',    gridId: 'materialsGrid'}       // NEW
];


  function cacheBust(url) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'v=' + Date.now(); // avoid CDN caching
  }

  function buildBookingHref({ service, title, priceLabel, image }) {
    const params = new URLSearchParams({
      service: service || '',
      title: title || '',
      price: priceLabel || '',
      img: image || ''
    });
    return `contact.html#booking?${params.toString()}`;
  }

  function renderCard(grid, tpl, item) {
    const node = tpl.content.cloneNode(true);
    const a = node.querySelector('.order-link');
    const img = node.querySelector('img');
    const badge = node.querySelector('.order-price-badge');
    const caption = node.querySelector('.order-caption');

    a.href = buildBookingHref({
      service: item.section || '',
      title: item.title || '',
      priceLabel: item.priceLabel || '',
      image: item.image || ''
    });

    if (img) { img.src = item.image || ''; img.alt = item.title || ''; }
    if (badge) {
      const label = item.priceLabel || '';
      if (label) { badge.textContent = label; badge.hidden = false; }
      else badge.hidden = true;
    }
    if (caption) caption.textContent = item.title || '';

    grid.appendChild(node);
  }

  function renderSection(items, sectionKey) {
    const meta = SECTIONS.find(s => s.key === sectionKey);
    if (!meta) return;
    const grid = document.getElementById(meta.gridId);
    const tpl = document.getElementById('product-card-template');
    if (!grid || !tpl) return;

    const filtered = items.filter(it => String(it.section || '').toLowerCase() === sectionKey);
    if (filtered.length === 0) return; // keep static fallback

    grid.innerHTML = ''; // replace only when we have data
    filtered.forEach(item => renderCard(grid, tpl, item));
  }

  async function initProductsFromJSON() {
    // Only run on services page
    if (
  !document.getElementById('mensGrid') &&
  !document.getElementById('womensGrid') &&
  !document.getElementById('bridalGrid') &&
  !document.getElementById('africanGrid') &&
  !document.getElementById('tiesGrid') &&
  !document.getElementById('materialsGrid')
) return;

    try {
      const res = await fetch(cacheBust(JSON_URL), { credentials: 'omit', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const items = Array.isArray(data) ? data : (data.items || []);
      if (!Array.isArray(items) || items.length === 0) return;

      renderSection(items, 'mens-suits');
renderSection(items, 'womens-suits');
renderSection(items, 'bridal');
renderSection(items, 'african');
renderSection(items, 'ties');        // NEW
renderSection(items, 'materials');   // NEW

    } catch (err) {
      console.error('Products JSON load failed:', err);
      // fallback: keep existing static HTML
    }
  }

  // Expose for init
  window.__initProductsFromJSON = initProductsFromJSON;
})();

