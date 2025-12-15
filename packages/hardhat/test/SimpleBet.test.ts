import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleBet } from "../typechain-types";

describe("SimpleBet", function () {
  let simpleBet: SimpleBet;
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    user1 = signers[1];
    user2 = signers[2];
    
    const SimpleBetFactory = await ethers.getContractFactory("SimpleBet");
    simpleBet = await SimpleBetFactory.deploy();
  });

  it("Должен создать пари", async () => {
    await simpleBet.connect(user1).createBet("Test", true, 24, {
      value: ethers.parseEther("0.01")
    });
    
    expect(await simpleBet.nextBetId()).to.equal(1);
  });

  it("Не должен создать пари с 0 ETH", async () => {
    await expect(
      simpleBet.connect(user1).createBet("Test", true, 24, {
        value: 0
      })
    ).to.be.revertedWith("Need ETH to create bet");
  });

  it("Должен позволить сделать ставку", async () => {
    // Создаем пари
    await simpleBet.connect(user1).createBet("Test", true, 24, {
      value: ethers.parseEther("0.01")
    });
    
    // Делаем ставку
    await expect(
      simpleBet.connect(user2).placeBet(0, false, {
        value: ethers.parseEther("0.02")
      })
    ).not.to.be.reverted;
  });

  it("Должен завершить пари", async () => {
    // Создаем пари
    await simpleBet.connect(user1).createBet("Test", true, 1, {
      value: ethers.parseEther("0.01")
    });
    
    // Перематываем время на 2 часа вперед
    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine", []);
    
    // Завершаем пари
    await expect(simpleBet.connect(user1).settleBet(0, true)).not.to.be.reverted;
  });

  it("Не должен позволить не-создателю завершить пари", async () => {
    await simpleBet.connect(user1).createBet("Test", true, 1, {
      value: ethers.parseEther("0.01")
    });
    
    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine", []);
    
    await expect(simpleBet.connect(user2).settleBet(0, true))
      .to.be.revertedWith("Only creator can settle");
  });

  it("Должен показать активные пари", async () => {
    // Создаем 2 пари
    await simpleBet.connect(user1).createBet("Test 1", true, 24, {
      value: ethers.parseEther("0.01")
    });
    
    await simpleBet.connect(user2).createBet("Test 2", false, 12, {
      value: ethers.parseEther("0.02")
    });
    
    const activeBets = await simpleBet.getActiveBets();
    expect(activeBets.length).to.equal(2);
  });

  it("Должен получить информацию о пари", async () => {
    await simpleBet.connect(user1).createBet("Bitcoin to 100k", true, 24, {
      value: ethers.parseEther("0.1")
    });
    
    const info = await simpleBet.connect(user1).getBetInfo(0);
    
    expect(info[0]).to.equal("Bitcoin to 100k"); // title
    expect(info[1]).to.equal(user1.address); // creator
    expect(info[2]).to.equal(ethers.parseEther("0.1")); // amount
  });
});