// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleBet {
    struct Bet {
        uint256 id;
        string title;
        address creator;
        uint256 deadline;
        bool isSettled;
        bool outcome;

        uint256 totalYes;
        uint256 totalNo;

        address[] players;
        mapping(address => uint256) bets;
        mapping(address => bool) side;
        mapping(address => bool) claimed;
    }

    uint256 public nextBetId;
    mapping(uint256 => Bet) private bets;

    event BetCreated(uint256 indexed betId, address indexed creator, string title, bool side);
    event BetPlaced(uint256 indexed betId, address indexed bettor, bool side, uint256 amount);

    // ================= CREATE =================

    function createBet(
        string calldata _title,
        bool _side,
        uint256 _hours
    ) external payable {
        require(msg.value > 0, "ETH required");
        require(_hours >= 1 && _hours <= 24, "1-24 hours");

        Bet storage bet = bets[nextBetId];
        bet.id = nextBetId;
        bet.title = _title;
        bet.creator = msg.sender;
        bet.deadline = block.timestamp + _hours * 1 hours;

        bet.players.push(msg.sender);
        bet.bets[msg.sender] = msg.value;
        bet.side[msg.sender] = _side;

        if (_side) {
            bet.totalYes += msg.value;
        } else {
            bet.totalNo += msg.value;
        }

        emit BetCreated(nextBetId, msg.sender, _title, _side);
        nextBetId++;
    }

    // ================= BET =================

    function placeBet(uint256 betId, bool _side) external payable {
        Bet storage bet = bets[betId];

        require(msg.value > 0, "ETH required");
        require(block.timestamp < bet.deadline, "Bet closed");
        require(!bet.isSettled, "Already settled");
        require(bet.bets[msg.sender] == 0, "Already bet");

        bet.players.push(msg.sender);
        bet.bets[msg.sender] = msg.value;
        bet.side[msg.sender] = _side;

        if (_side) {
            bet.totalYes += msg.value;
        } else {
            bet.totalNo += msg.value;
        }

        emit BetPlaced(betId, msg.sender, _side, msg.value);
    }

    // ================= VIEW =================

    function getActiveBets() external view returns (uint256[] memory) {
        uint256 count;
        for (uint256 i = 0; i < nextBetId; i++) {
            if (!bets[i].isSettled && block.timestamp < bets[i].deadline) {
                count++;
            }
        }

        uint256[] memory ids = new uint256[](count);
        uint256 index;

        for (uint256 i = 0; i < nextBetId; i++) {
            if (!bets[i].isSettled && block.timestamp < bets[i].deadline) {
                ids[index++] = i;
            }
        }

        return ids;
    }

    /// 🔹 ДАННЫЕ ПАРИ ДЛЯ ФРОНТЕНДА
    function getBetPreview(uint256 betId)
        external
        view
        returns (
            string memory title,
            address creator,
            uint256 creatorBet,
            bool creatorSide
        )
    {
        Bet storage bet = bets[betId];
        return (
            bet.title,
            bet.creator,
            bet.bets[bet.creator],
            bet.side[bet.creator]
        );
    }

    receive() external payable {}
}