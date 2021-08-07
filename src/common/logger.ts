import winston from 'winston';

const { EA_DEBUG } = process.env;

const logger = winston.createLogger({
    level: EA_DEBUG ? 'debug' : 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

export default logger;
