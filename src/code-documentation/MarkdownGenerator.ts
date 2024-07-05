import fs from "fs";
import path from "path";
import DocumentGenerator from "./DocumentGenerator";
import Document from "./Document";
class MarkdownGenerator extends DocumentGenerator {
  private doc: any;

  constructor() {
    super();
    this.doc = "";
  }

  addMarkdownContent(markdown: any): void {
    this.doc += markdown;
  }

  async generate(document: any, filePath: any): Promise<void> {
    try {
      for (const [field, content] of Object.entries(document.getContent())) {
        this.addMarkdownContent(content);
      }

      const directory = path.dirname(filePath);
      await fs.promises.mkdir(directory, { recursive: true });

      await fs.promises.writeFile(filePath, this.doc);
      console.log("Markdown file has been created");
    } catch (error) {
      console.error("Error creating Markdown file:", error);
    }
  }
}

export default MarkdownGenerator;