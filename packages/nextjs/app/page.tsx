"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();

  const { data: contentCount } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "contentCount",
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourContract");

  const buyContent = async (id: number, price: bigint) => {
    await writeContractAsync({
      functionName: "buyContent",
      args: [id],
      value: price,
    });
  };

  const renderContents = () => {
    if (!contentCount) return null;

    const items = [];
    for (let i = 0; i < Number(contentCount); i++) {
      items.push(<ContentItem key={i} contentId={i} onBuy={buyContent} />);
    }
    return items;
  };

  return (
    <div className="flex flex-col items-center p-10 gap-6">
      <h1 className="text-4xl font-bold">Digital Content Marketplace</h1>

      <p className="text-lg">Connected wallet: {address}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{renderContents()}</div>
    </div>
  );
};

const ContentItem = ({ contentId, onBuy }: { contentId: number; onBuy: (id: number, price: bigint) => void }) => {
  const { data: content } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "contents",
    args: [contentId],
  });

  const { data: hasAccess } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "hasAccess",
    args: [contentId],
  });

  if (!content || !content.exists) return null;

  return (
    <div className="border rounded-xl p-5 shadow">
      <h2 className="text-xl font-semibold">Content #{contentId}</h2>
      <p>Price: {Number(content.price) / 1e18} ETH</p>

      {hasAccess ? (
        <p className="text-green-600 mt-2">Purchased</p>
      ) : (
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => onBuy(contentId, content.price)}
        >
          Buy
        </button>
      )}
    </div>
  );
};

export default Home;
