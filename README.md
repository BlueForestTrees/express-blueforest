# express-blueforest

## Description
Simplify the usage of express.js http server.

https://www.npmjs.com/package/express-blueforest

## Example

*This will start an http server with the desired configuration*
```javascript
import startExpress from "express-blueforest"

const ENV = {
    PORT: process.env.PORT || 80,
    
    //REST_PATH: the folder where controllers are to be found. Relative to app root.
    REST_PATH: process.env.REST_PATH || "rest",
    
    //MORGAN: optional, to override the morgan log format (https://github.com/expressjs/morgan)
    MORGAN: process.env.MORGAN,
}

const errorMapper = null //don't use any errorMapper for now

export default startExpress(ENV, errorMapper)
```
