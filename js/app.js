class App {
    constructor() {
        // Initialize core elements
        this.initializeElements();
        
        // Initialize utility managers
        this.initializeManagers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize state
        this.currentData = null;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // Apply initial theme
        this.applyTheme(this.currentTheme);
    }

    initializeElements() {
        // Preview elements
        this.previewBtn = document.getElementById('previewBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.previewContainer = document.getElementById('previewContainer');
        this.previewTable = document.getElementById('previewTable');

        // GTIN scan elements
        this.gtinInput = document.getElementById('gtinInput');
        this.scanGtinBtn = document.getElementById('scanGtinBtn');
        this.gtinScanResult = document.getElementById('gtinScanResult');
        this.gtinResultContent = document.getElementById('gtinResultContent');

        // Section elements
        this.fileUploadSection = document.getElementById('fileUploadSection');
        this.gtinScanSection = document.getElementById('gtinScanSection');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
    }

    initializeManagers() {
        // Initialize in specific order to ensure dependencies
        window.themeManager = new ThemeManager();
        window.uiManager = new UIManager();
        window.dataValidation = window.dataValidation || {};
    }

    setupEventListeners() {
        // Mode switcher with animation
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchMode(e.target.value);
            });
        });

        // GTIN scan with enhanced feedback
        this.scanGtinBtn.addEventListener('click', () => {
            window.uiManager.showLoading('Scanning GTIN...');
            this.scanGtin().finally(() => {
                window.uiManager.hideLoading();
            });
        });

        // File handling events
        window.addEventListener('fileLoaded', (e) => {
            this.handleFileLoaded(e.detail);
        });

        // Data processing events
        window.addEventListener('mappingUpdated', () => {
            if (this.currentData) {
                this.updatePreview();
            }
        });

        window.addEventListener('parentArticleCreated', () => {
            if (this.currentData) {
                this.updatePreview();
            }
        });

        // Preview and export with enhanced feedback
        this.previewBtn?.addEventListener('click', () => {
            window.uiManager.showLoading('Generating preview...');
            setTimeout(() => {
                this.togglePreview();
                window.uiManager.hideLoading();
            }, 100);
        });

        this.exportBtn?.addEventListener('click', () => {
            window.uiManager.showLoading('Preparing export...');
            setTimeout(() => {
                this.exportData();
                window.uiManager.hideLoading();
                window.uiManager.showSuccess('Data exported successfully!');
            }, 100);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.remove();
                }
            }
        });
    }

    switchMode(mode) {
        const sections = {
            file: this.fileUploadSection,
            gtin: this.gtinScanSection
        };

        // Animate section transitions
        Object.entries(sections).forEach(([key, section]) => {
            if (!section) return;

            if (key === mode) {
                section.classList.remove('hidden');
                section.classList.add('animate-fade-in');
                
                // Remove animation class after it completes
                setTimeout(() => {
                    section.classList.remove('animate-fade-in');
                }, 300);
            } else {
                section.classList.add('hidden');
                section.classList.remove('animate-fade-in');
            }
        });

        // Reset states based on mode
        if (mode === 'file') {
            document.querySelectorAll('.mapping-section').forEach(section => {
                section.classList.add('hidden');
            });
            this.gtinScanResult?.classList.add('hidden');
        } else if (mode === 'gtin') {
            if (this.gtinInput) this.gtinInput.value = '';
            if (this.gtinResultContent) this.gtinResultContent.textContent = '';
            this.gtinScanResult?.classList.add('hidden');
        }
    }

    async scanGtin() {
        const gtin = this.gtinInput.value.trim();
        if (!gtin) {
            window.uiManager.showError('Please enter a GTIN to scan.');
            return;
        }

        // Validate GTIN format
        const gtinValidator = window.dataValidation.validators.gtin;
        const validationResult = gtinValidator.validate(gtin);
        if (!validationResult.valid) {
            window.uiManager.showError(validationResult.message);
            return;
        }

        this.gtinScanResult.classList.add('hidden');
        this.gtinResultContent.textContent = 'Scanning...';

        try {
            const response = await fetch('/api/scan-gtin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gtin })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();

            // Format and display JSON with syntax highlighting
            this.gtinResultContent.innerHTML = this.formatJSON(data);
            this.gtinScanResult.classList.remove('hidden');
            this.gtinScanResult.classList.add('animate-fade-in');

            window.uiManager.showSuccess('GTIN scan completed successfully');

        } catch (error) {
            window.uiManager.showError(`Error scanning GTIN: ${error.message}`);
            this.gtinResultContent.textContent = `Error: ${error.message}`;
            this.gtinScanResult.classList.remove('hidden');
        }
    }

    formatJSON(data) {
        const highlighted = JSON.stringify(data, null, 2)
            .replace(/&/g, '&amp;')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
                match => {
                    let cls = 'text-purple-600 dark:text-purple-400';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'text-gray-800 dark:text-gray-300';
                        } else {
                            cls = 'text-green-600 dark:text-green-400';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'text-blue-600 dark:text-blue-400';
                    } else if (/null/.test(match)) {
                        cls = 'text-red-600 dark:text-red-400';
                    }
                    return `<span class="${cls}">${match}</span>`;
                }
            );

        return `<div class="font-mono text-sm">${highlighted}</div>`;
    }

    handleFileLoaded(data) {
        this.currentData = data;
        window.columnMapper.currentData = this.currentData;
        
        // Enable export buttons with animation
        this.enableExport();
        
        // Show success message
        window.uiManager.showSuccess('File loaded successfully!');
        
        // Validate loaded data
        const invalidRows = window.dataValidation.validateDataset(data, window.columnMapper.getMapping());
        if (invalidRows.length > 0) {
            window.uiManager.showValidationErrors(invalidRows);
        }
    }

    enableExport() {
        if (this.exportBtn) {
            this.exportBtn.disabled = false;
            this.exportBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            this.exportBtn.classList.add('animate-fade-in');
        }
        
        if (this.previewBtn) {
            this.previewBtn.disabled = false;
            this.previewBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            this.previewBtn.classList.add('animate-fade-in');
        }
    }

    togglePreview() {
        const isHidden = this.previewContainer.classList.contains('hidden');
        
        if (isHidden) {
            this.updatePreview();
            this.previewContainer.classList.remove('hidden');
            this.previewContainer.classList.add('animate-fade-in');
            this.previewBtn.innerHTML = '<i class="fas fa-eye-slash mr-2"></i>Hide Preview';
        } else {
            this.previewContainer.classList.add('hidden');
            this.previewContainer.classList.remove('animate-fade-in');
            this.previewBtn.innerHTML = '<i class="fas fa-eye mr-2"></i>Preview Data';
        }
    }

    updatePreview() {
        try {
            const processedData = this.processData();
            this.renderPreviewTable(processedData);
        } catch (error) {
            window.uiManager.showError('Error updating preview: ' + error.message);
        }
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    processData() {
        if (!this.currentData) return [];

        const mapping = window.columnMapper.getMapping();
        const defaults = window.columnMapper.getDefaults();
        const googleMeta = window.columnMapper.getGoogleMetaValues();
        const parentArticles = window.variantManager.getParentArticles();

        // Process regular articles
        let processedData = this.currentData.map(row => {
            const processed = {};

            // Apply column mapping
            Object.entries(mapping).forEach(([source, target]) => {
                processed[target] = row[source];
            });

            // Apply default values
            Object.entries(defaults).forEach(([column, value]) => {
                if (!processed[column]) {
                    processed[column] = value;
                }
            });

            // Apply Google meta fields
            Object.entries(googleMeta).forEach(([field, value]) => {
                // Handle linked fields
                if (field === 'meta_google_brand' && processed['lieferant']) {
                    processed[field] = processed['lieferant'];
                } else if (field === 'meta_google_sku' && processed['han']) {
                    processed[field] = processed['han'];
                } else {
                    processed[field] = value;
                }
            });

            return processed;
        });

        // Add parent articles
        parentArticles.forEach(parent => {
            const parentArticle = {
                gtin: parent.number,
                artikelname: parent.description || `Parent Article ${parent.number}`,
                isParent: true,
                children: parent.children.map(child => child.gtin || child.artikelname)
            };

            // Apply Google meta fields to parent articles
            Object.entries(googleMeta).forEach(([field, value]) => {
                // Handle linked fields
                if (field === 'meta_google_brand' && parentArticle['lieferant']) {
                    parentArticle[field] = parentArticle['lieferant'];
                } else if (field === 'meta_google_sku' && parentArticle['han']) {
                    parentArticle[field] = parentArticle['han'];
                } else {
                    parentArticle[field] = value;
                }
            });

            processedData.push(parentArticle);
        });

        return processedData;
    }

    renderPreviewTable(data) {
        if (!data.length) {
            this.previewTable.innerHTML = `
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-table text-4xl mb-4"></i>
                    <p>No data to preview</p>
                </div>
            `;
            return;
        }

        const headers = new Set();
        data.forEach(row => {
            Object.keys(row).forEach(key => headers.add(key));
        });

        const headerRow = Array.from(headers).filter(h => h !== 'children' && h !== 'isParent');

        this.previewTable.innerHTML = `
            <thead>
                <tr class="bg-gray-50 dark:bg-gray-700">
                    ${headerRow.map(header => `
                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                            ${header}
                            <span class="ml-1 text-gray-400 dark:text-gray-500">
                                <i class="fas fa-sort"></i>
                            </span>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                ${data.map(row => `
                    <tr class="${row.isParent ? 'bg-blue-50 dark:bg-blue-900/20' : ''} 
                               hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        ${headerRow.map(header => {
                            const value = row[header] || '';
                            const isNumeric = !isNaN(value) && value !== '';
                            return `
                                <td class="px-4 py-2 text-sm ${isNumeric ? 'text-right' : ''} 
                                           text-gray-800 dark:text-gray-200" 
                                    data-source="${header}">
                                    ${this.formatCellValue(value, header)}
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        `;

        // Add sorting functionality
        this.addTableSorting();
    }

    formatCellValue(value, header) {
        if (!value) return '';

        // Format based on header type
        if (header.toLowerCase().includes('price') || header.toLowerCase().includes('cost')) {
            return this.formatPrice(value);
        } else if (header.toLowerCase().includes('date')) {
            return this.formatDate(value);
        } else if (typeof value === 'boolean') {
            return value ? 
                '<i class="fas fa-check text-green-500"></i>' : 
                '<i class="fas fa-times text-red-500"></i>';
        }

        return value;
    }

    formatPrice(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(num);
    }

    formatDate(value) {
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            return new Intl.DateTimeFormat('de-DE').format(date);
        } catch {
            return value;
        }
    }

    addTableSorting() {
        const headers = this.previewTable.querySelectorAll('th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => this.sortTable(index));
        });
    }

    sortTable(columnIndex) {
        const tbody = this.previewTable.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const headers = this.previewTable.querySelectorAll('th');
        const currentHeader = headers[columnIndex];
        
        // Toggle sort direction
        const isAscending = currentHeader.classList.contains('sort-asc');
        
        // Update sort icons
        headers.forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
            h.querySelector('.fas').className = 'fas fa-sort';
        });
        
        currentHeader.classList.add(isAscending ? 'sort-desc' : 'sort-asc');
        currentHeader.querySelector('.fas').className = 
            `fas fa-sort-${isAscending ? 'down' : 'up'}`;

        // Sort rows
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.trim();
            const bValue = b.cells[columnIndex].textContent.trim();
            
            if (this.isNumeric(aValue) && this.isNumeric(bValue)) {
                return (parseFloat(aValue) - parseFloat(bValue)) * (isAscending ? -1 : 1);
            }
            
            return aValue.localeCompare(bValue) * (isAscending ? -1 : 1);
        });

        // Reorder rows with animation
        rows.forEach((row, index) => {
            row.style.transition = 'transform 0.3s ease';
            row.style.transform = 'translateY(0)';
            setTimeout(() => tbody.appendChild(row), index * 50);
        });
    }

    isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    exportData() {
        const processedData = this.processData();
        const csv = this.convertToCSV(processedData);
        this.downloadCSV(csv);
    }

    convertToCSV(data) {
        if (!data.length) return '';

        const headers = new Set();
        data.forEach(row => {
            Object.keys(row).forEach(key => {
                if (key !== 'children' && key !== 'isParent') {
                    headers.add(key);
                }
            });
        });

        const headerRow = Array.from(headers);
        const csvRows = [headerRow.join(',')];

        data.forEach(row => {
            const values = headerRow.map(header => {
                const value = row[header] || '';
                // Escape values containing commas or quotes
                if (value.includes(',') || value.includes('"')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    downloadCSV(csv) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'mapped_data.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
