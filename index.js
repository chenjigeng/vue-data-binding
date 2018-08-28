class Observer {
  constructor(data) {
    // 如果不是对象，则返回
    if (!data || typeof data !== 'object') {
      return;
    }
    this.data = data;
    this.walk();
  }

  // 对传入的数据进行数据劫持
  walk() {
    for (let key in this.data) {
      this.defineReactive(this.data, key, this.data[key]);
    }
  }
  // 创建当前属性的一个发布实例，使用Object.defineProperty来对当前属性进行数据劫持。
  defineReactive(obj, key, val) {
    // 创建当前属性的发布者
    const dep = new Dep();
    /*
    * 递归对子属性的值进行数据劫持，比如说对以下数据
    * let data = {
    *   name: 'cjg',
    *   obj: {
    *     name: 'zht',
    *     age: 22,
    *     obj: {
    *       name: 'cjg',
    *       age: 22,
    *     }
    *   },
    * };
    * 我们先对data最外层的name和obj进行数据劫持，之后再对obj对象的子属性obj.name,obj.age, obj.obj进行数据劫持，层层递归下去，直到所有的数据都完成了数据劫持工作。
    */
    new Observer(val);
    Object.defineProperty(obj, key, {
      get() {
        // 若当前有对该属性的依赖项，则将其加入到发布者的订阅者队列里
        if (Dep.target) {
          dep.addSub(Dep.target);
        }
        return val;
      },
      set(newVal) {
        if (val === newVal) {
          return;
        }
        val = newVal;
        new Observer(newVal);
        dep.notify();
      }
    })
  }
}

// 发布者,将依赖该属性的watcher都加入subs数组，当该属性改变的时候，则调用所有依赖该属性的watcher的更新函数，触发更新。
class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(sub) {
    if (this.subs.indexOf(sub) < 0) {
      this.subs.push(sub);
    }
  }

  notify() {
    this.subs.forEach((sub) => {
      sub.update();
    })
  }
}

Dep.target = null;

// 观察者
class Watcher {
  /**
   *Creates an instance of Watcher.
   * @param {*} vm
   * @param {*} keys
   * @param {*} updateCb
   * @memberof Watcher
   */
  constructor(vm, keys, updateCb) {
    this.vm = vm;
    this.keys = keys;
    this.updateCb = updateCb;
    this.value = null;
    this.get();
  }

  // 根据vm和keys获取到最新的观察值
  get() {
    // 将Dep的依赖项设置为当前的watcher,并且根据传入的keys遍历获取到最新值。
    // 在这个过程中，由于会调用observer对象属性的getter方法，因此在遍历过程中这些对象属性的发布者就将watcher添加到订阅者队列里。
    // 因此，当这一过程中的某一对象属性发生变化的时候，则会触发watcher的update方法
    Dep.target = this;
    this.value = CompileUtils.parse(this.vm, this.keys);
    Dep.target = null;
    return this.value;
  }

  update() {
    const oldValue = this.value;
    const newValue = this.get();
    if (oldValue !== newValue) {
      this.updateCb(oldValue, newValue);
    }
  }
}

class MVVM {
  constructor({
    data,
    el,
  }) {
    this.data = data;
    this.el = el;
    this.init();
    this.initDom();
  }

  init() {
    new Observer(this.data);
    this.$el = this.isElementNode(this.el) ? this.el : document.querySelector(this.el);
    for (let key in this.data) {
      this.defineReactive(key);
    }
  }

  initDom() {
    const fragment = document.createDocumentFragment();
    let firstChild;
    while(firstChild = this.$el.firstChild) {
      fragment.appendChild(firstChild);
    }
    console.log(fragment);
    this.compile(fragment);
    document.body.appendChild(fragment);
  }
  // 将this.data的属性都绑定到this上，这样用户就可以直接通过this.xxx来访问this.data.xxx的值
  defineReactive(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.data[key];
      },
      set(newVal) {
        this.data[key] = newVal;
      }
    })
  }

  compile(node) {
    const textReg = /\{\{\s*\w+\s*\}\}/gi; // 检测{{name}}语法
    if (this.isElementNode(node)) {
      const attrs = node.attributes;
      Array.prototype.forEach.call(attrs, (attr) => {
        if (this.isDirective(attr)) {
          CompileUtils.compileModelAttr(this.data, node, attr)
        }
        console.log(attr);
      })
    } else if (this.isTextNode(node)) {
      let textContent = node.textContent;
      if (textReg.test(textContent)) {
        // 对于 "test{{test}} {{name}}"这种文本，可能在一个文本节点会出现多个匹配符，因此得对他们统一进行处理
        // 使用 textReg来对文本节点进行匹配，可以得到["{{test}}", "{{name}}"]两个匹配值
        const matchs = textContent.match(textReg);
        CompileUtils.compileTextNode(this.data, node, matchs);
      }
      console.log(node);
    }
    
    if (node.childNodes && node.childNodes.length > 0) {
      Array.prototype.forEach.call(node.childNodes, (child) => {
        this.compile(child);
      })
    }
    // while(firstChild = node.firstChild) {
    //   console.log(firstChild);
    // }
  }
  
  // 是否是属性节点
  isElementNode(node) {
    return node.nodeType === 1;
  }

  isTextNode(node) {
    return node.nodeType === 3;
  }

  isAttrs(node) {
    return node.nodeType === 2;
  }

  isDirective(attr) {
    return attr.nodeName.indexOf('v-') >= 0;
  }

}

const CompileUtils = {
  reg: /\{\{\s*(\w+)\s*\}\}/,
  compileTextNode(vm, node, matchs) {
    const rawTextContent = node.textContent;
    matchs.forEach((match) => {
      const keys = match.match(this.reg)[1];
      console.log(rawTextContent);
      new Watcher(vm, keys, () => this.updateTextNode(vm, node, matchs, rawTextContent));
    });
    this.updateTextNode(vm, node, matchs, rawTextContent);
  },
  updateTextNode(vm, node, matchs, rawTextContent) {
    console.log(rawTextContent);
    let newTextContent = rawTextContent;
    matchs.forEach((match) => {
      const keys = match.match(this.reg)[1];
      const val = this.getModelValue(vm, keys);
      newTextContent = newTextContent.replace(match, val);
    })
    node.textContent = newTextContent;
  },
  compileModelAttr(vm, node, attr) {
    const { value: keys, nodeName } = attr;
    node.value = this.getModelValue(vm, keys);
    node.removeAttribute(nodeName);
    new Watcher(vm, keys, (oldVal, newVal) => {
      node.value = newVal;
    });
    node.addEventListener('input', (e) => {
      this.setModelValue(vm, keys, e.target.value);
    });
  },
  /* 解析keys，比如，用户可以传入
  *  let data = {
  *    name: 'cjg',
  *    obj: {
  *      name: 'zht',
  *    },
  *  };
  *  new Watcher(data, 'obj.name', (oldValue, newValue) => {
  *    console.log(oldValue, newValue);
  *  })
  *  这个时候，我们需要将keys解析为data[obj][name]的形式来获取目标值
  */
  parse(vm, keys) {
    keys = keys.split('.');
    let value = vm;
    keys.forEach(_key => {
      value = value[_key];
    });
    return value;
  },
  getModelValue(vm, keys) {
    return this.parse(vm, keys);
  },
  setModelValue(vm, keys, val) {
    keys = keys.split('.');
    let value = vm;
    for(let i = 0; i < keys.length - 1; i++) {
      value = value[keys[i]];
    }
    value[keys[keys.length - 1]] = val;
  },
}

{/* <div id='app'>
    <input id='1' v-model='text'/>
    <span>asdas {{ text }} asd asd </span>
    asd {{ text }}
    <br />
    <input v-model='name' />
    asd {{ name }}
  </div> */}