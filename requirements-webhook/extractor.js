/**
 * extractor.js
 * -------------
 * Reads text content from requirement files.
 * Primary target is .md but retains support for .xlsx / .docx / images
 * in case additional requirement files are tracked in the future.
 */
const fs = require('fs');
const path = require('path');

/**
 * Extract readable text from a file based on its extension.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractTextContent(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.md':
        case '.txt':
            return fs.readFileSync(filePath, 'utf-8');

        case '.xlsx': {
            const XLSX = require('xlsx');
            const wb = XLSX.readFile(filePath);
            const lines = [];
            for (const name of wb.SheetNames) {
                lines.push(`## Sheet: ${name}`);
                lines.push(XLSX.utils.sheet_to_csv(wb.Sheets[name]));
                lines.push('');
            }
            return lines.join('\n');
        }

        case '.docx': {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }

        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.gif': {
            const stat = fs.statSync(filePath);
            return `[Binary image – ${stat.size} bytes, modified ${new Date(stat.mtimeMs).toISOString()}]`;
        }

        default:
            return `[Unsupported format: ${ext}]`;
    }
}

module.exports = { extractTextContent };
