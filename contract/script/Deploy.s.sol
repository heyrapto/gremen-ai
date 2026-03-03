pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ReactiveVault} from "../src/ReactiveVault.sol";

contract DeployScript is Script {
    function run() public {
        vm.startBroadcast();
        ReactiveVault vault = new ReactiveVault();
        console2.log("ReactiveVault deployed at:", address(vault));
        vm.stopBroadcast();
    }
}
