// Data type validators
const validators = {
    gtin: {
        validate: (value) => {
            if (!value) return { valid: false, message: 'GTIN is required' };
            const cleanValue = value.toString().trim();
            if (!/^\d{12,13}$/.test(cleanValue)) {
                return { valid: false, message: 'GTIN must be 12 or 13 digits' };
            }
            return { valid: true };
        },
        type: 'string',
        required: true
    },
    price: {
        validate: (value) => {
            if (!value) return { valid: true }; // Optional field
            const num = parseFloat(value);
            if (isNaN(num) || num < 0) {
                return { valid: false, message: 'Price must be a positive number' };
            }
            return { valid: true };
        },
        type: 'number',
        required: false
    },
    date: {
        validate: (value) => {
            if (!value) return { valid: true }; // Optional field
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { valid: false, message: 'Invalid date format' };
            }
            return { valid: true };
        },
        type: 'date',
        required: false
    },
    email: {
        validate: (value) => {
            if (!value) return { valid: true }; // Optional field
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return { valid: false, message: 'Invalid email format' };
            }
            return { valid: true };
        },
        type: 'string',
        required: false
    },
    url: {
        validate: (value) => {
            if (!value) return { valid: true }; // Optional field
            try {
                new URL(value);
                return { valid: true };
            } catch {
                return { valid: false, message: 'Invalid URL format' };
            }
        },
        type: 'string',
        required: false
    }
};

// Column type definitions
const columnTypes = {
    gtin: {
        name: 'GTIN',
        validator: validators.gtin,
        example: '1234567890123'
    },
    price: {
        name: 'Price',
        validator: validators.price,
        example: '99.99'
    },
    date: {
        name: 'Date',
        validator: validators.date,
        example: '2024-01-30'
    },
    email: {
        name: 'Email',
        validator: validators.email,
        example: 'example@domain.com'
    },
    imageUrl: {
        name: 'Image URL',
        validator: validators.url,
        example: 'https://example.com/image.jpg'
    }
};

// Validation helper functions
const validateRow = (row, columnMapping) => {
    const errors = [];
    Object.entries(columnMapping).forEach(([sourceCol, targetCol]) => {
        const value = row[sourceCol];
        const columnType = columnTypes[targetCol];
        
        if (columnType && columnType.validator) {
            const result = columnType.validator.validate(value);
            if (!result.valid) {
                errors.push({
                    column: sourceCol,
                    value: value,
                    message: result.message
                });
            }
        }
    });
    return errors;
};

const validateDataset = (data, columnMapping) => {
    const errors = [];
    data.forEach((row, index) => {
        const rowErrors = validateRow(row, columnMapping);
        if (rowErrors.length > 0) {
            errors.push({
                row: index + 1,
                errors: rowErrors
            });
        }
    });
    return errors;
};

// Export validation utilities
window.dataValidation = {
    validators,
    columnTypes,
    validateRow,
    validateDataset
};
