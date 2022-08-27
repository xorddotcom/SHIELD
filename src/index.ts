#!/usr/bin/env node
import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import { program } from "commander";
import { getShieldVersion } from "../utils/packageInfo";
import { commands } from "./commands/list";

Sentry.init({
  dsn: "https://d46d16ea7b1949d1b624d18cdfe56827@o1336142.ingest.sentry.io/6604728",
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
});

const shieldVersion = getShieldVersion();

Sentry.setExtra("shieldVersion", shieldVersion);

commands.forEach((el) => {
  if (el.option) {
    program
      .command(el.name)
      .description(el.description)
      .option(el.option[0], el.option[1])
      .action(el.action);
  } else {
    program.command(el.name).description(el.description).action(el.action);
  }
});

program.version(shieldVersion);

program.parse();
