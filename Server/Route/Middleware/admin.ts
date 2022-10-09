import {Request, Response} from "express";

export function isAdminLogin(req: Request, res: Response, next: Function) {
    if (req.cookies.adminToken) {

    } else {
        res.redirect("/admin/login");
    }
}