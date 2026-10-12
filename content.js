(() => {
  const PRINT_AREA_ID = 'kp-print-area';

  function ensurePrintArea() {
    let area = document.getElementById(PRINT_AREA_ID);
    if (!area) {
      area = document.createElement('div');
      area.id = PRINT_AREA_ID;
      document.body.appendChild(area);
    }
    return area;
  }

  // Strip our own buttons plus Keep's UI chrome (pin/archive/toolbar icons),
  // so the printed page contains only the note itself.
  // Checklist checkboxes are NOT buttons, so list checkmarks are preserved.
  function cleanClone(clone) {
    clone.querySelectorAll(
      '.kp-hover-print, .kp-modal-print, button, [role="button"], [role="toolbar"], [role="menu"]'
    ).forEach(el => el.remove());
    clone.removeAttribute('data-kp-note');
    clone.removeAttribute('data-kp-modal-done');
    return clone;
  }

  // Best-effort note title, used for the print header (tab title is restored after).
  function noteTitle(noteEl) {
    const t = noteEl.querySelector('div[aria-label*="title" i]');
    if (t && t.textContent.trim()) return t.textContent.trim().slice(0, 80);
    const body = (noteEl.innerText || '').split('\n').map(s => s.trim()).find(Boolean);
    return body ? body.slice(0, 80) : '';
  }

  function printNote(noteEl) {
    if (!noteEl) return;
    const area = ensurePrintArea();
    area.innerHTML = '';
    const clone = cleanClone(noteEl.cloneNode(true));
    const wrapper = document.createElement('div');
    wrapper.className = 'kp-print-wrapper';
    wrapper.appendChild(clone);
    area.appendChild(wrapper);
    // Use the note title for the print header; restore the tab title afterwards.
    const prevTitle = document.title;
    const t = noteTitle(noteEl);
    if (t) document.title = t;
    document.body.classList.add('kp-printing');
    // Give the DOM a moment to render before opening the system dialog
    setTimeout(() => {
      window.print();
      printNote._prevTitle = prevTitle;
    }, 60);
  }

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('kp-printing');
    if (printNote._prevTitle !== undefined) {
      document.title = printNote._prevTitle;
      printNote._prevTitle = undefined;
    }
    const area = document.getElementById(PRINT_AREA_ID);
    if (area) area.innerHTML = '';
  });

  function createHoverButton(card) {
    const btn = document.createElement('button');
    btn.className = 'kp-hover-print';
    btn.type = 'button';
    btn.title = 'Print this note';
    btn.setAttribute('aria-label', 'Print this note');
    btn.textContent = '🖨️';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      printNote(card);
    });
    // Prevent the note from opening when the button itself is hovered/clicked
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    return btn;
  }

  // Selectors for Keep note cards. .IZ65Hb-n0tgWb is the card class used by
  // working Keep scrapers (verified Oct 2026); the rest are fallbacks.
  const CARD_SELECTORS = [
    '.IZ65Hb-n0tgWb',
    'div[role="listitem"]',
    'div[data-id][tabindex="0"]',
    'div[jsaction][data-id]'
  ];

  function findCards(root = document) {
    const cards = new Set();
    for (const sel of CARD_SELECTORS) {
      try {
        root.querySelectorAll(sel).forEach(el => {
          // Skip the opened editor dialog and our own UI
          if (el.getAttribute('role') === 'dialog') return;
          if (el.id === PRINT_AREA_ID) return;
          if (el.closest('#' + PRINT_AREA_ID)) return;
          cards.add(el);
        });
      } catch (e) {}
    }
    return [...cards];
  }

  function attachHoverToCard(card) {
    if (card.dataset.kpNote === '1') return;
    // Ignore tiny or hidden elements
    const rect = card.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 40) return;
    card.dataset.kpNote = '1';
    const cs = window.getComputedStyle(card);
    if (cs.position === 'static') {
      card.style.position = 'relative';
    }
    const btn = createHoverButton(card);
    card.appendChild(btn);
  }

  function handleModal() {
    document.querySelectorAll('div[role="dialog"]').forEach(dialog => {
      if (dialog.dataset.kpModalDone === '1') return;
      if (dialog.id === PRINT_AREA_ID) return;
      // Skip tiny popups (color picker, overflow menus) — only the note editor.
      // Left unmarked so a growing dialog is picked up on a later scan.
      const rect = dialog.getBoundingClientRect();
      if (rect.width < 240 || rect.height < 160) return;
      dialog.dataset.kpModalDone = '1';
      const printBtn = document.createElement('button');
      printBtn.className = 'kp-modal-print';
      printBtn.type = 'button';
      printBtn.title = 'Print this note';
      printBtn.textContent = '🖨️ Print';
      printBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        printNote(dialog);
      });
      // Try to place it in Keep's bottom toolbar, otherwise top-right of dialog
      const toolbar = dialog.querySelector('[role="toolbar"]');
      if (toolbar) {
        toolbar.appendChild(printBtn);
      } else {
        printBtn.style.position = 'absolute';
        printBtn.style.top = '8px';
        printBtn.style.right = '8px';
        printBtn.style.zIndex = '10000';
        const dcs = window.getComputedStyle(dialog);
        if (dcs.position === 'static') dialog.style.position = 'relative';
        dialog.appendChild(printBtn);
      }
    });
  }

  function scan() {
    const cards = findCards();
    if (cards.length && !scan._logged) {
      scan._logged = true;
      console.log('[KeepPrint] found ' + cards.length + ' note cards');
    }
    cards.forEach(attachHoverToCard);
    handleModal();
  }

  console.log('[KeepPrint] extension loaded on ' + location.href);

  const observer = new MutationObserver(() => {
    // Debounce slightly via requestAnimationFrame
    if (scan._raf) return;
    scan._raf = requestAnimationFrame(() => {
      scan._raf = null;
      scan();
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  // Initial scan, plus a few delayed scans for Keep's lazy render
  scan();
  setTimeout(scan, 1000);
  setTimeout(scan, 3000);
})();
