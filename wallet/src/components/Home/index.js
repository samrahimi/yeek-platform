import React, { Component } from 'react';
import './style.css';
import Web3 from 'web3';
import _ from 'lodash';
import { Link } from 'react-router-dom';
let API_KEY = 'gdfRd6Ffu1Y9irW70Ljz';
class Home extends Component {
    constructor(props){
        super(props);
        this.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + API_KEY));
        this.state = {
            ids: [],
            hashes: [],
            curr_block: null
        };
    }

    componentWillMount() {
        console.log(this.web3.eth.accounts);
        this.web3.eth.getBlockNumber().then(res => {
            console.log(res);
            this.setState({
                curr_block: res
            });
            this.getLastNBlocks(5);
        });
        
    }
    // gets last N blocks on the network
    getLastNBlocks(N) {
        var curr_block_num = this.state.curr_block;
        var hashes = this.state.hashes.slice();
        var ids = this.state.ids.slice();
        for (var i = curr_block_num - N; i < curr_block_num; i++){
            this.web3.eth.getBlock(i).then(res => {
                hashes.push(res.hash);
                ids.push(res.number);
            });
        }

        this.setState({
            ids: ids,
            hashes: hashes
        });
    }
    render() {
        var tableRows = [];
        _.each(this.state.ids, (value, index) => {
            tableRows.push(
                <tr key={this.state.hashes[index]}>
                    <td className="tdCenter">{this.state.ids[index]}</td>
                    <td><Link to={`/block/${this.state.hashes[index]}`}>{this.state.hashes[index]}</Link></td>
                </tr>
            );
        });

        return (
            
            <div className="Home">
                <h2> Welcome to Home Page </h2>
                Latest Block Number: {this.state.curr_block}
                <table>
                    <thead><tr>
                        <th>Block Num</th>
                        <th>Hash</th>
                    </tr></thead>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            </div>

        );
    }
}

export default Home;