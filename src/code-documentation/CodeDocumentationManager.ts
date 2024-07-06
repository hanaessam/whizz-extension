import { promises as fs, existsSync } from 'fs';
import path from 'path';
import DocumentFieldManager from './DocumentFieldManager';
import PDFGenerator from './PDFGenerator';
// import DocxGenerator from './DocxGenerator.js';
import MarkdownGenerator from './MarkdownGenerator';
import Document from './Document';
import DocumentGenerator from './DocumentGenerator';

export interface DocumentationDetails {
  fields: string[];
  format: string;
  projectPath: string;
  projectSummary: string;
}

class CodeDocumentationManager {
  private document: Document | any;
  private fieldManager: DocumentFieldManager | any;

  constructor() { }

  async generateDocumentation(documentationDetails: DocumentationDetails): Promise<{ message: string }> {
    this.document = new Document();
    this.fieldManager = new DocumentFieldManager();

    const { fields, format, projectPath, projectSummary } = documentationDetails;
    if (!fields || !format || !projectPath || !projectSummary) {
      throw new Error("Fields, format, projectPath, and projectSummary are required");
    }

    fields.forEach((field) => {
      this.fieldManager.addField(field);
    });

    try {
      const fields = this.fieldManager.getFields();

      const dirPath = projectPath;
      console.log("dirPath", dirPath);

      // Ensure the directory exists
      if (!existsSync(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true });
      }

      const filePath = path.join(dirPath, `documentation.${format}`);


      if (format === 'pdf') {
        const pdfGenerator = new PDFGenerator();
        const content = await pdfGenerator.generateContent(
          projectPath,
          fields,
          format,
          projectSummary
        );
        this.document.setContent(fields, content);
        await pdfGenerator.generate(this.document, filePath);
        return { message: 'PDF documentation generated successfully.' };
        // } else if (format === 'docx') {
        //   const docxGenerator = new DocxGenerator();
        //   const content = await docxGenerator.generateContent(
        //     projectPath,
        //     fields,
        //     format,
        //     projectSummary
        //   );
        //   this.document.setContent(fields, content);
        //   await docxGenerator.generate(this.document, filePath);
        //   return { message: 'Docx documentation generated successfully.' };
        // } 
      } else if (format === 'md') {
        const markdownGenerator = new MarkdownGenerator();
        const content = await markdownGenerator.generateContent(
          projectPath,
          fields,
          format,
          projectSummary
        );
        this.document.setContent(fields, content);
        await markdownGenerator.generate(this.document, filePath);
        return { message: 'Markdown documentation generated successfully.' };
      }
      // Handle unsupported formats
      return { message: 'Unsupported documentation format provided.' };
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw new Error('Error generating documentation');
    }
  }
}

export default CodeDocumentationManager;
