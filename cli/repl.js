#!/usr/bin/node --experimental-repl-await

const repl = require('repl');
const { writeFile } = require("fs/promises");

const rcc = require("../index.js");

const { JSONStream } = require("json-color-stream");

let [
    username,
    password,
    address,
    port,
    protocol,
    self_signed
] = process.argv.slice(2);

let help_str = "\n"
    + "Welcome to Quizsage-Shell!\n"
    + "----------------------\n"
    + `Version : ${require("../package.json").version}\n`
    + "Available Options :\n"
    + "  help()                           : print this menu\n"
    + "  await api.<method>(...args)      : interact with server\n"
    + "  await jcsp(obj,opts)             : pretty print an object using json-color-stream\n"
    + "  await save_json(fp,obj,opts)     : save json to a file\n";

(async () => {
    console.log(`Connecting against: ${protocol}://${address}:${port}`);
    const api = new rcc.API({
        address : address,
        port : port,
        protocol : protocol,
        self_signed: !!self_signed,
    });
    
    await api.login(username, password);

    if ( !api.authenticated ) throw new Error("Login silently failed");

    console.log(help_str)

    repl_server = repl.start({ useColors : true });
    repl_server.setupHistory("./.repl_history", () => {});
    repl_server.on('exit', () => process.exit(0));

    // Wrappers
    repl_server.context.help = () => { console.log(help_str) };
    repl_server.context.api = api;
    repl_server.context.jcsp = (obj,opts={}) => {
        return JSONStream.stringify(obj,opts).then(console.log);
    }
    repl_server.context.save_json = (fp, obj, opts={}) => {
        return writeFile(fp,JSON.stringify(obj),opts);
    }

})();
