var errors = require("./errors")
var debug = require('debug')('api:express')
var validationResult = require('express-validator/check').validationResult
var matchedData = require('express-validator/filter').matchedData

exports.default = function (work, workname) {
    var workPromise = work.then && work || Promise.resolve(work)
    return function (req, res, next) {
        try {

            !res.locals.validated && validate(req, res)
            return workPromise.then(function (work) {
                var workResult = work(res.locals.result, req, res, next)
                var workPromise = workResult && workResult.then && workResult || Promise.resolve(workResult)
                return workPromise.then(function (result) {
                    res.locals.result = result
                    debug.enabled && workname && debug({WORK: {name: workname, result: res.locals.result}})
                })
            })
                .then(next)
                .catch(err => next(err))

        } catch (err) {
            console.error("ERROR", err)
            next(err)
        }
    }
}

function validate(req, res) {
    res.locals.validated = true
    var validationErrors = validationResult(req)
    if (!validationErrors.isEmpty()) {
        throw new errors.ValidationError(validationErrors.mapped())
    }
    res.locals.input = res.locals.result = matchedData(req)
    debug.enabled && debug({VALIDATED: res.locals.result})
}