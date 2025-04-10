/**
 * Handle application/x-www-form-encoded variant HTTP(S) requests
 *
 * @namespace api.requests
 */
const { request:http_request } = require("http");
const { request:https_request } = require("https");
const qs = require("node:querystring");


/**
 * Extends the core http/https IncomingMessage object with extra parameters: 'contentType' and 'data'
 *
 * @typedef {object} IncomingMessage
 * @param {number} statusCode
 * @param {string} contentType
 * @param {string | object} data
 */


/**
 * Promisify the core http.request/https.request function with nice defaults
 *
 * @memberOf api.requests
 * @param {string} method - the method of the request ('get', 'post', 'put', 'delete')
 * @param {string | URL} url - the url of the request
 * @param {object} [opts={}] - an options object to be passed to http.request, will override anything else
 * @param {string | null} [opts.api_key=undefined]
 * @param {string} [opts.content_type="application/x-www-form-urlencoded"]
 * @param {object | string} [body=''] - the body of the request, must be JSON-valid or empty, ignored for 'get' and 'delete'
 * @returns {Promise<IncomingMessage>} Resolves to the server response, but with additonal `.data` and `.type` attributes for the response data (auto parsed if JSON), and basic content type
 */
function request(method, url, { cookie_key=undefined, content_type="application/json", timeout_ms=20*1000, allow_self_signed=false, ...extras}={}, body='') {

    // Check the url protocol, also just make sure the url is valid.
    let parsed_url = new URL(url);
    let $ = { "http:":http_request, "https:":https_request }[parsed_url.protocol];
    if ( !$ ) throw new Error("Unsupported request protocol '"+parsed_url.protocol+"'");

    // Setup the options object
    let options = {
        method : method,
        headers: {},
        rejectUnauthorized: !allow_self_signed,
    };

    // Handle Body
    let include_body = ( body && ['post','put','patch'].includes(method.toLowerCase()) );
    if ( include_body ) {
        switch (content_type) {
            case "application/json":
                body = JSON.stringify(body)
                break;
            case "application/x-www-form-urlencoded":
                body = qs.stringify(body)
                break;
            default:
                break;
        }
        options.headers['Content-Length'] = Buffer.byteLength(body);
        options.headers['Content-Type'] = content_type;
    }

    // Handle api keys
    if ( cookie_key )  options.headers['Cookie'] = `quizsage_session=${cookie_key}`;

    // Override if applicable
    options = Object.assign( options, extras );

    return new Promise((resolve, reject) => {

        let timeout = null;
        if ( timeout_ms ) timeout = setTimeout(() => {
            reject(new Error("Request timed out"))
        }, timeout_ms);

        let req = $(url, options, (res) => {
            clearTimeout(timeout);
            res.setEncoding('utf-8');
            res.data = '';
            res.on('data', (chunk) => res.data = res.data + chunk);
            res.on('end', () => {
                // Parse any cookies
                res.cookies = {};
                for ( const str of res.headers['set-cookie']??[] ) {
                    const match = str.match(/^([^=]*)=([^;]*);.*/)
                    if ( !match ) continue;
                    res.cookies[match[1]] = match[2];
                }

                res.type = res.headers['content-type'];
                try {
                    res.type = res.type.match(/(application|text)\/([^;]+)/)[2];
                } catch (e) {
                    resolve(res);
                    return;
                }
                if ( res.type.includes("urlencoded") ) {
                    try {
                        res.data = qs.parse( res.data || '' );
                    } catch (e) {
                        reject(e);
                        return;
                    }
                    resolve(res);
                } else if ( res.type.includes("json") ) {
                    try {
                        res.data = JSON.parse( res.data || '' );
                    } catch (e) {
                        reject(e);
                        return;
                    }
                    resolve(res);
                } else {
                    resolve(res);
                }
            });
        });

        req.on('error', reject);

        if ( include_body ) {
            req.write(body);
        }

        req.end();
    });
}


/**
 * Perform a get request on an endpoint
 *
 * @memberOf api.requests
 * @param {string} url
 * @param {object} [header={}]
 * @returns {Promise<IncomingMessage>}
 */
function GET(url, header={}) {
    return request("get", url, header);
}

/**
 * Perform a delete request on an endpoint
 *
 * @memberOf api.requests
 * @param {string} url
 * @param {object} [header={}]
 * @returns {Promise<IncomingMessage>}
 */
function DELETE(url, header={}) {
    return request("delete", url, header);
}

/**
 * Perform a post request on an endpoint
 *
 * @memberOf api.requests
 * @param {string} url
 * @param {object} [header={}]
 * @param {string|object} [body='']
 * @returns {Promise<IncomingMessage>}
 */
function POST(url, header={}, body='') {
    return request("post", url, header, body);
}

/**
 * Perform a put request on an endpoint
 *
 * @memberOf api.requests
 * @param {string} url
 * @param {object} [header={}]
 * @param {string|object} [body='']
 * @returns {Promise<IncomingMessage>}
 */
function PUT(url, header={}, body='') {
    return request("put", url, header, body);
}

/**
 * Perform a patch request on an endpoint
 *
 * @memberOf api.requests
 * @param {string} url
 * @param {object} [header={}]
 * @param {string|object} [body='']
 * @returns {Promise<IncomingMessage>}
 */
function PATCH(url, header={}, body='') {
    return request("patch", url, header, body);
}


module.exports = {
    request,
    GET,
    DELETE,
    POST,
    PUT,
    PATCH
};

