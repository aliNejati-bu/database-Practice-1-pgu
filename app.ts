import express from "express";
import * as config from "./Config/config.json";
import routeLogger from "./Server/routeLogger";
import cookieParser from "cookie-parser";
import adminRouter from "./Server/Route/adminRouter";
import bodyParser from "body-parser";
import stylistRouter from "./Server/Route/stylistRouter";
import {dataManager} from "./DataManager/DataManager";

dataManager.connect().then(() => {

    let app = express();

// set ejs for template engine
    app.set('view engine', 'ejs');

// request logger
    app.use(routeLogger);

// set public folder for public files
    app.use(express.static('public'))

// add cookieParser
    app.use(cookieParser());


    app.use(bodyParser.urlencoded());
    app.use(bodyParser.json());


    app.get("/", (req, res) => {
        res.cookie("test", "value", {expire: 360000 + Date.now()} as any);
        res.render('index');
    });


    app.use("/admin", adminRouter);
    app.use("/stylist", stylistRouter);

    /*
     * run server block
     */

    let port = config.port; // get port from config
    let server = config.server; // get sever addr from config


    app.listen(port, server, () => {
        console.log("Server started: http://" + server + ":" + port); // start server
    });

}).catch(e => console.log(e))