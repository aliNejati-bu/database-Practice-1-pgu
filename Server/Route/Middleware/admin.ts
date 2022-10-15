import {Request, Response} from "express";
import * as jwt from "jsonwebtoken";
import * as config from "../../../Config/config.json";

export function isAdminLogin(req: Request, res: Response, next: Function) {
    if (req.cookies.adminToken) {
        try {
            let data = jwt.verify(req.cookies.adminToken, config.secret);
            if (data) {
                (req as any).token = data;
                next();
            } else {
                res.redirect("/admin/login");
            }
        } catch (e) {
            res.redirect("/admin/login");
        }
    } else {
        res.redirect("/admin/login");
    }
}