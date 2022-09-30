import {IFileModel, schemaType} from "./Abstraction/IFileModel";
import {BaseDataException} from "./Exception/BaseDataException";
import * as fs from "fs";
import path from "path";

// @ts-ignore
export class FileModel implements IFileModel {
    public recordSize: number = 0; //as byte

    constructor(public name: string,
                public schema: schemaType[]) {


        for (let i = 0; i < schema.length; i++) {
            if (schema[i].name == "id") {
                throw new BaseDataException('id coll invalid.');
            }
            if (schema[i].type == "number" || schema[i].type == "reference") {
                this.recordSize += 4;
            } else if (schema[i].type == "string") {
                this.recordSize += 100;
            }

            if (schema[i].type == "reference") {
                if (!schema[i].reference) {
                    throw new BaseDataException("on refrence type refrence bounder is need.");
                }
            }

            let moreThanAscii = schema[i].name
                .split("")
                .some(val => val.charCodeAt(0) > 127);

            if (moreThanAscii) {
                throw new BaseDataException("name: " + schema[i].name + " has char code more than ascii bytes.");
            }

            if (schema[i].name.length > 50) {
                throw new BaseDataException("name: " + schema[i].name + " most 50 byte.");
            }

        }
        schema.push({
            type: 'number',
            name: 'id'
        })
        this.recordSize += 4;
        this.createFile();
    }


    private async createFile() {
        fs.exists(path.join(".", "Data", this.name + ".mdb"), (ex) => {
            if (!ex) { // check for existing model file
                // create file if not exists.

                // create header buffer
                let header = Buffer.alloc(4); // first size for format


                header.write("%MDB", 0, 4, "ascii"); // write file header(format).

                header = Buffer.concat([header, Buffer.alloc(4)]); // concat 4byte after format for specify size of header in Uint32

                let schemaSize = 51 * this.schema.length; // set size of schema

                if (schemaSize > 4294967295) { // check size of schema
                    throw new BaseDataException("schema size overflow!(uint32)");
                }

                let schemaSizeBuffer = Buffer.alloc(4); // create buffer for store size of schema(UInt32)
                schemaSizeBuffer.writeUint32BE(schemaSize); // write size in buffer

                header = Buffer.concat([header, schemaSizeBuffer]); // concat schema size to buffer

                let references: Array<string> = [];

                // iterate over all schema elements for set schema table in header file
                for (let i = 0; i < this.schema.length; i++) {
                    let inLevelSchemaBuffer = Buffer.alloc(51); // create temp buffer for store in level schema

                    inLevelSchemaBuffer.write(this.schema[i].name, 0, 50, "ascii") // write name of schema level in buffer

                    // set type in 51st byte of schema buffer
                    if (this.schema[i].type == "number") {
                        inLevelSchemaBuffer.writeUint8(1, 50);
                    } else if (this.schema[i].type == "reference") {
                        inLevelSchemaBuffer.writeUint8(2, 50);
                        references.push((this.schema[i].reference as IFileModel).name);
                    } else {
                        inLevelSchemaBuffer.writeUint8(3, 50);
                    }
                    header = Buffer.concat([header, inLevelSchemaBuffer]); // concat schema buffer to header
                }
                for (let i = 0; i < references.length; i++) {
                    let tempBuffer = Buffer.alloc(50);
                    tempBuffer.write(references[i], 0, 50, "ascii");
                    header = Buffer.concat([header, tempBuffer]);
                }

                if (header.length > 4294967295) {
                    throw new BaseDataException("header size overflow!(uint32)");
                }
                header.writeUint32BE(header.length, 4);
                fs.writeFile(path.join(".", "Data", this.name + ".mdb"), header, (err) => {
                    if (err) throw err;
                });
            }
        });
    }
}
