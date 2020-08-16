# 不用 `React` 来让 React 官方教程中的井字棋跑起来 —— `Toy-React`


## 一、前期准备工作

### 1.1 webpack

1. 安装
    - ```yarn add webpack webpack-cli --save-dev ```
    - > webpack-cli: 提供一些常用命令
2. 作用：最大的作用是把Javascript中的`import`/`require`的多个文件打包成一个单个的JS文件
3. 使用`loader`定制各种各样的文件，比如想把 CSS 文件打包成 JS 文件，就可以写一个`CSS-loader`

#### 1.1.1 使用

1. 用`npx webpack`命令打包
    1. 首先创建配置文件 webpack.config.js
    2. 因为没有办法对webpack本身去做Babel转换，所以我们直接用的node 的标准，`module.exports{}`

## 1.2 babel
1. 将高版本的 JS 转换成低版本的 JS ,兼容低版本浏览器
2. 在`webpack`中以`loader`形式去使用的
3. 安装
   1. ``` yarn add babel-loader @babel/core @babel/preset-env --save-dev```
   2. > preset-env: 常用的配置的选项
4. @babel/plugin-transform-react-jsx
   1. > 用于翻译`jsx`语法
   2. 设置`{"pragma": 'createElement'}` 来改变`React function calls`的函数名称

## 二、JSX 的原理和关键实现


> 首先来了解下什么是JSX和它的解析规则：JSX就是JavaScript和XML结合的一种格式。React发明了JSX，利用HTML语法来创建虚拟DOM。当遇到"<"，JSX就当HTML解析，遇到 “{” 就当JavaScript解析。

> 我们要知道JSX语法的本质并不是直接把JSX渲染到页面，而是在内部先转换成了createElement 形式，然后再去渲染的，同时JSX在进行编译成JavaScript代码的时候进行了一定的优化，所以执行效率也更高。

> 使用`plugin-transform-react-jsx`来将 JSX　转换为　React 的函数调用，这里我们改为叫`creatElement()`

### 2.1 JSX 原生标签
1. 实现`creatElement()`
   1. 观察普通　`JSX<div>` 的转换结果
   2. 添加 id, class, 子节点, 文本内容的转换结果
   ```js
    document.body.appendChild(
        <div id="a" class="c">
            <div>abc</div>
            <div></div>
            <div></div>
        </div>
    );
   ```
   转换结果
   ```js
    document.body.appendChild(createElement("div", {
        id: "a",
        "class": "c"
    }, createElement("div", null, "abc"), createElement("div", null), createElement("div", null)));
   ```
   3. tagName是第一个参数，属性是一个对象作为第二个参数，而子节点就是剩下的几个参数
   ```js
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
   ```

### 2.2　JSX 自定义组件机制

1. 观察当把 div 换成自定义组件后，转换结果
```js
document.body.appendChild(createElement(Mycomponent, {
  id: "a",
  "class": "c"
}, createElement("div", null, "abc"), createElement("div", null), createElement("div", null)));
```
这时候不会把 Mycomponent 当作字符串了，所以需要一个 Mycomponent class，同时`createElement`也要做对应的变化
2. 因为自定义的组件是没有原生的DOM操作，我们需要对这些操作进行包装
   1. 需要包装的：createElement, createTextNode
   2. 对于自定义组件，应该有默认行为，可以从 Component 上继承下来


## 三、实现setState、re-render，引入`tic-tac-toe`

### 3.1 之前的问题

> 前面做的render存在两个问题：1. 没有数据来源，2. 数据改变后，没有很好的机制更新

需要修改 `Component` 和 `Wrapper` 来支持 `state`、 `setState`，`setState`不但改变`state`值本身，同时会重新`render`，对此`setState`之后，还会在整个生命周期结束后发起重新的`render`

1. 实现基于 Range 的 DOM 绘制
2. 实现重新绘制 re-render
3. 改变 state 和 re-render 应该合成为一句，setState
   1. 不同点
   2. setState 能实现对象的合并，把 OldState 和 NewState 合并
   3. rerender 不需要手动调用
---

### 3.2 基本跑起来 tic-tac-toe

- 搬运 tic-tac-toe 游戏
  - 源码：https://codepen.io/gaearon/pen/gWWZgR?editors=0100
  - 把 js 的部分拷贝过来放到 main.js 中。
  - 把 css 的部分直接贴到 main.html 文件中，用 style 标签包裹。
- 需要注意的地方：
  1. render 的节点是 document.body ，因为 main.html 里面没加 root div （或者加上也可以）
  ```ReactDOM.render(<Game />, document.body>```
  2. 把 function 组件改成 class 组件（别忘了加 this)，再把 `React.Component` 改成`Component`
- 处理 `className` 
  - ```<button className="square" onClick={this.props.onClick}>```
  - 在`ElementWrapper` 的 `setAttribute` 中
    ```js
    if(name === "className") {
        this.root.setAttribute("class", value);
    }
    ```

## 四、虚拟DOM的原理和关键实现

> 在React这种UI = data + template 思路下，如果不引入 VDOM 的话，我们只能全量更新它的DOM树，那么性能是不能接受的

目前的 ElementWrapper 上的方法是相当于 root 真实 DOM元素的代理，需要要把代理能力去掉，去真正的创建 VDOM

### 4.1 生成 vdom
1. 为 ElementWrapper 添加 get vdom();
    ```js
    get vdom() {
        return {
            type: this.type,
            props: this.props,
            // 组件 children 需要转换为vdom
            children: this.children.map((child) => child.vdom),
        };
    }
    ```
2. TextWrapper 添加 get vdom();
    ```js
    get vdom() {
        return {
            type: "#text",
            content: this.content,
        };
    }
    ```
3. 因为 setAttribute 就是存 this.props, 而appendChild 就是存child，这就和 Component 的行为一致，所以我们让Wrapper 继承 Component，同时把ElementWrapper中的set 和 append 注释掉。
4. Component 添加 get vdom()
    ```js
    get vdom() {
        return this.render().vdom;
    }
    ```

### 4.2 从 vdom 生成真实 DOM

1. Wrapper 中的 root 可以删掉了，我们是根据 vdom 来操作的
2. 而 get vdom() 是返回一个新对象，这样虽然是一颗干净的树，但是上面没有方法的话，是没办法重绘的。所以直接返回 this即可。
3. 对于vdom 的children还是组件的children，应该改为对应的vdom
    ```js
    get vchildren() {
        eturn this.children.map( child => child.vdom);
    }
    ```
4. setAttribute 和 appendChild 做的事情放在 RENDER_TO_DOM 做
    ```js
    [RENDER_TO_DOM](range) {
        range.deleteContents();

        // 还原props 到 真实 dom 的 attribute
        let root = document.createElement(this.type);
        for(let name in this.props) {
        let value = this.props[name];
        if (name.match(/^on([\s\S]+)$/)) {
            root.addEventListener(
            RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
            value
            );
        } else {
            if (name === "className") {
            root.setAttribute("class", value);
            } else {
            root.setAttribute(name, value);
            }
        }
        }

        // 还原children 到真实 dom 的children

        for(let child of this.children) {
        let childRange = document.createRange();
        childRange.setStart(root, root.childNodes.length);
        childRange.setEnd(root, root.childNodes.length);
        child[RENDER_TO_DOM](childRange);
        }
        range.insertNode(root);
    }
    ```
### 4.3 vdom 比对

#### 4.3.1 节点比较
```js
let isSameNode = (oldNode, newNode) => {
    if(oldNode.type !== newNode.type) {
        return false;
    }
    for(let name in newNode.props) {
        if(newNode.props[name] !== oldNode.props[name]) {
            return false;
        }
    }
    if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
        return false;
    }
    if(newNode.type === "#text") {
        if(newNode.content !== oldNode.content) {
            return  false; 
        }
    }
    return true;
}
```

#### 4.3.2 更新节点

```js
let update = (oldNode, newNode) => {
    // 对比项：type，props，children
    // #text content
    if(!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
    }
    newNode._range = oldNode._range;

    let newChildren = newNode.vchildren;
    let oldChildren = oldNode.vchildren;

    if(!newChildren || !newChildren.length) {
        return ;
    }

    let tailRange = oldChildren[oldChildren.length - 1]._range;

    for(let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if(i < oldChildren.length) {
            update(oldChild, newChild);
        } else {
            let range = document.createRange();
            range.setStart(tailRange.endContainer,tailRange.endOffset);
            range.setEnd(tailRange.endContainer,tailRange.endOffset);
            newChild[RENDER_TO_DOM](range);
            tailRange = range;
        }
    }
}

let vdom = this.vdom;
update(this._vdom, vdom);
this._vdom = vdom;
```