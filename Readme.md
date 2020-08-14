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
```
document.body.appendChild(createElement(Mycomponent, {
  id: "a",
  "class": "c"
}, createElement("div", null, "abc"), createElement("div", null), createElement("div", null)));
```
这时候不会把 Mycomponent 当作字符串了，所以需要一个 Mycomponent class，同时`createElement`也要做对应的变化
2. 因为自定义的组件是没有原生的DOM操作，我们需要对这些操作进行包装
   1. 需要包装的：createElement, createTextNode
   2. 也没有appendChild了，这里对应到 render() 中
