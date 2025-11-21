// 这是 Command 接口的抽象实现

export class Command {
    constructor(name = 'GenericCommand') {
        this.name = name;
    }

    // 必须实现：执行操作（状态前进）
    execute() {
        throw new Error("Command.execute() must be implemented.");
    }

    // 必须实现：撤销操作（状态后退）
    undo() {
        throw new Error("Command.undo() must be implemented.");
    }
}