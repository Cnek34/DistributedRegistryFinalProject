import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deploySimpleBet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("SimpleBet", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const simpleBet = await hre.ethers.getContract<Contract>("SimpleBet", deployer);
  console.log("✅ SimpleBet deployed at:", await simpleBet.getAddress());
};

export default deploySimpleBet;

deploySimpleBet.tags = ["SimpleBet"];