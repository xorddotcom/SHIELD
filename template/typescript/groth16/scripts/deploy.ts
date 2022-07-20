import { ethers } from 'hardhat';

async function main() {
  const Verifier = await ethers.getContractFactory('Verifier');
  const verifier = await Verifier.deploy();

  console.log('Verifier deployed to:', verifier.address);

  const Multiplier = await ethers.getContractFactory('Multiplier');

  const multiplier = await Multiplier.deploy(verifier.address);

  await multiplier.deployed();
  console.log('Multiplier deployed to:', multiplier.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
