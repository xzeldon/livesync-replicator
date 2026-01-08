export enum LogLevel {
	INFO = "INFO",
	WARN = "WARN",
	ERROR = "ERROR",
	DEBUG = "DEBUG",
}

export class Logger {
	private static format(level: LogLevel, msg: string): string {
		return `[${new Date().toISOString()}] [${level}] ${msg}`;
	}

	static info(msg: string) {
		console.log(this.format(LogLevel.INFO, msg));
	}

	static warn(msg: string) {
		console.warn(this.format(LogLevel.WARN, msg));
	}

	static error(msg: string, error?: unknown) {
		console.error(this.format(LogLevel.ERROR, msg));
		if (error) {
			if (error instanceof Error) {
				console.error(error.stack);
			} else {
				console.error(error);
			}
		}
	}
}
