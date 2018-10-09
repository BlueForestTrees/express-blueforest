import express from 'express'
import path from "path"
import bodyParser from 'body-parser'
import read from 'fs-readdir-recursive'
import _run from "./run"
import _errors from "./errors"
import morgan from "morgan"

const debug = require('debug')('api:express')
const error = require('debug')('api:express:err')
export const Router = require("express").Router
export const run = _run
export const convert = _run
export const errors = _errors

export default (ENV, errorAdapter) => () => {
    const port = ENV.PORT || 8080
    debug("starting on %o", port)
    const api = express()

    installUtils(api, ENV.MORGAN)

    //LOG REQ
    api.use(function (req, res, next) {
        if (debug.enabled) {
            debug("HTTP REQUEST BODY %o", req.body)
        }
        next()
    })

    //REST
    installRestServices(api, ENV.REST_PATH)

    //RESPONSE (OR NOT)
    api.use(function (req, res, next) {
        if (res.locals.result !== undefined) {
            if (debug.enabled) {
                debug("HTTP RESPONSE BODY %o", res.locals.result)
            }
            res.json(res.locals.result)
        } else {
            next()
        }
    })

    //404
    api.use(function (req, res, next) {
        const err = new Error()
        err.status = 404
        next(err)
    })

    //ERROR
    api.use(function (err, req, res, next) {
        if (errorAdapter) {
            errorAdapter(err)
        }
        res.status(err.status || 500)
        let responseBody = null
        if (err.body) {
            responseBody = err.body
        } else if (err.errorCode && err.message) {
            responseBody = {errorCode: err.errorCode, message: err.message}
        } else if (err.errorCode) {
            responseBody = {errorCode: err.errorCode}
        }
        res.json(responseBody)
        error("response %o", responseBody)
        error("error %o", err)
    })

    //LISTENING
    const server = api.listen(port)
    debug("started")
    return server
};

const installUtils = (api, morg) => {
    api.use(morgan(morg || ':status :method :url :response-time ms - :res[content-length]', {stream: {write: msg => debug(msg)}}))
    api.use(bodyParser.json())
    api.use(bodyParser.urlencoded({extended: false}))
}

const installRestServices = (api, p) => {
    let restPath = path.resolve(p)
    debug("scanning rest services @%o", restPath)
    let count = 0
    read(restPath).forEach(function (file) {
        const p = path.join(restPath, file)
        try {
            file.indexOf("Rest.js") > 1 && api.use(require(p))
            debug(file)
            count++
        } catch (e) {
            error("erreur au chargement du rest service", p, e)
        }
    })
    if (count > 0) {
        debug('%o rest services', count)
    } else {
        error("pas de rest service!")
    }
}
