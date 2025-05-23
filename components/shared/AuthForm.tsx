'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { signIn, signUp } from '@/lib/server/actions/user.actions';
import { authFormSchema, generateUsername } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import CustomFormField from './CustomFormField';
import PlaidLink from './PlaidLink';

const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = authFormSchema(type);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 2. Define a submit handler.
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Sign up with Appwrite & create plaid token
      if (type === 'sign-up') {
        const username = generateUsername(data.firstName!, data.lastName!);

        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          username,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password,
        };

        const newUser = await signUp(userData);

        setUser(newUser);
      }

      if (type === 'sign-in') {
        const response = await signIn({
          email: data.email,
          password: data.password,
        });

        if (response) router.push('/');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className='auth-form'>
      <header className='flex flex-col gap-5 md:gap-8'>
        <Link href='/' className='cursor-pointer flex items-center gap-1'>
          <Image
            src='/icons/logo.svg'
            width={34}
            height={34}
            alt='Skyline logo'
          />
          <h1 className='text-26 font-ibm-plex-serif font-bold text-black-1'>
            Skyline
          </h1>
        </Link>

        <div className='flex flex-col gap-1 md:gap-3'>
          <h1 className='text-24 lg:text-36 font-semibold text-gray-900'>
            {user ? 'Link Account' : type === 'sign-in' ? 'Sign in' : 'Sign up'}
            <p className='text-16 font-normal text-gray-600'>
              {user
                ? 'Link your account to get started'
                : 'Please enter your details'}
            </p>
          </h1>
        </div>
      </header>
      {user ? (
        <div className='flex flex-col gap-4'>
          <PlaidLink user={user} variant='primary' />
        </div>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {type === 'sign-up' && (
                <>
                  <div className='flex gap-4'>
                    <CustomFormField
                      control={form.control}
                      name='firstName'
                      label='First Name'
                      placeholder='Enter your first name'
                    />
                    <CustomFormField
                      control={form.control}
                      name='lastName'
                      label='Last Name'
                      placeholder='Enter your first name'
                    />
                  </div>
                  <CustomFormField
                    control={form.control}
                    name='address1'
                    label='Address'
                    placeholder='Enter your specific address'
                  />
                  <CustomFormField
                    control={form.control}
                    name='city'
                    label='City'
                    placeholder='Enter your city'
                  />
                  <div className='flex gap-4'>
                    <CustomFormField
                      control={form.control}
                      name='state'
                      label='State'
                      placeholder='Example: NY'
                    />
                    <CustomFormField
                      control={form.control}
                      name='postalCode'
                      label='Postal Code'
                      placeholder='Example: 11101'
                    />
                  </div>
                  <div className='flex gap-4'>
                    <CustomFormField
                      control={form.control}
                      name='dateOfBirth'
                      label='Date of Birth'
                      placeholder='YYYY-MM-DD'
                    />
                    <CustomFormField
                      control={form.control}
                      name='ssn'
                      label='SSN'
                      placeholder='Example: 1234'
                    />
                  </div>
                </>
              )}

              <CustomFormField
                control={form.control}
                name='email'
                label='Email'
                placeholder='Enter your email'
              />

              <CustomFormField
                control={form.control}
                name='password'
                label='Password'
                placeholder='Enter your password'
              />

              <div className='flex flex-col gap-4'>
                <Button type='submit' disabled={isLoading} className='form-btn'>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className='animate-spin' /> &nbsp;
                      Loading...
                    </>
                  ) : type === 'sign-in' ? (
                    'Sign in'
                  ) : (
                    'Sign up'
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <footer className='flex justify-center gap-1'>
            <p className='text-14 font-normal text-gray-600'>
              {type === 'sign-in'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </p>
            <Link
              href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
              className='form-link'
            >
              {type === 'sign-in' ? 'Sign up' : 'Sign in'}
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};

export default AuthForm;
