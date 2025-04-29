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
                this.showMessage('Loading sample data...', 'info');
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
                this.showMessage('Sample data loaded successfully!', 'success');
            } catch (error) {
                console.error('Error loading sample data:', error);
                this.showMessage(
                    `Error loading sample data: ${error.message || 'Please try again'}`, 
                    'error'
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
        // Validate file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['csv', 'xls', 'xlsx'].includes(extension)) {
            this.showMessage('Please upload a CSV or Excel file.', 'error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showMessage('File size must be less than 10MB.', 'error');
            return;
        }

        try {
            // Show loading state
            this.showMessage('Loading file...', 'info');
            this.fileName.textContent = file.name;
            this.fileInfo.classList.remove('hidden');

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

            // Show success message
            this.showMessage('File loaded successfully!', 'success');
            
            // Show mapping sections
            document.querySelectorAll('.mapping-section').forEach(section => {
                section.classList.remove('hidden');
            });
            
            // Dispatch event with parsed data
            window.dispatchEvent(new CustomEvent('fileLoaded', { detail: data }));

            // Scroll to mapping section
            document.querySelector('.mapping-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } catch (error) {
            console.error('Error parsing file:', error);
            this.showMessage(
                'Error parsing file: ' + (error.message || 'Please try again.'), 
                'error'
            );
            this.fileInfo.classList.add('hidden');
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
                        // Validate required columns
                        const requiredColumns = ['GTIN'];
                        const missingColumns = requiredColumns.filter(col => 
                            !results.meta.fields.includes(col)
                        );

                        if (missingColumns.length) {
                            reject(new Error(
                                `Missing required columns: ${missingColumns.join(', ')}`
                            ));
                        } else {
                            resolve(results.data);
                        }
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

                    // Validate required columns
                    const requiredColumns = ['GTIN'];
                    const headers = Object.keys(jsonData[0]);
                    const missingColumns = requiredColumns.filter(col => 
                        !headers.includes(col)
                    );

                    if (missingColumns.length) {
                        throw new Error(
                            `Missing required columns: ${missingColumns.join(', ')}`
                        );
                    }

                    resolve(jsonData);
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
