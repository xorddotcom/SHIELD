import { compile, init } from "../actions";
import { generateWitness } from "../actions/calculateWitness";

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
    name: "calculatewitness",
    description: "claculte the witness",
    option: ["-c, --circuit <value>", "specific circuit to compile"],
    action: generateWitness,
  },
];
