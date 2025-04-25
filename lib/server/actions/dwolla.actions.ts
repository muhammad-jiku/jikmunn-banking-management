/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { Client } from 'dwolla-v2';

const getEnvironment = (): 'production' | 'sandbox' => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case 'sandbox':
      return 'sandbox';
    case 'production':
      return 'production';
    default:
      throw new Error(
        'Dwolla environment should either be set to `sandbox` or `production`'
      );
  }
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    return await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get('location'));
  } catch (err: any) {
    // Check if this is a duplicate resource error
    if (
      err.body &&
      err.body.code === 'DuplicateResource' &&
      err.body._links?.about?.href
    ) {
      console.log(
        'Found duplicate funding source, returning existing one:',
        err.body._links.about.href
      );
      // Return the URL of the existing funding source instead of throwing an error
      return err.body._links.about.href;
    }

    console.error('Creating a Funding Source Failed: ', err);
    throw err; // Re-throw other errors
  }
};

// Get funding source ID from a URL
const getFundingSourceIdFromUrl = (url: string): string => {
  return url.split('/').pop() || '';
};

// Check if a bank account already exists for a customer
export const checkExistingFundingSource = async (
  customerId: string,
  bankName: string
) => {
  try {
    // Get all funding sources for the customer
    const response = await dwollaClient.get(
      `customers/${customerId}/funding-sources`
    );

    // Check if response has the expected structure
    if (
      !response.body ||
      !response.body._embedded ||
      !response.body._embedded['funding-sources']
    ) {
      console.warn('Unexpected response structure from Dwolla API');
      return null;
    }

    const fundingSources = response.body._embedded['funding-sources'];

    // Check if a funding source with this name already exists
    const existingSource = fundingSources.find(
      (source: any) => source.name === bankName
    );

    return existingSource ? existingSource._links.self.href : null;
  } catch (err) {
    console.error('Error checking existing funding sources:', err);
    return null;
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      'on-demand-authorizations'
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error('Creating an On Demand Authorization Failed: ', err);
    throw err;
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    return await dwollaClient
      .post('customers', newCustomer)
      .then((res) => res.headers.get('location'));
  } catch (err) {
    console.error('Creating a Dwolla Customer Failed: ', err);
    throw err;
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: 'USD',
        value: amount,
      },
    };
    return await dwollaClient
      .post('transfers', requestBody)
      .then((res) => res.headers.get('location'));
  } catch (err) {
    console.error('Transfer fund failed: ', err);
    throw err;
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    // Create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    // Check if this funding source already exists
    const existingFundingSourceUrl = await checkExistingFundingSource(
      dwollaCustomerId,
      bankName
    );

    if (existingFundingSourceUrl) {
      console.log('Funding source already exists, using existing one');
      return existingFundingSourceUrl;
    }

    // If not found, add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };

    return await createFundingSource(fundingSourceOptions);
  } catch (err) {
    console.error('Adding funding source failed: ', err);
    return null;
  }
};

// Get details about a funding source
export const getFundingSourceDetails = async (fundingSourceUrl: string) => {
  try {
    const fundingSourceId = getFundingSourceIdFromUrl(fundingSourceUrl);
    const response = await dwollaClient.get(
      `funding-sources/${fundingSourceId}`
    );
    return response.body;
  } catch (err) {
    console.error('Error fetching funding source details:', err);
    return null;
  }
};
