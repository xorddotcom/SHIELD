import { init, version } from "../actions";

export const commands = [
  {
    name: "init",
    description: "generates the boilerplate code",
    action: init,
  },
  {
    name: "version",
    description: "Shows shield's version.",
    action: version,
  },
];
