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

    let et = "";
    let e = false;
    if (req.cookies.error) {
        e = true;
        et = req.cookies.error;
        res.clearCookie("error");
    }

    let m = false;
    let mt = "";
    if (req.cookies.message) {
        m = true;
        mt = req.cookies.message;
        res.clearCookie('message');
    }

    res.render("users", {
        users,
        isMessage: m,
        isError: e,
        message: mt,
        error: et
    });
});


router.post("/users/create", isAdminLogin, async (req, res) => {
    let UsersModel = await dataManager.getModelSingleton("users");
    try {
        let result = await UsersModel.insertOne({
            name: req.body.username,
            password: req.body.password,
            iat: parseInt((Date.now() / 1000) as any)
        });
        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "created");
        }

        return res.redirect("/admin/users");
    } catch (e) {
        res.cookie("error", "user most unique.");
        return res.redirect("/admin/users");
    }

});
export default router;