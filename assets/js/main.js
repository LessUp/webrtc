/**
 * LessUp WebRTC - GitHub Pages Main JavaScript
 * Handles navigation, theme toggle, back to top, and interactive elements
 */

(function() {
  'use strict';

  // ============================================
  // Theme Management
  // ============================================
  const ThemeManager = {
    STORAGE_KEY: 'webrtc-theme',
    
    init() {
      this.applyTheme(this.getTheme());
      this.bindEvents();
    },
    
    getTheme() {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return stored;
      
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    },
    
    setTheme(theme) {
      localStorage.setItem(this.STORAGE_KEY, theme);
      this.applyTheme(theme);
    },
    
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
    },
    
    toggle() {
      const current = this.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
    },
    
    bindEvents() {
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => this.toggle());
      }
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  };

  // ============================================
  // Navigation Management
  // ============================================
  const NavigationManager = {
    init() {
      this.bindEvents();
      this.highlightActiveLink();
    },
    
    bindEvents() {
      const toggle = document.querySelector('.nav-toggle');
      const menu = document.querySelector('.nav-menu');
      
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', !isExpanded);
          menu.classList.toggle('show');
          menu.setAttribute('aria-hidden', isExpanded);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
          if (!toggle.contains(e.target) && !menu.contains(e.target) && menu.classList.contains('show')) {
            toggle.setAttribute('aria-expanded', 'false');
            menu.classList.remove('show');
            menu.setAttribute('aria-hidden', 'true');
          }
        });
      }
    },
    
    highlightActiveLink() {
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('.nav-link');
      
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.endsWith(href.replace(/^\//, ''))) {
          link.closest('.nav-item').classList.add('active');
        }
      });
    }
  };

  // ============================================
  // Back to Top Button
  // ============================================
  const BackToTopManager = {
    init() {
      this.button = document.querySelector('.back-to-top');
      if (!this.button) return;
      
      this.bindEvents();
      this.checkVisibility();
    },
    
    bindEvents() {
      window.addEventListener('scroll', () => {
        this.checkVisibility();
      }, { passive: true });
      
      this.button.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    },
    
    checkVisibility() {
      const scrollY = window.scrollY;
      if (scrollY > 500) {
        this.button.classList.add('show');
      } else {
        this.button.classList.remove('show');
      }
    }
  };

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  const SmoothScrollManager = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;
          
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            const navHeight = document.querySelector('.site-nav').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            
            // Update URL without jumping
            history.pushState(null, null, targetId);
          }
        });
      });
    }
  };

  // ============================================
  // Code Block Enhancement
  // ============================================
  const CodeBlockManager = {
    init() {
      this.addLanguageLabels();
      this.addCopyButtons();
    },
    
    addLanguageLabels() {
      document.querySelectorAll('pre > code').forEach(code => {
        const pre = code.parentElement;
        const classes = code.className.split(' ');
        const langClass = classes.find(c => c.startsWith('language-'));
        
        if (langClass) {
          const lang = langClass.replace('language-', '');
          pre.setAttribute('data-language', lang);
        }
      });
    },
    
    addCopyButtons() {
      document.querySelectorAll('pre').forEach(pre => {
        const button = document.createElement('button');
        button.className = 'code-copy-btn';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        `;
        
        button.addEventListener('click', () => {
          const code = pre.querySelector('code');
          if (code) {
            navigator.clipboard.writeText(code.textContent).then(() => {
              button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              `;
              button.classList.add('copied');
              
              setTimeout(() => {
                button.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                `;
                button.classList.remove('copied');
              }, 2000);
            });
          }
        });
        
        pre.style.position = 'relative';
        pre.appendChild(button);
      });
    }
  };

  // ============================================
  // Intersection Observer for Animations
  // ============================================
  const AnimationManager = {
    init() {
      this.observeElements();
    },
    
    observeElements() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      document.querySelectorAll('.feature-card, .doc-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
      });
    }
  };

  // Add CSS for animated elements
  const addAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      .code-copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s ease;
      }
      
      pre:hover .code-copy-btn {
        opacity: 1;
      }
      
      .code-copy-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
      
      .code-copy-btn.copied {
        background: var(--color-accent);
        color: white;
        border-color: var(--color-accent);
      }
    `;
    document.head.appendChild(style);
  };

  // ============================================
  // Initialize Everything
  // ============================================
  const init = () => {
    addAnimationStyles();
    ThemeManager.init();
    NavigationManager.init();
    BackToTopManager.init();
    SmoothScrollManager.init();
    CodeBlockManager.init();
    AnimationManager.init();
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
