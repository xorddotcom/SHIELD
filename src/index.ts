#!/usr/bin/env node
import { program } from "commander";
import { getShieldVersion } from "../utils/packageInfo";
import { commands } from "./commands/list";

commands.forEach((el) => {
  program.command(el.name).description(el.description).action(el.action);
});

program.version(getShieldVersion());

program.parse();
