const ValidationError = (errors) => ({
    status: 400,
    body: {errorCode: 2, message: "validation error(s)", errors}
});

export default {ValidationError};