(function() {
    'use strict';

    // ---- CONFIG ----
    const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyncgISOLpK4T8HUlVLMnjK8QXC7WkhY32NckH1hAyQtOZkcctunYNcRx54QhsRiifk/exec';

    // ---- DOM refs ----
    const form = document.getElementById('regForm');
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const rank = document.getElementById('rank');
    const organization = document.getElementById('organization');
    const special = document.getElementById('special');
    const submitBtn = document.getElementById('submitBtn');

    const popup = document.getElementById('registerPopup');
    const popupClose = document.getElementById('popupCloseBtn');
    const popupCancel = document.getElementById('popupCancelBtn');

    const confirmModal = document.getElementById('confirmModal');
    const modalClose = document.getElementById('modalCloseBtn');
    const modalClose2 = document.getElementById('modalCloseBtn2');
    const cardName = document.getElementById('cardName');
    const cardId = document.getElementById('cardId');
    const cardEmail = document.getElementById('cardEmail');
    const cardOrg = document.getElementById('cardOrg');
    const cardTicketId = document.getElementById('cardTicketId');
    const qrCardContainer = document.getElementById('qrcode-card');
    const downloadCardBtn = document.getElementById('downloadCardBtn');

    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    let currentParticipant = null;

    // ---- Helpers ----
    function showToast(msg, type) {
        toast.className = 'toast show' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
        toastMsg.textContent = msg;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 5000);
    }

    function openPopup() { popup.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closePopup() { popup.classList.remove('active'); document.body.style.overflow = ''; }

    function openConfirm() { confirmModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeConfirm() { confirmModal.classList.remove('active'); document.body.style.overflow = ''; }

    // ---- Open popup triggers ----
    document.querySelectorAll('#navRegisterBtn, #heroRegisterBtn, #heroCtaBtn, #bannerRegisterBtn, #footerRegisterBtn')
        .forEach(el => el.addEventListener('click', e => { e.preventDefault();
            openPopup(); }));

    popupClose.addEventListener('click', closePopup);
    popupCancel.addEventListener('click', closePopup);
    popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });

    modalClose.addEventListener('click', closeConfirm);
    modalClose2.addEventListener('click', closeConfirm);
    confirmModal.addEventListener('click', e => { if (e.target === confirmModal) closeConfirm(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (confirmModal.classList.contains('active'))
            closeConfirm(); if (popup.classList.contains('active')) closePopup(); } });

    // ---- Generate Unique ID ----
    function generateUniqueId() {
        const prefix = 'NACWS';
        const now = new Date();
        const ts = now.getFullYear().toString().slice(2) +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        return prefix + '-' + ts + '-' + rand;
    }

    // ---- Generate QR ----
    function generateQR(data) {
        qrCardContainer.innerHTML = '';
        try {
            new QRCode(qrCardContainer, {
                text: data,
                width: 120,
                height: 120,
                colorDark: '#07472d',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (e) { qrCardContainer.innerHTML = '<p style="color:red;">QR error</p>'; }
    }

    // ---- Open confirm with ticket ----
    function showTicket(participant) {
        currentParticipant = participant;
        cardName.textContent = participant.fullName;
        cardId.textContent = participant.uniqueId;
        cardEmail.textContent = participant.email;
        cardOrg.textContent = participant.organization || 'N/A';
        cardTicketId.textContent = participant.uniqueId;
        const qrPayload = JSON.stringify({ id: participant.uniqueId, name: participant.fullName, email: participant
            .email });
        generateQR(qrPayload);
        openConfirm();
    }

    // ---- Download ticket ----
    async function downloadTicket() {
        const card = document.getElementById('invitationCard');
        if (!card) { showToast('Ticket not found.', 'error'); return; }
        try {
            downloadCardBtn.disabled = true;
            downloadCardBtn.innerHTML = '<span class="spinner"></span> Generating…';
            const canvas = await html2canvas(card, {
                scale: 3,
                useCORS: true,
                backgroundColor: null,
                logging: false,
                width: card.scrollWidth,
                height: card.scrollHeight,
                windowWidth: card.scrollWidth,
                windowHeight: card.scrollHeight
            });
            const link = document.createElement('a');
            link.download = 'NACWS-Ticket-' + (currentParticipant ? currentParticipant.uniqueId : 'card') + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Ticket downloaded!', 'success');
        } catch (err) {
            showToast('Failed to generate ticket.', 'error');
        } finally {
            downloadCardBtn.disabled = false;
            downloadCardBtn.innerHTML = '⬇️ Download Ticket';
        }
    }
    downloadCardBtn.addEventListener('click', downloadTicket);

    // ---- Sanitize input (basic) ----
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Form submit ----
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = fullName.value.trim();
        const mail = email.value.trim();
        const phoneVal = phone.value.trim();
        const org = organization.value.trim();

        if (!name) { showToast('Please enter your full name.', 'error');
            fullName.focus(); return; }
        if (!mail || !mail.includes('@')) { showToast('Please enter a valid email.', 'error');
            email.focus(); return; }
        if (!phoneVal) { showToast('Please enter your phone number.', 'error');
            phone.focus(); return; }
        if (!org) { showToast('Please enter your organization.', 'error');
            organization.focus(); return; }

        // Sanitize all inputs
        const clean = {
            fullName: sanitize(name),
            email: sanitize(mail),
            phone: sanitize(phoneVal),
            rank: sanitize(rank.value.trim() || 'N/A'),
            organization: sanitize(org),
            special: sanitize(special.value.trim() || 'N/A')
        };

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

        const uniqueId = generateUniqueId();
        const payload = {
            uniqueId,
            ...clean,
            registrationDate: new Date().toISOString(),
            verified: false
        };

        try {
            await fetch(APP_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            showTicket(payload);
            showToast('Registration successful! Check your email.', 'success');
            form.reset();
            closePopup();
        } catch (err) {
            showTicket(payload);
            showToast('Registered locally. Email will be sent when online.', 'success');
            form.reset();
            closePopup();
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 Register &amp; Get QR';
        }
    });

    // ---- DEMO pre-fill ----
    if (window.location.search.includes('demo')) {
        fullName.value = 'Maj. Adebayo O. Johnson';
        email.value = 'adebayo.johnson@army.mil.ng';
        phone.value = '+234 800 123 4567';
        rank.value = 'Major';
        organization.value = 'Nigerian Army Cyber Warfare School';
        special.value = 'Vegetarian meal preferred.';
    }
    if (window.location.search.includes('register')) setTimeout(openPopup, 400);

    console.log('✅ NACWS Registration System loaded.');
})();
