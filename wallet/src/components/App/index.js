import React, { Component } from 'react';
import logo from './logo.svg';
import './style.css';
import {BrowserRouter as Router, Route, Link} from 'react-router-dom';
import Home from './../Home';
import Block from './../Blocks';
const e = React.createElement;
class App extends Component {
  render() {
      
    return e(
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>React Framework</h2>
        </div>
        <div className="App-nav">
          <Router>
              <div>
                  <Link to="/">Home</Link>
                  <Link to="/block">Blocks</Link>
                  <Route exact path="/" component={Home}/>
                  <Route exact path="/block" render={() =>(
                      <h3> Choose block hash</h3>
                  )}/>
                  <Route path="/block/:blockHash" component={Block}/>
              </div>
          </Router>
        </div>
      </div>
    );
  }
}
export default App;