import {IFileModel} from "./IFileModel";

export interface IDataManager {
    getModel(name: string): Promise<IFileModel>;

    getModelSingleton(name: string): Promise<IFileModel>;

    connect(): Promise<boolean>;
}