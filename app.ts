import {FileModel} from "./DataManager/FileModel";
import * as fs from "fs";


console.log("ok")


/*let b = Buffer.alloc(2);
b[0] = 0xA5;
b[1] = 0xFF;

console.log(b)
console.log(b.readUint16BE())*/

let f = new FileModel("salam", [
    {
        name: "name",
        type: "string"
    },
    {
        name:"age",
        type:"number"
    }
]);




/*
f.prepareConnect().then(r=> {
    console.log(r)
    console.log(f.headerSize)
    f.insertOne({
        name:"ali",
        age:33
    } as any).then(r=>{
        console.log(r.result)
    });
    console.log(f.recordSize)
});
*/
