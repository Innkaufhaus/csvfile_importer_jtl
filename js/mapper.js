class ColumnMapper {
    constructor() {
        this.mappingContainer = document.getElementById('mappingContainer');
        this.sourceColumns = document.getElementById('sourceColumns');
        this.targetColumns = document.getElementById('targetColumns');
        this.defaultValues = document.getElementById('defaultValues');
        this.validateButton = document.getElementById('validateMapping');
        this.currentData = null;
        
        // Standard target columns configuration
        this.standardColumns = [
            { id: 'gtin', name: 'GTIN', required: true, validate: this.validateGTIN },
            { id: 'han', name: 'HAN', required: false },
            { id: 'lieferant', name: 'Lieferant', required: false },
            { id: 'artikelname', name: 'Artikelname', required: true },
            { id: 'kurzbeschreibung', name: 'Kurzbeschreibung', required: false },
            { id: 'beschreibung', name: 'Beschreibung', required: false },
            { id: 'titel_tag', name: 'Titel-Tag (SEO)', required: false },
            { id: 'meta_description', name: 'Meta-Description (SEO)', required: false },
            { id: 'brutto_vk', name: 'Brutto-VK', required: true },
            { id: 'uvp', name: 'UVP', required: false },
            { id: 'einkaufspreis', name: 'Durchschnittlicher Einkaufspreis', required: false },
            { id: 'steuerklasse', name: 'Steuerklasse', required: false },
            { id: 'steuersatz', name: 'Steuersatz in %', required: false },
            { id: 'gewicht', name: 'Artikelgewicht', required: false },
            { id: 'breite', name: 'Breite', required: false },
            { id: 'hoehe', name: 'Höhe', required: false },
            { id: 'laenge', name: 'Länge', required: false },
            { id: 'bild1', name: 'Bild 1 Pfad/Url', required: false },
            { id: 'bild2', name: 'Bild 2 Pfad/Url', required: false },
            { id: 'bild3', name: 'Bild 3 Pfad/Url', required: false },
            { id: 'bild4', name: 'Bild 4 Pfad/Url', required: false },
            { id: 'bild5', name: 'Bild 5 Pfad/Url', required: false }
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('fileLoaded', (e) => {
            this.currentData = e.detail;
            this.handleFileData(e.detail);
        });

        if (this.validateButton) {
            this.validateButton.addEventListener('click', () => {
                this.validateAllMappings();
            });
        }
    }

    validateGTIN(value) {
        if (!value) return false;
        
        // Remove any whitespace
        const cleanValue = value.toString().trim();
        
        // Check if it's 12 or 13 digits
        if (!/^\d{12,13}$/.test(cleanValue)) {
            return false;
        }
        
        return true;
    }

    handleFileData(data) {
        if (!data || !data.length) return;
        
        // Get source columns from the first row
        const sourceColumns = Object.keys(data[0]);
        this.renderMappingInterface(sourceColumns);

        // Show all mapping sections
        document.querySelectorAll('.mapping-section').forEach(section => {
            section.classList.remove('hidden');
        });
    }

    renderMappingInterface(sourceColumns) {
        // Clear previous content
        this.sourceColumns.innerHTML = '';
        this.targetColumns.innerHTML = '';
        this.defaultValues.innerHTML = '';

        // Create mapping container
        const mappingContainer = document.createElement('div');
        mappingContainer.className = 'space-y-4';

        // Group required and optional columns
        const requiredColumns = this.standardColumns.filter(col => col.required);
        const optionalColumns = this.standardColumns.filter(col => !col.required);

        // Render source columns with validation status
        sourceColumns.forEach(column => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2 p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors';
            div.innerHTML = `
                <div class="flex-1">
                    <span class="text-sm font-medium">${column}</span>
                    <div class="validation-status text-xs mt-1"></div>
                </div>
                <i class="fas fa-arrow-right text-gray-400"></i>
                <div class="flex-1">
                    <select class="mapping-select w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                            data-source="${column}">
                        <option value="">-- Select Target --</option>
                        ${requiredColumns.length > 0 ? `
                            <optgroup label="Required Fields">
                                ${requiredColumns.map(target => 
                                    `<option value="${target.id}">${target.name} *</option>`
                                ).join('')}
                            </optgroup>
                        ` : ''}
                        ${optionalColumns.length > 0 ? `
                            <optgroup label="Optional Fields">
                                ${optionalColumns.map(target => 
                                    `<option value="${target.id}">${target.name}</option>`
                                ).join('')}
                            </optgroup>
                        ` : ''}
                    </select>
                </div>
                <div class="validation-icon w-6 text-center"></div>
            `;
            mappingContainer.appendChild(div);

            // Add change event listener for immediate validation
            const select = div.querySelector('.mapping-select');
            select.addEventListener('change', () => {
                this.validateMapping(select, div);
            });
        });

        this.sourceColumns.appendChild(mappingContainer);

        // Render default values section with improved UI
        const defaultValuesContainer = document.createElement('div');
        defaultValuesContainer.className = 'space-y-4';

        // Add description for default values
        const description = document.createElement('p');
        description.className = 'text-sm text-gray-600 mb-4';
        description.textContent = 'Set default values for unmapped or empty fields:';
        defaultValuesContainer.appendChild(description);

        this.standardColumns.forEach(column => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-4 p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors';
            div.innerHTML = `
                <label class="text-sm font-medium flex-1">
                    ${column.name}
                    ${column.required ? '<span class="text-red-500">*</span>' : ''}
                    <span class="block text-xs text-gray-500">
                        ${column.required ? 'Required' : 'Optional'}
                    </span>
                </label>
                <input type="text" 
                       class="default-value text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                       data-column="${column.id}"
                       placeholder="Enter default value">
            `;
            defaultValuesContainer.appendChild(div);

            // Add change event listener for immediate validation
            const input = div.querySelector('.default-value');
            input.addEventListener('input', () => {
                this.validateDefaultValue(input, div);
            });
        });

        this.defaultValues.appendChild(defaultValuesContainer);

        // Add validation summary section
        const validationSummary = document.createElement('div');
        validationSummary.id = 'validationSummary';
        validationSummary.className = 'mt-6 p-4 rounded border border-gray-200 hidden';
        this.defaultValues.appendChild(validationSummary);

        // Add validate button with improved styling
        const validateButton = document.createElement('button');
        validateButton.className = 'mt-6 w-full bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors';
        validateButton.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            Validate Mappings
        `;
        validateButton.addEventListener('click', () => this.validateAllMappings());
        this.defaultValues.appendChild(validateButton);
    }

    validateMapping(select, container) {
        const sourceColumn = select.dataset.source;
        const targetColumn = this.standardColumns.find(col => col.id === select.value);
        const validationStatus = container.querySelector('.validation-status');
        const validationIcon = container.querySelector('.validation-icon');

        if (!select.value) {
            validationStatus.textContent = '';
            validationIcon.innerHTML = '';
            container.classList.remove('border-red-500', 'border-green-500');
            return;
        }

        if (targetColumn && targetColumn.validate && this.currentData) {
            const invalidValues = [];
            this.currentData.forEach((row, index) => {
                const value = row[sourceColumn];
                if (!targetColumn.validate(value)) {
                    invalidValues.push({ row: index + 1, value });
                }
            });

            if (invalidValues.length > 0) {
                validationStatus.textContent = `Invalid values found in ${invalidValues.length} rows`;
                validationStatus.className = 'text-xs text-red-500 mt-1';
                validationIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
                container.classList.add('border-l-4', 'border-red-500');
            } else {
                validationStatus.textContent = 'All values valid';
                validationStatus.className = 'text-xs text-green-500 mt-1';
                validationIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
                container.classList.add('border-l-4', 'border-green-500');
            }
        }

        this.updateValidationSummary();
    }

    validateDefaultValue(input, container) {
        const targetColumn = this.standardColumns.find(col => col.id === input.dataset.column);
        
        if (!input.value) {
            container.classList.remove('border-red-500', 'border-green-500');
            return;
        }

        if (targetColumn && targetColumn.validate) {
            const isValid = targetColumn.validate(input.value);
            if (!isValid) {
                container.classList.add('border-l-4', 'border-red-500');
                container.classList.remove('border-green-500');
            } else {
                container.classList.add('border-l-4', 'border-green-500');
                container.classList.remove('border-red-500');
            }
        }

        this.updateValidationSummary();
    }

    updateValidationSummary() {
        const summary = document.getElementById('validationSummary');
        const errors = [];
        const warnings = [];

        // Check required fields
        this.standardColumns.forEach(column => {
            if (column.required) {
                const hasMapping = Array.from(document.querySelectorAll('.mapping-select'))
                    .some(select => select.value === column.id);
                const hasDefault = document.querySelector(`.default-value[data-column="${column.id}"]`)?.value;
                
                if (!hasMapping && !hasDefault) {
                    errors.push(`Required field "${column.name}" must be mapped or have a default value`);
                }
            }
        });

        // Check validation errors
        document.querySelectorAll('.validation-status').forEach(status => {
            if (status.classList.contains('text-red-500')) {
                errors.push(status.textContent);
            }
        });

        if (errors.length > 0 || warnings.length > 0) {
            summary.innerHTML = `
                ${errors.length > 0 ? `
                    <div class="text-red-500 mb-2">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        <strong>Errors:</strong>
                        <ul class="list-disc list-inside ml-4">
                            ${errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${warnings.length > 0 ? `
                    <div class="text-yellow-500">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Warnings:</strong>
                        <ul class="list-disc list-inside ml-4">
                            ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            `;
            summary.classList.remove('hidden');
        } else {
            summary.classList.add('hidden');
        }
    }

    validateAllMappings() {
        const mapping = this.getMapping();
        const defaults = this.getDefaults();
        const errors = [];
        let hasValidationErrors = false;

        // Validate all mappings
        document.querySelectorAll('.mapping-select').forEach(select => {
            this.validateMapping(select, select.closest('div.flex'));
            if (select.closest('div.flex').querySelector('.text-red-500')) {
                hasValidationErrors = true;
            }
        });

        // Validate all default values
        document.querySelectorAll('.default-value').forEach(input => {
            this.validateDefaultValue(input, input.closest('div.flex'));
            if (input.closest('div.flex').classList.contains('border-red-500')) {
                hasValidationErrors = true;
            }
        });

        // Update validation summary
        this.updateValidationSummary();

        // Show final validation result
        const summary = document.getElementById('validationSummary');
        if (!hasValidationErrors && !summary.querySelector('.text-red-500')) {
            this.showMessage('All mappings are valid!', 'success');
            return true;
        } else {
            this.showMessage('Please fix validation errors before proceeding.', 'error');
            summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return false;
        }
    }

    showMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast fixed top-4 right-4 p-4 rounded shadow-lg ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
        } text-white flex items-center space-x-2 z-50`;

        // Add icon based on message type
        const icon = document.createElement('i');
        icon.className = `fas fa-${
            type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-circle' :
            'info-circle'
        }`;
        messageDiv.appendChild(icon);

        const text = document.createElement('span');
        text.textContent = message;
        messageDiv.appendChild(text);

        document.body.appendChild(messageDiv);

        // Animate the message
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-20px)';
        messageDiv.style.transition = 'all 0.3s ease-in-out';

        // Force reflow
        messageDiv.offsetHeight;

        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';

        // Remove after delay
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(-20px)';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    updateMapping() {
        const mapping = {};
        document.querySelectorAll('.mapping-select').forEach(select => {
            if (select.value) {
                mapping[select.dataset.source] = select.value;
            }
        });

        // Dispatch mapping updated event
        window.dispatchEvent(new CustomEvent('mappingUpdated', {
            detail: { 
                mapping,
                defaults: this.getDefaults()
            }
        }));

        // Validate the new mapping
        this.updateValidationSummary();
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
