import { Test } from '../schema/test';
import { ResultsManager } from './results-manager';
import _ from 'lodash';
import logger from './logger';

export type TestResult<T = unknown> = {
    success: boolean;
    alerts?: string[];
} & Partial<T>;

export abstract class TestRunner<T = unknown> {
    public abstract run(test: Test<T>): Promise<TestResult>;

    protected hasExceededThreshold(current: number, previous: number, threshold: string): boolean {
        logger.debug('Checking whether threshold has been exceeded', { current, previous });

        if (_.isString(threshold) && threshold.endsWith('%')) {
            logger.debug(`Received threshold of ${threshold} as percentage`);
            const percentage = _(threshold).split('%').first()!;
            const percentageDiff = 100 * Math.abs((previous - current) / ((previous + current) / 2));

            return percentageDiff > parseFloat(percentage);
        }

        if (_.isNumber(threshold)) {
            logger.debug(`Received threshold of ${threshold} as deterministic number`);
            return Math.abs(previous - current) > threshold;
        }

        return false;
    }

    async handle(test: Test<T>): Promise<string> {
        const result = await this.run(test);

        return ResultsManager.generateResult(test, result);
    }
}
