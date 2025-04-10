const { request } = require("./requests.js");
const { APIError } = require("./errors.js");

/**
 * Create a query string from an object
 * @param {object} obj
 * @returns {string}
 */
function render_query_string(obj_or_array) {
    let query_string = "?";
    if ( Array.isArray(obj_or_array) ) {
        const arr = obj_or_array;
        for ( const [key, value] of arr ) {
            if ( value === undefined ) continue;
            query_string += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        }
    } else {
        const obj = obj_or_array;
        if ( Object.keys(obj).length === 0 ) return "";
        for ( const key in obj ) {
            if ( obj[key] === undefined ) continue;
            query_string += `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}&`;
        }
    }
    return query_string.slice(0, -1);
}

/**
 * Base API Class
 */
class APIBase {
    #cookie_key;

    /**
     * Constructor
     *
     * @param {object} config
     * @param {string} [config.address='localhost']
     * @param {number} [config.port=443]
     * @param {string} [config.protocol='https']
     */
    constructor({ address="localhost", port=443, protocol="https", self_signed=false, cookie_key }={}) {
        this.header = `${protocol}://${address}:${port}`;
        this.self_signed = self_signed;
        this.#cookie_key = cookie_key;
    }

    get authenticated() {
        return !!this.#cookie_key;
    }

    /**
     * Default error handler for API responses
     *
     * @param {number} code
     * @param {string} message
     * @throws {APIError}
     */
    _error_handler( code, message ) {
        throw new APIError(code, message);
    }

    /**
     * Request against an endpoint
     *
     * @param {string} method
     * @param {string} endpoint
     * @param {string|object} [body=""]
     * @param {object} [header={}]
     * @throws {APIError}
     * @returns {object}
     */
    async request(method, endpoint, body='', header={}) {
        console.log("=> "+endpoint)
        let resp = await request(
            method,
            this.header+endpoint,
            Object.assign(
                {
                    cookie_key : this.#cookie_key,
                    allow_self_signed: this.self_signed,
                },
                header
            ),
            body
        );
        if ( resp.statusCode < 300 ) {
            if ( resp.cookies.quizsage_session ) this.#cookie_key = resp.cookies.quizsage_session;
            return {
                statusCode : resp.statusCode,
                data : resp.data ? resp.data : undefined,
                cookies: resp.cookies || {},
            };
        } else {
            this._error_handler(resp.statusCode, (resp.data.errors??[{ message:"Error" }]).map(r => r.message).join("; "));
        }
    }

    /**
     * Get against an endpoint
     *
     * @param {string} endpoint
     * @param {object} [header={}]
     * @throws {APIError}
     * @returns {object}
     */
    async GET(endpoint, header={}) {
        return this.request("get", endpoint, '', header);
    }

    /**
     * delete against an endpoint
     *
     * @param {string} endpoint
     * @param {object} [header={}]
     * @throws {APIError}
     * @returns {object}
     */
    async DELETE(endpoint, header={}) {
        return this.request("delete", endpoint, '', header);
    }

    /**
     * put against an endpoint
     *
     * @param {string} endpoint
     * @param {string|object} [body=""]
     * @param {object} [header={}]
     * @throws {APIError}
     * @returns {object}
     */
    async PUT(endpoint, body='', header={}) {
        return this.request("put", endpoint, body, header);
    }

    /**
     * post against an endpoint
     *
     * @param {string} endpoint
     * @param {string|object} [body=""]
     * @param {object} [header={}]
     * @throws {APIError}
     * @returns {object}
     */
    async POST(endpoint, body='', header={}) {
        return this.request("post", endpoint, body, header);
    }

    /**
     * patch against an endpoint
     *
     * @param {string} endpoint
     * @param {string|object} [body=""]
     * @param {object} [header={}]
     * @throws {APIError}
     * @returns {object}
     */
    async PATCH(endpoint, body='', header={}) {
        return this.request("patch", endpoint, body, header);
    }


}

/**
 * API Class
 *
 * @extends APIBase
 */
class API extends APIBase {
    async login(email, password) {
        let resp = await this.POST(
            `/api/v1/user/login`,
            {
                email,
                password
            }
        );
        if ( !resp.data.success ) throw new APIError(400, resp.data.message)
        return resp.data;
    }

    get bibles() {
        return [ 'Protestant', 'Orthodox', 'Catholic' ];
    }
    async bible_books(bible) {
        let resp = await this.GET(
            `/api/v1/bible/books${render_query_string({bible})}`,
        );
        return resp.data;
    }
    async bible_structure(bible) {
        let resp = await this.GET(
            `/api/v1/bible/structure${render_query_string({bible})}`,
        );
        return resp.data;
    }
    async identify_from_books(books=[]) {
        let resp = await this.GET(
            `/api/v1/bible/identify${render_query_string(books.map(b => ["books", b]))}`,
        );
        return resp.data;
    }
    async parse_reference(text, { bible, abbreviate, sorted, exact_chapter, exact_verse, exact_book, minimum_book_length, expand_verses }={}) {
        const qs = render_query_string({
            text,
            bible,
            acronyms: abbreviate,
            sorting: sorted,
            require_chapter_match: exact_chapter,
            require_verse_match: exact_verse,
            require_verse_ucfirst: exact_book,
            require_verse_ucfirst: exact_book,
            minimum_book_length,
            add_detail: expand_verses
        })
        let resp = await this.GET(
            `/api/v1/bible/reference/parse${qs}`,
        );
        return resp.data;
    }
}

module.exports = exports = API;
