import { compile, init } from "../actions";
import { debug } from "../actions/debug";

interface Icommands {
  name: string;
  description: string;
  option?: string[];
  action(options: any): any;
}


export const commands: Icommands[] = [
  {
    name: "init",
    description: "generates the boilerplate code",
    action: init,
  },
  {
    name: "compile",
    description: "compiles the circuits to verifer contracts",
    option: ["-c, --circuit <value>", "specific circuit to compile"],
    action: compile,
  },
  {
    name: "debug",
    description: "debug (display input/output signals, circuit logs, and passed/failed constraints ) and generate a witness file of the circuit",
    option: ["-c, --circuit <value>", "specific circuit to debug"],
    action: debug,
  },
];
