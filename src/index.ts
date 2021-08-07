import { EndpointAnalyzer } from './endpoint-analyzer';

const analyzer = new EndpointAnalyzer();
const configFile = process.argv[2] ?? `${process.cwd()}/analyzer.yml`;

analyzer
    .init(configFile)
    .then(() => console.log('Finished successfully!'))
    .catch((err) => console.error(err.toString()));
