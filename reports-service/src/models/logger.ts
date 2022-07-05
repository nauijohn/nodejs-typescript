import winston, { format } from "winston";

export class Logger {
    public static getLogger(service: string) {
        return winston.createLogger({
            defaultMeta: { service: service },
            transports: [
                new winston.transports.Console({
                    level: "info",
                    format: format.combine(
                        format.colorize({ all: true }),
                        format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
                        format.align(),
                        format.printf(
                            (info) => `[${info.timestamp}] ${info.level}: class: ${info.service} ${info.message} `
                        )
                    )
                }),
                new winston.transports.File({
                    level: "info",
                    maxsize: 3000000000,
                    maxFiles: 3,
                    format: format.combine(
                        format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
                        format.align(),
                        format.printf(
                            (info) => `[${info.timestamp}] ${info.level}: class: ${info.service} ${info.message}`
                        ),
                        format.errors({ stack: true })
                    ),
                    filename: "winston-logs/infos.log"
                }),
                new winston.transports.File({
                    level: "error",
                    maxsize: 3000000000,
                    maxFiles: 3,
                    format: format.combine(
                        format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
                        format.align(),
                        format.printf(
                            (info) => `[${info.timestamp}] ${info.level}: class: ${info.service} ${info.message}`
                        ),
                        format.errors({ stack: true })
                    ),
                    filename: "winston-logs/errors.log"
                })
            ]
        });
    }
}
