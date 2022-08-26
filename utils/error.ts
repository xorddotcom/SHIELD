import { log } from "./logger";
export const printNameValidationError = () => {
  log("\nKindly enter a valid name.", "error");
  log("A valid name cannot have following attributes.", "error");
  log(
    `The characters not allowed at the beginning or the end are:
- Blank space
- Dot (.)`,
    "error"
  );
  log(
    `The characters not allowed in any place in the folder name are:
- Asterisk (*)
- Backslash ()
- Colon (:)
- Double quote (")
- Forward slash (/)
- Greater than (>)
- Less than (<)
- Question mark (?)
- Vertical bar or pipe (|)`,
    "error"
  );
};
