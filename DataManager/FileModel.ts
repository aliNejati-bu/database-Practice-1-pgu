import {conditionType, IFileModel, schemaType} from "./Abstraction/IFileModel";
import {BaseDataException} from "./Exception/BaseDataException";
import * as fs from "fs";
import path from "path";
import {dataManager} from "./DataManager";


export class FileModel implements IFileModel {
    public recordSize: number = 0; // as byte

    public headerSize: number = 0; // size of header

    public result: object | Array<any> = {}; // result of search or create

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
        this.recordSize += 5;
    }


    public prepareConnect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            fs.exists(this.filePath, async (ex) => {
                try {
                    if (!ex) {
                        // check for existing model file
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
                                references.push(this.schema[i].reference as string);
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

    public insertOne(data: object): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                let buffer = Buffer.alloc(0); // record buffer

                (data as any).id = await this.incrementId();


                for (let i = 0; i < this.schema.length; i++) { // iterate over all schema
                    let schemaBuffer: Buffer;

                    if (this.schema[i].type == "number" || this.schema[i].type == "reference") { // create buffer schema for int types

                        schemaBuffer = Buffer.alloc(4);

                        if (!data.hasOwnProperty(this.schema[i].name)) { // insert default if data not provide.

                            if (!this.schema[i].default) {
                                throw new BaseDataException("Col " + this.schema[i].name + " not defulte value.")
                            }

                            schemaBuffer.writeInt32BE(this.schema[i].default as number);
                        } else {

                            if (this.schema[i].unique) {
                                let all = await this.all();
                                let flag = all.some(value => value[this.schema[i].name] == (data as any)[this.schema[i].name]);
                                if (flag) {
                                    throw new BaseDataException("Col " + this.schema[i] + " is unique (" + (data as any)[this.schema[i].name] + ")")
                                }
                            }

                            if (typeof (data as any)[this.schema[i].name] != "number" || !Number.isInteger((data as any)[this.schema[i].name])) {
                                throw new BaseDataException("Col " + this.schema[i].name + " need int.");
                            } else {
                                schemaBuffer.writeInt32BE((data as any)[this.schema[i].name]);
                            }
                        }
                    } else { // create buffer for string type.

                        schemaBuffer = Buffer.alloc(128);

                        if (!data.hasOwnProperty(this.schema[i].name)) {// insert default if data not provide
                            if (!this.schema[i].default) {
                                throw new BaseDataException("Col " + this.schema[i].name + " not defulte value.")
                            }
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

                            if (this.schema[i].unique) {
                                let all = await this.all();
                                let flag = all.some(value => value[this.schema[i].name] == (data as any)[this.schema[i].name]);
                                if (flag) {
                                    throw new BaseDataException("Col " + this.schema[i].name + " is unique (" + (data as any)[this.schema[i].name] + ") model = " + this.name);
                                }
                            }

                            schemaBuffer.write((data as any)[this.schema[i].name], "ascii");
                        }


                    }
                    buffer = Buffer.concat([buffer, schemaBuffer]);
                }

                let isDeleteBuffer = Buffer.alloc(1);
                isDeleteBuffer.writeUint8(0);
                buffer = Buffer.concat([buffer, isDeleteBuffer]);

                if (buffer.length != this.recordSize) {
                    throw new BaseDataException("conflict buffer size.");
                }

                fs.appendFile(this.filePath, buffer, (err) => {
                    if (err) {
                        this.decrementId().then(() => {
                            reject(err);
                        });
                    } else {
                        let result = JSON.parse(JSON.stringify(data));
                        resolve(result);
                    }
                });
            } catch (e) {
                await this.decrementId();
                reject(e);
            }
        });
    }

    //TODO: add validator and, add default to result,check default that not exist.


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

    findById(id: number): Promise<any> {
        this.result = {};
        return new Promise<any>(async (resolve, reject) => {
            let position = this.headerSize + ((id - 1) * this.recordSize)
            fs.stat(this.filePath, (err, stats) => {
                if (err) return reject(err);

                if (stats.size < position + this.recordSize) {
                    return resolve(false);
                }


                fs.open(this.filePath, "r+", (err, fd) => {
                    fs.read(fd, Buffer.alloc(this.recordSize), 0, this.recordSize, position, async (err, bytesRead, buffer) => {
                        if (err) return reject(err);
                        let isdelete = buffer.readUInt8(this.recordSize - 1);
                        if (isdelete === 1) {
                            return resolve(false);
                        }
                        let result;
                        try {
                            result = await this.prepareResult(buffer);
                        } catch (e) {
                            return reject(e);
                        }
                        return resolve(result);
                    });
                });

            });
        });
    }


    private async prepareResult(buffer: Buffer) {
        let courses = 0;
        let result = {};
        for (let i = 0; i < this.schema.length; i++) {
            if (this.schema[i].type == "number") {
                let r = buffer.readInt32BE(courses);
                courses += 4;
                (result as any)[this.schema[i].name] = r;
            } else if (this.schema[i].type == "string") {
                let r = buffer.toString('ascii', courses, courses + 128).replace(/\0/g, '');
                courses += 128;

                (result as any)[this.schema[i].name] = r;
            } else {
                let id = buffer.readInt32BE(courses);
                courses += 4;
                let model = await dataManager.getModelSingleton(this.schema[i].reference as unknown as string);
                (result as any)[this.schema[i].name] = await model.findById(id);
            }
        }
        return result;
    }

    public async all(): Promise<Array<any>> {
        return new Promise((resolve, reject) => {
            fs.stat(this.filePath, async (err, stats) => {
                if (err) return reject(err);
                this.result = [];

                if (stats.size == this.headerSize) {
                    return resolve([]);
                }

                let recordsSize = stats.size - this.headerSize;
                let total = recordsSize / this.recordSize;
                let result = [];
                for (let i = 1; i <= total; i++) {
                    let res = (await this.findById(i));
                    if (res !== false) {
                        result.push(res);
                    }
                }
                return resolve(result);
            });
        });
    }

    async find(conditions: Array<Array<conditionType>>, isOne: boolean = false): Promise<Array<any>> {
        let all = await this.all();
        let result = [];

        for (let i = 0; i < all.length; i++) {
            let addResult = false;
            conditions.forEach(condGroup => {
                let lastFalse = false;
                if (addResult) {
                    return
                }
                condGroup.forEach(condition => {
                    let fieldPath = condition.field.split(".");
                    let value;
                    if (fieldPath.length == 1) {
                        value = all[i][fieldPath[0]];
                        if (!all[i].hasOwnProperty(condition.field)) {
                            throw new BaseDataException("field " + condition.field + " is not exist in " + this.name + " model.");
                        }
                    } else {
                        let current = all[i];
                        for (let j = 0; j < fieldPath.length; j++) {
                            if (current == false) {
                                break
                            }
                            if (!current.hasOwnProperty(fieldPath[j])) {
                                throw new BaseDataException("field " + condition.field + " is not exist in " + this.name + " model.");
                            }
                            current = current[fieldPath[j]];
                        }
                        value = current;
                    }


                    if (lastFalse) {
                        return;
                    }
                    switch (condition.op) {
                        case "=":
                            addResult = condition.value == value;
                            break;
                        case "!=":
                            addResult = condition.value != value;
                            break;
                        case "<":
                            addResult = (value as any) < condition.value;
                            break;
                        case ">":
                            addResult = (value as any) > condition.value;
                            break;
                        case "<=":
                            addResult = (value as any) <= condition.value;
                            break;
                        case ">=":
                            addResult = (value as any) >= condition.value;
                            break;
                    }

                    if (!addResult) {
                        lastFalse = true;
                    }
                })
            });
            if (addResult) {
                result.push(all[i]);
                if (isOne) {
                    return result;
                }
            }
        }
        return result;
    }


    updateById(data: any, id: number): Promise<any> {

        this.result = {};
        return new Promise<any>(async (resolve, reject) => {
            if (data.id) {
                return reject(new BaseDataException("can not edit id. model: " + this.name));
            }
            let positionRec = this.headerSize + ((id - 1) * this.recordSize)
            fs.stat(this.filePath, (err, stats) => {
                if (err) return reject(err);

                if (stats.size < positionRec + this.recordSize) {
                    return reject(new BaseDataException("In model: " + this.name + " id: " + id + " no exist."));
                }

                fs.open(this.filePath, "r+", (err, fd) => {
                    fs.read(fd, Buffer.alloc(this.recordSize), 0, this.recordSize, positionRec, async (err, bytesRead, buffer) => {
                        if (err) return reject(err);

                        let position = 0;
                        for (let i = 0; i < this.schema.length; i++) {
                            if (data.hasOwnProperty(this.schema[i].name)) {
                                if (this.schema[i].type == "string") {
                                    data[this.schema[i].name] = data[this.schema[i].name].toString();
                                    if (this.schema[i].unique) {
                                        let r = await this.findOne([[
                                            {
                                                field: this.schema[i].name,
                                                op: "=",
                                                value: data[this.schema[i].name]
                                            }
                                        ]]);
                                        if (r) {
                                            return reject(new BaseDataException("field " + this.schema[i].name + " is unique."));
                                        }
                                    }
                                    buffer.write(data[this.schema[i].name], position, 128, "ascii");
                                    position += 128;
                                } else {
                                    data[this.schema[i].name] = parseInt(data[this.schema[i].name]);
                                    if (this.schema[i].unique) {
                                        let r = await this.findOne([[
                                            {
                                                field: this.schema[i].name,
                                                op: "=",
                                                value: data[this.schema[i].name]
                                            }
                                        ]]);
                                        if (r) {
                                            return reject(new BaseDataException("field " + this.schema[i].name + " is unique."));
                                        }
                                    }
                                    buffer.writeInt32BE(data[this.schema[i].name], position);
                                    position += 4;
                                }
                            } else {
                                if (this.schema[i].type == "string") {
                                    position += 128;
                                } else {
                                    position += 4;
                                }
                            }
                        }
                        fs.write(fd, buffer, 0, this.recordSize, positionRec, async (err) => {
                            if (err) return reject(err);
                            resolve(await this.prepareResult(buffer));
                        });
                    });
                });

            });
        });
    }

    async findOne(conditions: Array<Array<conditionType>>): Promise<any> {
        return (await this.find(conditions, true))[0] ?? false;
    }

    deleteById(id: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let position = this.headerSize + ((id - 1) * this.recordSize);

            fs.stat(this.filePath, (err, stats) => {
                if (err) return reject(err);

                if (stats.size < position + this.recordSize) {
                    return resolve(false);
                }
                fs.open(this.filePath, 'r+', (err, fd) => {
                    if (err) return reject(err);

                    let ob = Buffer.alloc(1);
                    ob.writeUint8(1);
                    fs.write(fd, ob, 0, 1, position + (this.recordSize - 1), async (err) => {
                        if (err) return reject(err);
                        return resolve(true);
                    });

                });

            });
        });
    }

}

// TODO: add delete
//TODO: put comments.
// TODO: fix find all