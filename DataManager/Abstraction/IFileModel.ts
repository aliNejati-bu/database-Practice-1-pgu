export type schemaType = {
    name: string,
    type: "string" | "number" | "reference",
    reference?: string,
    default?: unknown,
    unique?: boolean
};

export interface IFileModel {
    name: string;

    result: object | Array<any>;


    prepareConnect(): Promise<boolean>;

    insertOne(data: object): Promise<any>;

    findById(id: number): Promise<any>;

    all(): Promise<Array<any>>;

}