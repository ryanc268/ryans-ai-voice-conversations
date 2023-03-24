import { type LogLevel } from "./enums";

export const logWithUTCDate = (message: string, logLevel: LogLevel) => {
  const localDate = new Date(Date.now()).toUTCString();
  console.error(`(${localDate})[${logLevel}]: ${message}`);
};
