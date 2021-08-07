import _ from 'lodash';
import axios from 'axios';
import { TestResult, TestRunner } from '../common/test-runner';
import { Test } from '../schema/test';
import { ResultsManager } from '../common/results-manager';

declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata: { startTime?: Date; endTime?: Date };
    }

    export interface AxiosResponse {
        latencyInSeconds: number;
    }
}

type LatencyTestOptions = {
    threshold: string;
};

type HttpTestOptions = {
    latency?: boolean | LatencyTestOptions;
};

type HttpTestResult = {
    latency?: string;
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
    async run({ endpoint, type, options }: Test<HttpTestOptions>): Promise<TestResult<HttpTestResult>> {
        const validPrefix = `${type}://`;

        if (!endpoint.startsWith(validPrefix)) {
            throw new Error(
                `Invalid endpoint ${endpoint} for test of type ${type}. Endpoint must start with ${validPrefix}`,
            );
        }

        let result: TestResult<HttpTestResult> = { success: false, alerts: [] };
        let latency: number;

        try {
            const response = await axios.get(endpoint);

            latency = response.latencyInSeconds;
            result.success = true;
        } catch (err) {
            return result;
        }

        if (options?.latency) {
            result.latency = `${latency} seconds`;

            if (_.isObject(options.latency) && options.latency.threshold) {
                const lastLatency = ResultsManager.getLastTestResult(endpoint, 'latency');

                if (
                    lastLatency &&
                    this.hasExceededThreshold(latency, parseFloat(lastLatency), options.latency.threshold)
                ) {
                    result.alerts!.push(
                        `Latency exceeded threshold of ${options.latency.threshold} [previous: ${lastLatency} seconds, current: ${latency} seconds]`,
                    );
                }
            }
        }

        return result;
    }
}
