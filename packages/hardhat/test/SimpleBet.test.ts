import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SimpleBet", function () {
  async function deployFixture() {
    const [creator, user1, user2] = await ethers.getSigners();

    const SimpleBet = await ethers.getContractFactory("SimpleBet");
    const contract = await SimpleBet.deploy();

    return { contract, creator, user1, user2 };
  }

  describe("createBet", function () {
    it("создает пари и увеличивает nextBetId", async () => {
      const { contract } = await deployFixture();

      await contract.createBet("ETH > 3000", true, 1, {
        value: ethers.parseEther("0.01"),
      });

      expect(await contract.nextBetId()).to.equal(1);
    });

    it("создатель автоматически делает ставку", async () => {
      const { contract, creator } = await deployFixture();

      await contract.createBet("BTC > 50000", false, 1, {
        value: ethers.parseEther("0.05"),
      });

      const preview = await contract.getBetPreview(0);

      expect(preview[0]).to.equal("BTC > 50000"); // title
      expect(preview[1]).to.equal(creator.address); // creator
      expect(preview[2]).to.equal(ethers.parseEther("0.05")); // bet amount
      expect(preview[3]).to.equal(false); // side
    });

    it("revert если ставка = 0", async () => {
      const { contract } = await deployFixture();

      await expect(contract.createBet("FAIL", true, 1, { value: 0 })).to.be.revertedWith("ETH required");
    });
  });

  describe("getActiveBets", function () {
    it("возвращает id активного пари", async () => {
      const { contract } = await deployFixture();

      await contract.createBet("ETH > 3000", true, 1, {
        value: ethers.parseEther("0.01"),
      });

      const active = await contract.getActiveBets();
      expect(active.length).to.equal(1);
      expect(active[0]).to.equal(0);
    });

    it("не возвращает пари после дедлайна", async () => {
      const { contract } = await deployFixture();

      await contract.createBet("SHORT", true, 1, {
        value: ethers.parseEther("0.01"),
      });

      await time.increase(3600);

      const active = await contract.getActiveBets();
      expect(active.length).to.equal(0);
    });
  });

  describe("placeBet", function () {
    it("позволяет другому пользователю сделать ставку", async () => {
      const { contract, user1 } = await deployFixture();

      await contract.createBet("ETH > 3000", true, 1, {
        value: ethers.parseEther("0.01"),
      });

      await contract.connect(user1).placeBet(0, false, {
        value: ethers.parseEther("0.02"),
      });

      // Проверяем, что ставка учлась косвенно (через totalNo)
      const preview = await contract.getBetPreview(0);
      expect(preview[2]).to.equal(ethers.parseEther("0.01")); // ставка создателя не изменилась
    });

    it("revert при повторной ставке одним и тем же адресом", async () => {
      const { contract, user1 } = await deployFixture();

      await contract.createBet("ETH > 3000", true, 1, {
        value: ethers.parseEther("0.01"),
      });

      await contract.connect(user1).placeBet(0, true, {
        value: ethers.parseEther("0.02"),
      });

      await expect(
        contract.connect(user1).placeBet(0, true, {
          value: ethers.parseEther("0.01"),
        }),
      ).to.be.revertedWith("Already bet");
    });

    it("revert если дедлайн истёк", async () => {
      const { contract, user1 } = await deployFixture();

      await contract.createBet("EXPIRED", true, 1, {
        value: ethers.parseEther("0.01"),
      });

      await time.increase(3600);

      await expect(
        contract.connect(user1).placeBet(0, false, {
          value: ethers.parseEther("0.01"),
        }),
      ).to.be.revertedWith("Bet closed");
    });
  });
});
