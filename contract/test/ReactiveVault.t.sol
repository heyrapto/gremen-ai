pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ReactiveVault} from "../src/ReactiveVault.sol";

contract ReactiveVaultTest is Test {
    ReactiveVault public vault;

    function setUp() public {
        vault = new ReactiveVault();
    }

    function test_Deposit() public {
        vm.deal(address(this), 10 ether);
        vault.deposit{value: 5 ether}();

        assertEq(vault.balances(address(this)), 5 ether);
        assertEq(vault.totalLiquidity(), 5 ether);
    }

    function test_Withdraw() public {
        vm.deal(address(this), 10 ether);
        vault.deposit{value: 5 ether}();

        vault.withdraw(1 ether);

        assertEq(vault.balances(address(this)), 4 ether);
        assertEq(vault.totalLiquidity(), 4 ether);
    }

    function test_Withdraw_RevertWhen_InsufficientBalance() public {
        vm.deal(address(this), 10 ether);
        vault.deposit{value: 5 ether}();

        vm.expectRevert("Insufficient balance");
        vault.withdraw(6 ether);
    }

    function test_Withdraw_RevertWhen_SafeModeActive() public {
        vm.deal(address(this), 10 ether);
        vault.deposit{value: 5 ether}();

        vault.activateSafeMode(90);

        vm.expectRevert("Safe Mode Active");
        vault.withdraw(1 ether);
    }

    receive() external payable {}
}
