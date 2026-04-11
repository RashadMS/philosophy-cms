/**
 * Main Frontend JavaScript
 * Handles all client-side interactions using vanilla JS and Fetch API
 */

// ============================================
// Global State & Configuration
// ============================================

const API_BASE = '/api';
let currentUser = null;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication status
  checkAuth();
  
  // Initialize navigation toggle (mobile)
  initMobileNav();
  
<<<<<<< HEAD
  // Initialize admin theme toggle
  initAdminThemeToggle();
  
=======
>>>>>>> b97e42c6385e63bb2c7f761ceda27040acfc07b7
  // Load content based on current page
  initPage();
});

// ============================================
<<<<<<< HEAD
// Theme Toggle (Admin)
// ============================================

function initAdminThemeToggle() {
  const adminToggle = document.getElementById('adminThemeToggle');
  if (!adminToggle) return;
  
  adminToggle.addEventListener('click', () => {
    if (typeof themeManager !== 'undefined') {
      themeManager.toggle();
      updateAdminThemeToggleIcon();
    }
  });
  
  updateAdminThemeToggleIcon();
}

function updateAdminThemeToggleIcon() {
  const button = document.getElementById('adminThemeToggle');
  if (!button || typeof themeManager === 'undefined') return;
  
  const isDark = themeManager.getCurrentTheme() === 'dark';
  const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                     </svg>`;
  const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>`;
  
  button.querySelector('svg').outerHTML = isDark ? moonIcon : sunIcon;
  button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

// ============================================
=======
>>>>>>> b97e42c6385e63bb2c7f761ceda27040acfc07b7
// Authentication
// ============================================

/**
 * Check if user is logged in and update UI accordingly
 */
function checkAuth() {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      updateAuthUI(true);
    } catch (e) {
      logout();
    }
  } else {
    updateAuthUI(false);
  }
}

/**
 * Update navigation based on auth status
 */
function updateAuthUI(isLoggedIn) {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  
<<<<<<< HEAD
  // Build auth content
  let authContent = '';
  if (isLoggedIn && currentUser) {
    authContent = `
=======
  if (isLoggedIn && currentUser) {
    navAuth.innerHTML = `
>>>>>>> b97e42c6385e63bb2c7f761ceda27040acfc07b7
      <div class="nav__user" style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 0.875rem; color: var(--color-text-muted);">
          ${escapeHtml(currentUser.name)}
        </span>
        ${currentUser.role === 'Admin' ? `
          <a href="/admin" class="btn btn--ghost btn--sm">لوحة التحكم</a>
        ` : ''}
        <button class="btn btn--ghost btn--sm" onclick="logout()">تسجيل الخروج</button>
      </div>
    `;
  } else {
<<<<<<< HEAD
    authContent = `
=======
    navAuth.innerHTML = `
>>>>>>> b97e42c6385e63bb2c7f761ceda27040acfc07b7
      <a href="/login" class="btn btn--ghost btn--sm">تسجيل الدخول</a>
      <a href="/register" class="btn btn--primary btn--sm">انضم</a>
    `;
  }
<<<<<<< HEAD
  
  // Add theme toggle button at the end
  navAuth.innerHTML = authContent;
  
  // Append theme toggle button if theme-manager loaded
  if (typeof createThemeToggleButton !== 'undefined') {
    const themeToggle = createThemeToggleButton();
    navAuth.appendChild(themeToggle);
  }
=======
>>>>>>> b97e42c6385e63bb2c7f761ceda27040acfc07b7
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  window.location.href = '/';
}

/**
 * Get auth headers for API requests
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ============================================
// Mobile Navigation
// ============================================

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('nav__links--open');
    });
    
    // Close menu when clicking a link
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('nav__links--open');
      });
    });
  }
}

// ============================================
// Page Initialization
// ============================================

function initPage() {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    loadHomePage();
  }
}

// ============================================
// Home Page
// ============================================

async function loadHomePage() {
  // Load featured posts
  loadFeaturedPosts();
  
  // Load articles
  loadCategoryPosts('Article', 'articlesPosts', 'articlesPagination');
  
  // Load research
  loadCategoryPosts('Research', 'researchPosts', 'researchPagination');
  
  // Load quotes
  loadCategoryPosts('Quote', 'quotesPosts', 'quotesPagination');
}

/**
 * Load featured posts
 */
async function loadFeaturedPosts() {
  const container = document.getElementById('featuredPosts');
  if (!container) return;
  
  try {
    const response = await fetch(`${API_BASE}/posts?featured=true&limit=3`, {
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.posts && data.posts.length > 0) {
      container.innerHTML = data.posts.map(post => renderPostCard(post)).join('');
    } else {
      // If no featured posts, load recent posts
      const recentResponse = await fetch(`${API_BASE}/posts?limit=3`, {
        headers: getAuthHeaders()
      });
      const recentData = await recentResponse.json();
      
      if (recentData.posts && recentData.posts.length > 0) {
        container.innerHTML = recentData.posts.map(post => renderPostCard(post)).join('');
      } else {
        container.innerHTML = `
          <div class="empty" style="grid-column: 1 / -1;">
            <div class="empty__icon">📝</div>
            <h3 class="empty__title">لا توجد مقالات بعد</h3>
            <p class="empty__description">تابع معنا قريباً للحصول على رؤى فلسفية جديدة.</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error loading featured posts:', error);
    container.innerHTML = '<p class="text-center">فشل تحميل المقالات</p>';
  }
}

/**
 * Load posts by category
 */
async function loadCategoryPosts(category, containerId, paginationId, page = 1) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  try {
    const response = await fetch(`${API_BASE}/posts?category=${category}&page=${page}&limit=6`, {
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.posts && data.posts.length > 0) {
      container.innerHTML = data.posts.map(post => 
        category === 'Quote' ? renderQuoteCard(post) : renderPostCard(post)
      ).join('');
      
      // Render pagination
      if (paginationId && data.pagination) {
        renderPagination(data.pagination, paginationId, (p) => {
          loadCategoryPosts(category, containerId, paginationId, p);
        });
      }
    } else {
      container.innerHTML = `
        <div class="empty" style="grid-column: 1 / -1;">
          <div class="empty__icon">${category === 'Quote' ? '💭' : '📄'}</div>
          <h3 class="empty__title">لا توجد ${category === 'Quote' ? 'اقتباسات' : category === 'Article' ? 'مقالات' : 'أبحاث'} بعد</h3>
          <p class="empty__description">تابع معنا قريباً للحصول على محتوى جديد.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error(`Error loading ${category} posts:`, error);
    container.innerHTML = '<p class="text-center">فشل تحميل المحتوى</p>';
  }
}

// ============================================
// Post Cards Rendering
// ============================================

/**
 * Render a standard post card
 */
function renderPostCard(post) {
  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return `
    <article class="card">
      ${post.coverImage ? `
        <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" class="card__image">
      ` : ''}
      <div class="card__content">
        <span class="card__category">${post.category}</span>
        <h3 class="card__title">
          <a href="/post/${post._id}">${escapeHtml(post.title)}</a>
        </h3>
        <p class="card__excerpt">${escapeHtml(post.excerpt || post.content.substring(0, 150))}...</p>
        <div class="card__meta">
          <span class="card__author">${escapeHtml(post.authorName)}</span>
          <div class="card__stats">
            <span class="card__stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              ${post.likeCount || 0}
            </span>
            <span class="card__stat">${date}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Render a quote card
 */
function renderQuoteCard(post) {
  return `
    <article class="card card--quote">
      <div class="card__content">
        <span class="card__category">اقتباس</span>
        <blockquote class="card__quote">
          "${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}"
        </blockquote>
        ${post.quoteAuthor ? `
          <p class="card__attribution">— ${escapeHtml(post.quoteAuthor)}</p>
        ` : ''}
        <div class="card__meta" style="margin-top: 1.5rem; color: rgba(255,255,255,0.6);">
          <a href="/post/${post._id}" style="color: var(--color-accent-light);">اقرأ المزيد ←</a>
          <span class="card__stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            ${post.likeCount || 0}
          </span>
        </div>
      </div>
    </article>
  `;
}

// ============================================
// Pagination
// ============================================

/**
 * Render pagination controls
 */
function renderPagination(pagination, containerId, loadFn) {
  const container = document.getElementById(containerId);
  if (!container || !pagination || pagination.pages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  if (pagination.current > 1) {
    html += `<button class="pagination__btn" data-page="${pagination.current - 1}">السابق</button>`;
  }
  
  // Page numbers
  for (let i = 1; i <= pagination.pages; i++) {
    if (
      i === 1 || 
      i === pagination.pages || 
      Math.abs(i - pagination.current) <= 1
    ) {
      html += `
        <button class="pagination__btn ${i === pagination.current ? 'pagination__btn--active' : ''}" 
                data-page="${i}" ${i === pagination.current ? 'disabled' : ''}>
          ${i}
        </button>
      `;
    } else if (Math.abs(i - pagination.current) === 2) {
      html += '<span style="padding: 0 0.5rem;">...</span>';
    }
  }
  
  // Next button
  if (pagination.current < pagination.pages) {
    html += `<button class="pagination__btn" data-page="${pagination.current + 1}">التالي</button>`;
  }
  
  container.innerHTML = html;
  
  // Add click handlers
  container.querySelectorAll('.pagination__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (page && !isNaN(page)) {
        loadFn(page);
        // Scroll to section
        container.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ============================================
// Toast Notifications
// ============================================

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__message">${escapeHtml(message)}</span>`;
  
  container.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

// ============================================
// Expose Functions Globally
// ============================================

window.showToast = showToast;
window.logout = logout;
window.escapeHtml = escapeHtml;
