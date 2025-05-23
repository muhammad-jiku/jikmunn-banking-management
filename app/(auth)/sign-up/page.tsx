import AuthForm from '@/components/shared/AuthForm';

const SignUp = async () => {
  return (
    <section className='flex-center size-full max-sm:px-6'>
      <AuthForm type='sign-up' />
    </section>
  );
};

export default SignUp;
