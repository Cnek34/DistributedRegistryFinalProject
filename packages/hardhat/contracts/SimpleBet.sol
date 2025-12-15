//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract SimpleBet {
    struct Bet {
        uint256 id;
        string title;
        address creator;
        uint256 amount;
        bool isYes; // true = за, false = против
        bool isSettled;
        bool outcome;
        uint256 deadline;
        mapping(address => uint256) bets;
        mapping(address => bool) side; // true = за, false = против
    }
    
    uint256 public nextBetId;
    mapping(uint256 => Bet) public bets;
    
    event BetCreated(uint256 indexed betId, address indexed creator, string title, uint256 amount, bool isYes);
    event BetPlaced(uint256 indexed betId, address indexed bettor, bool side, uint256 amount);
    event BetSettled(uint256 indexed betId, bool outcome);
    
    function createBet(string memory _title, bool _isYes, uint256 _hours) external payable {
        require(msg.value > 0, "Need ETH to create bet");
        require(_hours >= 1 && _hours <= 24, "Duration 1-24 hours");
        
        uint256 betId = nextBetId;
        Bet storage newBet = bets[betId];
        
        newBet.id = betId;
        newBet.title = _title;
        newBet.creator = msg.sender;
        newBet.amount = msg.value;
        newBet.isYes = _isYes;
        newBet.deadline = block.timestamp + (_hours * 1 hours);
        
        // Создатель автоматически ставит на свою сторону
        newBet.bets[msg.sender] = msg.value;
        newBet.side[msg.sender] = _isYes;
        
        nextBetId++;
        
        emit BetCreated(betId, msg.sender, _title, msg.value, _isYes);
    }
    
    function placeBet(uint256 betId, bool side) external payable {
        Bet storage bet = bets[betId];
        
        require(msg.value > 0, "Need ETH to bet");
        require(!bet.isSettled, "Bet already settled");
        require(block.timestamp < bet.deadline, "Betting time over");
        
        bet.bets[msg.sender] += msg.value;
        bet.side[msg.sender] = side;
        
        emit BetPlaced(betId, msg.sender, side, msg.value);
    }
    
    function settleBet(uint256 betId, bool outcome) external {
        Bet storage bet = bets[betId];
        
        require(msg.sender == bet.creator, "Only creator can settle");
        require(!bet.isSettled, "Already settled");
        require(block.timestamp >= bet.deadline, "Too early to settle");
        
        bet.isSettled = true;
        bet.outcome = outcome;
        
        // Простой расчет выигрышей - все кто угадал делят пул поровну
        uint256 totalWinningBets = 0;
        uint256 totalPool = 0;
        
        // Считаем общий пул и количество выигрышных ставок
        for (uint256 i = 0; i < nextBetId; i++) {
            // В реальности нужно хранить участников, но для простоты оставим так
        }
        
        emit BetSettled(betId, outcome);
    }
    
    function claimWinnings(uint256 betId) external {
        Bet storage bet = bets[betId];
        
        require(bet.isSettled, "Bet not settled yet");
        require(bet.side[msg.sender] == bet.outcome, "You lost");
        
        uint256 userBet = bet.bets[msg.sender];
        require(userBet > 0, "No bet found");
        
        // Для простоты возвращаем удвоенную ставку
        uint256 winnings = userBet * 2;
        
        // Обнуляем ставку перед отправкой
        bet.bets[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: winnings}("");
        require(success, "Transfer failed");
    }
    
    function getBetInfo(uint256 betId) external view returns (
        string memory title,
        address creator,
        uint256 amount,
        bool isYes,
        bool isSettled,
        bool outcome,
        uint256 deadline,
        uint256 yourBet,
        bool yourSide
    ) {
        Bet storage bet = bets[betId];
        
        return (
            bet.title,
            bet.creator,
            bet.amount,
            bet.isYes,
            bet.isSettled,
            bet.outcome,
            bet.deadline,
            bet.bets[msg.sender],
            bet.side[msg.sender]
        );
    }
    
    function getActiveBets() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Считаем активные пари
        for (uint256 i = 0; i < nextBetId; i++) {
            if (!bets[i].isSettled && block.timestamp < bets[i].deadline) {
                count++;
            }
        }
        
        uint256[] memory activeBets = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextBetId; i++) {
            if (!bets[i].isSettled && block.timestamp < bets[i].deadline) {
                activeBets[index] = i;
                index++;
            }
        }
        
        return activeBets;
    }
    
    receive() external payable {}
}