
/**
 * NACWS SECURE v2.5 
 */
(function() {
  'use strict';
  const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymwT9T38THRaWT56uhYXLFGijYZYzKoLwzS-Mhh0IQLmJAu056_LVCP3NBUgL27nQoWw/exec';
  let toastTimer = null;

  function showToast(msg, type) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    toast.className = 'toast show' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
    toastMsg.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> toast.classList.remove('show'), 4000);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  async function getClientIP() {
    try {
      const cached = sessionStorage.getItem('client_ip');
      if (cached) return cached;
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      if (data.ip) {
        sessionStorage.setItem('client_ip', data.ip);
        return data.ip;
      }
    } catch(e) {}
    return 'unknown';
  }

  async function generateUniqueIdSecure() {
    const prefix = 'NACWS';
    const now = new Date();
    const ts = now.getFullYear().toString().slice(2) +
      String(now.getMonth()+1).padStart(2,'0') +
      String(now.getDate()).padStart(2,'0') +
      String(now.getHours()).padStart(2,'0') +
      String(now.getMinutes()).padStart(2,'0') +
      String(now.getSeconds()).padStart(2,'0');
    let rand = '';
    if (window.crypto && crypto.getRandomValues) {
      const arr = new Uint8Array(4);
      crypto.getRandomValues(arr);
      rand = Array.from(arr).map(b=>b.toString(36).toUpperCase()).join('').slice(0,6);
    } else {
      rand = Math.random().toString(36).substring(2,8).toUpperCase();
    }
    return `${prefix}-${ts}-${rand}`;
  }

  function sanitize(str) {
    if (!str) return '';
    return String(str).replace(/[<>\"'&]/g,'').trim().slice(0,500);
  }

  const clientLimiter = {
    map: new Map(),
    check(key, limit=5, windowMs=60000) {
      const now = Date.now();
      const entry = this.map.get(key) || {count:0, start:now};
      if (now - entry.start > windowMs) { entry.count=0; entry.start=now; }
      entry.count++;
      this.map.set(key, entry);
      return entry.count <= limit;
    }
  };

  // NO-PREFLIGHT FETCH - critical fix for GAS CORS
  async function secureFetch(url, opts={}) {
    const method = (opts.method || 'GET').toUpperCase();
    try {
      let res;
      if (method === 'GET') {
        // GET must have NO custom headers at all to stay simple
        res = await fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow', cache: 'no-cache' });
      } else {
        // POST must use text/plain exactly (no charset) to stay simple
        res = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain' },
          body: opts.body
        });
      }
      const text = await res.text();
      try { return JSON.parse(text); } 
      catch(e) { 
        console.error('Invalid JSON:', text.slice(0,500));
        return {success:false, error:'Invalid server response'}; 
      }
    } catch(err) {
      console.error('Fetch failed', err);
      throw err;
    }
  }

  var Registration = {
    init: function() {
      var self=this;
      this.fullName=document.getElementById('fullName');
      this.serviceNo=document.getElementById('serviceNo');
      this.email=document.getElementById('email');
      this.phone=document.getElementById('phone');
      this.rank=document.getElementById('rank');
      this.role=document.getElementById('role');
      this.organization=document.getElementById('organization');
      this.special=document.getElementById('special');
      this.submitBtn=document.getElementById('submitBtn');
      this.form=document.getElementById('regForm');
      this.popup=document.getElementById('registerPopup');
      this.popupClose=document.getElementById('popupCloseBtn');
      this.popupCancel=document.getElementById('popupCancelBtn');
      this.confirmModal=document.getElementById('confirmModal');
      this.modalClose=document.getElementById('modalCloseBtn');
      this.modalClose2=document.getElementById('modalCloseBtn2');
      this.cardRank=document.getElementById('cardRank');
      this.cardName=document.getElementById('cardName');
      this.cardServiceNo=document.getElementById('cardServiceNo');
      this.cardRole=document.getElementById('cardRole');
      this.cardId=document.getElementById('cardId');
      this.cardEmail=document.getElementById('cardEmail');
      this.cardOrg=document.getElementById('cardOrg');
      this.cardTicketId=document.getElementById('cardTicketId');
      this.qrContainer=document.getElementById('qrcode-card');
      this.downloadBtn=document.getElementById('downloadCardBtn');
      this.retrieveBtn=document.getElementById('retrievePassBtn');
      this.currentParticipant=null;
      if(this.retrieveBtn) this.retrieveBtn.addEventListener('click', ()=>self.handleRetrieveTicket());
      document.querySelectorAll('#navRegisterBtn, #heroRegisterBtn, #bannerRegisterBtn, #footerRegisterBtn').forEach(el=>{ if(el) el.addEventListener('click', e=>{e.preventDefault(); self.openPopup();}); });
      if(this.popupClose) this.popupClose.addEventListener('click', ()=>self.closePopup());
      if(this.popupCancel) this.popupCancel.addEventListener('click', ()=>self.closePopup());
      if(this.popup) this.popup.addEventListener('click', e=>{ if(e.target===self.popup) self.closePopup(); });
      if(this.modalClose) this.modalClose.addEventListener('click', ()=>self.closeConfirm());
      if(this.modalClose2) this.modalClose2.addEventListener('click', ()=>self.closeConfirm());
      if(this.confirmModal) this.confirmModal.addEventListener('click', e=>{ if(e.target===self.confirmModal) self.closeConfirm(); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if(self.confirmModal?.classList.contains('active')) self.closeConfirm(); if(self.popup?.classList.contains('active')) self.closePopup(); }});
      if(this.form) this.form.addEventListener('submit', e=>self.handleSubmit(e));
      if(this.downloadBtn) this.downloadBtn.addEventListener('click', ()=>self.downloadTicket());
      this.initGallery();
    },
    openPopup(){ if(this.popup){ this.popup.classList.add('active'); document.body.style.overflow='hidden'; }},
    closePopup(){ if(this.popup){ this.popup.classList.remove('active'); document.body.style.overflow=''; }},
    openConfirm(){ if(this.confirmModal){ this.confirmModal.classList.add('active'); document.body.style.overflow='hidden'; }},
    closeConfirm(){ if(this.confirmModal){ this.confirmModal.classList.remove('active'); document.body.style.overflow=''; }},
    generateQR(data){
      if(!this.qrContainer) return;
      this.qrContainer.innerHTML='';
      this.qrContainer.style.width='120px'; this.qrContainer.style.height='120px';
      try{ new QRCode(this.qrContainer, {text:data, width:120, height:120, colorDark:'#07472d', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H}); }
      catch(e){ this.qrContainer.innerHTML='<p style="color:red">QR error</p>'; }
    },
    showTicket(participant){
      this.currentParticipant=participant;
      var formattedRank = (participant.rank && participant.rank!=='N/A') ? participant.rank.trim()+' ' : '';
      if(this.cardRank) this.cardRank.textContent=formattedRank;
      if(this.cardName) this.cardName.textContent=participant.fullName||'';
      if(this.cardServiceNo) this.cardServiceNo.textContent=participant.serviceNo||'N/A';
      if(this.cardRole) this.cardRole.textContent=participant.role||'N/A';
      if(this.cardId) this.cardId.textContent=participant.uniqueId;
      if(this.cardEmail) this.cardEmail.textContent=participant.email;
      if(this.cardOrg) this.cardOrg.textContent=participant.organization||'N/A';
      if(this.cardTicketId) this.cardTicketId.textContent=participant.uniqueId;
      var qrPayload = JSON.stringify({id: participant.uniqueId, sig: participant.hmac || participant.HMAC || ''});
      var self=this;
      setTimeout(()=>self.generateQR(qrPayload),200);
      this.openConfirm();
    },
    downloadTicket(){
      var self=this;
      var participant=this.currentParticipant;
      if(!participant){ showToast('No participant','error'); return; }
      var compact=document.getElementById('compactTicket');
      if(!compact){ showToast('Ticket template missing','error'); return; }
      var rankEl=document.getElementById('compactRank');
      var nameEl=document.getElementById('compactName');
      var svcNoEl=document.getElementById('compactSvcNo');
      var orgEl=document.getElementById('compactOrg');
      var idEl=document.getElementById('compactId');
      var roleEl=document.getElementById('compactRole');
      var formattedRank=(participant.rank && participant.rank!=='N/A')?participant.rank.trim()+' ':'';
      if(rankEl) rankEl.textContent=formattedRank;
      if(nameEl) nameEl.textContent=participant.fullName||'—';
      if(svcNoEl) svcNoEl.textContent=participant.serviceNo||'—';
      if(orgEl) orgEl.textContent=participant.organization||'—';
      if(idEl) idEl.textContent=participant.uniqueId||'—';
      if(roleEl) roleEl.textContent=participant.role||'—';
      var qrContainer=document.getElementById('qrcode-compact');
      if(qrContainer){
        qrContainer.innerHTML='';
        var qrPayload=JSON.stringify({id:participant.uniqueId||'', sig:participant.hmac||participant.HMAC||''});
        try{ new QRCode(qrContainer,{text:qrPayload,width:130,height:130,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.L}); }catch(e){}
      }
      compact.style.display='block'; compact.style.position='absolute'; compact.style.left='-9999px'; compact.style.top='0'; compact.style.width='350px';
      if(self.downloadBtn){ self.downloadBtn.disabled=true; self.downloadBtn.innerHTML='<span class="spinner"></span> Generating…'; }
      var card=compact.querySelector('.ticket')||compact;
      card.style.overflow='visible'; card.style.height='auto'; card.style.maxHeight='none';
      requestAnimationFrame(()=>{ setTimeout(()=>{
        html2canvas(card,{scale:2.5,useCORS:true,backgroundColor:'#0f281b',logging:false}).then(canvas=>{
          var link=document.createElement('a');
          link.download='NACWS-Ticket-'+(participant.uniqueId||'Ticket')+'.png';
          link.href=canvas.toDataURL('image/png'); link.click();
          showToast('Ticket downloaded!','success');
        }).catch(err=>{ showToast('Failed to generate','error'); }).finally(()=>{ compact.style.display='none'; if(self.downloadBtn){ self.downloadBtn.disabled=false; self.downloadBtn.innerHTML='⬇️ Download Ticket'; }});
      },200);});
    },
    async handleRetrieveTicket(){
      if(!clientLimiter.check('retrieve',3,60000)){ showToast('Too many attempts. Wait 1 min','error'); return; }
      var email = prompt("Enter your registered email:");
      if(!email) return;
      email=email.trim();
      var proof = prompt("For verification, enter last 4 digits of your phone:");
      if(proof===null) return;
      proof=proof.trim();
      showToast('Searching...','');
      try{
        var url = APP_SCRIPT_URL + '?action=find&q=' + encodeURIComponent(email) + '&proof=' + encodeURIComponent(proof);
        var data = await secureFetch(url);
        if(data.success===false || !data.UniqueID){ showToast('No participant found or proof mismatch','error'); return; }
        this.showTicket({uniqueId:data.UniqueID, fullName:data.FullName, serviceNo:data.ServiceNo, email:data.Email, rank:data.Rank, role:data.Role, organization:data.Organization, hmac:data.HMAC});
        showToast('Pass retrieved!','success');
      }catch(err){ showToast('Unable to reach server','error'); }
    },
    async handleSubmit(e){
      e.preventDefault();
      var self=this;
      var name=this.fullName?this.fullName.value.trim():'';
      var serviceNo=this.serviceNo?this.serviceNo.value.trim():'';
      var mail=this.email?this.email.value.trim():'';
      var phoneVal=this.phone?this.phone.value.trim():'';
      var roleVal=this.role?this.role.value.trim():'';
      var org=this.organization?this.organization.value.trim():'';
      var rankVal=this.rank?this.rank.value.trim():'';
      var specialVal=this.special?this.special.value.trim():'';
      var namePattern=/^[a-zA-Z\s\-\.' ]{2,100}$/;
      var servicePattern=/^[a-zA-Z0-9()\/\-]{0,50}$/;
      var emailPattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      var phonePattern=/^\+?[0-9\s\-\(\)]{7,20}$/;
      var orgPattern=/^[a-zA-Z0-9\s\-\.,\(\)]{2,150}$/;
      if(!name || !namePattern.test(name)){ showToast('Invalid full name','error'); return; }
      if(serviceNo && !servicePattern.test(serviceNo)){ showToast('Invalid service number','error'); return; }
      if(!mail || !emailPattern.test(mail)){ showToast('Invalid email','error'); return; }
      if(!phoneVal || !phonePattern.test(phoneVal)){ showToast('Invalid phone','error'); return; }
      if(!roleVal){ showToast('Select role','error'); return; }
      if(!org || !orgPattern.test(org)){ showToast('Invalid organization','error'); return; }
      if(!clientLimiter.check('register_'+mail,2,60000)){ showToast('Too many tries. Wait','error'); return; }
      var clean={fullName:sanitize(name), serviceNo:sanitize(serviceNo||'N/A'), email:sanitize(mail).toLowerCase(), phone:sanitize(phoneVal), rank:sanitize(rankVal||'N/A'), role:sanitize(roleVal), organization:sanitize(org), special:sanitize(specialVal||'N/A')};
      if(this.submitBtn){ this.submitBtn.disabled=true; this.submitBtn.innerHTML='<span class="spinner"></span> Checking…'; }
      try{
        var checkUrl = APP_SCRIPT_URL + '?action=check&email='+encodeURIComponent(clean.email)+'&serviceNo='+encodeURIComponent(clean.serviceNo);
        var checkData = await secureFetch(checkUrl);
        if(checkData.duplicate){ showToast('Email or Service No already registered','error'); return; }
        await self.processRegistration(clean);
      }catch(err){ showToast('Could not verify duplicate: '+err.message,'error'); }
      finally{ if(self.submitBtn){ self.submitBtn.disabled=false; self.submitBtn.innerHTML='Submit Now'; } }
    },
    async processRegistration(clean){
      var self=this;
      var uniqueId = await generateUniqueIdSecure();
      const clientIP = await getClientIP();
      var payload={uniqueId, fullName:clean.fullName, serviceNo:clean.serviceNo, email:clean.email, phone:clean.phone, rank:clean.rank, role:clean.role, organization:clean.organization, special:clean.special, registrationDate:new Date().toISOString(), clientIP:clientIP, userAgent:navigator.userAgent};
      try{
        const res = await fetch(APP_SCRIPT_URL, {method:'POST', mode:'cors', redirect:'follow', headers:{'Content-Type':'text/plain'}, body:JSON.stringify(payload)});
        const txt = await res.text();
        let data; try{ data = JSON.parse(txt); } catch(e){ data = {success:false, error:'Bad response '+txt.slice(0,200)}; }
        if(data.success===false){ showToast(data.error||'Registration failed','error'); return; }
        var finalParticipant = {...payload, hmac:data.hmac||'', uniqueId:data.id||uniqueId};
        self.showTicket(finalParticipant);
        showToast('Registration successful!','success');
        if(self.form) self.form.reset();
        self.closePopup();
      }catch(err){
        console.error(err);
        showToast('Network error: '+err.message,'error');
      }
    },
    initGallery(){
      const track=document.getElementById('galleryTrack');
      const prevBtn=document.getElementById('prevBtn');
      const nextBtn=document.getElementById('nextBtn');
      const dotsContainer=document.getElementById('galleryDots');
      const slider=document.getElementById('gallerySlider');
      if(!track||!prevBtn||!nextBtn||!dotsContainer||!slider) return;
      const slides=Array.from(track.children);
      const slideCount=slides.length;
      let currentIndex=0; let autoPlayInterval; const autoPlayTime=4000;
      dotsContainer.innerHTML='';
      slides.forEach((_,i)=>{
        const dot=document.createElement('button');
        dot.classList.add('gallery-dot'); dot.setAttribute('aria-label',`Go to slide ${i+1}`);
        if(i===0) dot.classList.add('active');
        dot.addEventListener('click',()=>goToSlide(i));
        dotsContainer.appendChild(dot);
      });
      const dots=dotsContainer.querySelectorAll('.gallery-dot');
      function updateSlider(){ track.style.transform=`translateX(-${currentIndex*100}%)`; dots.forEach((d,idx)=>d.classList.toggle('active',idx===currentIndex)); }
      function goToSlide(idx){ currentIndex=(idx+slideCount)%slideCount; updateSlider(); resetAutoPlay(); }
      function nextSlide(){ goToSlide(currentIndex+1); } function prevSlide(){ goToSlide(currentIndex-1); }
      function startAutoPlay(){ autoPlayInterval=setInterval(nextSlide,autoPlayTime); }
      function resetAutoPlay(){ clearInterval(autoPlayInterval); startAutoPlay(); }
      nextBtn.addEventListener('click', nextSlide); prevBtn.addEventListener('click', prevSlide);
      slider.addEventListener('mouseenter', ()=>clearInterval(autoPlayInterval));
      slider.addEventListener('mouseleave', startAutoPlay);
      updateSlider(); startAutoPlay();
    }
  };

  var Verify={
    html5QrCode:null, isScanning:false, currentId:null, currentParticipant:null,
    init:function(){
      var self=this;
      this.scanArea=document.getElementById('scanArea');
      this.reader=document.getElementById('reader');
      this.btnStart=document.getElementById('btnStartScanner');
      this.btnStop=document.getElementById('btnStopScanner');
      this.manualArea=document.getElementById('manualArea');
      this.manualId=document.getElementById('manualId');
      this.btnManualVerify=document.getElementById('btnManualVerify');
      this.resultCard=document.getElementById('resultCard');
      this.statusIcon=document.getElementById('statusIcon');
      this.statusText=document.getElementById('statusText');
      this.resultName=document.getElementById('resultName');
      this.resultId=document.getElementById('resultId');
      this.resultEmail=document.getElementById('resultEmail');
      this.resultOrg=document.getElementById('resultOrg');
      this.resultServiceNo=document.getElementById('resultServiceNo');
      this.resultRole=document.getElementById('resultRole');
      this.btnMarkVerified=document.getElementById('btnMarkVerified');
      this.btnClearResult=document.getElementById('btnClearResult');
      this.modeScan=document.getElementById('modeScan');
      this.modeManual=document.getElementById('modeManual');
      const token=localStorage.getItem('adminToken');
      const email=localStorage.getItem('adminEmail');
      if(!token || !email){ showToast('Admin login required','error'); setTimeout(()=>{ window.location.href='admin.html'; },1500); return; }
      if(this.btnStart) this.btnStart.addEventListener('click', ()=>self.startScanner());
      if(this.btnStop) this.btnStop.addEventListener('click', ()=>self.stopScanner());
      if(this.btnManualVerify) this.btnManualVerify.addEventListener('click', ()=>{ const id=self.manualId.value.trim(); if(id) self.verifyParticipantSecure(id,''); });
      if(this.btnClearResult) this.btnClearResult.addEventListener('click', ()=>self.clearResult());
      if(this.btnMarkVerified) this.btnMarkVerified.addEventListener('click', ()=>self.markVerified());
      if(this.modeScan) this.modeScan.addEventListener('click', ()=>self.setMode('scan'));
      if(this.modeManual) this.modeManual.addEventListener('click', ()=>self.setMode('manual'));
      this.setMode('scan');
    },
    setMode:function(mode){
      if(mode==='scan'){ this.scanArea.style.display='block'; this.manualArea.style.display='none'; this.manualArea.classList.remove('active'); if(this.modeScan) this.modeScan.classList.add('active'); if(this.modeManual) this.modeManual.classList.remove('active'); }
      else{ this.scanArea.style.display='none'; this.manualArea.style.display='block'; this.manualArea.classList.add('active'); if(this.modeManual) this.modeManual.classList.add('active'); if(this.modeScan) this.modeScan.classList.remove('active'); if(this.isScanning) this.stopScanner(); }
    },
    startScanner:function(){
      var self=this;
      if(this.isScanning) return;
      if(!this.html5QrCode) this.html5QrCode=new Html5Qrcode('reader');
      var config={fps:15, qrbox:{width:250,height:250}, aspectRatio:1.0};
      this.html5QrCode.start({facingMode:'environment'}, config, (decoded)=>self.onScanSuccess(decoded), ()=>{}).then(()=>{
        self.isScanning=true; if(self.scanArea) self.scanArea.classList.add('scanning-active');
        if(self.btnStart){ self.btnStart.textContent='⏳ Scanning...'; self.btnStart.disabled=true; }
        showToast('Camera started','');
      }).catch(err=>{ showToast('Camera error','error'); });
    },
    stopScanner:function(){
      var self=this;
      if(!this.html5QrCode||!this.isScanning) return;
      this.html5QrCode.stop().then(()=>{ self.isScanning=false; if(self.scanArea) self.scanArea.classList.remove('scanning-active'); if(self.btnStart){ self.btnStart.textContent='▶ Start Camera'; self.btnStart.disabled=false; } });
    },
    onScanSuccess:function(decodedText){
      var scannedId=''; var scannedSig='';
      if(!decodedText){ showToast('Empty QR','error'); return; }
      try{
        var parsed=JSON.parse(decodedText);
        if(parsed && parsed.id){ scannedId=String(parsed.id).trim(); scannedSig=String(parsed.sig||'').trim(); }
        else if(typeof parsed==='string'){ scannedId=parsed.trim(); }
      }catch(e){ scannedId=String(decodedText).trim(); }
      if(scannedId){ if(this.isScanning) this.stopScanner(); showToast('QR captured','success'); this.verifyParticipantSecure(scannedId, scannedSig); } else { showToast('Invalid QR','error'); }
    },
    async verifyParticipantSecure(id, sig){
      var self=this;
      if(!id.trim()){ showToast('Enter valid ID','error'); return; }
      this.currentId=id.trim();
      if(this.resultCard){
        this.resultCard.classList.add('show');
        if(this.statusIcon) this.statusIcon.textContent='⏳';
        if(this.statusText){ this.statusText.textContent='Searching...'; this.statusText.className='status-text'; }
        if(this.resultName) this.resultName.textContent='—';
        if(this.resultId) this.resultId.textContent=this.currentId;
        if(this.btnMarkVerified){ this.btnMarkVerified.disabled=true; this.btnMarkVerified.innerHTML='⏳ Searching...'; }
      }
      try{
        let url = APP_SCRIPT_URL + '?action=get&id='+encodeURIComponent(this.currentId);
        if(sig) url += '&sig='+encodeURIComponent(sig);
        const data = await secureFetch(url);
        if(data.success===false){ self.showNotFound(); return; }
        self.currentParticipant=data;
        self.displayResult(data);
      }catch(err){ showToast('Could not fetch','error'); }
    },
    showNotFound:function(){
      if(this.statusIcon) this.statusIcon.textContent='❌';
      if(this.statusText){ this.statusText.textContent='Not Found'; this.statusText.className='status-text not-found'; }
      if(this.btnMarkVerified){ this.btnMarkVerified.disabled=true; this.btnMarkVerified.innerHTML='❌ Not Registered'; }
      showToast('Not found','error');
    },
    displayResult:function(p){
      var isVerified=p.Verified===true||p.Verified==='TRUE';
      if(this.statusIcon) this.statusIcon.textContent=isVerified?'✅':'⏳';
      if(this.statusText){ this.statusText.textContent=isVerified?'Already Verified':'Not Yet Verified'; this.statusText.className='status-text '+(isVerified?'verified':'unverified'); }
      if(this.resultName) this.resultName.textContent=p.FullName||'—';
      if(this.resultServiceNo) this.resultServiceNo.textContent=p.ServiceNo||'—';
      if(this.resultId) this.resultId.textContent=p.UniqueID||this.currentId;
      if(this.resultEmail) this.resultEmail.textContent=p.Email||'—';
      if(this.resultOrg) this.resultOrg.textContent=p.Organization||'—';
      if(this.resultRole) this.resultRole.textContent=p.Role||'—';
      if(this.btnMarkVerified){
        if(isVerified){ this.btnMarkVerified.disabled=true; this.btnMarkVerified.innerHTML='✅ Already Verified'; }
        else{ this.btnMarkVerified.disabled=false; this.btnMarkVerified.innerHTML='✅ Mark as Verified'; }
      }
    },
    async markVerified(){
      var self=this;
      if(!this.currentId){ showToast('No participant','error'); return; }
      const token=localStorage.getItem('adminToken');
      const email=localStorage.getItem('adminEmail');
      if(!token||!email){ showToast('Login required','error'); return; }
      if(this.btnMarkVerified){ this.btnMarkVerified.disabled=true; this.btnMarkVerified.innerHTML='⏳ Verifying…'; }
      try{
        var url = APP_SCRIPT_URL + '?action=verify&id='+encodeURIComponent(this.currentId)+'&email='+encodeURIComponent(email)+'&token='+encodeURIComponent(token);
        const data = await secureFetch(url);
        if(data.success){ showToast('Verified!','success'); if(self.statusIcon) self.statusIcon.textContent='✅'; if(self.statusText){ self.statusText.textContent='Verified'; self.statusText.className='status-text verified'; } self.btnMarkVerified.innerHTML='✅ Verified'; }
        else{ showToast(data.error||'Failed','error'); if(self.btnMarkVerified){ self.btnMarkVerified.disabled=false; self.btnMarkVerified.innerHTML='✅ Mark as Verified'; } }
      }catch(err){ showToast('Network error','error'); if(self.btnMarkVerified){ self.btnMarkVerified.disabled=false; self.btnMarkVerified.innerHTML='✅ Mark as Verified'; } }
    },
    clearResult(){ if(this.resultCard) this.resultCard.classList.remove('show'); this.currentId=null; this.currentParticipant=null; }
  };

  var Admin={
    sessionToken:null, adminEmail:null, allData:[],
    init:function(){
      var self=this;
      this.loginOverlay=document.getElementById('adminLoginOverlay');
      this.dashboard=document.getElementById('adminDashboard');
      this.loginForm=document.getElementById('adminLoginForm');
      this.loginError=document.getElementById('loginError');
      this.loginBtn=document.getElementById('adminLoginBtn');
      this.logoutBtn=document.getElementById('adminLogoutBtn');
      this.tableBody=document.getElementById('adminTableBody');
      this.searchInput=document.getElementById('searchInput');
      this.filterVerified=document.getElementById('filterVerified');
      this.sessionToken=localStorage.getItem('adminToken');
      this.adminEmail=localStorage.getItem('adminEmail');
      if(this.loginForm) this.loginForm.addEventListener('submit', e=>self.handleLogin(e));
      if(this.logoutBtn) this.logoutBtn.addEventListener('click', ()=>self.logout());
      if(this.searchInput) this.searchInput.addEventListener('input', ()=>self.renderTable());
      if(this.filterVerified) this.filterVerified.addEventListener('change', ()=>self.renderTable());
      if(this.sessionToken && this.adminEmail){ this.showDashboard(); this.loadData(); } else { this.showLogin(); }
    },
    showLogin(){ if(this.loginOverlay) this.loginOverlay.style.display='flex'; if(this.dashboard) this.dashboard.style.display='none'; },
    showDashboard(){ if(this.loginOverlay) this.loginOverlay.style.display='none'; if(this.dashboard) this.dashboard.style.display='block'; },
    async handleLogin(e){
      e.preventDefault();
      var self=this;
      var email=document.getElementById('adminEmail').value.trim().toLowerCase();
      var password=document.getElementById('adminPassword').value;
      if(!email||!password){ showToast('Missing credentials','error'); return; }
      var btn=self.loginBtn; if(btn){ btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Signing in…'; }
      try{
        const clientIP = await getClientIP();
        const payload = JSON.stringify({action:'admin_login', email, password, clientIP, userAgent:navigator.userAgent});
        const res = await fetch(APP_SCRIPT_URL, {method:'POST', mode:'cors', redirect:'follow', headers:{'Content-Type':'text/plain'}, body:payload});
        const txt = await res.text();
        let data; try{ data = JSON.parse(txt); } catch(e){ data = {success:false, error:'Parse error '+txt.slice(0,100)}; }
        if(data.success){ localStorage.setItem('adminToken', data.token); localStorage.setItem('adminEmail', data.email); self.sessionToken=data.token; self.adminEmail=data.email; self.showDashboard(); self.loadData(); showToast('Welcome','success'); }
        else{ if(self.loginError){ self.loginError.textContent=data.error||'Invalid credentials'; self.loginError.classList.add('show'); } showToast('Login failed','error'); }
      }catch(err){ showToast('Network error: '+err.message,'error'); }
      finally{ if(btn){ btn.disabled=false; btn.innerHTML='🔑 Sign In'; } }
    },
    logout(){ localStorage.removeItem('adminToken'); localStorage.removeItem('adminEmail'); this.sessionToken=null; this.adminEmail=null; this.allData=[]; this.showLogin(); showToast('Logged out',''); },
    async loadData(){
      var self=this;
      if(!this.sessionToken||!this.adminEmail){ showToast('Not authenticated','error'); return; }
      if(this.tableBody) this.tableBody.innerHTML='<tr><td colspan="10" class="loading">⏳ Loading...</td></tr>';
      try{
        var url = APP_SCRIPT_URL + '?action=all&email='+encodeURIComponent(this.adminEmail)+'&token='+encodeURIComponent(this.sessionToken);
        const data = await secureFetch(url);
        if(data.success===false){ self.logout(); showToast('Session expired','error'); return; }
        if(Array.isArray(data)){ self.allData=data; self.renderTable(); self.updateStats(data); }
        else throw new Error('Invalid data');
      }catch(err){ if(self.tableBody) self.tableBody.innerHTML='<tr><td colspan="10" class="loading">❌ Error loading</td></tr>'; showToast('Could not load','error'); }
    },
    renderTable(){
      var search=this.searchInput?this.searchInput.value.toLowerCase():'';
      var filter=this.filterVerified?this.filterVerified.value:'';
      var filtered=this.allData.filter(row=>{
        var match=true;
        if(search){ match=(row.FullName&&row.FullName.toLowerCase().includes(search))||(row.Email&&row.Email.toLowerCase().includes(search))||(row.UniqueID&&row.UniqueID.toLowerCase().includes(search))||(row.ServiceNo&&row.ServiceNo.toLowerCase().includes(search)); }
        if(match && filter!==''){ var isVerified=row.Verified===true||row.Verified==='TRUE'; match=(filter==='true')===isVerified; }
        return match;
      });
      if(!this.tableBody) return;
      if(filtered.length===0){ this.tableBody.innerHTML='<tr><td colspan="10" style="text-align:center;padding:40px;color:#6b6560;">No registrations found.</td></tr>'; return; }
      var html='';
      filtered.forEach(row=>{
        var verified=row.Verified===true||row.Verified==='TRUE';
        var date=row.RegistrationDate?new Date(row.RegistrationDate).toLocaleDateString():'—';
        html+='<tr>'+
          '<td><strong>'+escapeHTML(row.UniqueID||'—')+'</strong></td>'+
          '<td>'+escapeHTML(row.ServiceNo||'—')+'</td>'+
          '<td>'+escapeHTML(row.Rank||'—')+'</td>'+
          '<td>'+escapeHTML(row.FullName||'—')+'</td>'+
          '<td>'+escapeHTML(row.Email||'—')+'</td>'+
          '<td>'+escapeHTML(row.Phone||'—')+'</td>'+
          '<td>'+escapeHTML(row.Organization||'—')+'</td>'+
          '<td>'+escapeHTML(row.Role||'—')+'</td>'+
          '<td>'+escapeHTML(date)+'</td>'+
          '<td><span class="verified-badge '+(verified?'verified-yes':'verified-no')+'">'+(verified?'✅ Verified':'⏳ Pending')+'</span></td>'+
          '</tr>';
      });
      this.tableBody.innerHTML=html;
    },
    updateStats(data){
      var total=data.length;
      var verified=data.filter(r=>r.Verified===true||r.Verified==='TRUE').length;
      var totalEl=document.getElementById('totalCount'); var verifiedEl=document.getElementById('verifiedCount'); var unverifiedEl=document.getElementById('unverifiedCount');
      if(totalEl) totalEl.textContent=total; if(verifiedEl) verifiedEl.textContent=verified; if(unverifiedEl) unverifiedEl.textContent=total-verified;
    },
    exportCSV(){
      if(!this.sessionToken||!this.adminEmail){ showToast('Not authenticated','error'); return; }
      if(this.allData.length===0){ showToast('No data','error'); return; }
      var headers=['UniqueID','ServiceNo','Rank','FullName','Email','Phone','Organization','Role','RegistrationDate','Verified'];
      var rows=this.allData.map(row=>[row.UniqueID,row.ServiceNo,row.Rank,row.FullName,row.Email,row.Phone,row.Organization,row.Role,row.RegistrationDate,(row.Verified===true||row.Verified==='TRUE')?'Yes':'No']);
      var csv=headers.join(',')+'\n';
      rows.forEach(r=>{ csv+=r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')+'\n'; });
      var blob=new Blob([csv],{type:'text/csv'}); var link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='NACWS_Registrations_'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast('CSV exported!','success');
    }
  };

  window.NACWS={registration:Registration, verify:Verify, admin:Admin};
  if(document.getElementById('regForm')){ document.addEventListener('DOMContentLoaded', ()=>NACWS.registration.init()); }
})();
