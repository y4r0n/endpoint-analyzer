import * as yup from 'yup';
import { Test, testSchema } from './test';

export type Configuration = {
    tests: Test[];
};

export const configSchema: yup.SchemaOf<Configuration> = yup.object().shape({
    tests: yup.array().of(testSchema).defined(),
});
