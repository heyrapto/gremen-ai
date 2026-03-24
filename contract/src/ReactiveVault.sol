pragma solidity ^0.8.20;

contract ReactiveVault {
    mapping(address => uint256) public balances;
    uint256 public totalLiquidity;
    bool public safeMode;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event SafeModeActivated(uint256 riskScore);

    modifier notSafeMode() {
        require(!safeMode, "Safe Mode Active");
        _;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external notSafeMode {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        totalLiquidity -= amount;

        payable(msg.sender).transfer(amount);

        emit Withdraw(msg.sender, amount);
    }

    function activateSafeMode(uint256 riskScore) external {
        safeMode = true;
        emit SafeModeActivated(riskScore);
    }

    function deactivateSafeMode() external {
        safeMode = false;
    }

    // Metadata functions to prevent EVM errors from wallet providers
    function name() external pure returns (string memory) {
        return "Reactive Vault";
    }

    function symbol() external pure returns (string memory) {
        return "RVAULT";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    // ERC165 — prevents MetaMask from reverting when it probes for interface support
    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }
}
