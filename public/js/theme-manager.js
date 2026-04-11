/**
 * Theme Manager - Dark/Light Mode System
 * Handles theme switching with localStorage persistence and system preference detection
 */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'theme-preference';
    this.THEME_ATTRIBUTE = 'data-theme';
    this.THEMES = {
      LIGHT: 'light',
      DARK: 'dark'
    };
    
    this.init();
  }

  /**
   * Initialize theme on page load
   * Priority: localStorage > system preference > light (default)
   */
  init() {
    const savedTheme = this.getSavedTheme();
    const preferredTheme = savedTheme || this.getSystemTheme();
    this.setTheme(preferredTheme);
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }

  /**
   * Get system preferred theme using prefers-color-scheme
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.THEMES.DARK;
    }
    return this.THEMES.LIGHT;
  }

  /**
   * Set theme and apply it
   */
  setTheme(theme) {
    if (!Object.values(this.THEMES).includes(theme)) {
      theme = this.THEMES.LIGHT;
    }

    // Set attribute on html for CSS to pick up
    document.documentElement.setAttribute(this.THEME_ATTRIBUTE, theme);

    // Save to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }

    // Dispatch custom event for any listeners
    this.dispatch('theme-changed', { theme });
  }

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const currentTheme = document.documentElement.getAttribute(this.THEME_ATTRIBUTE) || this.THEMES.LIGHT;
    const nextTheme = currentTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute(this.THEME_ATTRIBUTE) || this.THEMES.LIGHT;
  }

  /**
   * Dispatch custom event
   */
  dispatch(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  /**
   * Listen for theme changes
   */
  onThemeChange(callback) {
    window.addEventListener('theme-changed', (e) => {
      callback(e.detail.theme);
    });
  }
}

// Initialize theme manager globally
const themeManager = new ThemeManager();

// Create theme toggle button element
function createThemeToggleButton() {
  const button = document.createElement('button');
  button.className = 'theme-toggle';
  button.setAttribute('aria-label', 'تبديل المظهر - Toggle theme');
  button.setAttribute('title', 'تبديل بين المظهر الفاتح والداكن');
  button.id = 'themeToggle';
  
  updateThemeToggleIcon(button);
  
  button.addEventListener('click', () => {
    const newTheme = themeManager.toggle();
    updateThemeToggleIcon(button);
  });

  return button;
}

// Update toggle button icon based on current theme
function updateThemeToggleIcon(button) {
  const isDark = themeManager.getCurrentTheme() === 'dark';
  
  if (!button) {
    button = document.getElementById('themeToggle');
  }

  if (button) {
    button.innerHTML = isDark
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

// Listen for theme changes to update icon
themeManager.onThemeChange(() => {
  updateThemeToggleIcon();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, createThemeToggleButton, themeManager };
}
