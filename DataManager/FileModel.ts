import {IFileModel, schemaType} from "./Abstraction/IFileModel";
import {BaseDataException} from "./Exception/BaseDataException";
import * as fs from "fs";
import path from "path";


export class FileModel implements IFileModel {
    public recordSize: number = 0; // as byte

    public headerSize: number = 0; // size of header

    public result: object = {}; // result of search or create

    public filePath: string = path.join(".", "Data", this.name + ".mdb");


    constructor(public name: string,
                public schema: schemaType[]) {


        for (let i = 0; i < schema.length; i++) {
            if (schema[i].name == "id") {
                throw new BaseDataException('id coll invalid.');
            }
            if (schema[i].type == "number" || schema[i].type == "reference") {
                this.recordSize += 4;
            } else if (schema[i].type == "string") {
                this.recordSize += 128;
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


    }


    public prepareConnect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            fs.exists(this.filePath, async (ex) => {
                try {
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

                        let idCurrent = Buffer.alloc(4, 0x00); // buffer for store current id index
                        header = Buffer.concat([header, idCurrent]);

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


                        for (let i = 0; i < references.length; i++) { // create refrence section
                            let tempBuffer = Buffer.alloc(50); // each refrence 50byte
                            tempBuffer.write(references[i], 0, 50, "ascii");
                            header = Buffer.concat([header, tempBuffer]);
                        }

                        if (header.length > 4294967295) { // check length of header for control overflow
                            throw new BaseDataException("header size overflow!(uint32)");
                        }

                        header.writeUint32BE(header.length, 4); // write length of header in header buffer

                        fs.writeFile(this.filePath, header, (err) => { // save header buffer in head of file
                            if (err) return reject(err);
                            resolve(true);
                        });
                        this.headerSize = header.length;

                    } else { // if file exists

                        fs.open(this.filePath, 'r', (err, fd) => { // open file
                            if (err) return reject(err);

                            //read size of header
                            fs.read(fd, Buffer.alloc(4), 0, 4, 4, (err, bytesRead, buffer) => {
                                if (err) return reject(err);

                                this.headerSize = buffer.readUInt32BE();
                                resolve(true);
                            })
                        });

                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    public insertOne(data: object): Promise<IFileModel> {
        return new Promise(async (resolve, reject) => {
            try {
                let buffer = Buffer.alloc(0); // record buffer

                (data as any).id = await this.incrementId();


                for (let i = 0; i < this.schema.length; i++) { // iterate over all schema
                    let schemaBuffer: Buffer;

                    if (this.schema[i].type == "number" || this.schema[i].type == "reference") { // create buffer schema for int types

                        schemaBuffer = Buffer.alloc(4);

                        if (!data.hasOwnProperty(this.schema[i].name)) { // insert default if data not provide.
                            schemaBuffer.writeInt32BE(this.schema[i].default as number);
                        } else {
                            if (typeof (data as any)[this.schema[i].name] != "number" || !Number.isInteger((data as any)[this.schema[i].name])) {
                                throw new BaseDataException("Col " + this.schema[i].name + " need int.");
                            } else {
                                schemaBuffer.writeInt32BE((data as any)[this.schema[i].name]);
                            }
                        }

                    } else { // create buffer for string type.

                        schemaBuffer = Buffer.alloc(128);

                        if (!data.hasOwnProperty(this.schema[i].name)) { // insert default if data not provide
                            schemaBuffer.write(this.schema[i].default as string, "ascii");
                        }
                        if (typeof (data as any)[this.schema[i].name] != "string") {
                            throw new BaseDataException("Col " + this.schema[i].name + " need string.");
                        } else {
                            if (((data as any)[this.schema[i].name] as string).split("").some(val => val.charCodeAt(0) > 127)) {
                                throw new BaseDataException("Col " + (data as any)[this.schema[i].name] + " must ascii.");
                            }
                            if ((data as any)[this.schema[i].name].length > 128) {
                                throw new BaseDataException("Col " + (data as any)[this.schema[i].name] + " must 128byte.");
                            }
                            schemaBuffer.write((data as any)[this.schema[i].name], "ascii");
                        }


                    }
                    buffer = Buffer.concat([buffer, schemaBuffer]);
                }

                if (buffer.length != this.recordSize) {
                    throw new BaseDataException("conflict buffer size.");
                }

                fs.appendFile(this.filePath, buffer, (err) => {
                    if (err) {
                        this.decrementId().then(() => {
                            reject(err);
                        });
                    } else {
                        this.result = JSON.parse(JSON.stringify(data));
                        resolve(this);
                    }
                });
            } catch (e) {
                await this.decrementId();
                return reject(e);
            }

        });
    }


    /**
     * get current id (From 12 bytes of file to 4 bytes long)
     * @private
     */
    private getCurrentId(): Promise<number> {
        return new Promise((resolve, reject) => {
            fs.open(this.filePath, "r", (err, fd) => { // open file of model
                if (err) reject(err)

                // read file and save bytes in 4byte buffer and resolve readUInt32BE that buffer
                fs.read(fd, Buffer.alloc(4), 0, 4, 12, (err, bytesRead, buffer) => {
                    if (err) reject(err);
                    return resolve(buffer.readUInt32BE());

                });
            });
        });
    }

    private incrementId(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.getCurrentId().then((id) => {
                id = id + 1;

                let buffer = Buffer.alloc(4);
                buffer.writeUInt32BE(id);

                fs.open(this.filePath, 'r+', (err, fd) => {
                    fs.write(fd, buffer, 0, 4, 12, (err, written) => {
                        if (err) return reject(err);
                        return resolve(id)
                    });
                });
            }).catch(e => reject(e))
        });
    }

    private decrementId(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.getCurrentId().then((id) => {
                id = id - 1;

                let buffer = Buffer.alloc(4);
                console.log(id)
                buffer.writeUInt32BE(id);

                fs.open(this.filePath, 'r+', (err, fd) => {
                    fs.write(fd, buffer, 0, 4, 12, (err, written) => {
                        if (err) return reject(err);
                        return resolve(id)
                    });
                });
            }).catch(e => reject(e))
        });
    }
}
