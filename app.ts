import express from "express";
import * as config from "./Config/config.json";
import routeLogger from "./Server/routeLogger";


let app = express();

// set ejs for template engine
app.set('view engine', 'ejs');

// request logger
app.use(routeLogger);




/*
 * run server block
 */

let port = config.port; // get port from config
let server = config.server; // get sever addr from config


app.listen(port,server,()=>{
    console.log("Server started: http://"+server+":"+port); // start server
});