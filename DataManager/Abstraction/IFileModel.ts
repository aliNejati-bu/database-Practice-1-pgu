export type schemaType = {
    name: string,
    type: "string" | "number" | "reference",
    reference?: IFileModel,
    default?: unknown,
    unique?: boolean
};

export interface IFileModel {
    name: string;

    result: object | Array<any>;


    prepareConnect(): Promise<boolean>;

    insertOne(data: object): Promise<IFileModel>;

    findById(id: number): Promise<IFileModel>;

    all(): Promise<IFileModel>;

}