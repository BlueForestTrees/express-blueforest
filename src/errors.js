export const error = (errorCode, message) => ({errorCode, message});

export const ValidationError = (errors) => ({
    status: 400,
    body: {...error(2, "validation error(s)")}
});