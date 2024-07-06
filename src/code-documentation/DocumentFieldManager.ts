class DocumentFieldManager {
    private fields: string[];

    constructor() {
        this.fields = [];
    }

    addField(field: string): void {
        this.fields.push(field);
    }

    getFields(): string[] {
        return this.fields;
    }
}

export default DocumentFieldManager;