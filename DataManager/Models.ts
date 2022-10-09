import {IFileModel} from "./Abstraction/IFileModel";
import {FileModel} from "./FileModel";

export let models: Array<() => Promise<IFileModel>> = [
    async () => {
        let model = new FileModel("stylists",
            [
                {
                    name: "name",
                    type: "string",
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
        await model.prepareConnect();
        return model;
    },
    async () => {
        let model = new FileModel("services",
            [
                {
                    name: "name",
                    type: "string",
                    unique: true
                },
                {
                    name: "price",
                    type: "number",
                }
            ]);
        await model.prepareConnect();
        return model;
    },
    async () => {
        let model = new FileModel("users",
            [
                {
                    name: "name",
                    type: "string",
                    unique: true
                },
                {
                    name: "password",
                    type: "string",
                    default: "1234"
                },
                {
                    name: "iat",
                    type: "number"
                }
            ]);
        await model.prepareConnect();
        return model;
    },
    async () => {
        let model = new FileModel("serviceHistory",
            [
                {
                    name: "stylist",
                    type: "reference",
                    reference: "stylists"
                },
                {
                    name: "user",
                    type: "reference",
                    reference: "users"
                },
                {
                    name: "service",
                    type: "reference",
                    reference: "services"
                },
                {
                    name: "iat",
                    type: "number"
                },
                {
                    name: "paid",
                    type: "number"
                }
            ]);
        await model.prepareConnect();
        return model;
    },
    async () => {
        let model = new FileModel("admins",
            [
                {
                    name: "email",
                    type: "string",
                    unique: true
                },
                {
                    name: "password",
                    type: "string"
                }
            ]);
        await model.prepareConnect();
        return model;
    },

];