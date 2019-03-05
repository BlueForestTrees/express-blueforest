const ValidationError = (errors) => ({
    status: 400,
    body: {errorCode: 2, message: "Demande erronée", errors}
});

export default {ValidationError};