import { Client, Account } from 'appwrite';

const client = new Client();

client.
setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT) //API Endpoint
.setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID); //project ID

export const account = new Account(client);
export { client };