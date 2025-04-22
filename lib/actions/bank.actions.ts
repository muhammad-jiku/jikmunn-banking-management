/* eslint-disable @typescript-eslint/no-explicit-any */
import { CountryCode } from 'plaid';
import { plaidClient } from '../plaid';
import { parseStringify } from '../utils';
import { getTransactionsByBankId } from './transaction.actions';
import { getBank, getBanks } from './user.actions';

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });
    console.log('banks', banks);

    const accounts = await Promise.all(
      banks?.map(async (bank: Bank) => {
        // get each account info from plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });
        console.log('accountsResponse', accountsResponse);

        const accountData = accountsResponse.data.accounts[0];
        console.log('accountData', accountData);

        // get institution info from plaid
        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });
        console.log('institution', institution);

        const account = {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          appwriteItemId: bank.$id,
          shareableId: bank.shareableId,
        };
        console.log('account', account);

        return account;
      })
    );
    console.log('accounts', accounts);

    const totalBanks = accounts.length;
    console.log('totalBanks', totalBanks);

    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);
    console.log('totalCurrentBalance', totalCurrentBalance);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error);
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });
    // const bank = await getBank({ documentId: appwriteItemId });
    // if (!bank) {
    //   console.error(`No bank found for ID ${appwriteItemId}`);
    //   return null;
    // }
    console.log('bank', bank);

    console.log('plaidClient', plaidClient);
    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });
    console.log('accountsResponse', accountsResponse);

    const accountData = accountsResponse.data.accounts[0];
    console.log('accountData', accountData);

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });
    console.log('transferTransactionsData', transferTransactionsData);

    const transferTransactions = transferTransactionsData.documents.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? 'debit' : 'credit',
      })
    );
    console.log('transferTransactions', transferTransactions);

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const transactions = await getTransactions({
      accessToken: bank?.accessToken,
    });
    console.log('transactions', transactions);

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
    };
    console.log('account', account);

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    console.log('allTransactions', allTransactions);

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error('An error occurred while getting the account:', error);
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US'] as CountryCode[],
    });
    console.log('institutionResponse', institutionResponse);

    const intitution = institutionResponse.data.institution;
    console.log('intitution', intitution);

    return parseStringify(intitution);
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error);
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let cursor = ''; // <- initial empty cursor
  const allAdded: any[] = []; // accumulate new transactions
  let transactions: any = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      console.log('plaid client....', plaidClient);
      // console.log('plaid client config...', plaidClient.configuration);
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor, // pass the cursor each time
      });
      console.log('response', response);

      const data = response.data;
      console.log('data', data);

      // collect this page’s additions
      allAdded.push(...data.added);
      console.log('allAdded', allAdded);

      // transactions = response.data.added.map((transaction) => ({
      //   id: transaction.transaction_id,
      //   name: transaction.name,
      //   paymentChannel: transaction.payment_channel,
      //   type: transaction.payment_channel,
      //   accountId: transaction.account_id,
      //   amount: transaction.amount,
      //   pending: transaction.pending,
      //   category: transaction.category ? transaction.category[0] : '',
      //   date: transaction.date,
      //   image: transaction.logo_url,
      // }));

      transactions = allAdded.map((tx) => ({
        id: tx.transaction_id,
        name: tx.name,
        paymentChannel: tx.payment_channel,
        type: tx.payment_channel,
        accountId: tx.account_id,
        amount: tx.amount,
        pending: tx.pending,
        category: tx.category?.[0] ?? '',
        date: tx.date,
        image: tx.logo_url,
      }));
      console.log('transactions', transactions);

      // update for next iteration
      cursor = data.next_cursor;
      hasMore = data.has_more;
    }

    // // map/normalize once, after you’ve got every page
    // return allAdded.map((tx) => ({
    //   id: tx.transaction_id,
    //   name: tx.name,
    //   paymentChannel: tx.payment_channel,
    //   type: tx.payment_channel,
    //   accountId: tx.account_id,
    //   amount: tx.amount,
    //   pending: tx.pending,
    //   category: tx.category?.[0] ?? '',
    //   date: tx.date,
    //   image: tx.logo_url,
    // }));

    return parseStringify(transactions);
  } catch (error) {
    console.error('An error occurred while getting the accounts:', error);
  }
};
