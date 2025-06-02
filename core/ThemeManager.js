/**
 * ThemeManager - Centralized theme management
 * Handles theme switching, persistence, and menu interactions
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.themes = [
            'default',
            'grand-canyon',
            'moon',
            'sunset-beach',
            'north-pole',
            'rainforest',
            'ocean-depths'
        ];
        this.themeMenu = null;
        this.themeToggle = null;
        this.themeOptions = null;
        this.initialized = false;
    }

    /**
     * Initialize theme manager
     */
    initialize() {
        if (this.initialized) return;

        this.themeMenu = document.getElementById('theme-menu');
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeOptions = document.getElementById('theme-options');

        if (!this.themeMenu || !this.themeToggle || !this.themeOptions) {
            console.warn('Theme menu elements not found');
            return;
        }

        this.setupEventListeners();
        this.loadSavedTheme();
        this.initialized = true;
        console.log('ThemeManager initialized');
    }

    /**
     * Set up event listeners for theme menu
     */
    setupEventListeners() {
        // Theme toggle button
        this.themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Theme options
        this.themeOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-option') || e.target.closest('.theme-option')) {
                const themeButton = e.target.closest('.theme-option');
                const themeName = themeButton.dataset.theme;
                this.setTheme(themeName);
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.themeMenu && !this.themeMenu.contains(e.target)) {
                this.closeMenu();
            }
        });
    }

    /**
     * Toggle theme menu visibility
     */
    toggleMenu() {
        if (!this.themeMenu) return;
        
        this.themeMenu.classList.toggle('open');
        
        // Close sound menu if open
        const soundMenu = document.getElementById('sound-menu');
        if (soundMenu) {
            soundMenu.classList.remove('open');
        }
    }

    /**
     * Close theme menu
     */
    closeMenu() {
        if (this.themeMenu) {
            this.themeMenu.classList.remove('open');
        }
    }

    /**
     * Set active theme
     * @param {string} themeName - Theme name
     */
    setTheme(themeName) {
        if (!this.themes.includes(themeName)) {
            console.warn('Invalid theme name:', themeName);
            return;
        }

        // Remove existing theme classes
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        
        // Add new theme class (except for default)
        if (themeName !== 'default') {
            document.body.classList.add(`theme-${themeName}`);
        }

        // Update active button
        this.updateActiveButton(themeName);
        
        this.currentTheme = themeName;
        this.saveTheme();
        this.closeMenu();
        
        console.log('Theme changed to:', themeName);
    }

    /**
     * Update active theme button
     * @param {string} themeName - Active theme name
     */
    updateActiveButton(themeName) {
        const themeButtons = document.querySelectorAll('.theme-option');
        themeButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.querySelector(`[data-theme="${themeName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get all available themes
     * @returns {Array} Array of theme names
     */
    getAvailableThemes() {
        return [...this.themes];
    }

    /**
     * Check if current theme has special text handling
     * @returns {boolean}
     */
    hasSpecialTextHandling() {
        return ['moon', 'north-pole'].includes(this.currentTheme);
    }

    /**
     * Get theme-specific color for text
     * @param {string} type - Color type ('accurate', 'close', 'off')
     * @returns {string} CSS color value
     */
    getThemeColor(type) {
        const colors = {
            'moon': {
                'accurate': '#006400',
                'close': '#ff8c00',
                'off': '#dc143c'
            },
            'north-pole': {
                'accurate': '#0d4f3c',
                'close': '#8b4513',
                'off': '#8b0000'
            },
            'default': {
                'accurate': '#44ff44',
                'close': '#ffaa44',
                'off': '#ff4444'
            }
        };

        const themeColors = colors[this.currentTheme] || colors['default'];
        return themeColors[type] || themeColors['default'];
    }

    /**
     * Save current theme to localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem('music-tools-theme', this.currentTheme);
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }
    }

    /**
     * Load saved theme from localStorage
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('music-tools-theme');
            if (savedTheme && this.themes.includes(savedTheme)) {
                this.setTheme(savedTheme);
            } else {
                // Set default theme active button
                this.updateActiveButton('default');
            }
        } catch (error) {
            console.warn('Could not load theme from localStorage:', error);
            this.updateActiveButton('default');
        }
    }

    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.setTheme('default');
    }
}

// Export singleton instance
window.ThemeManager = new ThemeManager(); 