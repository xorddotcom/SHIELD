#!/usr/bin/env node
import { program } from "commander";
import commandList from "./commands/list/index.js";


commandList.forEach((el) => {
  program
  .command(el.name)
  .description(el.description)
  .action(el.action);
})

program.parse()