# express-blueforest

## Description
Simplify the usage of express.js http server, with express-validator lib + error management.

https://www.npmjs.com/package/express-blueforest

## String a server

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

const errorMapper = null //don't use any errorMapper for now, see bellow

export default startExpress(ENV, errorMapper)
```

## Adding a REST service
With an empty REST_PATH folder, the server will serve nothing.
*Let's add rest/postGameRest.js to add some behaviour*

```javascript
import {check} from 'express-validator/check'
import {objectNoEx} from "mongo-registry"
import {run} from "express-blueforest"
const router = Router()

//A controller pipeline. Validations steps followed by one or many "run" calls.
router.post("/api/game",
    check("_id").exists().isMongoId().withMessage("invalid mongo id").customSanitizer(objectNoEx),
    check("fragment").isIn(["impact", "roots", "facet"]),
    check("fragmentName").isLength({min: 1, max: 100}),
    run(onGameCreate)
)

//game is the object issued from the validation steps.
const onGameCreate = game => console.log("I create a game with fragment ", game.fragment)
//const onGameCreate = ({_id, fragment, fragmentName}) => console.log("I create a game with fragment ", fragment)
//const onGameCreate = ({_id, fragment, fragmentName}, req, res) => console.log("create game with request and response", req, res)

module.exports = router
```


Note: With multiple "run", the output of the previous is the input of the next.
```javascript
router.get("/api/game",
    run(()=>"hello"),
    run(msg=>`${msg}` mister!),
    run(msg=>{key:msg})// return {key:'hello mister!'}
)
```

## Handling errors

Errors management is in two parts: 
### business errors you throw in your business code:


```javascript
const onGameCreate = game => {
    [...]
    //Magical business error use case
    Math.random() > 0.5 && throwThe("magicalError")    
    [...]
}
```

### errorMapper, or how you decide to translate business error into http errors.

