import A from './Watcher';
// const a = require('./Watcher');

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
    // document.body.appendChild(fragment);
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

  compile() {

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
}