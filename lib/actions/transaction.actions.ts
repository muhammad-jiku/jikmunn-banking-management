import { ID, Query } from 'node-appwrite';
import { createAdminClient } from '../server/appwrite';
import { parseStringify } from '../utils';

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_TRANSACTIONS_COLLECTION_ID: TRANSACTIONS_COLLECTION_ID,
} = process.env;

export const createTransaction = async (
  transaction: CreateTransactionProps
) => {
  try {
    console.log('Creating transaction', transaction);

    const { database } = await createAdminClient();
    console.log('database', database);

    const newTransaction = await database.createDocument(
      DATABASE_ID!,
      TRANSACTIONS_COLLECTION_ID!,
      ID.unique(),
      {
        channel: 'online',
        category: 'Transfer',
        ...transaction,
      }
    );
    console.log('newTransaction', newTransaction);

    return parseStringify(newTransaction);
  } catch (error) {
    console.log(error);
  }
};

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  try {
    const { database } = await createAdminClient();
    console.log('database', database);

    const senderTransactions = await database.listDocuments(
      DATABASE_ID!,
      TRANSACTIONS_COLLECTION_ID!,
      [Query.equal('senderBankId', bankId)]
    );
    console.log('senderTransactions', senderTransactions);

    const receiverTransactions = await database.listDocuments(
      DATABASE_ID!,
      TRANSACTIONS_COLLECTION_ID!,
      [Query.equal('receiverBankId', bankId)]
    );
    console.log('receiverTransactions', receiverTransactions);

    const transactions = {
      total: senderTransactions.total + receiverTransactions.total,
      documents: [
        ...senderTransactions.documents,
        ...receiverTransactions.documents,
      ],
    };
    console.log('transactions', transactions);

    return parseStringify(transactions);
  } catch (error) {
    console.log(error);
  }
};
