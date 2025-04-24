import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const rawEnv = (process.env.PLAID_ENV ?? 'sandbox').toLowerCase();
const basePath =
  rawEnv === 'production'
    ? PlaidEnvironments.production
    : rawEnv === 'development'
    ? PlaidEnvironments.development
    : PlaidEnvironments.sandbox;

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
