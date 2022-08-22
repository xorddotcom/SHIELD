import { compile, init } from "../actions";

interface Icommands {
  name: string;
  description: string;
  action(): any;
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
    action: compile,
  },
];
