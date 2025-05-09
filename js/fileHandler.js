class FileHandler {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.mappingContainer = document.getElementById('mappingContainer');
        this.loadSampleButton = document.getElementById('loadSampleData');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Load sample data button
        this.loadSampleButton.addEventListener('click', async () => {
            try {
                window.uiManager.showLoading('Loading sample data...');
                const response = await fetch('/sample-data.csv');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const csvText = await response.text();
                if (!csvText.trim()) {
                    throw new Error('Sample data file is empty');
                }

                const blob = new Blob([csvText], { type: 'text/csv' });
                const file = new File([blob], 'sample-data.csv', { type: 'text/csv' });
                
                // Parse the CSV data first to validate it
                const data = await this.parseCSV(file);
                if (!data || !data.length) {
                    throw new Error('No valid data found in the sample file');
                }

                // If parsing succeeded, handle the file
                await this.handleFile(file);
                window.uiManager.showSuccess('Sample data loaded successfully!');
            } catch (error) {
                console.error('Error loading sample data:', error);
                window.uiManager.showError(
                    `Error loading sample data: ${error.message || 'Please try again'}`
                );
            }
        });

        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('border-blue-500');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('border-blue-500');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('border-blue-500');
            const files = e.dataTransfer.files;
            if (files.length) {
                this.handleFile(files[0]);
            }
        });

        // File input change event
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Click on dropzone or button
        this.dropZone.addEventListener('click', (e) => {
            // Prevent click if clicking on the button itself
            if (e.target.tagName !== 'BUTTON') {
                this.fileInput.click();
            }
        });

        // Prevent default browser behavior for drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
            this.dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Visual feedback for drag and drop
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('border-blue-500', 'bg-blue-50');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            });
        });
    }

    async handleFile(file) {
        try {
            // Validate file type
            const extension = file.name.split('.').pop().toLowerCase();
            if (!['csv', 'xls', 'xlsx'].includes(extension)) {
                window.uiManager.showError('Please upload a CSV or Excel file.');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                window.uiManager.showError('File size must be less than 10MB.');
                return;
            }

            // Show loading state with progress
            window.uiManager.showLoading(`Processing ${file.name}...`);
            this.fileName.textContent = file.name;
            this.fileInfo.classList.remove('hidden');

            // Add visual feedback for file processing
            this.dropZone.classList.add('opacity-50');
            this.dropZone.style.pointerEvents = 'none';

            let data;
            if (extension === 'csv') {
                data = await this.parseCSV(file);
            } else {
                data = await this.parseExcel(file);
            }

            // Validate data
            if (!data || !data.length) {
                throw new Error('File appears to be empty');
            }

            // Basic data validation
            const invalidRows = this.validateFileData(data);
            if (invalidRows.length > 0) {
                window.uiManager.showValidationErrors(invalidRows);
            }

            // Show success message
            window.uiManager.showSuccess('File loaded successfully!');
            
            // Show mapping sections with animation
            document.querySelectorAll('.mapping-section').forEach((section, index) => {
                setTimeout(() => {
                    section.classList.remove('hidden');
                    section.classList.add('animate-fade-in');
                }, index * 100);
            });
            
            // Dispatch event with parsed data
            window.dispatchEvent(new CustomEvent('fileLoaded', { detail: data }));

            // Smooth scroll to mapping section
            document.querySelector('.mapping-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } catch (error) {
            console.error('Error parsing file:', error);
            window.uiManager.showError(
                'Error parsing file: ' + (error.message || 'Please try again.')
            );
            this.fileInfo.classList.add('hidden');
        } finally {
            // Reset UI state
            this.dropZone.classList.remove('opacity-50');
            this.dropZone.style.pointerEvents = '';
            window.uiManager.hideLoading();
        }
    }

    validateFileData(data) {
        const invalidRows = [];
        
        data.forEach((row, index) => {
            const rowNumber = index + 1;
            const errors = [];

            // Check for empty or invalid values
            Object.entries(row).forEach(([column, value]) => {
                if (value === undefined || value === null || value === '') {
                    errors.push({
                        column,
                        value,
                        message: 'Empty or invalid value'
                    });
                }
            });

            if (errors.length > 0) {
                invalidRows.push({
                    row: rowNumber,
                    errors
                });
            }
        });

        return invalidRows;
    }

    // UI feedback methods now handled by UIManager

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => {
                    // Clean up header names
                    return header.trim();
                },
                transform: (value) => {
                    // Clean up cell values
                    return value.trim();
                },
                complete: (results) => {
                    if (results.errors.length) {
                        const errorMessages = results.errors.map(err => 
                            `Row ${err.row}: ${err.message}`
                        );
                        reject(new Error(errorMessages.join('\n')));
                    } else if (!results.data.length) {
                        reject(new Error('No data found in the file'));
                    } else {
                        // Handle column mapping for GTIN/EAN
                        const headers = results.meta.fields;
                        const hasGTIN = headers.includes('GTIN');
                        const hasEAN = headers.includes('EAN');

                        if (!hasGTIN && !hasEAN) {
                            reject(new Error('Missing required column: GTIN or EAN'));
                            return;
                        }

                        // If EAN column exists but no GTIN, map EAN to GTIN
                        let processedData = results.data;
                        if (!hasGTIN && hasEAN) {
                            processedData = results.data.map(row => {
                                // Convert numeric EAN to string with leading zeros
                                const eanValue = row.EAN;
                                if (!isNaN(eanValue)) {
                                    row.GTIN = eanValue.toString().padStart(13, '0');
                                } else {
                                    row.GTIN = eanValue;
                                }
                                return row;
                            });
                        }

                        // Clean and normalize the data
                        const cleanedData = processedData.map(row => {
                            const cleanRow = {};
                            Object.entries(row).forEach(([key, value]) => {
                                // Convert empty values to empty strings
                                if (value === undefined || value === null) {
                                    cleanRow[key] = '';
                                }
                                // Handle numeric values
                                else if (!isNaN(value)) {
                                    if (key === 'GTIN' || key === 'EAN') {
                                        cleanRow[key] = value.toString().padStart(13, '0');
                                    } else {
                                        cleanRow[key] = value.toString();
                                    }
                                }
                                // Clean string values
                                else if (typeof value === 'string') {
                                    cleanRow[key] = value.trim();
                                }
                                // Keep other values as is
                                else {
                                    cleanRow[key] = value;
                                }
                            });
                            return cleanRow;
                        });

                        resolve(cleanedData);
                    }
                },
                error: (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                }
            });
        });
    }

    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    if (!workbook.SheetNames.length) {
                        throw new Error('Excel file contains no sheets');
                    }

                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                        raw: false,
                        defval: ''
                    });

                    if (!jsonData.length) {
                        throw new Error('No data found in Excel file');
                    }

                    // Handle column mapping for GTIN/EAN
                    const headers = Object.keys(jsonData[0]);
                    const hasGTIN = headers.includes('GTIN');
                    const hasEAN = headers.includes('EAN');

                    if (!hasGTIN && !hasEAN) {
                        throw new Error('Missing required column: GTIN or EAN');
                    }

                    // If EAN column exists but no GTIN, map EAN to GTIN
                    if (!hasGTIN && hasEAN) {
                        jsonData = jsonData.map(row => {
                            // Convert numeric EAN to string with leading zeros
                            if (typeof row.EAN === 'number') {
                                row.GTIN = row.EAN.toString().padStart(13, '0');
                            } else {
                                row.GTIN = row.EAN;
                            }
                            return row;
                        });
                    }

                    // Clean and normalize the data
                    const cleanedData = jsonData.map(row => {
                        const cleanRow = {};
                        Object.entries(row).forEach(([key, value]) => {
                            // Convert empty values to empty strings
                            if (value === undefined || value === null) {
                                cleanRow[key] = '';
                            }
                            // Handle numeric values (like Excel numbers)
                            else if (typeof value === 'number') {
                                if (key === 'GTIN' || key === 'EAN') {
                                    cleanRow[key] = value.toString().padStart(13, '0');
                                } else {
                                    cleanRow[key] = value.toString();
                                }
                            }
                            // Clean string values
                            else if (typeof value === 'string') {
                                cleanRow[key] = value.trim();
                            }
                            // Keep other values as is
                            else {
                                cleanRow[key] = value;
                            }
                        });
                        return cleanRow;
                    });

                    resolve(cleanedData);
                } catch (error) {
                    reject(new Error(`Excel parsing error: ${error.message}`));
                }
            };
            reader.onerror = (error) => reject(new Error(`File reading error: ${error.message}`));
            reader.readAsArrayBuffer(file);
        });
    }
}

// Initialize FileHandler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileHandler = new FileHandler();
});
