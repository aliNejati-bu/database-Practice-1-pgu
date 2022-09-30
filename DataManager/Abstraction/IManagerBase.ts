import {IFileModel} from "./IFileModel";

type schemaType = {
    type: "string" | "number" | "reference",
    reference?: IFileModel,
    default?:unknown
};


export interface IFileManagerBase {
    defineSchema(name: string, schema: Array<schemaType>): IFileModel;
}