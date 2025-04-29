class VariantManager {
    constructor() {
        this.availableArticles = document.getElementById('availableArticles');
        this.selectedArticles = document.getElementById('selectedArticles');
        this.parentArticleNumber = document.getElementById('parentArticleNumber');
        this.parentDescription = document.getElementById('parentDescription');
        this.createParentButton = document.getElementById('createParentArticle');
        
        this.articles = [];
        this.parentArticles = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for file data
        window.addEventListener('fileLoaded', (e) => {
            this.handleFileData(e.detail);
        });

        // Listen for grouping method changes
        document.querySelectorAll('input[name="groupingMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleGroupingMethodChange(e.target.value);
            });
        });

        // Create parent article button
        this.createParentButton.addEventListener('click', () => {
            this.createParentArticle();
        });
    }

    handleFileData(data) {
        this.articles = data;
        this.renderAvailableArticles();
    }

    handleGroupingMethodChange(method) {
        if (method === 'manufacturer') {
            this.groupByManufacturer();
        } else {
            this.enableManualSelection();
        }
    }

    renderAvailableArticles() {
        this.availableArticles.innerHTML = '';
        this.articles.forEach((article, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer';
            div.innerHTML = `
                <input type="checkbox" class="article-checkbox" data-index="${index}">
                <span class="text-sm">${article.manufacturerNumber || article.sku || 'Article ' + (index + 1)}</span>
            `;
            this.availableArticles.appendChild(div);
        });

        // Add click handlers for article selection
        document.querySelectorAll('.article-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleArticleSelection(e.target);
            });
        });
    }

    handleArticleSelection(checkbox) {
        const index = parseInt(checkbox.dataset.index);
        const article = this.articles[index];
        
        if (checkbox.checked) {
            this.addToSelected(article, index);
        } else {
            this.removeFromSelected(index);
        }
    }

    addToSelected(article, index) {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-blue-50 rounded mb-2';
        div.dataset.index = index;
        div.innerHTML = `
            <span class="text-sm">${article.manufacturerNumber || article.sku || 'Article ' + (index + 1)}</span>
            <button class="remove-selected text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        div.querySelector('.remove-selected').addEventListener('click', () => {
            this.removeFromSelected(index);
            document.querySelector(`.article-checkbox[data-index="${index}"]`).checked = false;
        });
        
        this.selectedArticles.appendChild(div);
    }

    removeFromSelected(index) {
        const element = this.selectedArticles.querySelector(`[data-index="${index}"]`);
        if (element) {
            element.remove();
        }
    }

    groupByManufacturer() {
        // Group articles by manufacturer number
        const groups = {};
        this.articles.forEach((article, index) => {
            const mfgNumber = article.manufacturerNumber || '';
            if (!groups[mfgNumber]) {
                groups[mfgNumber] = [];
            }
            groups[mfgNumber].push({ article, index });
        });

        // Clear and update selected articles
        this.selectedArticles.innerHTML = '';
        Object.entries(groups).forEach(([mfgNumber, articles]) => {
            if (articles.length > 1) { // Only show groups with variants
                const groupDiv = document.createElement('div');
                groupDiv.className = 'mb-4 p-2 border rounded';
                groupDiv.innerHTML = `
                    <div class="font-medium mb-2">Group: ${mfgNumber}</div>
                    <div class="space-y-1">
                        ${articles.map(({ article, index }) => `
                            <div class="flex items-center justify-between p-1 bg-blue-50 rounded">
                                <span class="text-sm">${article.sku || 'Article ' + (index + 1)}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                this.selectedArticles.appendChild(groupDiv);
            }
        });
    }

    enableManualSelection() {
        // Clear selected articles and enable manual selection
        this.selectedArticles.innerHTML = '';
        document.querySelectorAll('.article-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    createParentArticle() {
        const number = this.parentArticleNumber.value.trim();
        const description = this.parentDescription.value.trim();
        
        if (!number) {
            alert('Please enter a parent article number');
            return;
        }

        const selectedIndices = Array.from(this.selectedArticles.querySelectorAll('[data-index]'))
            .map(el => parseInt(el.dataset.index));
        
        if (selectedIndices.length === 0) {
            alert('Please select child articles');
            return;
        }

        const parentArticle = {
            number,
            description,
            children: selectedIndices.map(index => this.articles[index])
        };

        this.parentArticles.push(parentArticle);
        
        // Clear form
        this.parentArticleNumber.value = '';
        this.parentDescription.value = '';
        this.enableManualSelection();

        // Dispatch event for parent article creation
        window.dispatchEvent(new CustomEvent('parentArticleCreated', {
            detail: { parentArticle }
        }));
    }

    getParentArticles() {
        return this.parentArticles;
    }
}

// Initialize VariantManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.variantManager = new VariantManager();
});
