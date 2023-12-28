# VERTO - ETHEREUM DEBIT CARD

Verto lets users users spend Ethereum at USD based merchants by converting their Ether stake to USD in real time. This is achieved by holding Ether in a smart contract and tying that balance to a virtual stripe card.

[vertopipeline.com](http://vertopipline.s3-website-us-east-1.amazonaws.com)

## OVERVIEW

### PART 1 - Account Creation and Funding
- A new cardholder and card is created on Stripe.
- The individual’s cardholder ID and Ethereum public key are “tied together” and stored in an Ethereum smart contract.
- The new user sends Ether to the contract address using their address specified in account creation. (This can easily be done on any crypto exchange i.e. Coinbase/Gemini)
- This balance is added to the smart contract and the Ether value assigned to the cardholder id (which is tied to the senders public key) is increased. 
- Blocknative, which has been set up to listen for contract activity, picks up on this and notifies a webhook on an express.js backend.
- The address of the contract caller is recorded and the cardholder ID + new Ether balance is retreived.
- A converter function is called using cryptocompare.com’s API to find the current USD value of their Ether.
- The spending limit for the account associated with this cardholder is updated on Stripe according to the value determined in the previous step.

### PART 2 - Spending Funds
- The user decides to buy something with their stripe card.
- Stripe checks the spending limit to determine if the cardholder has enough funds to cover the transaction.
- Stripe sends an issuing_authorization.request to an express.js backend.
- If the amount is less than 100 cents, it’s declined.
  - This is because Stripe requires the spending to be 100 cents minimum.
  - Future software iterations will deactivate the card instead once an Ether balance reaches zero.
- If approved, the authorization is hopefully captured and a transaction is created.
- In this instance, Stripe will eventually send an issuing_authorization.updated event where the authorization is approved and closed.
- In this case, the merchant_amount is recorded and its current Ether exchange rate is queried.
- This current Ether equivalent is subtracted from the user’s current balance in the smart contract.

### PART 3 - Withdrawing Funds
- The user wishes to withdraw Ether from the contract.
- As of right now, they can call a withdraw function on the contract, specifying an amount to withdraw.
  - The issue with this is that it can’t be executed from a crypto exchange.
  - Future software iterations will most likely implement a clever solution for this, such as sending a designated, minuscule Ethereum value which triggers the contract to return all funds to the sender.
- The new spending limit is updated as described in part 1.

> **NOTE:** Verto carries a lump sum of cash on Stripe to cover user purchases.

> **NOTE:** As you may have noticed, the lump sum of cash will decrease over time and the value of spent Ethereum in the contract will increase over time. The contract will need to be flushed at regular intervals and converted to USD, which can then be used to replenish the lump of cash on Stripe.

## FILE STRUCTURE

```app.mjs```

- Holds the express server. This contains webhooks for Stripe and Blocknative to handle authorizations and Ether funding/withdrawals as well as a route to the public wepage.

```deployment/Verto.sol```

- Defines the Smart contract structure and functions.

```deployment/deploy.js```

- Deployment script for putting Verto.sol on a specified blockchain.

```public/```

- Contains a homepage implemented in Bootstrap. The webpage is adapted from the NINESTARS template on bootstrapmade.org.

```converter.mjs```

- Exports two functions. They convert cents to wei (smallest unit of Ether) and vice versa using a live exchange rate API.

```eth_handler.mjs```

- Exports a class for handling interactions with the Ethereum smart contract.

```stripe_handler.mjs```

- Exports a class for handling interactions with Stripe.

```event_handler.mjs```

- Exports a class for handling all events that occur as a result of incoming webhook requests as well as internal calls.
- Implements the three modules described above.

```load_vars.sh```

- Simple shell script for loading environment variables when not in production.

> **NOTE:** All pushes to main are automatically sent to AWS EC2 and deployed.

