import {FileModel} from "./DataManager/FileModel";
import * as fs from "fs";
import {models} from "./DataManager/Models";
import {dataManager} from "./DataManager/DataManager";


console.log("ok")

async function a() {
    try {
        await dataManager.connect();
        let userModel = await dataManager.getModelSingleton("users");
        let stylistModel = await dataManager.getModelSingleton("stylists");
        let servicesModel = await dataManager.getModelSingleton("services");
        let serviceHistory = await dataManager.getModelSingleton("serviceHistory");
        /*await stylistModel.insertOne({
            name:"ali",
            age:44,
            class:5,
            password:"101020203030"
        });
        await stylistModel.insertOne({
            name:"reza",
            age:31,
            class:2,
            password:"101020203030"
        });
        await stylistModel.insertOne({
            name:"mohmmad",
            age:25,
            class:5,
            password:"101020203030"
        });

        await servicesModel.insertOne({
            name:"hc",
            price:136
        });
        await servicesModel.insertOne({
            name:"line",
            price:50
        });
        await servicesModel.insertOne({
            name:"hc02",
            price:500
        });

        await userModel.insertOne(
            {
                name:"user01",
                iat:parseInt((Date.now()/1000) as any),
                password:"1381"
            }
        );
        await userModel.insertOne(
            {
                name:"user02",
                iat:parseInt((Date.now()/1000) as any),
                password:"1381"
            }
        );
        await userModel.insertOne(
            {
                name:"user03",
                iat:parseInt((Date.now()/1000) as any),
                password:"1381"
            }
        );






        serviceHistory.insertOne({
            stylist:2,
            user:3,
            service:2,
            paid:0,
            iat:parseInt((Date.now()/1000) as any),
        });
*/
        console.log(await serviceHistory.findById(1))
    } catch (e) {
        console.log(e);
    }
}

a()



