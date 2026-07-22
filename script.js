// Small UX for all .btn hover (kept)
document.querySelectorAll('.btn').forEach((button) => {
    button.addEventListener('mouseenter', () => { button.style.transform = 'translateY(-2px)'; });
    button.addEventListener('mouseleave', () => { button.style.transform = ''; });
});

// Inject global call-confirmation modal once
(function(){
    if(document.getElementById('call-modal')) return; // already present
    const modalHtml = `
    <div id="call-modal" class="modal" aria-hidden="true" role="dialog" aria-labelledby="call-modal-title">
        <div class="modal-backdrop" data-modal-close></div>
        <div class="modal-panel" role="document">
            <h2 id="call-modal-title">Appel d'urgence</h2>
            <p id="call-modal-text">Appeler <strong id="call-number">+243 819 456 654</strong> ?</p>
            <div class="modal-actions">
                <button id="call-confirm" class="btn btn-primary">Appeler</button>
                <button id="call-cancel" class="btn btn-outline">Annuler</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('call-modal');
    const numberEl = document.getElementById('call-number');
    const confirmBtn = document.getElementById('call-confirm');
    const cancelBtn = document.getElementById('call-cancel');
    let pendingTel = null;
    let lastFocused = null;

    function getFocusable(el){
        return Array.from(el.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'))
            .filter(e=>e.offsetParent !== null);
    }

    function showModal(num, tel, trigger){
        numberEl.textContent = num;
        pendingTel = tel;
        lastFocused = trigger || document.activeElement;
        modal.setAttribute('aria-hidden','false');
        modal.setAttribute('aria-modal','true');
        document.body.style.overflow = 'hidden';
        // focus the confirm button
        confirmBtn.focus();
    }

    function hideModal(){
        modal.setAttribute('aria-hidden','true');
        modal.removeAttribute('aria-modal');
        pendingTel = null;
        document.body.style.overflow = '';
        if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    // trap focus
    modal.addEventListener('keydown', function(e){
        if(e.key !== 'Tab') return;
        const focusables = getFocusable(modal);
        if(focusables.length === 0) return;
        const idx = focusables.indexOf(document.activeElement);
        if(e.shiftKey){
            if(idx === 0){ focusables[focusables.length-1].focus(); e.preventDefault(); }
        } else {
            if(idx === focusables.length-1){ focusables[0].focus(); e.preventDefault(); }
        }
    });

    // global click handler to open modal for .btn-emergency
    document.addEventListener('click', function(e){
        const btn = e.target.closest('.btn-emergency');
        if(!btn) return;
        e.preventDefault();
        const tel = btn.getAttribute('href') || btn.dataset.tel || '';
        const num = (tel||'').replace('tel:','') || '+243 819 456 654';
        showModal(num, tel, btn);
    });

    confirmBtn.addEventListener('click', function(){ if(pendingTel) window.location.href = pendingTel; });
    cancelBtn.addEventListener('click', hideModal);
    modal.querySelector('[data-modal-close]').addEventListener('click', hideModal);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') hideModal(); });
})();

// Image skeleton and lazy handling (centralized)
(function(){
    document.querySelectorAll('.img-wrapper img').forEach(function(img){
        // set helpful attributes if missing
        if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
        if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
        if(!img.getAttribute('width')) img.setAttribute('width','96');
        if(!img.getAttribute('height')) img.setAttribute('height','96');
        if(!img.getAttribute('srcset')) img.setAttribute('srcset', img.getAttribute('src'));

        const wrapper = img.parentElement;
        img.addEventListener('load', function(){ wrapper.classList.add('loaded'); });
        img.addEventListener('error', function(){ wrapper.classList.add('error'); });
        if(img.complete && img.naturalWidth){ wrapper.classList.add('loaded'); }
    });
})();

// Contact form: try to POST to Formspree if configured, otherwise show a helpful message
(function(){
    const form = document.getElementById('contact-form');
    if(!form) return;
    form.addEventListener('submit', function(e){
        e.preventDefault();
        const action = form.getAttribute('action') || '';
        const data = new FormData(form);
        if(!action || action.includes('yourFormId')){
            alert('Formulaire non configuré pour l\'envoi. Remplacez l\'action du formulaire par votre endpoint Formspree.');
            form.reset();
            return;
        }
        fetch(action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(() => {
                const msg = document.createElement('div');
                msg.className = 'contact-success';
                msg.textContent = 'Merci — votre message a été envoyé.';
                form.parentElement.insertBefore(msg, form);
                form.reset();
            })
            .catch(() => {
                alert('Erreur lors de l\'envoi. Essayez plus tard.');
            });
    });
})();