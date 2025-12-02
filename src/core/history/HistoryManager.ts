import type { Command } from '../commands/Command';
// 可撤销的栈
const undoStack: Command[] = [];
// 可重做的栈
let redoStack: Command[] = [];
// 的大小
const MAX_STACK_SIZE = 50;

type Listener = () => void;
const listeners: Listener[] = [];

// 触发监听器
const notifyListeners = () => {
    listeners.forEach(callback => callback());
};

export const subscribe = (callback: Listener) => {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    };
};

export const executeCommand = (command: Command) => {
    if (!command) return;
    command.execute();
    undoStack.push(command);
    redoStack = [];
    if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift();
    }
    notifyListeners();
};

// 撤销最近执行的一个命令
export const undo = () => {
    if (undoStack.length === 0) return;

    const command = undoStack.pop();

    if (command) {
        command.undo();
        redoStack.push(command);
        notifyListeners();
    }
};

// 重做最近撤销的一个命令
export const redo = () => {
    if (redoStack.length === 0) return;

    // 从重做栈取出最近的命令
    const command = redoStack.pop();

    if (command) {
        command.execute();
        undoStack.push(command);
        notifyListeners();
    }
};

export const canUndo = (): boolean => undoStack.length > 0;
export const canRedo = (): boolean => redoStack.length > 0;