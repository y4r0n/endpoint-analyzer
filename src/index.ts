import { EndpointAnalyzer } from './endpoint-analyzer';

const analyzer = new EndpointAnalyzer();
const configFile = process.argv[2] ?? `${process.cwd()}/analyzer.yml`;

analyzer.init(configFile).catch((err) => console.error(err.toString()));
