export default (req, res, next) => {
    res.locals.result = null
    next()
}