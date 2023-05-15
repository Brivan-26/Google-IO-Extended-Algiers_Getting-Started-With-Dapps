const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
describe("Will", function () {
  async function deployLockFixture() {
    const [owner, address1, address2] = await ethers.getSigners();

    const WillContract = await ethers.getContractFactory("Will");
    const contract = await WillContract.deploy({
      value: ethers.utils.parseEther("50"),
    });
    return { contract, owner, address1, address2 };
  }

  describe("Deployment", () => {
    it("Should set variables correctly", async () => {
      const { contract, owner } = await loadFixture(deployLockFixture);
      const currentOwner = await contract.owner();
      const currentFortune = await contract.getFortune();

      expect(currentOwner).to.equal(owner.address);
      expect(Number(ethers.utils.formatEther(currentFortune))).to.equal(50);
    });

    it("Should revert if not an owner", async () => {
      const { contract, address1 } = await loadFixture(deployLockFixture);

      await expect(contract.connect(address1).ping()).to.be.revertedWith(
        "Only owner can call this function"
      );
    });
  });

  describe("Interacting with the contract", () => {
    describe("Adding inheritor", () => {
      it("Should succeed", async () => {
        const { contract, address1 } = await loadFixture(deployLockFixture);
        await addInheritor(contract, address1.address, "20");
        const inheritors = Array(await contract.inheritances);
        expect(inheritors.length).to.equal(1);
        const currentFortune = await contract.getFortune();
        expect(Number(ethers.utils.formatEther(currentFortune))).to.equal(30);
      });

      it("Should fail on existing inheritor", async () => {
        const { contract, address1 } = await loadFixture(deployLockFixture);
        await addInheritor(contract, address1.address, "20");
        await expect(
          contract.addInherite(address1.address, ethers.utils.parseEther("20"))
        ).to.be.revertedWith("Already inheritor");
      });

      it("Should fail on not having enough fortune", async () => {
        const { contract, address1, address2 } = await loadFixture(
          deployLockFixture
        );

        await addInheritor(contract, address1.address, "40");
        await expect(
          addInheritor(contract, address2.address, "30")
        ).to.be.revertedWith("Not sufficiant balance");
      });

      it("Should success on increasing fortune", async () => {
        const { contract } = await loadFixture(deployLockFixture);

        await contract.increaseFortune(ethers.utils.parseEther("20"));
        const currentFortune = await contract.getFortune();

        expect(Number(ethers.utils.formatEther(currentFortune))).to.equal(70);
      });
    });

    describe("Spliting the forutne", () => {
      it("Should fail for not inheritor", async () => {
        const { contract, address1 } = await loadFixture(deployLockFixture);
        await expect(
          contract.connect(address1).callForSplitFortune()
        ).to.be.revertedWith("Only Inheritor can call this function");
      });
      it("Should fail on not passing 1 week", async () => {
        const { contract, address1 } = await loadFixture(deployLockFixture);
        await addInheritor(contract, address1.address, "20");
        await expect(
          contract.connect(address1).callForSplitFortune()
        ).to.be.revertedWith("Didn't pass the inactivity lock");
      });

      it("Should success", async () => {
        const { contract, address1, address2 } = await loadFixture(
          deployLockFixture
        );
        await addInheritor(contract, address1.address, "20");
        await addInheritor(contract, address2.address, "30");
        //fake pass 7-days
        await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
        await contract.connect(address1).callForSplitFortune();
      });
    });
  });
});

async function addInheritor(contract, address, amount) {
  await contract.addInherite(address, ethers.utils.parseEther(amount));
}
