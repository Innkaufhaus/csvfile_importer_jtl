# File Mapper

A web-based tool for mapping and standardizing CSV/XLS files with parent-child article management capabilities.

## Features

- Upload CSV, XLS, and XLSX files
- Map columns to standardized format
- Set default values for missing fields
- Create parent-child article relationships
- Export standardized CSV files
- Modern, responsive interface with Tailwind CSS

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: None required

## Usage Instructions

1. **Upload File**
   - Drag and drop your CSV/XLS file or click "Browse Files"
   - Supported formats: CSV, XLS, XLSX

2. **Map Columns**
   - Match source columns to target columns
   - Required fields are marked with an asterisk (*)

3. **Set Default Values**
   - Configure default values for unmapped or empty fields
   - Values will be applied when no mapping exists

4. **Manage Parent-Child Articles**
   - Group by manufacturer number automatically
   - Or manually select articles to create parent-child relationships
   - Enter parent article details
   - Create multiple parent articles as needed

5. **Export**
   - Preview the mapped data
   - Export to standardized CSV format
   - Parent-child relationships are preserved in the export

## Technical Details

- Frontend: HTML5, Tailwind CSS, JavaScript
- File Processing: Papa Parse (CSV), SheetJS (Excel)
- Server: Node.js, Express
- Styling: Tailwind CSS, Font Awesome icons, Google Fonts

## License

MIT License
