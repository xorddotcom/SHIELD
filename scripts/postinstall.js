const fsExtra = require("fs-extra");
const main = () => {
  const content = fsExtra.readFileSync(
    `./node_modules/circom2/vendor/wasi.js`,
    {
      encoding: "utf-8",
    }
  );
  let bumped = content.replace(
    `bindings.exit(rval)\n                return constants_1.WASI_ESUCCESS\n            }`,
    "// bindings.exit(rval)\n}"
  );

  fsExtra.writeFileSync(`./node_modules/circom2/vendor/wasi.js`, bumped);
};

main();
