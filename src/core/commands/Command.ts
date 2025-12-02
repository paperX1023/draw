export abstract class Command {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract execute(): void;
    abstract undo(): void;
}