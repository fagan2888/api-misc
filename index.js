let express = require('express');

const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 60, checkperiod: 60 } );

let app = express();

const port = process.env.PORT || 7856;

let chainLib = require('smoke-js');
chainLib.api.setOptions({url: 'https://rpc2.smoke.io'});
chainLib.config.set('address_prefix', 'SMK');
chainLib.config.set('chain_id', '1ce08345e61cd3bf91673a47fc507e7ed01550dab841fd9cdb0ab66ef576aaf0');


fetch_chain_info = async () => {
    let chain_info = myCache.get("chain_info");

    if (typeof chain_info !== 'undefined' && chain_info !== null){
        // do nothing
    } else {
        const dgp = await chainLib.api.getDynamicGlobalPropertiesAsync();
        let accounts = await chainLib.api.getAccountsAsync(["smoke", "reserve"]);
        let [smoke, reserve] = accounts;

        const total_supply = parseFloat(dgp.current_supply.split(" ")[0]);
        const smoke_balance = parseFloat(smoke.balance.split(" ")[0]);
        const reserve_balance = parseFloat(reserve.balance.split(" ")[0]);

        const circulating_supply = total_supply - smoke_balance - reserve_balance;

        chain_info = {
            total_supply,
            circulating_supply,
            smoke_balance,
            reserve_balance
        };

        // remember to set cache
        myCache.set("chain_info", chain_info);
    }

    return chain_info;
};

serverStart = () => {
    let router = express.Router();

    router.get('/chain_info', async (req, res) => {
        try {
            const chain_info = await fetch_chain_info();

            res.status(200).send(`${JSON.stringify(chain_info)}`);
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