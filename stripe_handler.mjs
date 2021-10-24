import Stripe from 'stripe'

class StripeConn {

    constructor() {
        // set stripe instance
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        this.stripe = Stripe(stripeSecretKey);
    }

    /*  example person object
    {
        name: 'John Smith',
        email: 'johnwsmith@gmail.com',
        street: '1234 Main St',
        city: 'Oxford',
        state: 'OH',
        postal_code: '45056',
        country: 'US'
    }
    */

    // create a new cardholder and card on stripe
    async createCardholder(person) {
        var stripe = this.stripe;
        const cardholder = await stripe.issuing.cardholders.create({
            name: person.name,
            email: person.email,
            status: 'active',
            type: 'individual',
            billing: {
                address: {
                    line1: person.street,
                    city: person.city,
                    state: person.state,
                    postal_code: person.postal_code,
                    country: person.country,
                }
            },
            spending_controls: {
                spending_limits: [{
                    amount: 1,
                    interval: 'per_authorization'
                }]
            }
        });

        const card = await stripe.issuing.cards.create({
            cardholder: cardholder.id,
            currency: 'usd',
            type: 'virtual'
        });

        return {
            cardholder: cardholder, 
            card: card
        };
    }

    // update a cardholder's spending limit
    async updateLimit(cardholder_id, value) {
        var stripe = this.stripe;
        const response = await stripe.issuing.cardholders.update(
            cardholder_id,
            {
                spending_controls: {
                    spending_limits: [{
                        amount: value,
                        interval: 'per_authorization'
                    }]
                }
            }
        );
        return response;
    }

    // approve an issuing authorization request
    async approveAuthorization(id) {
        var stripe = this.stripe;
        const response = await stripe.issuing.authorizations.approve(id, {
            metadata: { reason: 'Request accepted, please approve this authorization.'}
        });
        return response;
    }

    // decline an issuing authorization request
    async declineAuthorization(id) {
        var stripe = this.stripe;
        const response = await stripe.issuing.authorizations.decline(id, {
            metadata: { reason: 'Insufficient funds, please decline this authorization.'}
        });
        return response;
    }

    // freeze the account with the specified cardholder id
    async pauseCardholder(cardholder_id) {
        var stripe = this.stripe;
        const response = await stripe.issuing.cardholders.update(
            cardholder_id,
            {
                status: "inactive"
            }
        );
        return response;
    }
}

export default StripeConn;