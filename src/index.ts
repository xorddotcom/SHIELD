#!/usr/bin/env node
import { program } from "commander";
import { getShieldVersion } from "../utils/packageInfo";
import { commands } from "./commands/list";

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

program.version(getShieldVersion());

program.parse();
