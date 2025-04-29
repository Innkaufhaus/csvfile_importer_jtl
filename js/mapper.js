class ColumnMapper {
    constructor() {
        this.mappingContainer = document.getElementById('mappingContainer');
        this.sourceColumns = document.getElementById('sourceColumns');
        this.targetColumns = document.getElementById('targetColumns');
        this.defaultValues = document.getElementById('defaultValues');
        this.validateButton = document.getElementById('validateMapping');
        this.currentData = null;
        
        // Standard target columns configuration
        // Standard product columns
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

        // Google meta fields with default values
        this.googleMetaFields = [
            { 
                id: 'meta_google_condition', 
                name: 'Google: Condition', 
                defaultValue: 'neu',
                readonly: true
            },
            { 
                id: 'meta_google_gender', 
                name: 'Google: Gender',
                options: ['male', 'female', 'unisex']
            },
            { 
                id: 'meta_google_size', 
                name: 'Google: Size'
            },
            { 
                id: 'meta_google_age_group', 
                name: 'Google: Age Group',
                options: ['newborn', 'infant', 'toddler', 'kids', 'adult']
            },
            { 
                id: 'meta_google_brand', 
                name: 'Google: Brand',
                linkedTo: 'lieferant'  // Automatically use Hersteller value
            },
            { 
                id: 'meta_google_tags', 
                name: 'Google: Tags'
            },
            { 
                id: 'meta_google_sku', 
                name: 'Google: SKU',
                linkedTo: 'han'  // Automatically use HAN value
            },
            { 
                id: 'meta_google_color', 
                name: 'Google: Color'
            }
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

        // Render default values sections
        const defaultValuesContainer = document.createElement('div');
        defaultValuesContainer.className = 'space-y-8';

        // Standard Fields Section
        const standardFieldsSection = document.createElement('div');
        standardFieldsSection.className = 'space-y-4';
        
        const standardTitle = document.createElement('h3');
        standardTitle.className = 'text-lg font-semibold text-gray-800';
        standardTitle.textContent = 'Standard Fields';
        standardFieldsSection.appendChild(standardTitle);

        const standardDescription = document.createElement('p');
        standardDescription.className = 'text-sm text-gray-600 mb-4';
        standardDescription.textContent = 'Set default values for unmapped or empty fields:';
        standardFieldsSection.appendChild(standardDescription);

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
            standardFieldsSection.appendChild(div);

            const input = div.querySelector('.default-value');
            input.addEventListener('input', () => {
                this.validateDefaultValue(input, div);
            });
        });

        // Google Meta Fields Section
        const googleFieldsSection = document.createElement('div');
        googleFieldsSection.className = 'space-y-4 mt-8';
        
        const googleTitle = document.createElement('h3');
        googleTitle.className = 'text-lg font-semibold text-gray-800';
        googleTitle.textContent = 'Google Meta Fields';
        googleFieldsSection.appendChild(googleTitle);

        const googleDescription = document.createElement('p');
        googleDescription.className = 'text-sm text-gray-600 mb-4';
        googleDescription.textContent = 'Configure Google Shopping meta fields:';
        googleFieldsSection.appendChild(googleDescription);

        this.googleMetaFields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-4 p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors';
            
            let input;
            if (field.options) {
                input = `
                    <select class="google-meta-value text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            data-field="${field.id}">
                        <option value="">-- Select ${field.name} --</option>
                        ${field.options.map(opt => `
                            <option value="${opt}">${opt}</option>
                        `).join('')}
                    </select>
                `;
            } else {
                input = `
                    <input type="text" 
                           class="google-meta-value text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                           data-field="${field.id}"
                           ${field.defaultValue ? `value="${field.defaultValue}"` : ''}
                           ${field.readonly ? 'readonly' : ''}
                           ${field.linkedTo ? 'disabled' : ''}
                           placeholder="${field.linkedTo ? 'Auto-filled from ' + field.linkedTo : 'Enter value'}">
                `;
            }

            div.innerHTML = `
                <label class="text-sm font-medium flex-1">
                    ${field.name}
                    ${field.linkedTo ? `
                        <span class="block text-xs text-gray-500">
                            Linked to ${field.linkedTo}
                        </span>
                    ` : ''}
                </label>
                ${input}
            `;
            googleFieldsSection.appendChild(div);
        });

        defaultValuesContainer.appendChild(standardFieldsSection);
        defaultValuesContainer.appendChild(googleFieldsSection);
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
        const targetColumn = select.value;
        const validationStatus = container.querySelector('.validation-status');
        const validationIcon = container.querySelector('.validation-icon');

        if (!targetColumn) {
            validationStatus.textContent = '';
            validationIcon.innerHTML = '';
            container.classList.remove('border-red-500', 'border-green-500');
            return;
        }

        // Show loading state
        window.uiManager.showLoading('Validating data...');

        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
            try {
                const columnType = window.dataValidation.columnTypes[targetColumn];
                if (columnType && columnType.validator && this.currentData) {
                    const errors = [];
                    this.currentData.forEach((row, index) => {
                        const value = row[sourceColumn];
                        const result = columnType.validator.validate(value);
                        if (!result.valid) {
                            errors.push({
                                row: index + 1,
                                value,
                                message: result.message
                            });
                        }
                    });

                    if (errors.length > 0) {
                        validationStatus.innerHTML = `
                            <div class="flex items-center space-x-2">
                                <span class="text-red-500">${errors.length} invalid values found</span>
                                <button class="text-blue-500 hover:text-blue-600 text-xs underline view-errors">
                                    View Details
                                </button>
                            </div>
                        `;
                        validationIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
                        container.classList.add('border-l-4', 'border-red-500');
                        container.classList.remove('border-green-500');

                        // Add click handler for viewing errors
                        container.querySelector('.view-errors').addEventListener('click', () => {
                            window.uiManager.showValidationErrors([{
                                row: 'Multiple',
                                errors: errors.map(err => ({
                                    column: sourceColumn,
                                    value: err.value,
                                    message: err.message
                                }))
                            }]);
                        });
                    } else {
                        validationStatus.innerHTML = `
                            <div class="flex items-center space-x-2">
                                <span class="text-green-500">All values valid</span>
                                <span class="text-xs text-gray-500">(${this.currentData.length} rows)</span>
                            </div>
                        `;
                        validationIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
                        container.classList.add('border-l-4', 'border-green-500');
                        container.classList.remove('border-red-500');
                    }
                }
            } catch (error) {
                console.error('Validation error:', error);
                window.uiManager.showError('Error validating data: ' + error.message);
            } finally {
                window.uiManager.hideLoading();
            }

            this.updateValidationSummary();
        }, 0);
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

    async validateAllMappings() {
        window.uiManager.showLoading('Validating all mappings...');

        try {
            const mapping = this.getMapping();
            const defaults = this.getDefaults();
            const errors = [];

            // Validate column mappings
            const mappingPromises = Array.from(document.querySelectorAll('.mapping-select'))
                .map(select => new Promise(resolve => {
                    this.validateMapping(select, select.closest('div.flex'));
                    resolve();
                }));

            // Validate default values
            const defaultPromises = Array.from(document.querySelectorAll('.default-value'))
                .map(input => new Promise(resolve => {
                    this.validateDefaultValue(input, input.closest('div.flex'));
                    resolve();
                }));

            // Wait for all validations to complete
            await Promise.all([...mappingPromises, ...defaultPromises]);

            // Collect all validation errors
            const validationErrors = [];
            document.querySelectorAll('.validation-status').forEach(status => {
                if (status.querySelector('.text-red-500')) {
                    const container = status.closest('div.flex');
                    const sourceColumn = container.querySelector('.mapping-select')?.dataset.source;
                    const errorText = status.textContent.trim();
                    validationErrors.push(`${sourceColumn}: ${errorText}`);
                }
            });

            // Update validation summary
            this.updateValidationSummary();

            // Show final validation result
            if (validationErrors.length === 0) {
                window.uiManager.showSuccess('All mappings are valid!');
                return true;
            } else {
                window.uiManager.showError(
                    'Validation failed. Please fix the errors before proceeding.',
                    7000
                );
                const summary = document.getElementById('validationSummary');
                summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return false;
            }
        } catch (error) {
            console.error('Validation error:', error);
            window.uiManager.showError('An error occurred during validation: ' + error.message);
            return false;
        } finally {
            window.uiManager.hideLoading();
        }
    }

    // UI feedback methods now handled by UIManager

    updateMapping() {
        const mapping = {};
        document.querySelectorAll('.mapping-select').forEach(select => {
            if (select.value) {
                mapping[select.dataset.source] = select.value;

                // Update linked Google meta fields
                this.googleMetaFields.forEach(field => {
                    if (field.linkedTo && field.linkedTo === select.value) {
                        const linkedInput = document.querySelector(`[data-field="${field.id}"]`);
                        if (linkedInput) {
                            linkedInput.value = select.value;
                        }
                    }
                });
            }
        });

        // Dispatch mapping updated event
        window.dispatchEvent(new CustomEvent('mappingUpdated', {
            detail: { 
                mapping,
                defaults: this.getDefaults(),
                googleMeta: this.getGoogleMetaValues()
            }
        }));

        // Validate the new mapping
        this.updateValidationSummary();
    }

    getGoogleMetaValues() {
        const values = {};
        document.querySelectorAll('.google-meta-value').forEach(input => {
            if (input.value) {
                values[input.dataset.field] = input.value;
            }
        });
        return values;
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
