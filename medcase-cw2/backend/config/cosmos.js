// config/cosmos.js – Azure Cosmos DB client singleton
const { CosmosClient } = require('@azure/cosmos');

let _client = null;
let _container = null;

function getClient() {
  if (!_client) {
    if (!process.env.COSMOS_CONNECTION_STRING) {
      throw new Error('COSMOS_CONNECTION_STRING environment variable not set');
    }
    _client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  }
  return _client;
}

async function getContainer() {
  if (!_container) {
    const client   = getClient();
    const database = client.database(process.env.COSMOS_DATABASE  || 'MedCaseDB');
    _container     = database.container(process.env.COSMOS_CONTAINER || 'cases');
  }
  return _container;
}

module.exports = { getClient, getContainer };
