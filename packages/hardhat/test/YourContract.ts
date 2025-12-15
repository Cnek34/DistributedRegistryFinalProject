// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { YourContract } from "../typechain-types";

// describe("YourContract - Digital Content", function () {
//   let contract: YourContract;
//   let owner: any;
//   let user: any;

//   beforeEach(async () => {
//     [owner, user] = await ethers.getSigners();
//     const Factory = await ethers.getContractFactory("YourContract");
//     contract = (await Factory.deploy(owner.address)) as YourContract;
//     await contract.waitForDeployment();
//   });

//   it("Owner can create content", async () => {
//     await contract.createContent(
//       ethers.parseEther("0.05"),
//       "ipfs://content1"
//     );

//     const content = await contract.contents(0);
//     expect(content.exists).to.equal(true);
//   });

//   it("User can buy content", async () => {
//     await contract.createContent(
//       ethers.parseEther("0.05"),
//       "ipfs://content1"
//     );

//     await contract.connect(user).buyContent(0, {
//       value: ethers.parseEther("0.05"),
//     });

//     expect(await contract.hasAccess(0, user.address)).to.equal(true);
//   });

//   it("User cannot access content without buying", async () => {
//     await contract.createContent(
//       ethers.parseEther("0.05"),
//       "ipfs://secret"
//     );

//     await expect(
//       contract.connect(user).getContentURI(0)
//     ).to.be.revertedWith("Access denied");
//   });

//   it("Owner can withdraw ETH", async () => {
//     await contract.createContent(
//       ethers.parseEther("0.05"),
//       "ipfs://content1"
//     );

//     await contract.connect(user).buyContent(0, {
//       value: ethers.parseEther("0.05"),
//     });

//     await expect(() =>
//       contract.withdraw()
//     ).to.changeEtherBalance(owner, ethers.parseEther("0.05"));
//   });
// });
