import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1') //API Endpoint
    .setProject('692882a20032126470c2'); //project ID

export const account = new Account(client);
export { client };