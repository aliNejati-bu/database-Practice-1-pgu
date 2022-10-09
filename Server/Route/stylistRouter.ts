import express from "express";
import {isStylistLogin} from "./Middleware/stylist";
import {dataManager} from "../../DataManager/DataManager";
import * as jwt from "jsonwebtoken";
import * as config from "../../Config/config.json";

let router = express.Router();

router.get("/", isStylistLogin, async (req, res, next) => {
    try {

        let model = await dataManager.getModelSingleton("stylists");
        let user = await model.findById((req as any).token.id);

        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let history = await servicesHistoryModel.find([[{field: "stylist.id", op: "=", value: user.id}]]);


        let servicesModel = await dataManager.getModelSingleton("services");
        let services = await servicesModel.all();

        services = services.reverse();

        res.render("spanel", {isError: false, user, history, services})
    } catch (e) {

        console.log(e);
        res.send(e);
    }
});

router.get("/login", (req, res, next) => {
    res.render("stylistLogin", {isError: false});
});


router.post("/login", async (req, res, next) => {
    try {
        let model = await dataManager.getModelSingleton("stylists");
        let user = await model.findOne([[
            {field: "name", op: "=", value: req.body.name}
        ]]);
        console.log(user)
        if (!user) {
            return res.render("stylistLogin", {
                isError: true,
                error: "user and password not match"
            });
        } else {
            if (user.password != req.body.password) {
                return res.render("stylistLogin", {
                    isError: true,
                    error: "user and password not match"
                });
            } else {
                let token = jwt.sign({
                    id: user.id
                }, config.secret);
                res.cookie("stylistToken", token, {expire: 360000 * Date.now()} as any);
                res.redirect("/stylist");
            }
        }
    } catch (e) {

        console.log(e);
        res.send(e);
    }
})

router.post("/create", isStylistLogin, async (req, res) => {
    try {
        let body = req.body;
        let userModel = await dataManager.getModelSingleton("users");
        let user = await userModel.findOne([[{field: "name", op: "=", value: body.username}]]);
        if (!user) {
            user = await userModel.insertOne({
                name: body.username,
                iat: parseInt((Date.now() / 1000) as any),
                password: "1234"
            });
        }

        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let result = await servicesHistoryModel.insertOne({
            stylist: (req as any).token.id,
            user: (user as any).id,
            service: parseInt((body.service) as any),
            iat: parseInt((Date.now() / 1000) as any),
            paid: 1
        });
        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "created");
        }
        res.redirect("/stylist");
    } catch (e) {
        console.log(e);

        res.send(e);
    }
});

export default router;