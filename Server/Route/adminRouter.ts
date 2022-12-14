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

        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let all = await servicesHistoryModel.all();
        let total = 0;

        all.forEach(value => {
            total += value.service.price
        });


        return res.render("adminPanel", {
            isError: false,
            user,
            total,
            tc: all.length
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

router.post("/users/delete", isAdminLogin, async (req, res) => {
    try {
        let usersModel = await dataManager.getModelSingleton("users");
        let result = usersModel.deleteById(req.body.id);
        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "deleted!");
        }

        return res.redirect("/admin/users");
    } catch (e) {
        console.log(e);
        res.send(e);
    }
});

router.get("/users/history/:user", isAdminLogin, async (req, res) => {
    try {
        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let history = await servicesHistoryModel.find([[
            {
                field: "user.id",
                op: "=",
                value: parseInt(req.params.user)
            }
        ]]);

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


        res.render('userHistory', {
            history,
            isMessage: m,
            isError: e,
            message: mt,
            error: et,
            userID: req.params.user
        });
    } catch (e) {
        console.log(e);
        res.send(e);
    }

});

router.post("/users/history/delete", async (req, res) => {
    try {
        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let result = await servicesHistoryModel.deleteById(parseInt(req.body.id));

        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "deleted!");
        }
        res.redirect("/admin/users/history/" + req.body.userID);

    } catch (e) {
        console.log(e);

        res.send(e);
    }
});


router.get("/services", isAdminLogin, async (req, res) => {
    try {
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

        let servicesModel = await dataManager.getModelSingleton("services");
        res.render('services', {
            isMessage: m,
            isError: e,
            message: mt,
            error: et,
            services: await servicesModel.all()
        });
    } catch (e) {
        console.log(e);

        res.send(e);
    }
});


router.post("/services/delete", async (req, res) => {
    try {
        let servicesModel = await dataManager.getModelSingleton("services");
        let result = await servicesModel.deleteById(parseInt(req.body.id));

        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "deleted!");
        }

        res.redirect("/admin/services");

    } catch (e) {
        console.log(e);

        res.send(e);
    }
});


router.post("/services/create", async (req, res) => {
    try {
        let servicesModel = await dataManager.getModelSingleton("services");

        let result = await servicesModel.insertOne({
            name: req.body.name,
            price: parseInt(req.body.price)
        });

        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "created!");
        }

        res.redirect("/admin/services");

    } catch (e) {
        res.cookie("error", "name most unique.");
        return res.redirect("/admin/services");
    }
});

router.get("/services/:id", isAdminLogin, async (req, res) => {
    try {
        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let history = await servicesHistoryModel.find([[
            {
                field: "service.id",
                op: "=",
                value: parseInt(req.params.id)
            }
        ]]);

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


        res.render('serviceHistory', {
            history,
            isMessage: m,
            isError: e,
            message: mt,
            error: et,
            id: req.params.id
        });
    } catch (e) {
        console.log(e);
        res.send(e);
    }
});


router.post("/services/history/delete", isAdminLogin, async (req, res) => {
    try {
        let servicesHistoryModel = await dataManager.getModelSingleton("serviceHistory");
        let result = await servicesHistoryModel.deleteById(parseInt(req.body.id));

        if (!result) {
            res.cookie("error", "error");
        } else {
            res.cookie("message", "deleted!");
        }
        res.redirect("/admin/users/history/" + req.body.userID);
    } catch (e) {
        console.log(e);

        res.send(e);
    }
});
export default router;