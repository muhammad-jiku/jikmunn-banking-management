/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authFormSchema } from '@/lib/utils';
import { Control, FieldPath } from 'react-hook-form';
import { z } from 'zod';

const formSchema = authFormSchema('sign-up');

interface CustomFormField {
  control: Control<z.infer<typeof formSchema>>;
  name: FieldPath<z.infer<typeof formSchema>>;
  label: string;
  placeholder: string;
}

const CustomFormField = ({
  control,
  name,
  label,
  placeholder,
}: CustomFormField) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className='form-item'>
          <FormLabel
            className='form-label'
            // className='shad-input-label'
            htmlFor={`input-${name}`}
          >
            {label}
          </FormLabel>
          <div className='flex w-full flex-col'>
            <FormControl>
              <Input
                id={`input-${name}`}
                aria-describedby={
                  fieldState.error ? `error-${name}` : undefined
                }
                placeholder={placeholder}
                className='input-class'
                // className='shad-input'
                type={name === 'password' ? 'password' : 'text'}
                {...field}
              />
            </FormControl>
            <FormMessage
              id={`error-${name}`}
              className='form-message mt-2'
              // className='shad-error mt-2'
            />
          </div>
        </div>
      )}
    />
  );
};

export default CustomFormField;
