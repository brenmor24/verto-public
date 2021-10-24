import StripeConn from './stripe_handler.mjs'
import EthConn from './eth_handler.mjs'
import { weiToCents, centsToWei } from './converter.mjs'

class EventHandle {
    // construct an event handler object
    constructor() {
        this.stripe_conn = new StripeConn();
        this.eth_conn = new EthConn();
    }

    // handle a confirmed stripe authorization
    async handleAuthorization(stripe_id, cents) {
        var stripe_conn = this.stripe_conn;
        var eth_conn = this.eth_conn;

        // subtract equivalent wei from ethereum balance
        const wei_equiv = await centsToWei(cents);
        const eth_response = await eth_conn.spendFunds(stripe_id, wei_equiv);

        // fetch updated balance 
        const wei_balance = await eth_conn.checkBalance(stripe_id);
        const new_cents = await weiToCents(wei_balance);

        // update stripe spending limit with the new balance
        const stripe_response = await stripe_conn.updateLimit(stripe_id, new_cents);
        return {
            ethereum_log: eth_response,
            stripe_log: stripe_response
        };
    }

    // handle contract transaction event from blocknative
    async handleContractEvent(address) {
        var stripe_conn = this.stripe_conn;
        var eth_conn = this.eth_conn;

        const wei_balance = await eth_conn.checkBalanceAddress(address);
        const cents_equiv = await weiToCents(wei_balance);

        const stripe_response = await stripe_conn.updateLimit(stripe_id, cents_equiv);

        return {
            stripe_log: stripe_response
        };
    }

    // handle an issuing authorization request
    async handleAuthRequest(id, value) {
        var stripe_conn = this.stripe_conn;
        if (value < 100) {
            const response = await stripe_conn.declineAuthorization(id);
            return response;
        } else {
            const response = await stripe_conn.approveAuthorization(id);
            return response;
        }
    }

    /* example account object
    {
        person: {
            name: 'Rutherford Henderson',
            email: 'rutherfordbhenderson@gmail.com',
            street: '1234 Main St',
            city: 'Oxford',
            state: 'OH',
            postal_code: '45056',
            country: 'US'
        },
        address: '0xF4G9E30D029A...'
    }
    */

    // handle account creation
    async handleAccountCreation(account_obj) {
        var stripe_conn = this.stripe_conn;
        var eth_conn = this.eth_conn;

        const stripe_response = await stripe_conn.createCardholder(account_obj.person);
        const cardholder_id = stripe_response.cardholder.id;

        const eth_response = await eth_conn.createUser(cardholder_id, account_obj.address);

        return {
            stripe_log: stripe_response,
            eth_log: eth_response
        }
    }
}

export default EventHandle;