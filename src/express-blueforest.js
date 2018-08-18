import express from 'express';
import path from "path";
import bodyParser from 'body-parser';
import read from 'fs-readdir-recursive';
import _run from "./run";
import _errors from "./errors";

export const Router = require("express").Router;
export const run = _run;
export const convert = _run;
export const errors = _errors;

export default (ENV, errorAdapter, init) => () => {
    const port = ENV.PORT || 8080;
    console.log("starting express on" , port);
    const api = express();

    if (init) {
        init(api)
    }

    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({extended: false}));

    //LOG REQ
    api.use(function (req, res, next) {
        console.log("HTTP REQUEST", JSON.stringify({
            url: `${req.method} ${req.url}`,
            body: req.body
        }, null, 2))
        next();
    });

    //REST
    let restPath = path.resolve(ENV.REST_PATH)
    console.log("scanning rest services @", restPath);
    let count = 0;
    read(restPath).forEach(function (file) {
        const p = path.join(restPath, file)
        try {
            file.indexOf("Rest.js") > 1 && api.use(require(p))
            count++
        } catch (e) {
            console.error("erreur au chargement du rest service", p, e)
        }
    });
    if (count > 0) {
        console.log(`${count} rest services`)
    } else {
        console.error("pas de rest service!")
    }

    //RESPONSE TO RETURN
    api.use(function (req, res, next) {
        if (res.locals.result !== undefined) {
            res.json(res.locals.result);
        } else {
            next();
        }
    });

    //NOT FOUND
    api.use(function (req, res, next) {
        const err = new Error();
        err.status = 404;
        next(err);
    });

    //ERROR
    api.use(function (err, req, res, next) {

        if (errorAdapter) {
            errorAdapter(err);
        }

        res.status(err.status || 500);
        let responseBody = null;
        if (err.body) {
            responseBody = err.body
        } else if (err.errorCode && err.message) {
            responseBody = {errorCode: err.errorCode, message: err.message}
        } else if (err.errorCode) {
            responseBody = {errorCode: err.errorCode}
        }
        res.json(responseBody);
        console.error("res error", responseBody);
        console.error("error", err);
    });

    //LISTENING
    const server = api.listen(port);
    console.log("started");
    return server;
};
