import AuthForm from '@/components/shared/AuthForm';

const SignIn = () => {
  return (
    <section className='flex-center size-full max-xs:px-6'>
      <AuthForm type='sign-in' />
    </section>
  );
};

export default SignIn;
