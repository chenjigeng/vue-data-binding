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
    const keys = this.keys.split('.');
    let value = this.vm;
    keys.forEach(_key => {
      value = value[_key];
    });
    this.value = value;
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

// example
let data = {
  name: 'cjg',
  obj: {
    name: 'zht',
  },
};

new Observer(data);
// 监听data对象的name属性，当data.name发现变化的时候，触发cb函数
new Watcher(data, 'name', (oldValue, newValue) => {
  console.log(oldValue, newValue);
})

data.name = 'zht';

// 监听data对象的obj.name属性，当data.obj.name发现变化的时候，触发cb函数
new Watcher(data, 'obj.name', (oldValue, newValue) => {
  console.log(oldValue, newValue);
})

data.obj.name = 'cwc';
data.obj.name = 'dmh';
