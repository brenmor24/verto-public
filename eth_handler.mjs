import Web3 from 'web3'

class EthConn {
  // define abi for contract interactions
  static CONTRACT_ABI = [{ "inputs": [], "name": "addFunds", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "id", "type": "string" }], "name": "checkBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "id", "type": "string" }, { "internalType": "address", "name": "add", "type": "address" }, { "internalType": "address", "name": "caller", "type": "address" }], "name": "createUser", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "id", "type": "string" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "caller", "type": "address" }], "name": "spendFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdrawFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

  constructor() {
    // create web3 provider
    var providerURL = process.env.PROVIDER_URL;
    var web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

    // add account to web3
    const privateKey = process.env.PRIVATE_KEY;
    var account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    // set caller instance
    this.caller = process.env.ACCOUNT_ADDRESS;

    // set web3 instance
    this.web3 = web3;

    // create contract
    const contractAddress = process.env.CONTRACT_ADDRESS;
    var contract = new web3.eth.Contract(EthConn.CONTRACT_ABI, contractAddress);

    // set contract instance
    this.contract = contract;
  }

  // USE FOR TESTING NOT PRODUCTION
  async addFunds(amount) {
    var contract = this.contract;
    const caller = this.caller;
    const response = await contract.methods.fundAccount().send({
      from: caller,
      value: amount,
      gas: 1000000
    });
    return response;
  }

  // remove equivalent funds spent on card from ethereum balance
  async spendFunds(stripe_id, amount) {
    var contract = this.contract;
    const caller = this.caller;
    const response = await contract.methods.spendFunds(stripe_id, amount, caller).send({
      from: caller,
      gas: 1000000
    });
    return response;
  }

  // USE FOR TESTING NOT PRODUCTION
  async withdrawFunds(amount) {
    var contract = this.contract;
    const caller = this.caller;
    const response = await contract.methods.withdrawFunds(amount).send({
      from: caller,
      gas: 1000000
    });
    return response;
  }

  // check ethereum balance using stripe id
  async checkBalance(stripe_id) {
    var contract = this.contract;
    const balance = await contract.methods.checkBalance(stripe_id).call();
    return balance;
  }

  // check ethereum balance using address
  async checkBalanceAddress(address) {
    var contract = this.contract;
    const balance = await contract.methods.checkBalanceAddress(address).call();
    return balance;
  }

  // create a new user with id + address pair
  async createUser(stripe_id, address) {
    var contract = this.contract;
    const caller = this.caller;
    const response = await contract.methods.createUser(stripe_id, address, caller).send({
      from: caller,
      gas: 1000000
    });
    return response;
  }
}

export default EthConn;