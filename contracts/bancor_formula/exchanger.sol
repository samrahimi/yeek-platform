interface IYeekFormula {
    function calculatePurchaseReturn(uint256 _supply, uint256 _connectorBalance, uint32 _connectorWeight, uint256 _depositAmount) external view returns (uint256);
    function calculateSaleReturn(uint256 _supply, uint256 _connectorBalance, uint32 _connectorWeight, uint256 _sellAmount) external view returns (uint256);
}

interface ITradeableAsset {
    function totalSupply() external view returns (uint256);
    function approve(address spender, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint tokens) external returns (bool success);
    function decimals() external view returns (uint256);
    function transfer(address _to, uint256 _value) external;
    function balanceOf(address _address) external view returns (uint256);
}

/* A basic permissions hierarchy (Owner -> Admin -> Everyone else). One owner may appoint and remove any number of admins
   and may transfer ownership to another individual address */
contract Administered {
    address public creator;

    mapping (address => bool) public admins;
    
    constructor()  public {
        creator = msg.sender;
        admins[creator] = true;
    }

    //Restrict to the current owner. There may be only 1 owner at a time, but 
    //ownership can be transferred.
    modifier onlyOwner {
        require(creator == msg.sender);
        _;
    }
    
    //Restrict to any admin. Not sufficient for highly sensitive methods
    //since basic admin can be granted programatically regardless of msg.sender
    modifier onlyAdmin {
        require(admins[msg.sender] || creator == msg.sender);
        _;
    }

    //Add an admin with basic privileges. Can be done by any superuser (or the owner)
    function grantAdmin(address newAdmin) onlyOwner  public {
        _grantAdmin(newAdmin);
    }

    function _grantAdmin(address newAdmin) internal
    {
        admins[newAdmin] = true;
    }

    //Transfer ownership
    function changeOwner(address newOwner) onlyOwner public {
        creator = newOwner;
    }

    //Remove an admin
    function revokeAdminStatus(address user) onlyOwner public {
        admins[user] = false;
    }
}

/* A liqudity pool that executes buy and sell orders for an ETH / Token Pair */
/* The owner deploys it and then adds tokens / ethereum in the desired ratio */

contract MarketMaker is Administered {
    bool public enabled = false;    //Owner can turn off and on

    //The token which is being bought and sold
    ITradeableAsset public tokenContract;
    //The contract that does the calculations to determine buy and sell pricing
    IYeekFormula public formulaContract;
    //The reserve pct of this exchanger, expressed in ppm
    uint32 public weight;

    /** 
        @dev Deploys an exchanger contract for a given token / Ether pairing
        @param _token An ERC20 token
        @param _weight The reserve fraction of this exchanger, in ppm
        @param _formulaContract The contract with the algorithms to calculate price
     */

    constructor(address _token, 
                uint32 _weight,
                address _formulaContract) {
        require (_weight > 0 && weight <= 1000000);
        
        weight = _weight;
        tokenContract = ITradeableAsset(_token);
        formulaContract = IYeekFormula(_formulaContract);
    }
    
    /**
     @dev Deposit tokens to the reserve. Note: to deposit ether, send it to this contract with no call data
     @param amount The amount of whatever ERC20 token is represented by tokenContract
     */
    function depositTokens(uint amount) onlyOwner public {
        tokenContract.transferFrom(msg.sender, this, amount);
    }
        
    /**
     @dev Deposit ether 
     */
     function depositEther() public payable returns(uint) {
//return getQuotePrice(); 
     }
     

    /**  
     @dev Withdraw tokens from the reserve
     @param amount The amount in real tokens (decimals are taken care of for you)
     */
    function withdrawTokens(uint amount) onlyOwner public {
        tokenContract.transfer(msg.sender, amount);
    }

    function withdrawEther(uint amountInWei) onlyOwner public {
        msg.sender.transfer(amountInWei); //Transfers in wei
    }

    function getQuotePrice() public view returns(uint) {
        uint tokensPerEther = 
        formulaContract.calculatePurchaseReturn(
            tokenContract.totalSupply(),
            address(this).balance,
            weight,
            1 ether 
        ); 

        return tokensPerEther;
    }

    /**
     @dev Buy tokens with ether. 
     */
    function buy() public payable {
        uint amount = formulaContract.calculatePurchaseReturn(
            tokenContract.totalSupply(),
            address(this).balance,
            weight,
            msg.value);
        require (tokenContract.balanceOf(this) >= amount);
        tokenContract.transfer(msg.sender, amount);
    }
    /**
     @dev Sell tokens for ether
     */
     function sell(uint quantity) public {
         uint amountInWei = formulaContract.calculateSaleReturn(
             tokenContract.totalSupply(),
             address(this).balance,
             weight,
             quantity
         );
         require (amountInWei <= address(this).balance);
         require (tokenContract.transferFrom(msg.sender, this, quantity));

         msg.sender.transfer(amountInWei); //Always send ether last
     }
}