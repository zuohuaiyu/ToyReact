const RENDER_TO_DOM = Symbol('render to dom');

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      // 因为加了表示匹配型的括号(), 这时候 RegExo 的属性 $1 则表示匹配的字符串
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()),
        value
      );
    } else {
      if(name === "className") {
        this.root.setAttribute("class", value);
      } else {
        this.root.setAttribute(name, value);
      }
    }
  }

  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor(content) {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  } 
  rerender() {
    // 因为 range 为空之后，会被合并到相邻的 Range 里面，所以我们需要保证 range 不空，先插入再删除

    // 用oldRange保存旧的range
    let oldRange = this._range;
    
    // 创建个新range，设置为旧range的start和end，再插入
    let range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    // 把旧range的start挪到插入的内容之后，再删除
    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();

  }
  setState(newState) {
    // 防止 state 是空的
    if(this.state === null || typeof this.state !== "object") {
      this.state = newState;
      this.rerender();
      return;
    }

    let merge = (oldState, newState) => {
      for(let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== "object") {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    }
    merge(this.state, newState);
    this.rerender();
  }

}

export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === "string") {
    e = new ElementWrapper(type);
  } else {
    e = new type();
  }

  for (const i in attributes) {
    e.setAttribute(i, attributes[i]);
  }
  let insertChildren = (children) => {
    for (const child of children) {
      if (typeof child === "string") {
        child = new TextWrapper(child);
      }
      if(child === null) {
        continue;
      }
      if (typeof child === "object" && child instanceof Array) {
        insertChildren(child);
      } else {
        e.appendChild(child);
      }
    }
  };
  insertChildren(children);
  return e;
}

export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}
