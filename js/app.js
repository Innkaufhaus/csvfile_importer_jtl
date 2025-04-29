class App {
    constructor() {
        this.previewBtn = document.getElementById('previewBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.previewContainer = document.getElementById('previewContainer');
        this.previewTable = document.getElementById('previewTable');

        this.gtinInput = document.getElementById('gtinInput');
        this.scanGtinBtn = document.getElementById('scanGtinBtn');
        this.gtinScanResult = document.getElementById('gtinScanResult');
        this.gtinResultContent = document.getElementById('gtinResultContent');

        this.fileUploadSection = document.getElementById('fileUploadSection');
        this.gtinScanSection = document.getElementById('gtinScanSection');

        this.currentData = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mode switcher
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchMode(e.target.value);
            });
        });

        // GTIN scan button
        this.scanGtinBtn.addEventListener('click', () => {
            this.scanGtin();
        });

        // Listen for file load
        window.addEventListener('fileLoaded', (e) => {
            this.currentData = e.detail;
            window.columnMapper.currentData = this.currentData;
            this.enableExport();
        });

        // Listen for mapping updates
        window.addEventListener('mappingUpdated', () => {
            if (this.currentData) {
                this.updatePreview();
            }
        });

        // Listen for parent article creation
        window.addEventListener('parentArticleCreated', () => {
            if (this.currentData) {
                this.updatePreview();
            }
        });

        // Preview button
        this.previewBtn.addEventListener('click', () => {
            this.togglePreview();
        });

        // Export button
        this.exportBtn.addEventListener('click', () => {
            this.exportData();
        });
    }

    switchMode(mode) {
        if (mode === 'file') {
            this.fileUploadSection.classList.remove('hidden');
            this.gtinScanSection.classList.add('hidden');
            // Hide mapping sections until file loaded
            document.querySelectorAll('.mapping-section').forEach(section => {
                section.classList.add('hidden');
            });
            this.gtinScanResult.classList.add('hidden');
        } else if (mode === 'gtin') {
            this.fileUploadSection.classList.add('hidden');
            this.gtinScanSection.classList.remove('hidden');
            this.gtinScanResult.classList.add('hidden');
            // Clear previous GTIN input and result
            this.gtinInput.value = '';
            this.gtinResultContent.textContent = '';
        }
    }

    async scanGtin() {
        const gtin = this.gtinInput.value.trim();
        if (!gtin) {
            alert('Please enter a GTIN to scan.');
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

            // Display raw JSON for now
            this.gtinResultContent.textContent = JSON.stringify(data, null, 2);
            this.gtinScanResult.classList.remove('hidden');

            // TODO: Prefill mapping fields with data if applicable

        } catch (error) {
            this.gtinResultContent.textContent = `Error: ${error.message}`;
            this.gtinScanResult.classList.remove('hidden');
        }
    }

    enableExport() {
        this.exportBtn.disabled = false;
        this.previewBtn.disabled = false;
    }

    togglePreview() {
        if (this.previewContainer.classList.contains('hidden')) {
            this.updatePreview();
            this.previewContainer.classList.remove('hidden');
            this.previewBtn.textContent = 'Hide Preview';
        } else {
            this.previewContainer.classList.add('hidden');
            this.previewBtn.textContent = 'Preview Data';
        }
    }

    updatePreview() {
        const processedData = this.processData();
        this.renderPreviewTable(processedData);
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
        if (!data.length) return;

        const headers = new Set();
        data.forEach(row => {
            Object.keys(row).forEach(key => headers.add(key));
        });

        const headerRow = Array.from(headers).filter(h => h !== 'children' && h !== 'isParent');

        this.previewTable.innerHTML = `
            <thead>
                <tr class="bg-gray-50">
                    ${headerRow.map(header => `
                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            ${header}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr class="${row.isParent ? 'bg-blue-50' : ''} border-b">
                        ${headerRow.map(header => `
                            <td class="px-4 py-2 text-sm" data-source="${header}">
                                ${row[header] || ''}
                            </td>
                        `).join('')}
                    </tr>
                `).join('')}
            </tbody>
        `;
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
