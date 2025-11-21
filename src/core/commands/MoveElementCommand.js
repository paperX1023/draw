// src/core/commands/MoveElementCommand.js
import { Command } from './Command';
import { useEditorState } from '../../composables/useEditorState';

export class MoveElementCommand extends Command {
    /**
     * @param {Array<Object>} elementMoves - 包含 { id, fromX, fromY, toX, toY } 的数组
     */
    constructor(elementMoves) {
        super('MoveElement');
        this.elementMoves = elementMoves;
    }

    // 执行
    execute() {
        const { updateElement } = useEditorState();

        this.elementMoves.forEach(move => {
            updateElement(move.id, {
                x: move.toX,
                y: move.toY
            });
        });
    }

    // 撤销
    undo() {
        const { updateElement } = useEditorState();

        this.elementMoves.forEach(move => {
            updateElement(move.id, {
                x: move.fromX,
                y: move.fromY
            });
        });
    }
}