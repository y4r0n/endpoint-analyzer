import fs from 'fs';
import _ from 'lodash';
import { TestResult } from './test-runner';
import { Test } from '../schema/test';

const RESULTS_FILE_NAME = 'results.txt';
const SUCCESS_PREFIX = 'SUCCESS';
const FAIL_PREFIX = 'FAIL';
const LINE_DELIMITER = '\n';
const TEST_OPTION_PREFIX = '[';
const TEST_OPTION_SUFFIX = ']';

export class ResultsManager {
    static publishResults(results: string[]) {
        const resultsText = results.join(LINE_DELIMITER) + LINE_DELIMITER;

        console.log('### TEST RESULTS:');
        console.log(resultsText);
        fs.appendFileSync(RESULTS_FILE_NAME, results.join(LINE_DELIMITER) + LINE_DELIMITER);
    }

    static getResultTestOptionPrefix = (testOption: string) => {
        return `${TEST_OPTION_PREFIX}${testOption}:`;
    };

    static getLastTestResult(endpoint: string, testOptionText: string) {
        let content, result;

        try {
            content = fs.readFileSync(RESULTS_FILE_NAME, 'utf8');
        } catch (err) {
            return;
        }

        const relevantResults = _(content)
            .split(LINE_DELIMITER)
            .filter((result) => result.includes(testOptionText) && result.includes(endpoint))
            .value();

        if (relevantResults.length) {
            const lastResult = _.last(relevantResults);
            const testOptionValueText = _(lastResult)
                .split(ResultsManager.getResultTestOptionPrefix(testOptionText))
                .last()!
                .trim();

            result = _(testOptionValueText).split(' ').first();
        }

        return result;
    }

    static generateResult(test: Test, result: TestResult): string {
        const { success, alerts, ...rest } = result;
        let lines: string[] = [];

        const getOptionText = (testOption: string, result: string) =>
            `${ResultsManager.getResultTestOptionPrefix(testOption)} ${result}${TEST_OPTION_SUFFIX}`;

        const prefix = `${success ? SUCCESS_PREFIX : FAIL_PREFIX}`;
        const optionsResults = _.entries(rest)
            .map(([title, result]) => getOptionText(title, result))
            .join(' ');

        const resultText = `${prefix}: ${test.type.toUpperCase()} test for ${test.endpoint} ${
            optionsResults.length ? `${optionsResults}` : ''
        }`;

        lines.push(resultText);

        if (!_.isEmpty(alerts)) {
            lines.push(...alerts!.map((alert) => `ALERT: ${alert}`));
        }

        return lines.join('\n');
    }
}
