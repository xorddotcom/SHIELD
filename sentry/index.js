import { getShieldVersion } from "../utils/packageInfo.js";
import * as Sentry from "@sentry/node";

const SENTRY_DSN =
  "https://d5762e0e00534ec29bafa5efb909e861@o1331511.ingest.sentry.io/6595801";

export class Reporter {
  static reportError(error) {
    const instance = Reporter._getInstance();

    if (!instance.enabled) {
      return;
    }

    instance.init();

    // const Sentry = require("@sentry/node");
    Sentry.setExtra("verbose", instance.verbose);
    // Sentry.setExtra("configPath", instance.configPath);
    Sentry.setExtra("nodeVersion", process.version);

    const shieldVersion = getShieldVersion();
    Sentry.setExtra("shieldVersion", shieldVersion);

    Sentry.captureException(error);

    return true;
  }

  /**
   * Enable or disable reporting. When disabled, all calls to `reportError` are
   * no-ops.
   */
  static setEnabled(enabled) {
    const instance = Reporter._getInstance();
    instance.enabled = enabled;
  }

  /**
   * Enable or disable verbose output. This is necessary to pass the correct
   * environment variable to the transport subprocess.
   */
  static setVerbose(verbose) {
    const instance = Reporter._getInstance();
    instance.verbose = verbose;
  }

  /**
   * The path to the hardhat config file. We use this when files are anonymized,
   * since the hardhat config is the only file in the user's project that is not
   * anonymized.
   */
  static setConfigPath(configPath) {
    const instance = Reporter._getInstance();
    instance.configPath = configPath;
  }

  /**
   * Wait until all Sentry events were sent or until `timeout` milliseconds are
   * elapsed.
   *
   * This needs to be used before calling `process.exit`, otherwise some events
   * might get lost.
   */
  static async close(timeout) {
    const instance = Reporter._getInstance();
    if (!instance.enabled || !instance.initialized) {
      return true;
    }

    const Sentry = await import("@sentry/node");
    return Sentry.close(timeout);
  }

  static _instance;

  static _getInstance() {
    if (this._instance === undefined) {
      this._instance = new Reporter();
    }

    return this._instance;
  }

  // static _hasTelemetryConsent() {
  //   const telemetryConsent = hasConsentedTelemetry();

  //   return telemetryConsent === true;
  // }

  enabled;
  initialized = false;
  verbose = false;
  configPath;

  constructor() {
    this.enabled = true;
    // if (isRunningOnCiServer()) {
    //   this.enabled = false;
    // }

    // // set HARDHAT_ENABLE_SENTRY=true to enable sentry during development (for local testing)
    // if (isLocalDev() && process.env.HARDHAT_ENABLE_SENTRY === undefined) {
    //   this.enabled = false;
    // }
  }

  init() {
    if (this.initialized) {
      return;
    }

    // const Sentry = require("@sentry/node");

    // const linkedErrorsIntegration = new Sentry.Integrations.LinkedErrors({
    //   key: "parent",
    // });

    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
    });

    this.initialized = true;
  }
}
