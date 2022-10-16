import express from "express";
import {isAdminLogin} from "./Middleware/admin";
import {dataManager, DataManager} from "../../DataManager/DataManager";
import * as jwt from "jsonwebtoken";
import * as config from "../../Config/config.json";

let router = express.Router();

router.get("/", isAdminLogin, async (req, res, next) => {
    try {
        let model = await dataManager.getModelSingleton("admins");

        let user = await model.findById((req as any).token.id);


        return res.render("adminPanel", {
            isError: false,
            user
        });

    } catch (e) {
        console.log(e);
        res.send(e);
    }
});

router.get("/login", async (req, res, next) => {
    res.render("adminLogin", {isError: false});
});

router.post("/login", async (req, res) => {
    try {
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
    } catch (e) {
        console.log(e);
        res.send(e);
    }
});


router.get("/users", isAdminLogin, async (req, res) => {
    let UsersModel = await dataManager.getModelSingleton("users");
    let users = await UsersModel.all();

    res.render("users", {
        isError: false,
        isMessage: false,
        users
    });
});

export default router;