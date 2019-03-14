var express = require('express')
var path = require("path")
var bodyParser = require('body-parser')
var read = require('fs-readdir-recursive')
var _run = require("./run")
var _errors = require("./errors")
var morgan = require("morgan")
var _thenNull = require("./thenNull")

var debug = require('debug')('api:express')
var error = require('debug')('api:err:express')

exports.Router = require("express").Router
exports.run = _run.default
exports.convert = _run.default
exports.errors = _errors
exports.thenNull = _thenNull.default
exports.default = startExpress
exports.__esModule = true

function startExpress(ENV, errorAdapter) {
    return function () {
        var port = ENV.PORT || 80
        debug("starting on %o", port)
        var api = express()

        installUtils(api, ENV.MORGAN)

        //LOG REQ
        if (debug.enabled) {
            api.use(function (req, res, next) {
                var request = {
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
                var err = new Error()
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
                err = errorAdapter(err) || err
            }
            res.status(err.status || 500)
            var body = null
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
                error({
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
                })
            }
        })

        //LISTENING
        return api.listen(port)
    }
}

function installUtils(api, morg) {
    if (debug.enabled) {
        api.use(morgan(morg || ':status :method :url :response-time ms - :res[content-length]', {
            stream: {
                write: function (msg) {
                    debug(msg)
                }
            }
        }))
    }
    api.use(bodyParser.json())
    api.use(bodyParser.urlencoded({extended: false}))
}

function installRestServices(api, p) {
    var restPath = path.resolve(p)
    debug("scanning rest services @%o", restPath)
    var count = 0
    read(restPath).forEach(function (file) {
        var p = path.join(restPath, file)
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
