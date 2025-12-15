"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";

const SIMPLE_BET_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "bool", "name": "_isYes", "type": "bool"},
      {"internalType": "uint256", "name": "_hours", "type": "uint256"}
    ],
    "name": "createBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveBets",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function Home() {
  const { isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0.01");
  
  const { writeContract } = useWriteContract();
  const { data: activeBets } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_BET_ABI,
    functionName: "getActiveBets",
  });

  const handleCreate = async () => {
    if (!title) return;
    
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: SIMPLE_BET_ABI,
      functionName: "createBet",
      args: [title, true, 24n],
      value: parseEther(amount),
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Пари</h1>
      
      {isConnected ? (
        <>
          <div className="mb-4">
            <input
              className="input input-bordered mr-2"
              placeholder="Название пари"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="input input-bordered mr-2"
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleCreate}>
              Создать
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2">Активные пари: {activeBets?.length || 0}</h2>
            {activeBets?.map((id: bigint) => (
              <div key={id.toString()} className="border p-2 mb-2">
                Пари #{id.toString()}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Подключите кошелек</p>
      )}
    </div>
  );
}