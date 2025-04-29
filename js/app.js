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
            return processed;
        });

        // Add parent articles
        parentArticles.forEach(parent => {
            processedData.push({
                sku: parent.number,
                manufacturerNumber: parent.number,
                name: parent.description || `Parent Article ${parent.number}`,
                isParent: true,
                children: parent.children.map(child => child.sku || child.manufacturerNumber)
            });
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
                            <td class="px-4 py-2 text-sm">
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
