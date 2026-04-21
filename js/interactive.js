/* Security Molding — Interactive Study Guide
   Lightweight vanilla JS. No framework. */

(() => {
  // ===== Reading progress bar =====
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    const setBar = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      bar.style.width = (Math.min(1, Math.max(0, scrolled)) * 100) + '%';
    };
    document.addEventListener('scroll', setBar, { passive: true });
    setBar();
  }

  // ===== Tabs =====
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const btns = group.querySelectorAll('.tabs__btn');
    const panels = group.querySelectorAll('.tabs__panel');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.setAttribute('aria-selected', 'false'));
        panels.forEach(p => p.setAttribute('aria-hidden', 'true'));
        btn.setAttribute('aria-selected', 'true');
        const target = btn.getAttribute('data-panel');
        const panel = group.querySelector(`[data-panel-id="${target}"]`);
        if (panel) panel.setAttribute('aria-hidden', 'false');
      });
    });
  });

  // ===== Accordion =====
  document.querySelectorAll('.accordion__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const body = btn.nextElementSibling;
      btn.setAttribute('aria-expanded', !expanded);
      if (!expanded) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = '0px';
      }
    });
  });

  // ===== Flashcards =====
  document.querySelectorAll('.flip').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  });

  // ===== Glossary pop-ups =====
  const modal = document.getElementById('gloss-modal');
  const modalTitle = document.getElementById('gloss-modal-title');
  const modalBody = document.getElementById('gloss-modal-body');
  const modalEyebrow = document.getElementById('gloss-modal-eyebrow');

  const openModal = (data) => {
    if (!modal) return;
    modalEyebrow.textContent = data.eyebrow || 'Glossary';
    modalTitle.textContent = data.title || '';
    modalBody.innerHTML = data.body || '';
    modal.classList.add('is-open');
  };
  const closeModal = () => modal && modal.classList.remove('is-open');

  document.querySelectorAll('.gloss').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal({
        eyebrow: el.dataset.eyebrow || 'Shop talk',
        title: el.dataset.title || el.textContent,
        body: el.dataset.body || ''
      });
    });
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal__close')) closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  // ===== Quiz =====
  document.querySelectorAll('.quiz').forEach(quiz => {
    const opts = quiz.querySelectorAll('.quiz__opt');
    const feedback = quiz.querySelector('.quiz__feedback');
    let answered = false;
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = opt.dataset.correct === 'true';
        opt.classList.add(correct ? 'is-correct' : 'is-wrong');
        opts.forEach(o => {
          if (o !== opt && o.dataset.correct === 'true') o.classList.add('is-correct');
        });
        if (feedback) {
          feedback.classList.add('is-visible');
          const msg = correct
            ? feedback.dataset.correct
            : feedback.dataset.wrong;
          if (msg) feedback.innerHTML = msg;
        }
      });
    });
  });

  // ===== Smooth scroll for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Intersection reveal =====
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-inview');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  }
})();
