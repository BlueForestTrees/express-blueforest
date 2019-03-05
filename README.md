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

With an empty REST_PATH folder, the server will serve nothing.
*Let's add rest/postGameRest.js to add some behaviour*

```javascript
import {check} from 'express-validator/check'
import {objectNoEx} from "mongo-registry"
import {run} from "express-blueforest"
const router = Router()

router.post("/api/game",
    check("_id").exists().isMongoId().withMessage("invalid mongo id").customSanitizer(objectNoEx),
    check("fragment").isIn(["impact", "roots", "facet"]),
    check("fragmentName").isLength({min: 1, max: 100}),
    run(game => col("Games")
        .insertOne(game)
        .then(res => res.result))
)

module.exports = router
```
