import express from "express";
import {isStylistLogin} from "./Middleware/stylist";
import {dataManager} from "../../DataManager/DataManager";
import * as jwt from "jsonwebtoken";
import * as config from "../../Config/config.json";

let router = express.Router();

router.get("/", isStylistLogin, (req, res, next) => {
    res.render("spanel")
});

router.get("/login", (req, res, next) => {
    res.render("stylistLogin", {isError: false});
});


router.post("/login", async (req, res, next) => {
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

})

export default router;