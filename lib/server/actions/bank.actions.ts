/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { CountryCode } from 'plaid';
import { plaidClient } from '../../plaid';
import { parseStringify } from '../../utils';
import { getTransactionsByBankId } from './transaction.actions';
import { getBank, getBanks } from './user.actions';

/**
 * Interface for getAccounts function parameters
 */
interface getAccountsProps {
  userId: string;
}

/**
 * Interface for getAccount function parameters
 */
interface getAccountProps {
  appwriteItemId: string;
}

/**
 * Interface for getInstitution function parameters
 */
interface getInstitutionProps {
  institutionId: string;
}

/**
 * Interface for getTransactions function parameters
 */
interface getTransactionsProps {
  accessToken: string;
}

/**
 * Interface for Bank object
 */
interface Bank {
  $id: string;
  accessToken: string;
  shareableId: string;
}

/**
 * Interface for Transaction object
 */
interface Transaction {
  $id: string;
  $createdAt: string;
  name?: string;
  amount?: number;
  channel?: string;
  category?: string;
  senderBankId?: string;
}

/**
 * Get multiple bank accounts for a user
 * @param userId - The ID of the user whose banks to fetch
 * @returns Object containing account data, total number of banks, and total balance
 */
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });

    // Handle case when no banks are found
    if (!banks || !Array.isArray(banks) || banks.length === 0) {
      return parseStringify({
        data: [],
        totalBanks: 0,
        totalCurrentBalance: 0,
      });
    }

    // Process each bank to get account information
    const accountPromises = banks.map(async (bank: Bank) => {
      try {
        // Skip if bank or accessToken is invalid
        if (!bank || !bank.accessToken) {
          console.warn(`Invalid bank data for user ${userId}`);
          return null;
        }

        // get each account info from plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });

        // Handle case when no accounts are found
        if (
          !accountsResponse?.data?.accounts ||
          accountsResponse.data.accounts.length === 0
        ) {
          console.warn(`No accounts found for bank ${bank.$id}`);
          return null;
        }

        const accountData = accountsResponse.data.accounts[0];
        const institutionId = accountsResponse.data.item?.institution_id;

        // Skip if no institution ID is found
        if (!institutionId) {
          console.warn(`No institution ID found for bank ${bank.$id}`);
          return null;
        }

        // get institution info from plaid
        const institution = await getInstitution({
          institutionId: institutionId,
        });

        // Skip if no institution data is found
        if (!institution) {
          console.warn(`Institution data not found for ID ${institutionId}`);
          return null;
        }

        // Create account object with all necessary fields and fallbacks
        const account = {
          id: accountData.account_id,
          availableBalance: accountData.balances.available ?? 0,
          currentBalance: accountData.balances.current ?? 0,
          institutionId: institution.institution_id,
          name: accountData.name ?? 'Unnamed Account',
          officialName:
            accountData.official_name ?? accountData.name ?? 'Unnamed Account',
          mask: accountData.mask ?? '****',
          type: (accountData.type as string) ?? 'unknown',
          subtype: (accountData.subtype as string) ?? '',
          appwriteItemId: bank.$id,
          shareableId: bank.shareableId ?? '',
        };

        return account;
      } catch (error) {
        console.error(`Error processing bank with ID ${bank.$id}:`, error);
        return null;
      }
    });

    // Wait for all account promises to resolve
    const accounts = await Promise.all(accountPromises);

    // Filter out null accounts (those that failed to process)
    const validAccounts = accounts.filter(
      (account): account is NonNullable<typeof account> =>
        account !== null && account !== undefined
    );

    // Calculate summary data
    const totalBanks = validAccounts.length;
    const totalCurrentBalance = validAccounts.reduce((total, account) => {
      return total + (account.currentBalance ?? 0);
    }, 0);

    return parseStringify({
      data: validAccounts,
      totalBanks,
      totalCurrentBalance,
    });
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error);
    // Return safe fallback data
    return parseStringify({
      data: [],
      totalBanks: 0,
      totalCurrentBalance: 0,
    });
  }
};

/**
 * Get details for a single bank account
 * @param appwriteItemId - The Appwrite document ID of the bank
 * @returns Object containing account data and transactions
 */
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    // Validate input
    if (!appwriteItemId) {
      console.warn('No appwriteItemId provided to getAccount');
      return parseStringify({
        data: null,
        transactions: [],
      });
    }

    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });

    // Handle case when bank is not found
    if (!bank || !bank.accessToken) {
      console.warn(`Bank not found for ID ${appwriteItemId}`);
      return parseStringify({
        data: null,
        transactions: [],
      });
    }

    // Get account info from plaid
    let accountsResponse;
    try {
      accountsResponse = await plaidClient.accountsGet({
        access_token: bank.accessToken,
      });
    } catch (error) {
      console.error(
        `Error fetching account data from Plaid for bank ${appwriteItemId}:`,
        error
      );
      return parseStringify({
        data: null,
        transactions: [],
      });
    }

    // Handle case when no accounts are found
    if (
      !accountsResponse?.data?.accounts ||
      accountsResponse.data.accounts.length === 0
    ) {
      console.warn(`No accounts found for bank ${appwriteItemId}`);
      return parseStringify({
        data: null,
        transactions: [],
      });
    }

    const accountData = accountsResponse.data.accounts[0];

    // Get transfer transactions from appwrite
    let transferTransactions = [];
    try {
      const transferTransactionsData = await getTransactionsByBankId({
        bankId: bank.$id,
      });

      // Process transfer transactions if available
      transferTransactions = transferTransactionsData?.documents
        ? transferTransactionsData.documents.map(
            (transferData: Transaction) => ({
              id: transferData.$id,
              name: transferData.name ?? 'Unnamed Transaction',
              amount: transferData.amount ?? 0,
              date: transferData.$createdAt,
              paymentChannel: transferData.channel ?? 'unknown',
              category: transferData.category ?? 'uncategorized',
              type: transferData.senderBankId === bank.$id ? 'debit' : 'credit',
            })
          )
        : [];
    } catch (error) {
      console.error(
        `Error fetching transfer transactions for bank ${appwriteItemId}:`,
        error
      );
      // Continue with empty transfer transactions
      transferTransactions = [];
    }

    // Ensure we have an institution ID
    const institutionId = accountsResponse.data.item?.institution_id;
    if (!institutionId) {
      console.warn(`No institution ID found for bank ${appwriteItemId}`);
      // We can still continue with partial data
    }

    // Get institution info from plaid
    let institution = null;
    if (institutionId) {
      try {
        institution = await getInstitution({ institutionId });
      } catch (error) {
        console.error(
          `Error fetching institution data for ID ${institutionId}:`,
          error
        );
        // Continue with null institution
      }
    }

    // Get Plaid transactions, handling potential errors
    let plaidTransactions = [];
    try {
      plaidTransactions =
        (await getTransactions({
          accessToken: bank.accessToken,
        })) || [];
    } catch (error) {
      console.error(
        `Error fetching Plaid transactions for bank ${appwriteItemId}:`,
        error
      );
      // Continue with empty plaid transactions
    }

    // Create account object with all necessary fields and fallbacks
    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available ?? 0,
      currentBalance: accountData.balances.current ?? 0,
      institutionId: institution?.institution_id ?? 'unknown',
      name: accountData.name ?? 'Unnamed Account',
      officialName:
        accountData.official_name ?? accountData.name ?? 'Unnamed Account',
      mask: accountData.mask ?? '****',
      type: (accountData.type as string) ?? 'unknown',
      subtype: (accountData.subtype as string) ?? '',
      appwriteItemId: bank.$id,
    };

    // Ensure plaidTransactions is an array
    if (!Array.isArray(plaidTransactions)) {
      plaidTransactions = [];
    }

    // Ensure transferTransactions is an array
    if (!Array.isArray(transferTransactions)) {
      transferTransactions = [];
    }

    // Sort transactions by date such that the most recent transaction is first
    const allTransactions = [
      ...plaidTransactions,
      ...transferTransactions,
    ].sort((a, b) => {
      // Handle potentially invalid dates
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error('An error occurred while getting the account:', error);
    return parseStringify({
      data: null,
      transactions: [],
    });
  }
};

/**
 * Get institution details from Plaid
 * @param institutionId - The Plaid institution ID
 * @returns Institution data or null if not found
 */
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    // Validate input
    if (!institutionId) {
      console.warn('No institutionId provided to getInstitution');
      return null;
    }

    // Get institution data from Plaid
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US'] as CountryCode[],
    });

    // Validate response
    if (!institutionResponse?.data?.institution) {
      console.warn(`Institution not found for ID ${institutionId}`);
      return null;
    }

    const institution = institutionResponse.data.institution;
    return parseStringify(institution);
  } catch (error) {
    console.error(
      `An error occurred while getting the institution (ID: ${institutionId}):`,
      error
    );
    return null;
  }
};

/**
 * Get transactions for a bank account from Plaid
 * @param accessToken - The Plaid access token for the bank
 * @returns Array of transactions or empty array if none found or error occurs
 */
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  // Validate input
  if (!accessToken) {
    console.warn('No accessToken provided to getTransactions');
    return [];
  }

  let hasMore = true;
  let transactions: any[] = [];
  let cursor: string | null = null;

  try {
    // Iterate through each page of transaction updates for item
    while (hasMore) {
      // Prepare request parameters
      const params: any = {
        access_token: accessToken,
      };

      // Add cursor if available from previous iterations
      if (cursor) {
        params.cursor = cursor;
      }

      // Call Plaid API
      const response = await plaidClient.transactionsSync(params);

      // Validate response
      if (!response?.data) {
        console.warn('Invalid response from Plaid transactionsSync');
        break;
      }

      const data = response.data;

      // Ensure we have an 'added' array
      if (!data.added || !Array.isArray(data.added)) {
        console.warn('No added transactions in Plaid response');
        data.added = [];
      }

      // Map the new transactions
      const newTransactions = data.added.map((transaction) => ({
        id:
          transaction.transaction_id ||
          `tx-${Math.random().toString(36).substring(2, 15)}`,
        name: transaction.name || 'Unnamed Transaction',
        paymentChannel: transaction.payment_channel || 'other',
        type: transaction.payment_channel || 'other',
        accountId: transaction.account_id || 'unknown',
        amount: transaction.amount || 0,
        pending: transaction.pending || false,
        category: transaction.category
          ? transaction.category[0]
          : 'uncategorized',
        date: transaction.date || new Date().toISOString().split('T')[0],
        image: transaction.logo_url || null,
      }));

      // Add the new transactions to the running list
      transactions = [...transactions, ...newTransactions];

      // Update pagination tracking
      hasMore = data.has_more || false;
      cursor = data.next_cursor || null;

      // Safety check to prevent infinite loops
      if (transactions.length > 5000) {
        console.warn(
          'Transaction fetch limit reached (5000). Stopping pagination.'
        );
        break;
      }
    }

    return parseStringify(transactions);
  } catch (error: unknown) {
    console.error('An error occurred while getting the transactions:', error);

    // Properly type-check if error is an AxiosError to access response data
    if (error instanceof Error) {
      console.error('Error message:', error.message);

      // Check if it's an AxiosError with response data
      if (
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
      ) {
        console.error('Plaid API error details:', error.response.data);
      }
    }

    // Return an empty array instead of undefined
    return [];
  }
};
