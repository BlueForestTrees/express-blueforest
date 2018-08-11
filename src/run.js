import errors from "./errors";

const {validationResult} = require('express-validator/check');
const {matchedData} = require('express-validator/filter');

export default work => (req, res, next) =>
    Promise
        .resolve(doWork(req, res, next, work))
        .catch(err => next(err));

const doWork = async (req, res, next, work) => {
    if (!res.locals.validated) {
        res.locals.validated = true;
        res.locals.result = await work(validate(req, res), req, res, next);
        console.log("WORK RESULT", JSON.stringify(res.locals.result, null, 2))
    } else {
        res.locals.result = await work(res.locals.result, req, res, next);
        console.log("WORK RESULT", JSON.stringify(res.locals.result, null, 2))
    }
    next();
};

const validate = req => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        throw new errors.ValidationError(validationErrors.mapped());
    }
    return matchedData(req);
};