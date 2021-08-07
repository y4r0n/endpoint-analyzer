import { TestResult, TestRunner } from '../common/test-runner';
import { Test } from '../schema/test';
import dns from 'dns';
import logger from '../common/logger';

type DnsTestOptions = null;

type DnsTestResult = {
    lookup: string;
};

export class DnsTestRunner extends TestRunner<DnsTestOptions> {
    private async lookup(endpoint: string): Promise<string> {
        return new Promise((resolve, reject) => {
            dns.lookup(endpoint, (err, address) => {
                err ? reject(err) : resolve(address);
            });
        });
    }

    async run({ endpoint }: Test<DnsTestOptions>): Promise<TestResult<DnsTestResult>> {
        logger.debug(`Testing DNS connectivity for endpoint: ${endpoint}`);
        try {
            const address = await this.lookup(endpoint);

            logger.debug(`Successfully tested DNS connectivity`);
            return { success: true, lookup: address };
        } catch (err) {
            logger.error(`Failed to get DNS record`);
            logger.error(err);
            return { success: false };
        }
    }
}
