class FileHandler {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.setupEventListeners();
    }

    setupEventListeners() {
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
    }

    async handleFile(file) {
        this.fileName.textContent = file.name;
        this.fileInfo.classList.remove('hidden');

        const extension = file.name.split('.').pop().toLowerCase();
        let data;

        try {
            if (extension === 'csv') {
                data = await this.parseCSV(file);
            } else if (['xls', 'xlsx'].includes(extension)) {
                data = await this.parseExcel(file);
            } else {
                throw new Error('Unsupported file type');
            }

            // Dispatch event with parsed data
            window.dispatchEvent(new CustomEvent('fileLoaded', { detail: data }));
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file. Please try again.');
        }
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (error) => {
                    reject(error);
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
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
}

// Initialize FileHandler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileHandler = new FileHandler();
});
