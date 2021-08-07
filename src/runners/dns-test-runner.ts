import { TestResult, TestRunner } from '../common/test-runner';
import { Test } from '../schema/test';
import dns from 'dns';

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

    async run(test: Test<DnsTestOptions>): Promise<TestResult<DnsTestResult>> {
        try {
            const address = await this.lookup(test.endpoint);
            return { success: true, lookup: address };
        } catch (err) {
            return { success: false };
        }
    }
}
