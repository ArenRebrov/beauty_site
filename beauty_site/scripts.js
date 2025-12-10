
// Simple front-end booking logic (stores bookings in localStorage)
(function(){
  const timeSelect = document.getElementById('time');
  const dateInput = document.getElementById('date');
  const bookingForm = document.getElementById('bookingForm');
  const bookingsList = document.getElementById('bookingsList');
  const clearBtn = document.getElementById('clearBtn');

  // populate time slots (09:00 - 18:00 every 30 min)
  function mkSlots(){
    if(!timeSelect) return; // Если нет элемента time, пропускаем
    timeSelect.innerHTML = '<option value="">— Выберите время —</option>';
    for(let h=9; h<=18; h++){
      for(let m=0; m<60; m+=30){
        const hh = String(h).padStart(2,'0');
        const mm = String(m).padStart(2,'0');
        const val = hh+':'+mm;
        const opt = document.createElement('option'); opt.value = val; opt.textContent = val;
        timeSelect.appendChild(opt);
      }
    }
  }

  mkSlots();

  // bookings stored as array in localStorage under 'lumiere_bookings'
  function loadBookings(){
    const raw = localStorage.getItem('lumiere_bookings');
    return raw ? JSON.parse(raw) : [];
  }
  function saveBookings(arr){ localStorage.setItem('lumiere_bookings', JSON.stringify(arr)); }

  function renderBookings(){
    if(!bookingsList) return; // Не на странице booking
    const arr = loadBookings().sort((a,b)=> (a.date+a.time) > (b.date+b.time) ? 1 : -1);
    bookingsList.innerHTML = '';
    if(arr.length===0){
      bookingsList.innerHTML = '<li class="muted">Нет ближайших записей</li>'; return;
    }
    arr.slice(0,10).forEach((b,idx)=>{
      const li = document.createElement('li'); li.className='booking-item';
      li.innerHTML = '<div><strong>'+b.service+'</strong><div class="muted">'+b.date+' • '+b.time+' • '+b.name+'</div></div>' +
                     '<div><button data-i="'+idx+'" class="btn small delete">Отменить</button></div>';
      bookingsList.appendChild(li);
    });
    // attach delete
    bookingsList.querySelectorAll('.delete').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const i = Number(e.target.dataset.i);
        const arr = loadBookings();
        arr.splice(i,1);
        saveBookings(arr);
        renderBookings();
      });
    });
  }

  // prevent double-booking same date+time
  function isSlotTaken(date, time){
    return loadBookings().some(b=> b.date===date && b.time===time);
  }

  if(bookingForm) {
    bookingForm.addEventListener('submit', function(e){
      e.preventDefault();
      const service = document.getElementById('service').value.trim();
      const date = dateInput.value;
      const time = timeSelect.value;
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();

      if(!service || !date || !time || !name || !phone){ alert('Заполните все поля.'); return; }
      const today = new Date().toISOString().slice(0,10);
      if(date < today){ alert('Выберите сегодняшнюю дату или позже.'); return; }
      if(isSlotTaken(date,time)){ alert('Это время уже занято. Пожалуйста, выберите другое.'); return; }

      const arr = loadBookings();
      arr.push({service,date,time,name,phone,created: new Date().toISOString()});
      saveBookings(arr);
      renderBookings();
      alert('Запись создана — мы свяжемся для подтверждения.');
      bookingForm.reset();
    });
  }

  clearBtn && clearBtn.addEventListener('click', ()=>{ if(confirm('Очистить форму?')) bookingForm.reset(); });

  // initialize list on page load
  if(bookingsList) renderBookings();
})();

/* Lightbox for gallery and portfolio */
+(function(){
  let lb = null;
  let currentUrls = [];
  let currentIdx = 0;

  function createLightbox(){
    if(lb) return;
    lb = document.createElement('div'); 
    lb.className='lightbox'; 
    lb.setAttribute('aria-hidden','true');
    lb.innerHTML = '<div class="inner">'
      + '<button class="close" aria-label="Закрыть">✕</button>'
      + '<button class="nav prev" aria-label="Предыдущая">◀</button>'
      + '<img src="" alt="Просмотр работы">'
      + '<button class="nav next" aria-label="Следующая">▶</button>'
      + '</div>';
    document.body.appendChild(lb);
    
    const btnClose = lb.querySelector('.close');
    const btnPrev = lb.querySelector('.prev');
    const btnNext = lb.querySelector('.next');
    
    btnClose.addEventListener('click', closeLightbox);
    btnPrev.addEventListener('click', prevPhoto);
    btnNext.addEventListener('click', nextPhoto);
    lb.addEventListener('click', (e)=>{ if(e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', (e)=>{
      if(!lb.classList.contains('open')) return;
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft') prevPhoto();
      if(e.key === 'ArrowRight') nextPhoto();
    });
  }
  
  function openLightbox(i){
    createLightbox();
    if(i < 0 || i >= currentUrls.length) return;
    currentIdx = i;
    const img = lb.querySelector('img');
    img.src = currentUrls[currentIdx];
    lb.classList.add('open');
    lb.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  
  function closeLightbox(){
    if(!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  
  function prevPhoto(){
    if(!lb || !lb.classList.contains('open')) return;
    currentIdx = (currentIdx - 1 + currentUrls.length) % currentUrls.length;
    lb.querySelector('img').src = currentUrls[currentIdx];
  }
  
  function nextPhoto(){
    if(!lb || !lb.classList.contains('open')) return;
    currentIdx = (currentIdx + 1) % currentUrls.length;
    lb.querySelector('img').src = currentUrls[currentIdx];
  }
  
  function initThumbs(){
    const thumbs = Array.from(document.querySelectorAll('.portfolio-item:not(.hidden) .thumb'));
    currentUrls = thumbs.map(a => a.href);
    thumbs.forEach((a, i) => {
      a.onclick = (e) => { e.preventDefault(); openLightbox(i); };
    });
  }
  
  initThumbs();
  window.reinitLightbox = initThumbs;
})();

/* Portfolio filter functionality - simple and direct */
document.addEventListener('DOMContentLoaded', function(){
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function(){
      const selectedFilter = this.getAttribute('data-filter');
      
      // Update button states
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Filter portfolio items
      portfolioItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if(selectedFilter === 'all' || selectedFilter === itemCategory) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
      
      // Reinit lightbox for visible items
      if(window.reinitLightbox) {
        window.reinitLightbox();
      }
    });
  });
});
