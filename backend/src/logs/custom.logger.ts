import { LoggerService, LogLevel } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";

export class CustomLogger implements LoggerService {
    private static contextRules: Record<string, number> = {};
    private readonly LOG_LEVEL_MAP: Record<string, number> = {
        trace: 0,
        debug: 1,
        info: 2,
        warn: 3,
        error: 4
    };

    constructor(
        @InjectPinoLogger()
        private logger: PinoLogger,
    ) {
        if (Object.keys(CustomLogger.contextRules).length === 0) {
            this.initializeContextRules();
        }
    }
    verbose(message: string, context?: string) {
        if (this.shouldLog("trace", context)) {
            this.logger.trace({ context }, message)
        }
    }

    debug(message: string, context?: string) {
        if (this.shouldLog("debug", context)) {
            this.logger.debug({ context }, message)
        }
    }

    log(message: string, context?: string) {
        if (this.shouldLog("info", context)) {
            this.logger.info({ context }, message)
        }
    }

    warn(message: string, context?: string) {
        if (this.shouldLog("warn", context)) {
            this.logger.warn({ context }, message)
        }
    }

    error(message: string, context?: string) {
        if (this.shouldLog("error", context)) {
            this.logger.error({ context }, message)
        }
    }

    private initializeContextRules() {
        /**
         * context=AppController;level=debug/level=error
         * 
         * {
         *  "*": 2,
         *  "AppController": 1
         * }
         */

        const rules = process.env.LOG_RULES;
        if (!rules) {
            CustomLogger.contextRules["*"] = this.LOG_LEVEL_MAP["info"];
            return;
        }

        const ruleEntries = rules.split("/");
        //paga os itens separados por /
        for (const rule of ruleEntries) {
            let contextPart = "*";
            let levelPart = "info";
            const parts = rule.split(";");

            //paga os itens separados por ;
            for (const part of parts) {
                // pega a parte de context depois do =
                if (part.startsWith("context=")) {
                    contextPart = part.split("=")[1] || contextPart;

                }
                // pega a parte de level depois do = 
                else if (part.startsWith('level=')) {
                    levelPart = part.split("=")[1] || levelPart;
                }
            }



            //separa os context caso o usuario coloque mais de um 
            const contexts = contextPart.split(',');

            //pega o nivel que o usuario selecionou
            const numericLevel = this.LOG_LEVEL_MAP[levelPart.trim()] || this.LOG_LEVEL_MAP["info"]

            for (const context of contexts) {
                CustomLogger.contextRules[context.trim()] = numericLevel;
            }
        }
    }

    private shouldLog(methodLevel: string, context?: string): boolean {
        return this.LOG_LEVEL_MAP[methodLevel] >= this.getLogLevel(context);
    }

    private getLogLevel(context?: string): number {
        context = context || " ";
        const level = CustomLogger.contextRules[context] ?? CustomLogger.contextRules["*"] ?? this.LOG_LEVEL_MAP["info"];
        return level;
    }
}