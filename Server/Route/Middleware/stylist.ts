import {Request, Response} from "express";
import * as jwt from "jsonwebtoken";
import * as config from "../../../Config/config.json";

export function isStylistLogin(req: Request, res: Response, next: Function) {

    if (req.cookies.stylistToken) {
        try {
            let data = jwt.verify(req.cookies.stylistToken, config.secret);
            if (data) {
                (req as any).token = data;
                next();
            } else {
                res.redirect("/stylist/login");
            }
        } catch (e) {
            res.redirect("/stylist/login");
        }
    } else {
        res.redirect("/stylist/login");
    }
}