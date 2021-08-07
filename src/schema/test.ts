import * as yup from 'yup';

export type SupportedTestTypes = 'dns' | 'http' | 'https';

export type Test<T = unknown> = {
    type: SupportedTestTypes;
    endpoint: string;
    options?: T;
};

export const testSchema: yup.SchemaOf<Test> = yup.object().shape({
    type: yup.mixed<SupportedTestTypes>().oneOf(['dns', 'http', 'https']).defined(),
    endpoint: yup.string().defined(),
    options: yup.mixed<Test>(),
});
