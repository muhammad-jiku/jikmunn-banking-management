import HeaderBox from '@/components/shared/HeaderBox';
import RecentTransactions from '@/components/shared/RecentTransactions';
import RightSidebar from '@/components/shared/RightSidebar';
import TotalBalanceBox from '@/components/shared/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { createSessionClient } from '@/lib/server/appwrite';
import { redirect } from 'next/navigation';

// searchParams is a Promise that must be awaited
interface SearchParamProps {
  searchParams: Promise<{ id?: string; page?: string }>;
}

export default async function Home({ searchParams }: SearchParamProps) {
  // Initialize Appwrite session
  await createSessionClient();

  // Fetch the current user
  const loggedIn = await getLoggedInUser();
  if (!loggedIn?.$id) redirect('/sign-in');

  // Await and extract search params
  const { id, page } = await searchParams;
  const currentPage = Number(page as string) || 1;

  // Fetch user's bank accounts
  const accounts = await getAccounts({
    userId: loggedIn.$id,
  });
  // if (!accounts) return null;
  if (!accounts) return;

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  // Fetch selected account details and transactions
  const account = await getAccount({ appwriteItemId });
  // if (!account) return null;

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type='greeting'
            title='Welcome'
            user={loggedIn?.firstName || 'Guest'}
            subtext='Access and manage your account and transactions efficiently.'
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>

        <RecentTransactions
          accounts={accountsData}
          transactions={account?.transactions}
          appwriteItemId={appwriteItemId}
          page={currentPage}
        />
      </div>

      <RightSidebar
        user={loggedIn}
        transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  );
}
