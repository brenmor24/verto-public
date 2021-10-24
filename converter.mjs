import https from 'https'

// fetch the current USD equivalent of one ETH from cryptocompare.com
function fetchRate() {
    return new Promise(function (resolve, reject) {
        https.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', (chunk) => {
                var price = JSON.parse(data).USD;
                resolve(price);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });
    });
}

// convert an amount of wei to its current equivalent value in cents
async function weiToCents(wei) {
    if (wei < 1000000000000) {
        return 0;
    }
    var usdPerEth = await fetchRate();
    var centsPerEth = usdPerEth*100;
    var eth = wei/1000000000000000000;
    var cents = eth*centsPerEth;
    cents = Math.round(cents);
    return cents;
}

// convert an amount of cents to its current equivalent value in wei
async function centsToWei(cents) {
    var usdPerEth = await fetchRate();
    var centsPerEth = usdPerEth*100;
    var eth = cents/centsPerEth;
    var wei = eth*1000000000000000000;
    wei = Math.round(wei);
    return wei;
}

export {weiToCents, centsToWei};