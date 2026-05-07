// config/storage.js – Azure Blob Storage client
const { BlobServiceClient } = require('@azure/storage-blob');

let _blobServiceClient = null;

function getBlobServiceClient() {
  if (!_blobServiceClient) {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable not set');
    }
    _blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
  }
  return _blobServiceClient;
}

async function getContainerClient(containerName) {
  const client = getBlobServiceClient();
  return client.getContainerClient(containerName);
}

module.exports = { getBlobServiceClient, getContainerClient };
