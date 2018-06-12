pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "../contracts/yeek_formula/formula.sol";

// exposes internal functions in formula.sol for testing
contract ExposeInternals is Utils {
    function _safeAdd(uint256 _x, uint256 _y) public pure returns (uint256) {
        
        return safeAdd(_x, _y);

    }

    function _safeSub(uint256 _x, uint256 _y) public pure returns (uint256) {
        
        return safeSub(_x, _y);

    }

    function _safeMul(uint256 _x, uint256 _y) public pure returns (uint256) {

        return safeMul(_x, _y);

    }
}

contract TestFormulas{
    
    uint256 x;
    uint256 y;

    // resets x, y values after each test function calls
    function afterEach() public {

        x = uint256(0);
        y = uint256(0);

    }
    /////////////////////////Utils contract tests/////////////////////////////////
    function testPrimitiveSafeAdd() public {
        ExposeInternals form = new ExposeInternals();
        
        x = uint256(4);
        y = uint256(2);

        Assert.equal(form._safeAdd(x, y), uint256(6), "4 + 2 should be 6");

    }

    function testPrimitiveSafeSub() public {

        ExposeInternals form = new ExposeInternals();
        x = uint256(5);
        y = uint256(2);
        Assert.equal(form._safeSub(x, y), uint256(3), "5 - 2 should be 3");

    }

    function testPrimitiveSafeMul() public {

        ExposeInternals form = new ExposeInternals();
        x = uint256(4);
        y = uint256(7);

        Assert.equal(form._safeMul(x, y), uint256(28), "4 * 7 should be 28");
    }

    function testZeroMul() public {

        ExposeInternals form = new ExposeInternals();
        x = uint256(0);
        y = ~uint256(0);
        Assert.equal(form._safeMul(x, y), uint256(0), "0 * (2^256 - 1) should be 0");
    }

    function testOverflowSafeAdd() public {

        ExposeInternals form = new ExposeInternals();

        x = ~uint256(0) - 1; // max uint256 value: 2^256 - 2
        y = uint256(1);

        Assert.equal(form._safeAdd(x, y), ~uint256(0), "Should return max uint256 value");
    }

    /////////////////////////YeekFormula contract tests/////////////////////////////////


}