class Document {
    private content: any;

    constructor() {
        this.content = {};
    }

    setContent(field: string, content: any): void {
        this.content[field] = content;
    }

    getContent(): any {
        return this.content;
    }
}

export default Document;