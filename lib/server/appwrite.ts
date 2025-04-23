'use server';

import { cookies } from 'next/headers';
import { Account, Client, Databases, Users } from 'node-appwrite';

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const session = (await cookies()).get('jikmunn-session');
  if (!session || !session.value) {
    throw new Error('No session');
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY!);

  // console.log('createAdminClient', client);
  // console.log('createAdminClient endpoint', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!);
  // console.log('createAdminClient project id', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
  // console.log('createAdminClient api key', process.env.NEXT_PUBLIC_APPWRITE_API_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get database() {
      return new Databases(client);
    },
    get user() {
      return new Users(client);
    },
  };
}
