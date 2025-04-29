class App {
    constructor() {
        this.previewBtn = document.getElementById('previewBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.previewContainer = document.getElementById('previewContainer');
        this.previewTable = document.getElementById('previewTable');
        
        this.currentData = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for file load
        window.addEventListener('fileLoaded', (e) => {
            this.currentData = e.detail;
            // Store the data in mapper for validation
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
