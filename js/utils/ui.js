class UIManager {
    constructor() {
        this.setupLoadingIndicator();
        this.setupErrorDisplay();
    }

    setupLoadingIndicator() {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50';
        overlay.id = 'loadingOverlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'bg-white p-6 rounded-lg shadow-xl flex items-center space-x-4';
        spinner.innerHTML = `
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div class="text-lg" id="loadingText">Processing...</div>
        `;
        
        overlay.appendChild(spinner);
        document.body.appendChild(overlay);
    }

    setupErrorDisplay() {
        // Create error container
        const container = document.createElement('div');
        container.className = 'fixed bottom-4 right-4 max-w-md z-50';
        container.id = 'errorContainer';
        document.body.appendChild(container);
    }

    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        text.textContent = message;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('flex');
        overlay.classList.add('hidden');
    }

    showError(message, duration = 5000) {
        const container = document.getElementById('errorContainer');
        
        const alert = document.createElement('div');
        alert.className = `
            bg-red-500 text-white p-4 rounded-lg shadow-lg mb-2 
            transform translate-x-full transition-transform duration-300 ease-in-out
            flex items-center justify-between
        `;
        
        alert.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
            <button class="ml-4 hover:text-red-200">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(alert);
        
        // Animate in
        setTimeout(() => {
            alert.classList.remove('translate-x-full');
        }, 100);

        // Setup close button
        const closeBtn = alert.querySelector('button');
        closeBtn.addEventListener('click', () => {
            alert.classList.add('translate-x-full');
            setTimeout(() => alert.remove(), 300);
        });

        // Auto remove after duration
        if (duration) {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.classList.add('translate-x-full');
                    setTimeout(() => alert.remove(), 300);
                }
            }, duration);
        }
    }

    showSuccess(message, duration = 3000) {
        const container = document.getElementById('errorContainer');
        
        const alert = document.createElement('div');
        alert.className = `
            bg-green-500 text-white p-4 rounded-lg shadow-lg mb-2 
            transform translate-x-full transition-transform duration-300 ease-in-out
            flex items-center justify-between
        `;
        
        alert.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
            <button class="ml-4 hover:text-green-200">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(alert);
        
        // Animate in
        setTimeout(() => {
            alert.classList.remove('translate-x-full');
        }, 100);

        // Setup close button
        const closeBtn = alert.querySelector('button');
        closeBtn.addEventListener('click', () => {
            alert.classList.add('translate-x-full');
            setTimeout(() => alert.remove(), 300);
        });

        // Auto remove after duration
        if (duration) {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.classList.add('translate-x-full');
                    setTimeout(() => alert.remove(), 300);
                }
            }, duration);
        }
    }

    showValidationErrors(errors) {
        const container = document.createElement('div');
        container.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const dialog = document.createElement('div');
        dialog.className = 'bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col';
        
        dialog.innerHTML = `
            <div class="p-6 border-b">
                <h3 class="text-lg font-semibold text-red-600 flex items-center">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Validation Errors
                </h3>
            </div>
            <div class="p-6 overflow-auto">
                <div class="space-y-4">
                    ${errors.map(error => `
                        <div class="bg-red-50 p-4 rounded">
                            <div class="font-medium text-red-800">Row ${error.row}</div>
                            <ul class="mt-2 list-disc list-inside text-sm text-red-700">
                                ${error.errors.map(err => `
                                    <li>
                                        Column "${err.column}": ${err.message}
                                        ${err.value ? `(Value: "${err.value}")` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="p-6 border-t bg-gray-50 flex justify-end">
                <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Close
                </button>
            </div>
        `;

        const closeBtn = dialog.querySelector('button');
        closeBtn.addEventListener('click', () => {
            container.classList.add('opacity-0');
            setTimeout(() => container.remove(), 300);
        });

        container.appendChild(dialog);
        document.body.appendChild(container);

        // Animate in
        container.classList.add('transition-opacity', 'duration-300');
        container.classList.remove('opacity-0');
    }
}

// Initialize UI manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});
