// 存储可撤销的命令栈
const undoStack = [];
// 存储可重做的命令栈
let redoStack = [];

// 限制栈的大小，防止内存溢出
const MAX_STACK_SIZE = 50;

// --- 1. 新增：监听器列表 (用于通知 UI 更新) ---
const listeners = [];

/**
 * 触发所有监听器，通知状态变化
 */
const notifyListeners = () => {
    listeners.forEach(callback => callback());
};

/**
 * 允许外部组件订阅状态变化
 * @param {Function} callback - 当历史记录改变时调用的函数
 * @returns {Function} 取消订阅的函数 (cleanup)
 */
export const subscribe = (callback) => {
    listeners.push(callback);
    // 返回清理函数，方便组件卸载时取消订阅
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    };
};


// --- 2. 核心逻辑 (已整合通知机制) ---

/**
 * 执行一个命令，并将其推入撤销栈
 * @param {Command} command - 遵循 Command 接口的对象
 */
export const executeCommand = (command) => {
    // 1. 执行命令的核心操作（修改状态）
    command.execute();

    // 2. 将命令推入撤销栈
    undoStack.push(command);

    // 3. 清空重做栈（因为执行了新操作，历史分支改变了）
    redoStack = [];

    // 4. 限制撤销栈大小
    if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift(); // 移除最旧的命令
    }

    // 5. 【关键】通知 UI 更新按钮状态
    notifyListeners();
};

/**
 * 撤销最近执行的一个命令
 */
export const undo = () => {
    if (undoStack.length === 0) {
        console.log("No more actions to undo.");
        return;
    }

    // 1. 从撤销栈取出最近的命令
    const command = undoStack.pop();

    // 2. 执行命令的撤销操作
    command.undo();

    // 3. 将命令推入重做栈
    redoStack.push(command);

    // 4. 【关键】通知 UI 更新按钮状态
    notifyListeners();
};

/**
 * 重做最近撤销的一个命令
 */
export const redo = () => {
    if (redoStack.length === 0) {
        console.log("No more actions to redo.");
        return;
    }

    // 1. 从重做栈取出最近的命令
    const command = redoStack.pop();

    // 2. 重新执行命令的核心操作
    command.execute();

    // 3. 将命令推入撤销栈
    undoStack.push(command);

    // 4. 【关键】通知 UI 更新按钮状态
    notifyListeners();
};

// 暴露状态查询函数，方便 UI 判断按钮是否可用
export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;