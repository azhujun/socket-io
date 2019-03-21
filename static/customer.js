const socket = io('ws://127.0.0.1:3839');
let app = new Vue({
    el: '#app',
    data: {
        userList:{},
        customerList:{},
        userNotJoin:{},
        userActiveList:{},
        userActiveListBar:"userList",
        chahe:{},
        message:"",
        activeTabs: "",
        activeIM:{},
        redCircle: {
            customerList: false,
            userNotJoin: false,
            userList: false
        },
        isLogin: false,
        name:""
    },
    filters: {
        showName: function (name) {
          	if(name){
             	let str = name.split("-");
                if (str[0] === '访客') {
                    name = str[0] + " " + str[1];
                }
            }

            return name;
        }
    },
    methods: {
        open: function(username){
            if(username){
                socket.emit("login", {userName: username}) 
            }else{
                showNotification("请输入你的昵称")
            }
        },
        isUser: function(){
            return this.userList[this.activeTabs];
        },
        createTime: function() {
            var myDate = new Date();
            var hour = myDate.getHours();
            var min = myDate.getMinutes();
            var sec = myDate.getSeconds();
            if (min >= 1 && min <= 9) {
                min = "0" + min;
            }
            if (sec >= 0 && sec <= 9) {
                sec = "0" + sec;
            }
            var time = "[" + hour + ":" + min + ":" + sec + "]";
            return time;
        },
        openCustomer: function(customer) {
            // // 方法内 `this` 指向 vm
            this.setUser(customer)
            this.activeTabs = customer.name;
        },
        setUser: function(user){
            !this.userList[user.name] && this.$set(this.userList, user.name, {
                name: user.name,
                id: user.id,
                list: this.chahe[user.name]||[]
            })
        },
        joinUser: function(user){
            this.userNotJoin[user.name] && delete this.userNotJoin[user.name];
            socket.emit("join user", user);
            this.userActiveList = Object.assign({}, this.userNotJoin)
        },
        changeTabs: function(tab){
            this.redCircle[tab] = false;
            this.userActiveListBar = tab;
            this.userActiveList = Object.assign({}, this[tab])
        },
        checkedUser:function(user){
            if(this.userActiveListBar==="userNotJoin"){
                this.joinUser(user);
                return;
            }
            if(this.activeIM===user){
                this.activeTabs = "";
                this.activeIM = "";
            }else{
                user.circle = false;
                this.activeTabs = user.name;
                this.activeIM = user;
            }
        },
        sendMessage: function(){
            if(!this.activeTabs || !this.activeIM){
                this.message = "";
                this.activeIM = "";
                showNotification('此用户 已离线');
                this.userActiveList = Object.assign({}, this.userList)
                return;
            }

            var valueStr = this.filterText(this.message);
            if(!valueStr){
                return;
            }

            let _atabs = this.userActiveList[this.activeTabs];
            let _chache = this.chahe[this.activeTabs];
            let time = this.createTime();
            _atabs && _atabs.list.push({text: valueStr, time:time, type:"left",name: this.name });
            !_chache && (this.chahe[this.activeTabs]=[]);
            this.chahe[this.activeTabs].push({text: valueStr, time:time, type:"left",name: this.name });
            if(this.isUser()){
                socket.emit("message to user",{
                    name: this.activeTabs,
                    text: valueStr
                })
            }else{
                socket.emit("customer to customer",{
                    name: this.activeTabs,
                    text: valueStr
                })
            }
            this.message = "";
            this.scrollMessage();
        },
        filterText: function(text){
            text = text.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
            if (/<a href=/gi.test(text)) {
                return text;
            }
            text = text.replace(/((?:http:\/\/)(?:.[\w]+)+)/g, function() {
                if (/^http/.test(arguments[1])) {
                    return (
                        '<a href="' +
                        arguments[1] +
                        '" class="link" target="_block">' +
                        arguments[1] +
                        "</a>"
                    );
                }
            });
            return text;
        },
        getMessage: function(res){
            if(this.userActiveListBar !== 'userList'){
                this.redCircle.userList = true;
            }

            let _atabs = this.userList[res.name];

            let _chache = this.chahe[res.name];
            let valueStr = this.filterText(res.text);
            let time = this.createTime();
            _atabs &&  _atabs.list.push({text: valueStr, time: time, type:"right", name:res.name});
            !_chache && (this.chahe[res.name]=[]);
            this.chahe[res.name].push({text: valueStr, time: time, type:"right", name:res.name});
            
            if(this.activeIM.name !== res.name){
                _atabs.circle = true;
                _atabs.text = valueStr;
            }

            if(res.name === this.activeIM.name){
                this.activeIM = _atabs;
            }

            if(this.userActiveListBar === 'userList'){
                this.userActiveList = Object.assign({}, this.userList)
            }
            this.scrollMessage();
        },
        scrollMessage: function(){
            let scroll = document.querySelector(".scroll-list.ui-scroll");
            scroll && (scroll.scrollTop=scroll.scrollHeight);
        }
    },
    created(){
        socket.on("system.log", res=>{
            // MchatUI.sendTpl(res);
            console.log(res,'log')
        })

        socket.on("user reconnect", res => {
            // MchatUI.sendTpl(res);
            console.log(res)
            this.joinUser(res);
        })

        socket.on("loginSuccess", code=>{
            // MchatUI.sendTpl(res);
            console.log(code,'log')
            if(code===200){
                socket.emit("adduser", {userName: this.name, type:"customer"});
                this.isLogin = true;
            }else{
                alert("此昵称已被占用")
            }
        })

        socket.on("system.error", res=>{
            // MchatUI.sendTpl(res);
            console.log(res.text,'error')
        })
        
        socket.on("system.alet", res=>{
            // MchatUI.sendTpl(res);
            console.log(res.text,'alert')
            showNotification(res.text)
            this.userList[res.name] && delete this.userList[res.name];
            this.activeTabs === res.name && (this.activeTabs="");
        })
        
        socket.on("join user", res =>{
            this.userList[res.name]={
                name: res.name,
                id: res.id,
                list:[]
            };
            if(this.userActiveListBar === 'userList'){
                this.userActiveList = Object.assign({}, this.userList)
            }
            showNotification(res.name+" 加入聊天")
        })
        
        socket.on("user not join", res=>{
          	if(Object.keys(res).length){
               this.redCircle.userNotJoin = true; 
               showNotification ("有用户在等待。。。")
               this.userNotJoin = res;
            }else{
            	this.redCircle.userNotJoin = false; 
            }
        })
        
        socket.on("customer list", res=>{
            !this.socketid && (this.socketid = socket.id);
            this.customerList = res;
        })
        
        socket.on("customer unline", res=>{
            this.customerList[res] && delete this.customerList[res];
        })
        
        socket.on("user chche", res => {
            this.setUser(res);
            // for(let i in res.cache){
            //     let text = res.cache[i];
            //     console.log({
            //         name:res.name,
            //         text: text
            //     })

            // }
        });
        
        socket.on("message", res => {
            this.setUser(res);
            this.getMessage(res);
            if(res.name !== this.activeTabs){
                showNotification("有新的消息来自 "+res.name)
            }
        });
    }
})

function showNotification (message) {
    window.Notification.permission = "granted";
    if (window.Notification){
        if(window.Notification.permission == "denied"){
            layer && layer.msg(message);
        }else if (window.Notification.permission == "granted") {
            var notification = new Notification('通知消息', {
                body: message,
                icon: "http://"+getPath()+"/images/logo.png"
            });
            
            setTimeout(function(){
                notification.close();
            },5000);

        } else {
            window.Notification.requestPermission();
        }  
    }
}

function getPath() {
    //获取当前网址，如： http://localhost:8080/websocket/index.jsp
    var curWwwPath = window.document.location.href;
    //获取主机地址之后的目录，如： websocket/index.jsp
    var pathName = window.document.location.pathname;
    //获取主机地址，如：  localhost:8080
    var hostport=document.location.host;
    //获取带"/"的项目名，如：/websocket
    var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
    return (hostport + projectName);
}