import {FileModel} from "./DataManager/FileModel";


console.log("ok")


/*let b = Buffer.alloc(2);
b[0] = 0xA5;
b[1] = 0xFF;

console.log(b)
console.log(b.readUint16BE())*/


let f = new FileModel("test", [
    {
        name: "name",
        type: "string"
    }
]);
