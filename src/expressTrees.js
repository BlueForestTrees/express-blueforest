import express from 'express';
import path from "path";
import morgan from "morgan";
import bodyParser from 'body-parser';
import read from 'fs-readdir-recursive';
import _run from "./run";
import {error as _err} from "./errors";

export const Router = require("express").Router;
export const run = _run;
export const error = _err;

export default (ENV, errorAdapter) => () => {
    const port = ENV.PORT || 8080;
    console.log("starting express on" , port);
    const api = express();

    api.use(morgan(ENV.MORGAN || ':status :method :url :response-time ms - :res[content-length]'));
    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({extended: false}));

    //LOG REQ
    api.use(function (req, res, next) {
        console.log("req", {user: req.token && req.token.user, url: `${req.method} ${req.url}`}, {params: req.params}, {body: req.body});
        next();
    });

    //REST
    let restPath = path.resolve(ENV.REST_PATH);
    console.log("scanning rest services @", restPath);
    let count = 0;
    read(restPath).forEach(function (file) {
        file.indexOf(".js") > 1 && api.use(require(path.join(restPath, file)));
        count++;
    });
    console.log(`${count} services loaded`);

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
            responseBody = err.body;
        } else if (err.message) {
            responseBody = {error: err.message};
        }
        res.json(responseBody);
        console.log("res", responseBody);
    });

    //LISTENING
    const server = api.listen(port);
    console.log("started");
    return server;
};
