export type schemaType = {
    name: string,
    type: "string" | "number" | "reference",
    reference?: IFileModel,
    default?: unknown
};

export interface IFileModel {
    name: string;

    result: object;


    prepareConnect(): Promise<boolean>;

    insertOne(data: object): Promise<IFileModel>;

    findById(id: number): Promise<IFileModel>;
}