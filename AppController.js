/**
 * AppController - Main application controller
 * Coordinates all components and manages tab system
 */
class AppController {
    constructor() {
        this.currentTab = 'metronome';
        this.components = {
            metronome: null,
            tuner: null,
            piano: null
        };
        this.tabButtons = null;
        this.tabContents = null;
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) return;

        console.log('Initializing AppController...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize core managers first
        await this.initializeCore();

        // Initialize tab system
        this.initializeTabs();

        // Initialize components
        await this.initializeComponents();

        this.initialized = true;
        console.log('AppController initialized successfully');
    }

    /**
     * Initialize core managers
     */
    async initializeCore() {
        console.log('Initializing core managers...');

        // Initialize audio manager (will be suspended initially, resumed on user gesture)
        if (window.AudioManager) {
            const audioInitialized = await window.AudioManager.initialize();
            console.log('AudioManager initialized:', audioInitialized);
            console.log('AudioManager ready for audio:', window.AudioManager.isReady());
        }

        // Initialize theme manager
        if (window.ThemeManager) {
            window.ThemeManager.initialize();
            console.log('ThemeManager initialized');
        }

        // Initialize metronome sounds
        if (window.MetronomeSounds) {
            window.MetronomeSounds.initialize();
            console.log('MetronomeSounds initialized');
        }

        // Initialize frequency utils (if needed)
        if (window.FrequencyUtils) {
            // Set default A4 frequency from any saved calibration
            const savedA4 = localStorage.getItem('music-tools-a4-frequency');
            if (savedA4) {
                window.FrequencyUtils.setA4Frequency(parseFloat(savedA4));
                console.log('FrequencyUtils A4 frequency restored:', savedA4);
            }
        }
    }

    /**
     * Initialize tab system
     */
    initializeTabs() {
        console.log('Initializing tab system...');
        
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        console.log('Found tab buttons:', this.tabButtons.length);
        console.log('Found tab contents:', this.tabContents.length);
        
        if (this.tabButtons.length === 0) {
            console.error('No tab buttons found!');
            return;
        }
        
        this.tabButtons.forEach((button, index) => {
            console.log(`Setting up tab button ${index}:`, button.dataset.tab);
            
            // Add a test click handler first
            button.addEventListener('click', (e) => {
                console.log('TAB BUTTON CLICKED:', button.dataset.tab);
                this.switchTab(button.dataset.tab);
            });
            
            // Test that the button is clickable
            setTimeout(() => {
                console.log(`Tab button ${index} is clickable:`, button.style.pointerEvents !== 'none');
            }, 50);
        });
        
        // Start with metronome tab active
        this.switchTab('metronome');
        
        console.log('Tab initialization completed');
    }

    /**
     * Initialize all components
     */
    async initializeComponents() {
        console.log('Initializing components...');

        // Initialize metronome (always initialize since it's the default tab)
        await this.initializeMetronome();

        console.log('Components initialized');
    }

    /**
     * Switch to a different tab
     * @param {string} tabName - Name of tab to switch to
     */
    async switchTab(tabName) {
        if (tabName === this.currentTab) return;

        console.log(`Switching to ${tabName} tab`);

        // Update tab buttons
        this.tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });

        // Handle component lifecycle
        await this.handleTabSwitch(this.currentTab, tabName);

        this.currentTab = tabName;
    }

    /**
     * Handle component lifecycle when switching tabs
     * @param {string} fromTab - Previous tab
     * @param {string} toTab - New tab
     */
    async handleTabSwitch(fromTab, toTab) {
        // Cleanup previous tab component
        await this.cleanupComponent(fromTab);

        // Initialize new tab component
        await this.initializeComponent(toTab);
    }

    /**
     * Initialize a specific component
     * @param {string} componentName - Component name
     */
    async initializeComponent(componentName) {
        switch (componentName) {
            case 'metronome':
                await this.initializeMetronome();
                break;
            case 'tuner':
                await this.initializeTuner();
                break;
            case 'piano':
                await this.initializePiano();
                break;
        }
    }

    /**
     * Cleanup a specific component
     * @param {string} componentName - Component name
     */
    async cleanupComponent(componentName) {
        const component = this.components[componentName];
        if (component && typeof component.destroy === 'function') {
            await component.destroy();
            this.components[componentName] = null;
        }
    }

    /**
     * Initialize metronome component
     */
    async initializeMetronome() {
        if (this.components.metronome) {
            console.log('Metronome already exists, skipping initialization');
            return;
        }

        console.log('Initializing metronome component...');
        
        // Check if metronome tab is visible
        const metronomeTab = document.getElementById('metronome-tab');
        if (!metronomeTab || !metronomeTab.classList.contains('active')) {
            console.log('Metronome tab not active, skipping initialization');
            return;
        }
        
        // Check if Metronome class is available
        if (window.Metronome) {
            console.log('Creating new Metronome instance...');
            try {
                this.components.metronome = new window.Metronome();
                console.log('Metronome instance created successfully');
                
                // Verify the metronome has essential elements
                if (this.components.metronome.startStopButton) {
                    console.log('Metronome start button found:', this.components.metronome.startStopButton);
                } else {
                    console.error('Metronome start button not found!');
                }
            } catch (error) {
                console.error('Error creating Metronome instance:', error);
                this.components.metronome = null;
            }
        } else {
            console.error('Metronome class not available');
        }
    }

    /**
     * Initialize tuner component
     */
    async initializeTuner() {
        if (this.components.tuner) return;

        console.log('Initializing tuner component...');
        
        // Check if tuner tab is visible
        const tunerTab = document.getElementById('tuner-tab');
        if (!tunerTab || !tunerTab.classList.contains('active')) {
            console.log('Tuner tab not active, skipping initialization');
            return;
        }
        
        // Create tuner instance
        if (window.PitchTuner) {
            this.components.tuner = new window.PitchTuner();
            // Initialize with a small delay to ensure DOM is ready and tab is visible
            setTimeout(() => {
                if (this.components.tuner && this.components.tuner.init) {
                    console.log('Calling tuner.init()...');
                    this.components.tuner.init();
                }
            }, 150); // Slightly longer delay to ensure tab switching is complete
        } else {
            console.error('PitchTuner class not available');
        }
    }

    /**
     * Initialize piano component
     */
    async initializePiano() {
        if (this.components.piano) return;

        console.log('Initializing piano component...');
        
        // Check if piano tab is visible
        const pianoTab = document.getElementById('piano-tab');
        if (!pianoTab || !pianoTab.classList.contains('active')) {
            console.log('Piano tab not active, skipping initialization');
            return;
        }
        
        // Create piano instance
        if (window.VirtualPiano) {
            this.components.piano = new window.VirtualPiano();
            // Initialize with a small delay to ensure DOM is ready and tab is visible
            setTimeout(() => {
                if (this.components.piano && this.components.piano.init) {
                    console.log('Calling piano.init()...');
                    this.components.piano.init();
                }
            }, 150); // Slightly longer delay to ensure tab switching is complete
        } else {
            console.error('VirtualPiano class not available');
        }
    }

    /**
     * Get current active component
     * @returns {Object|null} Current component instance
     */
    getCurrentComponent() {
        return this.components[this.currentTab];
    }

    /**
     * Get current tab name
     * @returns {string} Current tab name
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Cleanup all components
     */
    async destroy() {
        console.log('Destroying AppController...');

        // Cleanup all components
        for (const componentName of Object.keys(this.components)) {
            await this.cleanupComponent(componentName);
        }

        // Cleanup core managers
        if (window.AudioManager) {
            await window.AudioManager.destroy();
        }

        this.initialized = false;
    }
}

// Export singleton instance
window.AppController = new AppController();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    console.log('Available globals check:', {
        AudioManager: !!window.AudioManager,
        FrequencyUtils: !!window.FrequencyUtils,
        ThemeManager: !!window.ThemeManager,
        MetronomeSounds: !!window.MetronomeSounds,
        PitchTuner: !!window.PitchTuner,
        VirtualPiano: !!window.VirtualPiano,
        Metronome: !!window.Metronome
    });
    
    setTimeout(() => {
        console.log('Starting AppController initialization...');
        try {
            window.AppController.initialize().then(() => {
                console.log('AppController initialization completed successfully');
            }).catch((error) => {
                console.error('AppController initialization failed:', error);
            });
        } catch (error) {
            console.error('AppController initialization threw error:', error);
        }
    }, 100);
}); 