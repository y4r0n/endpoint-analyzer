import { Test } from '../schema/test';
import { ResultsManager } from './results-manager';
import _ from 'lodash';

export type TestResult<T = unknown> = {
    success: boolean;
    alerts?: string[];
} & Partial<T>;

export abstract class TestRunner<T = unknown> {
    public abstract run(test: Test<T>): Promise<TestResult>;

    protected hasExceededThreshold(current: number, previous: number, threshold: string): boolean {
        if (_.isString(threshold) && threshold.endsWith('%')) {
            const percentage = _(threshold).split('%').first()!;
            const percentageDiff = 100 * Math.abs((previous - current) / ((previous + current) / 2));

            return percentageDiff > parseFloat(percentage);
        }

        if (_.isNumber(threshold)) {
            return Math.abs(previous - current) > threshold;
        }

        return false;
    }

    async handle(test: Test<T>): Promise<string> {
        const result = await this.run(test);

        return ResultsManager.generateResult(test, result);
    }
}
