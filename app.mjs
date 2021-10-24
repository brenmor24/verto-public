// Copyright 2021 Brendan Moran
// server starts below 

// load env variables if not production
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import express from 'express'
const app = express();

import bodyParser from 'body-parser';

// used for public webpage
app.use(express.static('public'))

// parse non webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// initialize event handler instance
import EventHandle from './event_handler.mjs'
const event_handler = new EventHandle();

// initialize stripe instance
import Stripe from 'stripe'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(stripeSecretKey);
const webhookSecret = process.env.WEBHOOK_SECRET;

// handle blocknative events
app.post('/blocknative', (req, res) => {
  res.status(200).send({ received: true });

  if (req.body.from == process.env.ACCOUNT_ADDRESS) {
    console.log("Contract called by self -> Ignore.");

  } else if (req.body.status == "pending") {
    console.log("Unconfirmed transaction -> Ignore");

  } else if (req.body.status == "confirmed") {
    const address = request.body.from;
    event_handler.handleContractEvent(address).then(response => {
      console.log(response);
    }).catch(error => {
      console.log("Error updating spending limit: " + error.message);
    });
  } else {
    console.log("Unsupported transaction type");
  }
});

app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  // verify webhook signature and extract the event.
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    // handle card creation event
    case 'issuing_card.created': 
      response.json({ received: true, type: 'You created a card.' });
      console.log('Stripe created a card...');
      break;

    // handle cardholder update event
    case 'issuing_cardholder.updated': 
      response.json({ received: true, type: 'You updated the card.' });
      console.log('Stripe updated a card...');
      break;

    // handle authorization request event
    case 'issuing_authorization.request': 
      console.log('Stripe is requesting an authorization...');
      
      const id = event.data.object.id;
      const amount = event.data.object.pending_request.amount;

      event_handler.handleAuthRequest(id, amount).then(result => {
        console.log(result);
        response.json({ received: true, type: 'I received your authorization request and handled it.' });
      }).catch(error => {
        console.log('Error authorizing request: ' + error.message);
      });
      break;

    case 'issuing_authorization.created': 
      response.json({ received: true, type: 'You created an authorization.' });
      console.log('Stripe created an authorization...');
      break;

    case 'issuing_cardholder.created': 
      response.json({ received: true, type: 'You created a cardholder.' });
      console.log('Stripe created a cardholder...');
      break;

    case 'issuing_authorization.updated': 
      response.json({ received: true, type: 'You updated an authorization.' });
      console.log('Stripe updated an authorization...');

      var auth_object = event.data.object;
      var approved = auth_object.approved;
      var status = auth_object.status;

      // deduct ether and update spending limit if authorization is approved and closed
      if (approved && status == 'closed') {
        var stripe_id = auth_object.cardholder;
        var cents = auth_object.merchant_amount;
        event_handler.handleAuthorization(stripe_id, cents).then(result => {
          console.log(result);
        }).catch(error => {
          console.log("Error deducting ether equivalent: " + error.message);
        });
      }
      break;

    // handle transaction creation event
    case 'issuing_transaction.created': 
      response.json({ received: true, type: 'You created a transaction.' });
      console.log('Stripe created a transaction...');
      break;

    // handle available balance event
    case 'balance.available': 
      response.json({ received: true, type: 'A balance is available.' });
      console.log('There is a balance available...');
      break;

    // handle all other events
    default:
      response.json({ received: true, type: 'Unknown event.' });
      console.log('An unknown event was received...');
  }
});

const { PORT = 3000 } = process.env;

app.listen(PORT, () => {
  console.log("App is listening on port 3000...");
});