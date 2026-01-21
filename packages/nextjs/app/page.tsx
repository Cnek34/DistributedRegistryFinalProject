"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

/* ================= ABI ================= */

const ABI = [
  {
    name: "createBet",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_title", type: "string" },
      { name: "_side", type: "bool" },
      { name: "_hours", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getActiveBets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "getBetPreview",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "betId", type: "uint256" }],
    outputs: [{ type: "string" }, { type: "address" }, { type: "uint256" }, { type: "bool" }],
  },
] as const;

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

/* ================= BET CARD ================= */

function BetCard({ betId }: { betId: bigint }) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getBetPreview",
    args: [betId],
  });

  if (!data) return null;

  const [title, creator, betAmount, side] = data;

  return (
    <div className="border p-4 rounded mt-2">
      <p>
        <b>Название:</b> {title}
      </p>
      <p>
        <b>От кого:</b> {creator}
      </p>
      <p>
        <b>Ставка:</b> {formatEther(betAmount)} ETH
      </p>
      <p>
        <b>Сторона:</b>{" "}
        {side ? <span className="text-green-600">За</span> : <span className="text-red-600">Против</span>}
      </p>
    </div>
  );
}

/* ================= PAGE ================= */

export default function Home() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [side, setSide] = useState(true);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { data: activeBets, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getActiveBets",
  });

  /* ===== WAIT TX ===== */

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  /* ===== CREATE BET ===== */

  async function createBet() {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "createBet",
        args: [title, side, 24n],
        value: parseEther(amount),
      });

      setTxHash(hash);
      setTitle("");
    } catch (e) {
      console.error(e);
    }
  }

  if (!isConnected) {
    return <p className="p-8">Подключите кошелёк</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Пари</h1>

      {/* ===== CREATE BET ===== */}
      <div className="mb-6 space-y-2">
        <input
          className="input input-bordered w-full"
          placeholder="Название пари"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          className="input input-bordered w-full"
          type="number"
          step="0.001"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <select
          className="select select-bordered w-full"
          value={side ? "yes" : "no"}
          onChange={e => setSide(e.target.value === "yes")}
        >
          <option value="yes">За</option>
          <option value="no">Против</option>
        </select>

        <button className="btn btn-primary w-full" onClick={createBet}>
          Создать пари
        </button>
      </div>

      {/* ===== LIST ===== */}
      <h2 className="text-xl font-bold">Активные пари: {activeBets?.length ?? 0}</h2>

      {activeBets?.map(id => (
        <BetCard key={id.toString()} betId={id} />
      ))}
    </div>
  );
}
