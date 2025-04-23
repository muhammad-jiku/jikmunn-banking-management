import HeaderBox from '@/components/shared/HeaderBox';
import RecentTransactions from '@/components/shared/RecentTransactions';
import RightSidebar from '@/components/shared/RightSidebar';
import TotalBalanceBox from '@/components/shared/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/server/actions/bank.actions';
import { getLoggedInUser } from '@/lib/server/actions/user.actions';
import { redirect } from 'next/navigation';

// searchParams is a Promise that must be awaited
interface SearchParamProps {
  searchParams: Promise<{ id?: string; page?: string }>;
}

export default async function Home({ searchParams }: SearchParamProps) {
  try {
    // Fetch the current user
    const loggedIn = await getLoggedInUser();

    // Redirect if user is not logged in
    if (!loggedIn?.$id) {
      console.log('User not logged in, redirecting to sign-in page');
      redirect('/sign-in');
    }

    // Await and extract search params
    const params = await searchParams;
    const id = params?.id || '';
    const page = params?.page || '1';
    const currentPage = Number(page) || 1;

    // Fetch user's bank accounts
    console.log(`Fetching accounts for user: ${loggedIn.$id}`);
    const accounts = await getAccounts({
      userId: loggedIn.$id,
    });

    console.log('Accounts data:', accounts);

    // Check if accounts data is available
    if (
      !accounts ||
      !accounts.data ||
      !Array.isArray(accounts.data) ||
      accounts.data.length === 0
    ) {
      console.log('No bank accounts found for user');

      // Render a message when no accounts are available
      return (
        <section className='home'>
          <div className='home-content'>
            <header className='home-header'>
              <HeaderBox
                type='greeting'
                title='Welcome'
                user={loggedIn?.firstName || 'Guest'}
                subtext='Connect your first bank account to get started.'
              />
            </header>

            <div className='flex items-center justify-center h-64'>
              <p className='text-gray-500'>No bank accounts connected yet.</p>
            </div>
          </div>
        </section>
      );
    }

    const accountsData = accounts.data;

    // Use the id from searchParams or default to the first account if available
    const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

    console.log(`Fetching account details for bank: ${appwriteItemId}`);

    // Fetch selected account details and transactions
    const account = await getAccount({ appwriteItemId });

    console.log('Account data:', account?.data ? 'Found' : 'Not found');
    console.log('Transactions count:', account?.transactions?.length || 0);

    // Ensure we have valid data for rendering
    const transactions = account?.transactions || [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const accountData = account?.data;

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
              totalBanks={accounts?.totalBanks || 0}
              totalCurrentBalance={accounts?.totalCurrentBalance || 0}
            />
          </header>

          <RecentTransactions
            accounts={accountsData}
            transactions={transactions}
            appwriteItemId={appwriteItemId}
            page={currentPage}
          />
        </div>

        <RightSidebar
          user={loggedIn}
          transactions={transactions}
          banks={accountsData?.slice(0, Math.min(2, accountsData.length)) || []}
        />
      </section>
    );
  } catch (error) {
    console.error('Error in Home page:', error);

    // Render an error state
    return (
      <section className='home'>
        <div className='home-content'>
          <div className='p-6 bg-red-50 border border-red-200 rounded-lg'>
            <h2 className='text-lg font-medium text-red-800'>
              Something went wrong
            </h2>
            <p className='mt-1 text-sm text-red-700'>
              We encountered an error while loading your banking information.
              Please try refreshing the page or contact support if the issue
              persists.
            </p>
          </div>
        </div>
      </section>
    );
  }
}
