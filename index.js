let express = require('express');
let fetch = require("node-fetch");

const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 60, checkperiod: 60 } );

let app = express();

const port = process.env.PORT || 7856;


get_current_supply = async () => {
    let current_supply = myCache.get("total_supply");

    if (typeof current_supply !== 'undefined' && current_supply !== null){
        // do nothing
    } else {
        current_supply = await fetch_current_supply();

        // remember to set cache
        myCache.set("total_supply", current_supply);
    }

    return current_supply;
};

fetch_current_supply = async () => {
    const res_rpc = await fetch("https://rpc.smoke.io", {
        method: 'POST',
        body: `{"jsonrpc":"2.0", "id":0, "method":"call", "params":["database_api", "get_dynamic_global_properties", []]}`,
        headers: { 'Content-Type': 'application/json' }
    });

    const res_rpc_json = await res_rpc.json();
    const current_supply = res_rpc_json.result.current_supply;
    const the_value = current_supply.split(" ")[0];
    return the_value;
};

serverStart = () => {
    let router = express.Router();

    router.get('/total_supply', async (req, res) => {
        try {
            const current_supply = await get_current_supply();

            res.status(200).send(`${current_supply}`);
        } catch(e) {
            console.log(e);
            res.status(500).send(JSON.stringify(e));
        } finally {

        }
    });

    app.use('/misc', router);

    app.listen(port);
    console.log('api-misc on port ' + port);
};

serverStart();