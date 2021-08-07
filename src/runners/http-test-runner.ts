import _ from 'lodash';
import axios from 'axios';
import { TestResult, TestRunner } from '../common/test-runner';
import { Test } from '../schema/test';
import { ResultsManager } from '../common/results-manager';
import logger from '../common/logger';

declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata: { startTime?: Date; endTime?: Date };
    }

    export interface AxiosResponse {
        latencyInSeconds: number;
    }
}

type ThresholdOption = {
    threshold: string;
};

type HttpTestOptions = {
    latency?: boolean | ThresholdOption;
    bandwidth?: boolean | ThresholdOption;
};

type HttpTestResult = {
    latency?: string;
    bandwidth?: string;
};

type GetAlertTextArgs = {
    endpoint: string;
    options: HttpTestOptions;
    optionText: keyof HttpTestOptions;
    value: any;
};

axios.interceptors.request.use((config) => {
    config.metadata = { startTime: new Date() };
    return config;
});

axios.interceptors.response.use((response) => {
    response.config.metadata.endTime = new Date();

    const latency = response.config.metadata.endTime.getTime() - response.config.metadata.startTime!.getTime();
    response.latencyInSeconds = latency / 1000;
    return response;
});

export class HttpTestRunner extends TestRunner<HttpTestOptions> {
    private calculateMbps(latency: number, bytes: number) {
        const bits = bytes * 8;
        return bits / latency / 100000;
    }

    private getAlertText({ endpoint, options, optionText, value }: GetAlertTextArgs) {
        if (_.isObject(options[optionText])) {
            logger.debug(`Running threshold check of ${optionText} for endpoint: ${endpoint}`);

            const option = options[optionText]! as ThresholdOption;
            const lastResult = ResultsManager.getLastTestResult(endpoint, optionText);

            if (lastResult && this.hasExceededThreshold(value, parseFloat(lastResult), option.threshold)) {
                logger.debug('Threshold has been reached');

                return `${_.capitalize(optionText)} exceeded threshold of ${
                    option.threshold
                } [previous: ${lastResult}, current: ${value}]`;
            }
        }
    }

    async run({ endpoint, type, options }: Test<HttpTestOptions>): Promise<TestResult<HttpTestResult>> {
        const validPrefix = `${type}://`;

        if (!endpoint.startsWith(validPrefix)) {
            throw new Error(
                `Invalid endpoint ${endpoint} for test of type ${type}. Endpoint must start with ${validPrefix}`,
            );
        }

        let result: TestResult<HttpTestResult> = { success: false, alerts: [] };
        let latency, bandwidth: number;

        logger.debug(`Testing ${type} connectivity for endpoint: ${endpoint}`);

        try {
            const { latencyInSeconds, data } = await axios.get(endpoint);
            const size = Buffer.from(data).length;

            logger.debug(`Response size calculated as: ${size} bytes for ${type} endpoint: ${endpoint}`);
            logger.debug(
                `Request latency calculated as: ${latencyInSeconds} seconds for ${type} endpoint: ${endpoint}`,
            );

            latency = latencyInSeconds;
            bandwidth = this.calculateMbps(latencyInSeconds, size);

            logger.debug(`Bandwidth calculated as: ${bandwidth} Mbps for ${type} endpoint: ${endpoint}`);

            logger.debug(`Successfully tested ${type} connectivity for endpoint: ${endpoint}`);
            result.success = true;
        } catch (err) {
            return result;
        }

        const resultTypes: Record<keyof HttpTestResult, { value: any; text: string }> = {
            latency: { value: latency, text: `${latency} seconds` },
            bandwidth: { value: bandwidth, text: `${bandwidth} Mbps` },
        };

        _(resultTypes)
            .entries()
            .forEach(([optionType, { value, text }]) => {
                const optionText = optionType as keyof HttpTestResult;

                if (options?.[optionText as keyof HttpTestResult]) {
                    logger.debug(`${optionText} check is turned on for ${type} endpoint: ${endpoint}`);
                    result[optionText as keyof HttpTestResult] = text;

                    const alert = this.getAlertText({ options, optionText, value, endpoint });
                    if (alert) result.alerts!.push(alert);
                }
            });

        return result;
    }
}
