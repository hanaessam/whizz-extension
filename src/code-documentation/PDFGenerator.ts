import PDFDocument from 'pdfkit';
import fs from 'fs';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import path from 'path';
import Document from './Document';
import DocumentGenerator from './DocumentGenerator';

class PDFGenerator extends DocumentGenerator{
  private doc: any;

  constructor() {
    super();
    this.doc = new PDFDocument();
    this.doc.font('../../media/Helvetica.ttf');
  }

  private async addMarkdownContent(markdown: any): Promise<void> {
    const htmlContent = await marked.parse(markdown);
    const dom = new JSDOM(htmlContent);
    const elements = dom.window.document.body.children;
  
    this.parseAndRender(elements);
  }

  private parseAndRender(elements: HTMLCollection): void {
    for (const element of elements) {
      switch (element.tagName.toLowerCase()) {
        case 'h1':
          this.doc.fontSize(24).text(element.textContent, { bold: true });
          break;
        case 'h2':
          this.doc.fontSize(20).text(element.textContent, { bold: true });
          break;
        case 'h3':
          this.doc.fontSize(18).text(element.textContent, { bold: true });
          break;
        case 'p':
          this.doc.fontSize(12).text(element.textContent);
          break;
        case 'ul':
          this.doc
            .fontSize(12)
            .list(Array.from(element.children).map((li) => li.textContent));
          break;
        default:
          this.doc.fontSize(12).text(element.textContent);
          break;
      }
      this.doc.moveDown();
    }
  }

  public async generate(document: any, filePath: any): Promise<void> {
    const directory = path.dirname(filePath);
    fs.mkdir(directory, (err) => {
      if (err) {
        console.error(err);
      }
    });

    for (const [field, content] of Object.entries(document.getContent())) {
      this.addMarkdownContent(content);
    }

    const writeStream = fs.createWriteStream(filePath);
    this.doc.pipe(writeStream);
    this.doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }
}

export default PDFGenerator;
