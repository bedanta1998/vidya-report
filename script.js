document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Slide Selectors
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  let currentSlideIndex = 1;

  // Controls UI Selectors
  const btnPrev = document.getElementById('prev-btn');
  const btnNext = document.getElementById('next-btn');
  const btnTheme = document.getElementById('theme-toggle');
  const btnFullscreen = document.getElementById('fullscreen-toggle');
  const btnMenu = document.getElementById('btnMenu');
  
  const slideNum = document.getElementById('slideNum');
  const progressBar = document.getElementById('progress-fill');
  const progressBarContainer = document.getElementById('progressBarContainer');
  
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarList = document.getElementById('sidebarList');

  // Initialize
  initPresentation();

  function initPresentation() {
    // 1. Build TOC Drawer Items dynamically
    buildSidebarMenu();

    // 2. Load from Hash URL state
    handleHashChange();

    // 3. Register Event Listeners
    window.addEventListener('hashchange', handleHashChange);
    
    btnPrev.addEventListener('click', prevSlide);
    btnNext.addEventListener('click', nextSlide);
    btnTheme.addEventListener('click', toggleTheme);
    btnFullscreen.addEventListener('click', toggleFullscreen);
    btnMenu.addEventListener('click', openMenu);
    
    sidebarClose.addEventListener('click', closeMenu);
    sidebarOverlay.addEventListener('click', (e) => {
      if (e.target === sidebarOverlay) closeMenu();
    });

    // Keyboard bindings
    document.addEventListener('keydown', handleKeyDown);

    // Mobile Swipes
    setupSwipeListeners();

    // Progress Bar click navigation
    progressBarContainer.addEventListener('click', handleProgressBarClick);

    // Load saved Theme
    const savedTheme = localStorage.getItem('vidya-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateLogoTheme(savedTheme);

    // Setup dynamic 16:9 fullscreen/responsive scaling
    setupWidescreenScaling();
  }

  // Build Sidebar Table of Contents Menu
  function buildSidebarMenu() {
    sidebarList.innerHTML = '';
    slides.forEach((slide, idx) => {
      const titleSpan = slide.querySelector('.slide-title');
      
      let title = `Slide ${idx + 1}`;
      if (titleSpan) {
        title = titleSpan.textContent.trim();
      } else if (slide.classList.contains('slide-cover')) {
        const h1 = slide.querySelector('h1');
        if (h1) title = h1.textContent.trim();
      } else if (slide.classList.contains('slide-section')) {
        const h2 = slide.querySelector('h2');
        if (h2) title = h2.textContent.trim();
      }

      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.innerHTML = `
        <span class="sidebar-item-num">${String(idx + 1).padStart(2, '0')}</span>
        <span class="sidebar-item-title">${title}</span>
      `;
      item.addEventListener('click', () => {
        goToSlide(idx + 1);
        closeMenu();
      });
      sidebarList.appendChild(item);
    });
  }

  // Handle URL hash changes
  function handleHashChange() {
    const hash = window.location.hash;
    const match = hash.match(/^#slide-(\d+)$/);
    if (match) {
      const targetIndex = parseInt(match[1], 10);
      if (targetIndex >= 1 && targetIndex <= totalSlides) {
        goToSlide(targetIndex, false);
        return;
      }
    }
    goToSlide(1, true);
  }

  // Main Navigation Driver
  function goToSlide(index, updateHash = true) {
    if (index < 1 || index > totalSlides) return;
    
    slides.forEach((slide, idx) => {
      const slideNum = idx + 1;
      slide.classList.remove('active', 'prev');
      
      if (slideNum === index) {
        slide.classList.add('active');
      } else if (slideNum < index) {
        slide.classList.add('prev');
      }
    });

    currentSlideIndex = index;
    updateUIControls();

    if (updateHash) {
      window.location.hash = `#slide-${currentSlideIndex}`;
    }
  }

  // Expose globally for inline onclick handlers
  window.goToSlide = goToSlide;

  function nextSlide() {
    if (currentSlideIndex < totalSlides) {
      goToSlide(currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 1) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  // Update UI components
  function updateUIControls() {
    btnPrev.disabled = (currentSlideIndex === 1);
    btnNext.disabled = (currentSlideIndex === totalSlides);
    
    slideNum.textContent = `${currentSlideIndex} / ${totalSlides}`;
    
    const percentage = ((currentSlideIndex - 1) / (totalSlides - 1)) * 100;
    progressBar.style.width = `${percentage}%`;

    // Toggle Header Logos
    const logoIitg = document.getElementById('logo-iitg');
    const logoCet = document.getElementById('logo-cet');
    if (logoIitg && logoCet) {
      if (currentSlideIndex === 1) {
        logoIitg.style.display = 'flex';
        logoCet.style.display = 'none';
      } else {
        logoIitg.style.display = 'none';
        logoCet.style.display = 'flex';
      }
    }

    const sidebarItems = Array.from(sidebarList.querySelectorAll('.sidebar-item'));
    sidebarItems.forEach((item, idx) => {
      item.classList.remove('active', 'visited');
      if (idx + 1 === currentSlideIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (idx + 1 < currentSlideIndex) {
        item.classList.add('visited');
      }
    });
  }

  // Keyboard controls
  function handleKeyDown(e) {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'Backspace':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(1);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        if (sidebarOverlay.classList.contains('open')) {
          closeMenu();
        } else {
          openMenu();
        }
        break;
      case 't':
      case 'T':
        e.preventDefault();
        toggleTheme();
        break;
    }
  }

  // Theme Toggler
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('vidya-theme', newTheme);
    updateLogoTheme(newTheme);
  }

  function updateLogoTheme(theme) {
    const logoLight = document.querySelector('.logo-light');
    const logoDark = document.querySelector('.logo-dark');
    if (logoLight && logoDark) {
      if (theme === 'dark') {
        logoLight.style.setProperty('display', 'none', 'important');
        logoDark.style.setProperty('display', 'inline-block', 'important');
      } else {
        logoLight.style.setProperty('display', 'inline-block', 'important');
        logoDark.style.setProperty('display', 'none', 'important');
      }
    }
  }

  // Fullscreen Toggler
  function toggleFullscreen() {
    const container = document.getElementById('presentation');
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Sidebar Menu
  function openMenu() {
    sidebarOverlay.classList.add('open');
  }

  function closeMenu() {
    sidebarOverlay.classList.remove('open');
  }

  // Progress Bar click navigation
  function handleProgressBarClick(e) {
    const rect = progressBarContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickedPercentage = clickX / width;
    
    const targetSlide = Math.min(
      totalSlides,
      Math.max(1, Math.round(clickedPercentage * (totalSlides - 1)) + 1)
    );
    goToSlide(targetSlide);
  }

  // Swipe Gestures
  let touchStartX = 0;
  let touchEndX = 0;

  function setupSwipeListeners() {
    const container = document.getElementById('presentation');
    
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
  }

  function handleSwipeGesture() {
    const swipeThreshold = 50;
    const deltaX = touchEndX - touchStartX;
    
    if (deltaX < -swipeThreshold) {
      nextSlide();
    } else if (deltaX > swipeThreshold) {
      prevSlide();
    }
  }

  // Dynamic 16:9 scale to fit screen
  function setupWidescreenScaling() {
    const container = document.querySelector('.presentation-container');
    if (!container) return;
    
    const baseW = 1333;
    const baseH = 750;
    
    function updateScale() {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const scale = Math.min(winW / baseW, winH / baseH);
      container.style.transform = `scale(${scale})`;
    }
    
    window.addEventListener('resize', updateScale);
    updateScale();
  }

});
