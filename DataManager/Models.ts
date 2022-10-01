import {IFileModel} from "./Abstraction/IFileModel";
import {FileModel} from "./FileModel";

export let models: Array<() => Promise<IFileModel>> = [
    async () => {
        return new FileModel("stylists",
            [
                {
                    name: "name",
                    type: "string",
                    default: "noname",
                    unique: true
                },
                {
                    name: "age",
                    type: "number",
                    default: 0
                },
                {
                    name: "class",
                    default: 1,
                    type: "number"
                },
                {
                    name: "password",
                    type: "string"
                }
            ]);
    },
];