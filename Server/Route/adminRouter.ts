import express from "express";
import {isAdminLogin} from "./Middleware/admin";
import {dataManager, DataManager} from "../../DataManager/DataManager";
import * as jwt from "jsonwebtoken";
import * as config from "../../Config/config.json";

let router = express.Router();

router.get("/", isAdminLogin, (req, res, next) => {
    res.send("ok");
});

router.get("/login", async (req, res, next) => {
    res.render("adminLogin", {isError: false});
});

router.post("/login", async (req, res) => {
    try{
        let model = await dataManager.getModelSingleton("admins");
        let userName = req.body.name;
        let password = req.body.password;
        let user = await model.findOne([
            [
                {
                    field: 'email',
                    op: '=',
                    value: userName
                },
                {
                    field: "password",
                    op: "=",
                    value: password
                }
            ]
        ]);

        if (!user) {
            return res.render("adminLogin", {isError: true, error: "user name and password not match."});
        } else {
            let token = jwt.sign({
                id: user.id
            }, config.secret);
            res.cookie("adminToken", token, {expire: 360000 * Date.now()} as any);
            res.redirect("/admin");
        }
    }catch (e){
        console.log(e);
        res.send(e);
    }
});


export default router;