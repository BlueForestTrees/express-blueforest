exports.default = function (req, res, next) {
    res.locals.result = null
    next()
}