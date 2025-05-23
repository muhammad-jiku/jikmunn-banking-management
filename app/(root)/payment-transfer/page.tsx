import HeaderBox from '@/components/shared/HeaderBox';
import PaymentTransferForm from '@/components/shared/PaymentTransferForm';
import { getAccounts } from '@/lib/server/actions/bank.actions';
import { getLoggedInUser } from '@/lib/server/actions/user.actions';

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({
    userId: loggedIn.$id,
  });

  if (!accounts) return;

  const accountsData = accounts?.data;

  return (
    <section className='payment-transfer'>
      <HeaderBox
        title='Payment Transfer'
        subtext='Please provide any specific details or notes related to the payment transfer'
      />

      <section className='size-full pt-5'>
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  );
};

export default Transfer;
