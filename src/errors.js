const error = (errorCode, message) => ({errorCode, message});

const ValidationError = (errors) => ({
    status: 400,
    body: {...error(2, "validation error(s)"), errors}
});

export default {error, ValidationError};