#!/usr/bin/env node
import { program } from "commander";
import commandList from "./commands/list/index.js";
import { Reporter } from "./sentry/index.js";

try {
  commandList.forEach((el) => {
    program.command(el.name).description(el.description).action(el.action);
  });

  program.parse();
} catch (e) {
  console.log(e);
  Reporter.reportError(e);
}
