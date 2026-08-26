/**
 * NACWS – Unified Application Logic
 * Handles: Registration (index), Verification (verify), Admin (admin)
 */

(function() {
    'use strict';

    // ============================================================
    // SHARED HELPERS
    // ============================================================
    const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0yBX8R_YWE9Zt00_EB85r2cK0FfRxknKsfC9Qd_JxiEUQNYHiwP8NZPUK-Ff2L9hy/exec';
    let toastTimer = null;

    function showToast(msg, type) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        if (!toast) return;
        toast.className = 'toast show' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
        toastMsg.textContent = msg;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() {
            toast.classList.remove('show');
        }, 4000);
    }

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

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============================================================
    // MODULE: REGISTRATION (index.html)
    // ============================================================
    var Registration = {
        init: function() {
            var self = this;
            this.fullName = document.getElementById('fullName');
            this.serviceNo = document.getElementById('serviceNo');
            this.email = document.getElementById('email');
            this.phone = document.getElementById('phone');
            this.rank = document.getElementById('rank');
            this.role = document.getElementById('role');
            this.organization = document.getElementById('organization');
            this.special = document.getElementById('special');
            this.submitBtn = document.getElementById('submitBtn');
            this.form = document.getElementById('regForm');
            this.popup = document.getElementById('registerPopup');
            this.popupClose = document.getElementById('popupCloseBtn');
            this.popupCancel = document.getElementById('popupCancelBtn');
            this.confirmModal = document.getElementById('confirmModal');
            this.modalClose = document.getElementById('modalCloseBtn');
            this.modalClose2 = document.getElementById('modalCloseBtn2');
            this.cardName = document.getElementById('cardName');
            this.cardServiceNo = document.getElementById('cardServiceNo');
            this.cardRole = document.getElementById('cardRole');
            this.cardId = document.getElementById('cardId');
            this.cardEmail = document.getElementById('cardEmail');
            this.cardOrg = document.getElementById('cardOrg');
            this.cardTicketId = document.getElementById('cardTicketId');
            this.qrContainer = document.getElementById('qrcode-card');
            this.downloadBtn = document.getElementById('downloadCardBtn');

            this.currentParticipant = null;

            // Bind events
            document.querySelectorAll('#navRegisterBtn, #heroRegisterBtn, #bannerRegisterBtn, #footerRegisterBtn')
                .forEach(function(el) {
                    if (el) el.addEventListener('click', function(e) { e.preventDefault();
                        self.openPopup(); });
                });

            if (this.popupClose) this.popupClose.addEventListener('click', function() { self.closePopup(); });
            if (this.popupCancel) this.popupCancel.addEventListener('click', function() { self.closePopup(); });
            if (this.popup) this.popup.addEventListener('click', function(e) { if (e.target === self.popup) self
                    .closePopup(); });

            if (this.modalClose) this.modalClose.addEventListener('click', function() { self.closeConfirm(); });
            if (this.modalClose2) this.modalClose2.addEventListener('click', function() { self.closeConfirm(); });
            if (this.confirmModal) this.confirmModal.addEventListener('click', function(e) { if (e.target === self
                    .confirmModal) self.closeConfirm(); });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (self.confirmModal && self.confirmModal.classList.contains('active')) self.closeConfirm();
                    if (self.popup && self.popup.classList.contains('active')) self.closePopup();
                }
            });

            if (this.form) {
                this.form.addEventListener('submit', function(e) { self.handleSubmit(e); });
            }

            if (this.downloadBtn) {
                this.downloadBtn.addEventListener('click', function() { self.downloadTicket(); });
            }

            // Pre-fill demo
            if (window.location.search.includes('demo')) {
                if (this.fullName) this.fullName.value = 'Umar Faruk';
                if (this.serviceNo) this.serviceNo.value = 'N/2332';
                if (this.email) this.email.value = 'donfaruk191@gmail.com';
                if (this.phone) this.phone.value = '+234 800 123 4567';
                if (this.rank) this.rank.value = 'Major';
                if (this.role) this.role.value = 'Discussant';
                if (this.organization) this.organization.value = 'Nigerian Army';
                if (this.special) this.special.value = 'None';
            }
            if (window.location.search.includes('register')) {
                setTimeout(function() { self.openPopup(); }, 400);
            }
            self.initGallery(); 
        },

        openPopup: function() {
            if (!this.popup) return;
            this.popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closePopup: function() {
            if (!this.popup) return;
            this.popup.classList.remove('active');
            document.body.style.overflow = '';
        },

        openConfirm: function() {
            if (!this.confirmModal) return;
            this.confirmModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeConfirm: function() {
            if (!this.confirmModal) return;
            this.confirmModal.classList.remove('active');
            document.body.style.overflow = '';
        },

        generateQR: function(data) {
            if (!this.qrContainer) return;
            this.qrContainer.innerHTML = '';
            // Ensure container has fixed dimensions
            this.qrContainer.style.width = '120px';
            this.qrContainer.style.height = '120px';
            try {
                new QRCode(this.qrContainer, {
                    text: data,
                    width: 120,
                    height: 120,
                    colorDark: '#07472d',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (e) {
                this.qrContainer.innerHTML = '<p style="color:red;">QR error</p>';
                showToast('QR generation error. Try again.', 'error');
            }
        },

        showTicket: function(participant) {
            this.currentParticipant = participant;
            if (this.cardName) this.cardName.textContent = participant.fullName;
            if (this.cardServiceNo) this.cardServiceNo.textContent = participant.serviceNo || 'N/A';
            if (this.cardRole) this.cardRole.textContent = participant.role || 'N/A';
            if (this.cardId) this.cardId.textContent = participant.uniqueId;
            if (this.cardEmail) this.cardEmail.textContent = participant.email;
            if (this.cardOrg) this.cardOrg.textContent = participant.organization || 'N/A';
            if (this.cardTicketId) this.cardTicketId.textContent = participant.uniqueId;
            var qrPayload = JSON.stringify({
                id: participant.uniqueId,
                name: participant.fullName,
                email: participant.email,
                serviceNo: participant.serviceNo,
                role: participant.role
            });
            // Delay QR generation to ensure container is ready
            var self = this;
            setTimeout(function() {
                self.generateQR(qrPayload);
            }, 200);
            this.openConfirm();
        },

        // ===== DOWNLOAD TICKET – FIXED to capture full ticket =====
downloadTicket: function() {
  var self = this;
  var card = document.getElementById('invitationCard');
  if (!card) {
    showToast('Ticket not found.', 'error');
    return;
  }
  self.downloadBtn.disabled = true;
  self.downloadBtn.innerHTML = '<span class="spinner"></span> Generating…';

  // Ensure the card is fully expanded
  card.style.transform = 'none';
  card.style.overflow = 'visible';
  card.style.height = 'auto';
  card.style.maxHeight = 'none';

  // Force a reflow
  void card.offsetHeight;

  html2canvas(card, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: card.scrollWidth,
    height: card.scrollHeight,
    windowWidth: card.scrollWidth,
    windowHeight: card.scrollHeight,
    onclone: function(doc) {
      var cloned = doc.getElementById('invitationCard');
      if (cloned) {
        cloned.style.transform = 'none';
        cloned.style.overflow = 'visible';
        cloned.style.height = 'auto';
        cloned.style.maxHeight = 'none';
        // Remove any fixed widths that cause right white space
        cloned.style.width = '100%';
        cloned.style.boxSizing = 'border-box';
      }
    }
  }).then(function(canvas) {
    var link = document.createElement('a');
    link.download = 'NACWS-Ticket-' + (self.currentParticipant ? self.currentParticipant.uniqueId : 'card') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Ticket downloaded!', 'success');
  }).catch(function(err) {
    console.error('html2canvas error:', err);
    // Fallback: QR only
    var qrCanvas = self.qrContainer ? self.qrContainer.querySelector('canvas') : null;
    if (qrCanvas) {
      var link = document.createElement('a');
      link.download = 'NACWS-QR-' + (self.currentParticipant ? self.currentParticipant.uniqueId : 'card') + '.png';
      link.href = qrCanvas.toDataURL('image/png');
      link.click();
      showToast('QR downloaded (fallback).', 'success');
    } else {
      showToast('Failed to generate ticket. Please try again.', 'error');
    }
  }).finally(function() {
    self.downloadBtn.disabled = false;
    self.downloadBtn.innerHTML = '⬇️ Download Ticket';
  });
},

        // ===== GALLERY SLIDER =====
        initGallery: function() {
            const track = document.getElementById('galleryTrack');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const dotsContainer = document.getElementById('galleryDots');
            const slider = document.getElementById('gallerySlider');

            if (!track || !prevBtn || !nextBtn || !dotsContainer || !slider) return;

            const slides = Array.from(track.children);
            const slideCount = slides.length;
            let currentIndex = 0;
            let autoPlayInterval;
            const autoPlayTime = 4000;

            let startX = 0;
            let isDragging = false;

            dotsContainer.innerHTML = '';

            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.classList.add('gallery-dot');
                dot.setAttribute('aria-label', `Go to slide ${i+1}`);
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            });
            const dots = Array.from(dotsContainer.children);

            function updateSlider() {
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
                dots.forEach(dot => dot.classList.remove('active'));
                dots[currentIndex].classList.add('active');
            }
            function nextSlide() { currentIndex = (currentIndex + 1) % slideCount; updateSlider(); }
            function prevSlide() { currentIndex = (currentIndex - 1 + slideCount) % slideCount; updateSlider(); }
            function goToSlide(index) { currentIndex = index; updateSlider(); resetAutoPlay(); }
            function startAutoPlay() { stopAutoPlay(); autoPlayInterval = setInterval(nextSlide, autoPlayTime); }
            function stopAutoPlay() { clearInterval(autoPlayInterval); }
            function resetAutoPlay() { stopAutoPlay(); startAutoPlay(); }

            nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
            prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });
            slider.addEventListener('mouseenter', stopAutoPlay);
            slider.addEventListener('mouseleave', startAutoPlay);

            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                stopAutoPlay();
                track.style.transition = 'none';
            });
            track.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const diff = e.touches[0].clientX - startX;
                track.style.transform = `translateX(${-currentIndex * 100 + (diff / slider.offsetWidth) * 100}%)`;
            });
            track.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                track.style.transition = 'transform 0.8s cubic-bezier(.77,0,.18,1)';
                const diff = e.changedTouches[0].clientX - startX;
                if (diff > 50) { prevSlide(); } else if (diff < -50) { nextSlide(); }
                updateSlider();
                startAutoPlay();
            });

            startAutoPlay();
        },

        // ===== HANDLE SUBMIT with validation =====
        handleSubmit: function(e) {
            e.preventDefault();
            var self = this;
            var name = this.fullName ? this.fullName.value.trim() : '';
            var serviceNo = this.serviceNo ? this.serviceNo.value.trim() : '';
            var mail = this.email ? this.email.value.trim() : '';
            var phoneVal = this.phone ? this.phone.value.trim() : '';
            var roleVal = this.role ? this.role.value.trim() : '';
            var org = this.organization ? this.organization.value.trim() : '';
            var rankVal = this.rank ? this.rank.value.trim() : '';

            // Validation patterns
            var namePattern = /^[a-zA-Z0-9\-\.\s]+$/;
            var servicePattern = /^[a-zA-Z0-9()\/]+$/;
            var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            var phonePattern = /^\+?[0-9\s\-()]+$/;
            var orgPattern = /^[a-zA-Z0-9\- ]+$/;
            var rankPattern = /^[a-zA-Z0-9\-/ ]+$/;

            if (!name) { showToast('Please enter your full name.', 'error'); if (this.fullName) this.fullName.focus(); return; }
            if (!namePattern.test(name)) { showToast('Name contains invalid characters.', 'error'); if (this.fullName) this.fullName.focus(); return; }
            if (!serviceNo) { showToast('Please enter your service number.', 'error'); if (this.serviceNo) this.serviceNo.focus(); return; }
            if (!servicePattern.test(serviceNo)) { showToast('Service number contains invalid characters.', 'error'); if (this.serviceNo) this.serviceNo.focus(); return; }
            if (!mail || !emailPattern.test(mail)) { showToast('Please enter a valid email.', 'error'); if (this.email) this.email.focus(); return; }
            if (!phoneVal || !phonePattern.test(phoneVal)) { showToast('Please enter a valid phone number.', 'error'); if (this.phone) this.phone.focus(); return; }
            if (!roleVal) { showToast('Please select your role.', 'error'); if (this.role) this.role.focus(); return; }
            if (!org) { showToast('Please enter your organization.', 'error'); if (this.organization) this.organization.focus(); return; }
            if (!orgPattern.test(org)) { showToast('Organization contains invalid characters.', 'error'); if (this.organization) this.organization.focus(); return; }
            if (rankVal && !rankPattern.test(rankVal)) { showToast('Rank contains invalid characters.', 'error'); if (this.rank) this.rank.focus(); return; }

            var clean = {
                fullName: sanitize(name),
                serviceNo: sanitize(serviceNo),
                email: sanitize(mail),
                phone: sanitize(phoneVal),
                rank: sanitize(rankVal || 'N/A'),
                role: sanitize(roleVal),
                organization: sanitize(org),
                special: sanitize((this.special ? this.special.value.trim() : '') || 'N/A')
            };

            if (this.submitBtn) {
                this.submitBtn.disabled = true;
                this.submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';
            }

            var uniqueId = generateUniqueId();
            var payload = {
                uniqueId: uniqueId,
                fullName: clean.fullName,
                serviceNo: clean.serviceNo,
                email: clean.email,
                phone: clean.phone,
                rank: clean.rank,
                role: clean.role,
                organization: clean.organization,
                special: clean.special,
                registrationDate: new Date().toISOString(),
                verified: false
            };

            fetch(APP_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function() {
                self.showTicket(payload);
                showToast('Registration successful! Check your email.', 'success');
                if (self.form) self.form.reset();
                self.closePopup();
            }).catch(function() {
                self.showTicket(payload);
                showToast('Registered locally. Email will be sent when online.', 'success');
                if (self.form) self.form.reset();
                self.closePopup();
            }).finally(function() {
                if (self.submitBtn) {
                    self.submitBtn.disabled = false;
                    self.submitBtn.innerHTML = '🚀 Register &amp; Get QR';
                }
            });
        }
    };

    // ============================================================
    // MODULE: VERIFICATION (verify.html)
    // ============================================================
    var Verify = {
        init: function() {
            var self = this;
            this.readerEl = document.getElementById('reader');
            this.btnStart = document.getElementById('btnStartScanner');
            this.btnStop = document.getElementById('btnStopScanner');
            this.scanArea = document.getElementById('scanArea');
            this.modeScan = document.getElementById('modeScan');
            this.modeManual = document.getElementById('modeManual');
            this.manualArea = document.getElementById('manualArea');
            this.manualId = document.getElementById('manualId');
            this.btnManualVerify = document.getElementById('btnManualVerify');
            this.resultCard = document.getElementById('resultCard');
            this.statusIcon = document.getElementById('statusIcon');
            this.statusText = document.getElementById('statusText');
            this.resultName = document.getElementById('resultName');
            this.resultServiceNo = document.getElementById('resultServiceNo');
            this.resultId = document.getElementById('resultId');
            this.resultEmail = document.getElementById('resultEmail');
            this.resultOrg = document.getElementById('resultOrg');
            this.resultRole = document.getElementById('resultRole');
            this.btnMarkVerified = document.getElementById('btnMarkVerified');
            this.btnClearResult = document.getElementById('btnClearResult');
            this.installBanner = document.getElementById('installBanner');
            this.installBtn = document.getElementById('installBtn');

            this.html5QrCode = null;
            this.isScanning = false;
            this.currentParticipant = null;
            this.currentId = null;
            this.cachedData = [];

            // Mode toggle
            if (this.modeScan) {
                this.modeScan.addEventListener('click', function() {
                    self.modeScan.classList.add('active');
                    self.modeManual.classList.remove('active');
                    if (self.manualArea) self.manualArea.classList.remove('active');
                    if (self.scanArea) self.scanArea.style.display = 'block';
                    showToast('QR scan mode active', '');
                });
            }
            if (this.modeManual) {
                this.modeManual.addEventListener('click', function() {
                    self.modeManual.classList.add('active');
                    self.modeScan.classList.remove('active');
                    if (self.manualArea) self.manualArea.classList.add('active');
                    if (self.scanArea) self.scanArea.style.display = 'none';
                    if (self.isScanning) self.stopScanner();
                    showToast('Manual entry mode active', '');
                });
            }
            if (this.modeScan) this.modeScan.classList.add('active');

            // Scanner buttons
            if (this.btnStart) {
                this.btnStart.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.startScanner();
                });
            }
            if (this.btnStop) {
                this.btnStop.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.stopScanner();
                });
            }

            // Manual verify
            if (this.btnManualVerify) {
                this.btnManualVerify.addEventListener('click', function(e) {
                    e.preventDefault();
                    var id = self.manualId ? self.manualId.value.trim() : '';
                    if (!id) { showToast('Enter a Unique ID.', 'error'); return; }
                    self.verifyParticipant(id);
                });
            }
            if (this.manualId) {
                this.manualId.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && self.btnManualVerify) self.btnManualVerify.click();
                });
            }

            // Result actions
            if (this.btnMarkVerified) {
                this.btnMarkVerified.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.markAsVerified();
                });
            }
            if (this.btnClearResult) {
                this.btnClearResult.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.clearResult();
                });
            }

            // PWA Install
            var deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                deferredPrompt = e;
                if (self.installBanner) self.installBanner.classList.add('show');
            });
            if (this.installBtn) {
                this.installBtn.addEventListener('click', function() {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then(function(result) {
                            if (result.outcome === 'accepted') {
                                if (self.installBanner) self.installBanner.classList.remove('show');
                                showToast('App installed!', 'success');
                            } else {
                                showToast('Installation cancelled.', '');
                            }
                            deferredPrompt = null;
                        });
                    }
                });
            }
            window.addEventListener('appinstalled', function() {
                if (self.installBanner) self.installBanner.classList.remove('show');
                showToast('✅ App installed! Find it on your home screen.', 'success');
            });

            if (window.location.protocol === 'file:') {
                var manifestLink = document.getElementById('manifestLink');
                if (manifestLink) manifestLink.remove();
            }

            console.log('✅ NACWS Verify loaded.');
        },

        startScanner: function() {
            var self = this;
            if (this.isScanning) return;
            if (!this.html5QrCode) {
                this.html5QrCode = new Html5Qrcode('reader');
            }
            var config = { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
            this.html5QrCode.start({ facingMode: 'environment' }, config,
                function(decodedText) { self.onScanSuccess(decodedText); },
                function(err) { /* silent */ }
            ).then(function() {
                self.isScanning = true;
                if (self.scanArea) self.scanArea.classList.add('scanning-active');
                if (self.btnStart) {
                    self.btnStart.textContent = '⏳ Scanning...';
                    self.btnStart.disabled = true;
                }
                showToast('Camera started. Point at a QR code.', '');
            }).catch(function(err) {
                console.error('Scanner start error:', err);
                showToast('Could not access camera. Please check permissions.', 'error');
                if (self.btnStart) {
                    self.btnStart.disabled = false;
                    self.btnStart.textContent = '▶ Start Camera';
                }
            });
        },

        stopScanner: function() {
            var self = this;
            if (!this.html5QrCode || !this.isScanning) return;
            this.html5QrCode.stop().then(function() {
                self.isScanning = false;
                if (self.scanArea) self.scanArea.classList.remove('scanning-active');
                if (self.btnStart) {
                    self.btnStart.textContent = '▶ Start Camera';
                    self.btnStart.disabled = false;
                }
                showToast('Camera stopped.', '');
            }).catch(function(err) {
                console.error('Stop error:', err);
            });
        },

        onScanSuccess: function(decodedText) {
            try {
                var data = JSON.parse(decodedText);
                if (data.id) this.verifyParticipant(data.id);
                else showToast('Invalid QR format.', 'error');
            } catch (e) {
                if (decodedText && decodedText.startsWith('NACWS-')) this.verifyParticipant(decodedText);
                else showToast('Invalid QR code.', 'error');
            }
        },

        fetchAllData: function() {
            var self = this;
            return fetch(APP_SCRIPT_URL + '?action=all')
                .then(function(response) {
                    if (!response.ok) throw new Error('Network error');
                    return response.json();
                })
                .then(function(data) {
                    if (Array.isArray(data)) {
                        self.cachedData = data;
                        return data;
                    }
                    throw new Error('Unexpected response');
                })
                .catch(function(err) {
                    console.error('Fetch error:', err);
                    showToast('Could not load participant data.', 'error');
                    return [];
                });
        },

        verifyParticipant: function(id) {
            var self = this;
            if (!id || !id.trim()) { showToast('Enter a valid ID.', 'error'); return; }
            this.currentId = id.trim();
            if (this.resultCard) {
                this.resultCard.classList.add('show');
                if (this.statusIcon) this.statusIcon.textContent = '⏳';
                if (this.statusText) {
                    this.statusText.textContent = 'Searching...';
                    this.statusText.className = 'status-text';
                }
                if (this.resultName) this.resultName.textContent = '—';
                if (this.resultServiceNo) this.resultServiceNo.textContent = '—';
                if (this.resultId) this.resultId.textContent = this.currentId;
                if (this.resultEmail) this.resultEmail.textContent = '—';
                if (this.resultOrg) this.resultOrg.textContent = '—';
                if (this.resultRole) this.resultRole.textContent = '—';
                if (this.btnMarkVerified) {
                    this.btnMarkVerified.disabled = true;
                    this.btnMarkVerified.innerHTML = '⏳ Searching...';
                }
            }

            this.fetchAllData().then(function(allData) {
                if (!allData || allData.length === 0) {
                    if (self.statusIcon) self.statusIcon.textContent = '⚠️';
                    if (self.statusText) {
                        self.statusText.textContent = 'No Data';
                        self.statusText.className = 'status-text not-found';
                    }
                    if (self.btnMarkVerified) {
                        self.btnMarkVerified.disabled = true;
                        self.btnMarkVerified.innerHTML = '⚠️ No Data';
                    }
                    showToast('Could not retrieve registration data.', 'error');
                    return;
                }
                var participant = allData.find(function(row) { return row.UniqueID === self.currentId; });
                if (participant) {
                    self.currentParticipant = participant;
                    self.displayResult(participant);
                } else {
                    if (self.statusIcon) self.statusIcon.textContent = '❌';
                    if (self.statusText) {
                        self.statusText.textContent = 'Not Found';
                        self.statusText.className = 'status-text not-found';
                    }
                    if (self.resultName) self.resultName.textContent = '—';
                    if (self.resultServiceNo) self.resultServiceNo.textContent = '—';
                    if (self.resultId) self.resultId.textContent = self.currentId;
                    if (self.resultEmail) self.resultEmail.textContent = '—';
                    if (self.resultOrg) self.resultOrg.textContent = '—';
                    if (self.resultRole) self.resultRole.textContent = '—';
                    if (self.btnMarkVerified) {
                        self.btnMarkVerified.disabled = true;
                        self.btnMarkVerified.innerHTML = '❌ Not Registered';
                    }
                    showToast('Participant not found. Please check the ID.', 'error');
                }
            });
        },

        displayResult: function(participant) {
            var isVerified = participant.Verified === true || participant.Verified === 'TRUE';
            if (this.statusIcon) this.statusIcon.textContent = isVerified ? '✅' : '⏳';
            if (this.statusText) {
                this.statusText.textContent = isVerified ? 'Already Verified' : 'Not Yet Verified';
                this.statusText.className = 'status-text ' + (isVerified ? 'verified' : 'unverified');
            }
            if (this.resultName) this.resultName.textContent = participant.FullName || '—';
            if (this.resultServiceNo) this.resultServiceNo.textContent = participant.ServiceNo || '—';
            if (this.resultId) this.resultId.textContent = participant.UniqueID || '—';
            if (this.resultEmail) this.resultEmail.textContent = participant.Email || '—';
            if (this.resultOrg) this.resultOrg.textContent = participant.Organization || '—';
            if (this.resultRole) this.resultRole.textContent = participant.Role || '—';
            if (this.btnMarkVerified) {
                this.btnMarkVerified.disabled = isVerified;
                this.btnMarkVerified.innerHTML = isVerified ? '✅ Already Verified' : '✅ Mark as Verified Attendace';
            }
            if (this.resultCard) this.resultCard.classList.add('show');
        },

        markAsVerified: function() {
            var self = this;
            if (!this.currentParticipant || !this.currentId) return;
            if (this.currentParticipant.Verified === true || this.currentParticipant.Verified === 'TRUE') {
                showToast('Already verified.', '');
                return;
            }
            if (this.btnMarkVerified) {
                this.btnMarkVerified.disabled = true;
                this.btnMarkVerified.innerHTML = '<span class="spinner"></span> Updating...';
            }
            var url = APP_SCRIPT_URL + '?action=verify&id=' + encodeURIComponent(this.currentId);
            fetch(url)
                .then(function(response) { return response.json(); })
                .then(function(result) {
                    if (result.success) {
                        self.currentParticipant.Verified = true;
                        self.displayResult(self.currentParticipant);
                        showToast('✅ Verified successfully!', 'success');
                    } else {
                        showToast('Verification failed: ' + (result.error || 'Unknown'), 'error');
                    }
                })
                .catch(function(err) {
                    console.error('Mark verified error:', err);
                    showToast('Could not connect to the server.', 'error');
                })
                .finally(function() {
                    if (self.btnMarkVerified) {
                        self.btnMarkVerified.disabled = false;
                        self.btnMarkVerified.innerHTML = '✅ Mark as Verified Attendance';
                    }
                });
        },

        clearResult: function() {
            if (this.resultCard) this.resultCard.classList.remove('show');
            this.currentParticipant = null;
            this.currentId = null;
            if (this.btnMarkVerified) {
                this.btnMarkVerified.disabled = false;
                this.btnMarkVerified.innerHTML = '✅ Mark as Verified Attendance';
            }
            if (this.manualId) this.manualId.value = '';
        }
    };

    // ============================================================
    // MODULE: ADMIN (admin.html)
    // ============================================================
    var Admin = {
        allData: [],

        init: function() {
            var self = this;
            this.searchInput = document.getElementById('searchInput');
            this.filterVerified = document.getElementById('filterVerified');
            this.tableBody = document.getElementById('adminTableBody');

            if (this.searchInput) {
                this.searchInput.addEventListener('input', function() { self.renderTable(); });
            }
            if (this.filterVerified) {
                this.filterVerified.addEventListener('change', function() { self.renderTable(); });
            }

            this.loadData();
        },

        loadData: function() {
            var self = this;
            if (this.tableBody) {
                this.tableBody.innerHTML = '<tr><td colspan="10" class="loading">⏳ Loading...</td></tr>';
            }
            fetch(APP_SCRIPT_URL + '?action=all')
                .then(function(response) {
                    if (!response.ok) throw new Error('Network error');
                    return response.json();
                })
                .then(function(data) {
                    if (Array.isArray(data)) {
                        self.allData = data;
                        self.renderTable();
                        self.updateStats(data);
                    } else {
                        throw new Error('Invalid data');
                    }
                })
                .catch(function(err) {
                    console.error('Load data error:', err);
                    if (self.tableBody) {
                        self.tableBody.innerHTML = '<tr><td colspan="10" class="loading">❌ Error loading data.</td></tr>';
                    }
                    showToast('Could not load data.', 'error');
                });
        },

        renderTable: function() {
            var search = this.searchInput ? this.searchInput.value.toLowerCase() : '';
            var filter = this.filterVerified ? this.filterVerified.value : '';

            var filtered = this.allData.filter(function(row) {
                var match = true;
                if (search) {
                    match = (row.FullName && row.FullName.toLowerCase().includes(search)) ||
                        (row.Email && row.Email.toLowerCase().includes(search)) ||
                        (row.UniqueID && row.UniqueID.toLowerCase().includes(search)) ||
                        (row.ServiceNo && row.ServiceNo.toLowerCase().includes(search));
                }
                if (match && filter !== '') {
                    var isVerified = row.Verified === true || row.Verified === 'TRUE';
                    match = (filter === 'true') === isVerified;
                }
                return match;
            });

            if (!this.tableBody) return;
            if (filtered.length === 0) {
                this.tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:#6b6560;">No registrations found.</td></tr>';
                return;
            }

            var html = '';
            filtered.forEach(function(row) {
                var verified = row.Verified === true || row.Verified === 'TRUE';
                var date = row.RegistrationDate ? new Date(row.RegistrationDate).toLocaleDateString() : '—';
                html += '<tr>' +
                    '<td><strong>' + (row.UniqueID || '—') + '</strong></td>' +
                    '<td>' + (row.ServiceNo || '—') + '</td>' +
                    '<td>' + (row.Rank || '—') + '</td>' +
                    '<td>' + (row.FullName || '—') + '</td>' +
                    '<td>' + (row.Email || '—') + '</td>' +
                    '<td>' + (row.Phone || '—') + '</td>' +
                    '<td>' + (row.Organization || '—') + '</td>' +
                    '<td>' + (row.Role || '—') + '</td>' +
                    '<td>' + date + '</td>' +
                    '<td><span class="verified-badge ' + (verified ? 'verified-yes' : 'verified-no') + '">' + (verified ? '✅ Verified Attendance' : '⏳ Pending') + '</span></td>' +
                    '</tr>';
            });
            this.tableBody.innerHTML = html;
        },

        updateStats: function(data) {
            var total = data.length;
            var verified = data.filter(function(r) { return r.Verified === true || r.Verified === 'TRUE'; }).length;
            var totalEl = document.getElementById('totalCount');
            var verifiedEl = document.getElementById('verifiedCount');
            var unverifiedEl = document.getElementById('unverifiedCount');
            if (totalEl) totalEl.textContent = total;
            if (verifiedEl) verifiedEl.textContent = verified;
            if (unverifiedEl) unverifiedEl.textContent = total - verified;
        },

        exportCSV: function() {
            if (this.allData.length === 0) {
                showToast('No data to export.', 'error');
                return;
            }
            var headers = ['UniqueID', 'ServiceNo', 'Rank', 'FullName', 'Email', 'Phone', 'Organization', 'Role', 'RegistrationDate', 'Verified'];
            var rows = this.allData.map(function(row) {
                return [
                    row.UniqueID,
                    row.ServiceNo,
                    row.Rank,
                    row.FullName,
                    row.Email,
                    row.Phone,
                    row.Organization,
                    row.Role,
                    row.RegistrationDate,
                    (row.Verified === true || row.Verified === 'TRUE') ? 'Yes' : 'No'
                ];
            });
            var csv = headers.join(',') + '\n';
            rows.forEach(function(row) {
                csv += row.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',') + '\n';
            });
            var blob = new Blob([csv], { type: 'text/csv' });
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'NACWS_Registrations_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('CSV exported!', 'success');
        }
    };

    // ============================================================
    // EXPOSE MODULES
    // ============================================================
    window.NACWS = {
        registration: Registration,
        verify: Verify,
        admin: Admin
    };

    // Auto‑init registration on index page
    if (document.getElementById('regForm')) {
        document.addEventListener('DOMContentLoaded', function() {
            NACWS.registration.init();
        });
    }

})();
