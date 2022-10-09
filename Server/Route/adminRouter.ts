import express from "express";
import {isAdminLogin} from "./Middleware/admin";
import {dataManager, DataManager} from "../../DataManager/DataManager";

let router = express.Router();

router.get("/", isAdminLogin, (req, res, next) => {

});

router.get("/login", (req, res, next) => {
    res.render("adminLogin");
});



export default router;