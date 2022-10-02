import {IDataManager} from "./Abstraction/IDataManager";
import {IFileModel} from "./Abstraction/IFileModel";
import {models} from "./Models";
import {BaseDataException} from "./Exception/BaseDataException";

export class DataManager implements IDataManager {

    public models: object = {};

    public transientModels: object = {};

    public originalModel: Array<() => Promise<IFileModel>> = [];

    constructor() {
        this.originalModel = models;
    }

    async getModel(name: string): Promise<IFileModel> {
        if (this.models.hasOwnProperty(name)) {
            return ((this.transientModels as any)[name]());
        } else {
            throw new BaseDataException("Model " + name + " not founded.");
        }
    }

    async getModelSingleton(name: string): Promise<IFileModel> {
        if (this.models.hasOwnProperty(name)) {
            return ((this.models as any)[name] as IFileModel);
        } else {
            throw new BaseDataException("Model " + name + " not founded.");
        }
    }

    async connect(): Promise<boolean> {
        for (let i = 0; i < this.originalModel.length; i++) {
            let model = await this.originalModel[i]();
            await model.prepareConnect();
            (this.models as any)[model.name] = model;
            (this.transientModels as any)[model.name] = this.originalModel[i];
        }
        return true;
    }
}

export let dataManager = new DataManager();