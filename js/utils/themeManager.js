class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.app = document.getElementById('app');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.setupEventListeners();
        this.applyTheme();
        this.checkSystemPreference();
    }

    setupEventListeners() {
        // Theme toggle button
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('theme') === null) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    checkSystemPreference() {
        // If no theme is set, use system preference
        if (localStorage.getItem('theme') === null) {
            this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            this.applyTheme();
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    applyTheme() {
        // Update classes
        if (this.currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
            this.app.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark');
            this.app.classList.remove('dark-mode');
        }

        // Update button icon
        const sunIcon = this.themeToggle.querySelector('.fa-sun').parentElement;
        const moonIcon = this.themeToggle.querySelector('.fa-moon').parentElement;
        
        if (this.currentTheme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
