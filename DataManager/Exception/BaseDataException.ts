export class BaseDataException extends Error {
    constructor(msg: string) {
        super('Base data error: ' + msg);
    }
}