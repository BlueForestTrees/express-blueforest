import errors from "./errors";

const {validationResult} = require('express-validator/check');
const {matchedData} = require('express-validator/filter');

export default work => (req, res, next) =>
    Promise
        .resolve(doWork(req, res, next, work))
        .catch(err => next(err));

const doWork = async (req, res, next, work) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        throw new errors.ValidationError(validationErrors.mapped());
    } else {
        const body = await work(matchedData(req), req, res, next);
        res.json(body);
        console.log("res", body);
    }
};