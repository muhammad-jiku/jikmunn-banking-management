import BankCard from '@/components/shared/BankCard';
import HeaderBox from '@/components/shared/HeaderBox';
import { getAccounts } from '@/lib/server/actions/bank.actions';
import { getLoggedInUser } from '@/lib/server/actions/user.actions';
import { Key } from 'react';

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({
    userId: loggedIn.$id,
  });

  return (
    <section className='flex'>
      <div className='my-banks'>
        <HeaderBox
          title='My Bank Accounts'
          subtext='Effortlessly manage your banking activites.'
        />

        <div className='space-y-4'>
          <h2 className='header-2'>Your cards</h2>
          <div className='flex flex-wrap gap-6 lg:gap-x-[1px] lg:gap-y-6'>
            {accounts &&
              accounts.data.map((a: Account, idx: Key | null | undefined) => (
                <BankCard
                  key={idx}
                  account={a}
                  userName={`${loggedIn?.firstName} ${loggedIn?.lastName}`}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;
