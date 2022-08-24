import { compile, init } from "../actions";

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
];
