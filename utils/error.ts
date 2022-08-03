import chalk from 'chalk';
export const printNameValidationError = () => {
  console.log('');
  console.log(chalk.red('Kindly enter a valid name.'));
  console.log('');
  console.log(chalk.red('A valid name cannot have following attributes.'));
  console.log('');
  console.log(
    chalk.red(`The characters not allowed at the beginning or the end are:
- Blank space
- Dot (.)`)
  );
  console.log('');
  console.log(
    chalk.red(`The characters not allowed in any place in the folder name are:
- Asterisk (*)
- Backslash ()
- Colon (:)
- Double quote (")
- Forward slash (/)
- Greater than (>)
- Less than (<)
- Question mark (?)
- Vertical bar or pipe (|)`)
  );
};
