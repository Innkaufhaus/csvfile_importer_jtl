class ColumnMapper {
    constructor() {
        this.mappingContainer = document.getElementById('mappingContainer');
        this.sourceColumns = document.getElementById('sourceColumns');
        this.targetColumns = document.getElementById('targetColumns');
        this.defaultValues = document.getElementById('defaultValues');
        
        // Standard target columns configuration
        this.standardColumns = [
            { id: 'sku', name: 'SKU', required: true },
            { id: 'manufacturerNumber', name: 'Manufacturer Number', required: true },
            { id: 'name', name: 'Product Name', required: true },
            { id: 'description', name: 'Description', required: false },
            { id: 'price', name: 'Price', required: true },
            { id: 'category', name: 'Category', required: false },
            { id: 'size', name: 'Size', required: false },
            { id: 'color', name: 'Color', required: false },
            { id: 'weight', name: 'Weight', required: false },
            { id: 'stock', name: 'Stock', required: false }
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('fileLoaded', (e) => {
            this.handleFileData(e.detail);
        });
    }

    handleFileData(data) {
        if (!data || !data.length) return;
        
        // Get source columns from the first row
        const sourceColumns = Object.keys(data[0]);
        this.renderMappingInterface(sourceColumns);
    }

    renderMappingInterface(sourceColumns) {
        // Clear previous content
        this.sourceColumns.innerHTML = '';
        this.targetColumns.innerHTML = '';
        this.defaultValues.innerHTML = '';

        // Render source columns
        sourceColumns.forEach(column => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2 p-2 bg-gray-50 rounded';
            div.innerHTML = `
                <span class="text-sm">${column}</span>
                <i class="fas fa-arrow-right text-gray-400"></i>
                <select class="mapping-select flex-1 text-sm rounded border-gray-300" data-source="${column}">
                    <option value="">-- Select Target --</option>
                    ${this.standardColumns.map(target => 
                        `<option value="${target.id}">${target.name}${target.required ? ' *' : ''}</option>`
                    ).join('')}
                </select>
            `;
            this.sourceColumns.appendChild(div);
        });

        // Render default values section
        this.standardColumns.forEach(column => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2 p-2';
            div.innerHTML = `
                <label class="text-sm flex-1">${column.name}${column.required ? ' *' : ''}</label>
                <input type="text" 
                       class="default-value text-sm rounded border-gray-300" 
                       data-column="${column.id}"
                       placeholder="Default value">
            `;
            this.defaultValues.appendChild(div);
        });

        // Add event listeners for mapping changes
        document.querySelectorAll('.mapping-select').forEach(select => {
            select.addEventListener('change', () => this.updateMapping());
        });
    }

    updateMapping() {
        const mapping = {};
        document.querySelectorAll('.mapping-select').forEach(select => {
            if (select.value) {
                mapping[select.dataset.source] = select.value;
            }
        });

        // Get default values
        const defaults = {};
        document.querySelectorAll('.default-value').forEach(input => {
            if (input.value) {
                defaults[input.dataset.column] = input.value;
            }
        });

        // Dispatch mapping updated event
        window.dispatchEvent(new CustomEvent('mappingUpdated', {
            detail: { mapping, defaults }
        }));
    }

    getMapping() {
        const mapping = {};
        document.querySelectorAll('.mapping-select').forEach(select => {
            if (select.value) {
                mapping[select.dataset.source] = select.value;
            }
        });
        return mapping;
    }

    getDefaults() {
        const defaults = {};
        document.querySelectorAll('.default-value').forEach(input => {
            if (input.value) {
                defaults[input.dataset.column] = input.value;
            }
        });
        return defaults;
    }
}

// Initialize ColumnMapper when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.columnMapper = new ColumnMapper();
});
