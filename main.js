/* 
    function createElement(tagName, attributes, ...children) {
        let e = document.createElement(tagName);
        for (const i in attributes) {
            e.setAttribute(i, attributes[i]);
        }
        for (const child of children) {
            if(typeof child === 'string'){
                child = document.createTextNode(child);
            }
            e.appendChild(child);
        }
        return e;
    }

    document.body.appendChild(
    <div id="a" class="c">
        <div>abc</div>
        <div></div>
        <div></div>
    </div>
    );

*/

// JSX 自定义组件机制

import { createElement, Component, render } from "./toy-react";

class Mycomponent extends Component{
  render() {
    return <div>
      <h1>my component</h1>
      {this.children}
    </div>
  }
}

render(
  <Mycomponent id="a" class="c">
    <div>abc</div>
    <div></div>
    <div></div>
  </Mycomponent>
, document.body);