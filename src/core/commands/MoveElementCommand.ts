import { Command } from './Command';
import { useEditorStore } from '@/stores/editorStore';

interface IMoveData {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export class MoveElementCommand extends Command {
    private moves: IMoveData[];

    constructor(moves: IMoveData[]) {
        super('Move Element');
        this.moves = moves;
    }

    execute() {
        const store = useEditorStore();
        this.moves.forEach(m => {
            store.updateElement(m.id, { x: m.toX, y: m.toY });
        })
    }

    undo() {
        const store = useEditorStore();
        this.moves.forEach(m => {
            store.updateElement(m.id, { x: m.fromX, y: m.fromY });
        });
    }
}