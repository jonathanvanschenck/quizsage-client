
/**
 * Custom error for API status codes
 *
 * @extends Error
 * @param {string} message
 * @param {string} code - conforms to 'ERR_STATUS_CODE_<number>' format
 */
class APIError extends Error {
    constructor( code, message ) {
        super( `${code} : ${message}` );
        this.code = `ERR_STATUS_CODE_${code}`;
    }
}


module.exports = exports = {
    APIError
}
