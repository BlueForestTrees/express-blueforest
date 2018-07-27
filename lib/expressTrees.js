"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.run = exports.Router = undefined;

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _morgan = require("morgan");

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _fsReaddirRecursive = require("fs-readdir-recursive");

var _fsReaddirRecursive2 = _interopRequireDefault(_fsReaddirRecursive);

var _run2 = require("./run");

var _run3 = _interopRequireDefault(_run2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Router = exports.Router = require("express").Router;
var run = exports.run = _run3.default;

exports.default = function (ENV, errorAdapter) {
    return function () {
        var port = ENV.PORT || 8080;
        console.log("starting express on", port);
        var api = (0, _express2.default)();

        api.use((0, _morgan2.default)(ENV.MORGAN || ':status :method :url :response-time ms - :res[content-length]'));
        api.use(_bodyParser2.default.json());
        api.use(_bodyParser2.default.urlencoded({ extended: false }));

        //LOG REQ
        api.use(function (req, res, next) {
            console.log("req", { user: req.token && req.token.user, url: req.method + " " + req.url }, { params: req.params }, { body: req.body });
            next();
        });

        //REST
        var restPath = _path2.default.resolve(ENV.REST_PATH);
        console.log("scanning rest services @", restPath);
        var count = 0;
        (0, _fsReaddirRecursive2.default)(restPath).forEach(function (file) {
            file.indexOf(".js") > 1 && api.use(require(_path2.default.join(restPath, file)));
            count++;
        });
        console.log(count + " services loaded");

        //NOT FOUND
        api.use(function (req, res, next) {
            var err = new Error();
            err.status = 404;
            next(err);
        });

        //ERROR
        api.use(function (err, req, res, next) {

            if (errorAdapter) {
                errorAdapter(err);
            }

            res.status(err.status || 500);
            var responseBody = null;
            if (err.body) {
                responseBody = err.body;
            } else if (err.message) {
                responseBody = { error: err.message };
            }
            res.json(responseBody);
            console.log("res", responseBody);
        });

        //LISTENING
        var server = api.listen(port);
        console.log("started");
        return server;
    };
};