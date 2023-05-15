const hre = require("hardhat");

async function main() {
  const Will = await hre.ethers.getContractFactory("Will");
  const will = await Will.deploy({ value: ethers.utils.parseEther("150") });

  await will.deployed();

  console.log(`Will deployed to ${will.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
