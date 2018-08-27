
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
