export type schemaType = {
    name: string,
    type: "string" | "number" | "reference",
    reference?: IFileModel,
    default?: unknown
};

export interface IFileModel {
    name: string;


    constructor(name: string, schema: Array<schemaType>): never;
}