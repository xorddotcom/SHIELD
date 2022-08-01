#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const list_1 = require("./commands/list");
list_1.commands.forEach((el) => {
    commander_1.program
        .command(el.name)
        .description(el.description)
        .action(el.action);
});
commander_1.program.parse();
//# sourceMappingURL=index.js.map