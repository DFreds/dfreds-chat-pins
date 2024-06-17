export default class Semaphore {
    constructor(max: number);

    get remaining(): number;

    get active(): number;

    add(fn: Function): Promise<void>;

    clear(): void;

    protected _try(): Promise<void>;
}
