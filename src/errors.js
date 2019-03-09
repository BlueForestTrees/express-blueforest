exports.ValidationError = function (errors) {
    return {
        status: 400,
        body: {errorCode: 2, message: "Demande erronée", errors}
    }
}