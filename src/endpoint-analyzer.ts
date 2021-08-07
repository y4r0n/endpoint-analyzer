import yaml from 'js-yaml';
import fs from 'fs';
import { TestRunner } from './common/test-runner';
import { DnsTestRunner } from './runners/dns-test-runner';
import { HttpTestRunner } from './runners/http-test-runner';
import { SupportedTestTypes, Test } from './schema/test';
import { configSchema, Configuration } from './schema/configuration';
import { ResultsManager } from './common/results-manager';

export class EndpointAnalyzer {
    private runners: Record<SupportedTestTypes, TestRunner>;

    constructor() {
        this.runners = {
            dns: new DnsTestRunner(),
            http: new HttpTestRunner(),
            https: new HttpTestRunner(),
        };
    }

    public async init(filename: string) {
        const config = this.loadConfig(filename);
        return await this.runTests(config.tests);
    }

    private async runTests(tests: Test[]) {
        const output = await Promise.all(tests.map((test) => this.runners[test.type].handle(test)));

        ResultsManager.publishResults(output);
    }

    private loadConfig(filename: string): Configuration {
        let content;

        try {
            content = fs.readFileSync(filename, 'utf8');
        } catch (err) {
            throw new Error(`Could not find a configuration file in ${filename}`);
        }

        try {
            content = yaml.load(content);
        } catch (err) {
            throw new Error(`Could not read ${filename} as a valid yaml`);
        }

        try {
            configSchema.validateSync(content);
        } catch (err) {
            throw new Error(`Malformed analyzer config: ${err.toString()}`);
        }

        return content as Configuration;
    }
}
