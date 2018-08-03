import React, { Component } from 'react';
import './style.css';
import { Link } from 'react-router-dom';
import Web3 from 'web3';

let API_KEY = 'gdfRd6Ffu1Y9irW70Ljz';

class Blocks extends Component {
    constructor(props){
        super(props);
        this.state = {
            blocks: []
        }
        this.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + API_KEY))
    }

    componentWillMount() {
        var hash = this.props.match.params.blockHash;
        this.getBlockData(hash);
    }

    getBlockData(hash) {
        
        console.log("Block hash: " + hash);
        this.web3.eth.getBlock(hash).then(res => {

            
        });

    }
    render() {

        return (

            <div className="Blocks">
                <h2>Block Information</h2>
            </div>
        )
    }
}

export default Blocks;