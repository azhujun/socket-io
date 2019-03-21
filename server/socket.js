const messages = require('./messages');

let customersList = {};
let userNotJoin = {};
let customersPool = {};
let userPool = {};

class customer{
    constructor(name, socket){
        this.name = name || Math.floor(Math.random() * 1000) +"号";
        this.socket = socket;
        this.max = 20;
        this.number = 0;
        this.userIDS = [];
        this.type = 'customer';
        this.isOnline = true;
        socket.join('customer');
        this.init();
    }

    isMax(){
        return this.number >= this.max;
    }

    join(user){
        user.isjoin = true;
        user.customer = this;
        user.customerName = this.name;
        user.socket.emit("system.log", `客服代表 ${this.name} 正在为您服务`);
        user.socket.emit("system.kefu", {name:this.name})
        this.socket.emit("join user", {name:user.name, id:user.socket.id});
        user.sendCache();
        this.number++;
        this.userIDS.push(user.name)
        return true;
    }

    remove(user){
        user.isjoin = false;
        user.roomid = "";
        user.customer = "";
        this.number--;
        this.socket.emit("system.alet", {text:`客户 ${user.name} 已离线`, name: user.name});
        let index = this.userIDS.indexOf(user.name);
        index !== -1 && this.userIDS.splice(index, 1);
    }
    
    init(){

        this.socket.on("message to user", res => {
            let user = userPool[res.name];
            if(user){
                messages.insertOne({
                    name: this.name,
                    text: res.text,
                    to: res.name,
                    time: new Date()
                });
                user.socket.emit("message", {
                    text: res.text,
                    name: this.name
                })
            }else{
                console.log("没有找到"+res.name)
            }
        })

        this.socket.on("customer to customer", res => {
            let customer = customersPool[res.name];
            if(customer){
                messages.insertOne({
                    name: this.name,
                    text: res.text,
                    to: res.name,
                    time: new Date()
                });
                customer.socket.emit("message", {
                    text: res.text,
                    name: this.name
                })
            }
        })

        this.socket.on("join user", res => {
            let _u = userPool[res.name];
            _u && this.join(_u) && delete userNotJoin[res.name];
            this.socket.broadcast.emit('user not join', userNotJoin);
        });
    }
}

class user{
    constructor(name, socket){
        this.name = name || "访客";
        this.socket = socket;
        this.isjoin = false;
        this.customer = "";
        this.customerName = "";
        this.type = 'user';
        this.cache = [];
        this.init();
    }
    
    init(){

        this.socket.on("message to customer", res => {
            //给我的客服推送
            if(this.customer){
                if(!this.customer.isOnline){
                    this.customer = "";
                    this.socket.emit("system.log", "客服已离线");
                    this.socket.emit("system.log", "正在等待客服");
                    userNotJoin[this.name] = {id:this.socket.id, name:this.name}
                    this.socket.broadcast.emit('user not join', userNotJoin);
                    return;
                }

                this.customer.socket.emit("message", {
                    id: this.socket.id,
                    name: this.name,
                    text: res
                })

                messages.insertOne({
                    name: this.name,
                    text: res,
                    to: this.customer.name,
                    time: new Date()
                });

            }else{
                //缓存
                this.cache.push(res)
                messages.insertOne({
                    name: this.name,
                    text: res,
                    to: this.customer.name,
                    time: new Date()
                });
            }
        })
       
    }

    sendCache(){
        this.cache.length && this.customer.socket.emit("user chche", {name:this.name,id:this.id,cache:this.cache});
        this.cache = [];
    }
}

function init(socket, io){
    let _self = null;
    socket.on("login", name=>{
        //检查客服重名
        let code = 200;
        customersPool[name] && (code=-1);
        socket.emit("loginSuccess", code)
    });

    socket.on("user reconnect", (data) => {
        if(!userPool[data.name]){
            _self = new user(data.name, socket);
            userPool[_self.name] = _self;
        }
        
        let customer = customersPool[data.customerName];
        _self.socket.emit("system.log", "重新连接中。。。");
        if(customer){
            customer.socket.emit("user reconnect", {
                name: _self.name
            })
        }else{
            userNotJoin[_self.name] = {id:_self.socket.id, name:_self.name}
            _self.socket.broadcast.emit('user not join', userNotJoin);
        }
    });
    
    socket.on("adduser", data => {
        if(data.type === 'customer'){
            _self = new customer(data.userName, socket);
            // 客服列表信息
            customersList[_self.name] = {id: _self.socket.id, name:_self.name, list:[]};
            // 所有在线用户
            customersPool[_self.name] = _self;
            socket.emit("user not join", userNotJoin);
            io.sockets.emit('customer list', customersList);
        }

        if(data.type === 'user'){
            
            socket.emit("system.log", "正在连接。。。")
            socket.emit("system.log", "安排客服中");
            _self = new user(data.userName, socket);

            // 所有在线用户
            userPool[_self.name] = _self;

            for(let i in customersPool){
                let cus = customersPool[i];
                if(cus && !cus.isMax()){
                    cus.join(_self)
                    break;
                }
            }

            //如果没有加入
            if(!_self.isjoin){
                socket.emit("system.log", "正在等待客服");
                userNotJoin[_self.name] = {id:_self.socket.id, name:_self.name}
                socket.broadcast.emit('user not join', userNotJoin);
            }
        }
    })

    socket.on('disconnect', (reason) => {
        // 如果客服掉线
        if(_self && _self.type === "customer"){
            for(let i in _self.userIDS){
                let userName = _self.userIDS[i];
                let item = userPool[userName];
                if(item){
                    item.roomid = 'kefu';
                    item.isjoin = false;
                    item.customer = "";
                    item.socket.emit("system.log", "客服已离线");
                    userNotJoin[item.name] = {id:item.socket.id, name:item.name}
                }
            }
            _self.isOnline = false;
            let index = customersList[_self.name];
            index && delete customersList[_self.name];
            let index2 = customersPool[_self.name];
            index2 && delete customersPool[_self.name];
            socket.broadcast.to("customer").emit("customer unline", _self.name)
            _self.userIDS && socket.broadcast.emit('user not join', userNotJoin);
        }
        //如果用户掉线
        if(_self && _self.type === "user"){
            _self.roomid = '';
            _self.isjoin = false;
            _self.customer && _self.customer.remove(_self);
            let index = userNotJoin[_self.name];
            index && delete userNotJoin[_self.name];
            let index2 = userPool[_self.name];
            index2 && delete userPool[_self.name];
        }
    });

    socket.on('disconnecting', (reason) => {
        let rooms = Object.keys(socket.rooms);
        // ...
        console.log("断线了")
        
        socket.emit("system.error", "断线了")
    });

    socket.on('error', (error) => {
        // ...
        console.log("出错了", error)
        socket.emit("system.error", "出错了")
    });
}

module.exports = {
    init
}