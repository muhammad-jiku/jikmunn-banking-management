'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ID, Query } from 'node-appwrite';
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from 'plaid';
import { plaidClient } from '../plaid';
import { createAdminClient, createSessionClient } from '../server/appwrite';
import { encryptId, extractCustomerIdFromUrl, parseStringify } from '../utils';
import { addFundingSource, createDwollaCustomer } from './dwolla.actions';

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USERS_COLLECTION_ID: USERS_COLLECTION_ID,
  APPWRITE_BANKS_COLLECTION_ID: BANKS_COLLECTION_ID,
} = process.env;

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();
    console.log('userId', userId);
    console.log('database', database);

    const user = await database.listDocuments(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );
    console.log('user', user);

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error);
  }
};

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    console.log('account', account);

    const session = await account.createEmailPasswordSession(email, password);
    console.log('session', session);

    (await cookies()).set('jikmunn-session', session.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
    });

    const user = await getUserInfo({ userId: session.userId });
    console.log('user', user);

    return parseStringify(user);
  } catch (error) {
    console.error('Error', error);
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;
  console.log('userData', userData);

  let newUserAccount;

  try {
    const { account, database } = await createAdminClient();
    console.log('account', account);
    console.log('database', database);

    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    );
    console.log('New user account:', newUserAccount);

    if (!newUserAccount) throw new Error('Error creating user');

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal',
    });
    console.log('Dwolla customer URL:', dwollaCustomerUrl);

    if (!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer');

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);
    console.log('Dwolla customer ID:', dwollaCustomerId);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }
    );
    console.log('New user document:', newUser);

    const session = await account.createEmailPasswordSession(email, password);
    console.log('Session:', session);

    (await cookies()).set('jikmunn-session', session.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
    });

    return parseStringify(newUser);
  } catch (error) {
    console.error('Error', error);
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    console.log('account', account);

    const result = await account.get();
    console.log('result', result);

    const user = await getUserInfo({ userId: result.$id });
    console.log('user', user);

    return parseStringify(user);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    console.log('account', account);

    (await cookies()).delete('jikmunn-session');

    await account.deleteSession('current');
  } catch (error) {
    console.log('Error', error);
    return null;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    };
    console.log('tokenParams', tokenParams);

    const response = await plaidClient.linkTokenCreate(tokenParams);
    console.log('response', response);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.log(error);
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();
    console.log('database', database);

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANKS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    );
    console.log('bankAccount', bankAccount);

    return parseStringify(bankAccount);
  } catch (error) {
    console.log(error);
  }
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    console.log('response', response);

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    console.log('accessToken', accessToken);
    console.log('itemId', itemId);

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    console.log('accountsResponse', accountsResponse);

    const accountData = accountsResponse.data.accounts[0];
    console.log('accountData', accountData);

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum,
    };
    console.log('request', request);

    const processorTokenResponse = await plaidClient.processorTokenCreate(
      request
    );
    console.log('processorTokenResponse', processorTokenResponse);

    const processorToken = processorTokenResponse.data.processor_token;
    console.log('processorToken', processorToken);

    // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });
    console.log('fundingSourceUrl', fundingSourceUrl);

    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error;

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    // Revalidate the path to reflect the changes
    revalidatePath('/');

    // Return a success message
    return parseStringify({
      publicTokenExchange: 'complete',
    });
  } catch (error) {
    console.error('An error occurred while creating exchanging token:', error);
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();
    console.log('database', database);

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANKS_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );
    console.log('banks', banks);

    return parseStringify(banks.documents);
  } catch (error) {
    console.log(error);
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();
    console.log('database', database);

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANKS_COLLECTION_ID!,
      [Query.equal('$id', [documentId])]
    );
    console.log('bank', bank);

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};

// export const getBank = async ({ documentId }: getBankProps) => {
//   if (!documentId) {
//     throw new Error('getBank: must provide a documentId');
//   }
//   try {
//     const { database } = await createAdminClient();
//     // ← direct fetch by ID, no Query.equal needed
//     const bank = await database.getDocument(
//       DATABASE_ID!,
//       BANKS_COLLECTION_ID!,
//       documentId
//     );

//     return parseStringify(bank);
//   } catch (error) {
//     console.log(error);
//   }
// };

export const getBankByAccountId = async ({
  accountId,
}: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();
    console.log('database', database);

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANKS_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    );
    console.log('bank', bank);

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};
