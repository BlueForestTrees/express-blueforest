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
    const port = ENV.PORT || 80
    debug("starting on %o", port)
    const api = express()

    installUtils(api, ENV.MORGAN)

    //LOG REQ
    if (debug.enabled) {
        api.use(function (req, res, next) {
            const request = {
                method: req.method,
                url: req.originalUrl,
                body: req.body
            }
            debug({REQ: request})
            next()
        })
    }

    //REST
    installRestServices(api, ENV.REST_PATH)

    //RESPONSE (OR NOT)
    api.use(function (req, res, next) {
        if (res.locals.result === undefined) {
            const err = new Error()
            err.status = 404
            next(err)
        } else {
            if (debug.enabled) {
                debug({RESP: res.locals.result})
            }
            res.json(res.locals.result)
        }
    })

    //ERROR
    api.use(function (err, req, res, next) {
        if (errorAdapter) {
            errorAdapter(err)
        }
        res.status(err.status || 500)
        let body = null
        if (err.body) {
            body = err.body
        } else if (err.errorCode && err.message) {
            body = {errorCode: err.errorCode, message: err.message}
        } else if (err.errorCode) {
            body = {errorCode: err.errorCode}
        }
        res.json(body)

        if (debug.enabled) {
            debug(JSON.stringify({ERR: err}, null, 2))
        } else {
            const errLog = {
                ERR: {
                    req: {
                        method: req.method,
                        headers: req.headers,
                        url: req.originalUrl,
                        cookies: req.cookies,
                        body: req.body
                    },
                    cause: err
                }
            }
            console.error(JSON.stringify(errLog))
        }
    })

    //LISTENING
    return api.listen(port)
};

const installUtils = (api, morg) => {
    if (debug.enabled) {
        api.use(morgan(morg || ':status :method :url :response-time ms - :res[content-length]', {stream: {write: msg => debug(msg)}}))
    }
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
