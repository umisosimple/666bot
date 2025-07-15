const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class Logger {
  constructor() {
    this.timeStamp = () => new Date().toISOString();
  }

  info(message, ...args) {
    console.log(
      `${colors.green}[INFO]${colors.reset} ${colors.cyan}${this.timeStamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  error(message, ...args) {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${colors.cyan}${this.timeStamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  warn(message, ...args) {
    console.warn(
      `${colors.yellow}[WARN]${colors.reset} ${colors.cyan}${this.timeStamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.magenta}[DEBUG]${colors.reset} ${colors.cyan}${this.timeStamp()}${colors.reset} - ${message}`,
        ...args
      );
    }
  }
}

module.exports = { logger: new Logger() };
