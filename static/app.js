const socket = io('ws://127.0.0.1:3839');
let userName = "";
let customerName = "";
socket.on("system.log", res => {
    MchatUI.sendTpl(res);
});
socket.on("system.kefu", res => {
    customerName = res.name;
});

socket.on("system.error", res => {
    MchatUI.sendTpl(res);
});

socket.on("message", res => {
    MchatUI.getMessage(res.text, res.name);
});

function getName() {
    var givenNames = [
        "子璇", "淼", "国栋", "夫子", "瑞堂", "甜", "敏", "尚", "国贤", "贺祥", "晨涛",
        "昊轩", "易轩", "益辰", "益帆", "益冉", "瑾春", "瑾昆", "春齐", "杨", "文昊",
        "东东", "雄霖", "浩晨", "熙涵", "溶溶", "冰枫", "欣欣", "宜豪", "欣慧", "建政",
        "美欣", "淑慧", "文轩", "文杰", "欣源", "忠林", "榕润", "欣汝", "慧嘉", "新建",
        "建林", "亦菲", "林", "冰洁", "佳欣", "涵涵", "禹辰", "淳美", "泽惠", "伟洋",
        "涵越", "润丽", "翔", "淑华", "晶莹", "凌晶", "苒溪", "雨涵", "嘉怡", "佳毅",
        "子辰", "佳琪", "紫轩", "瑞辰", "昕蕊", "萌", "明远", "欣宜", "泽远", "欣怡",
        "佳怡", "佳惠", "晨茜", "晨璐", "运昊", "汝鑫", "淑君", "晶滢", "润莎", "榕汕",
        "佳钰", "佳玉", "晓庆", "一鸣", "语晨", "添池", "添昊", "雨泽", "雅晗", "雅涵",
        "清妍", "诗悦", "嘉乐", "晨涵", "天赫", "玥傲", "佳昊", "天昊", "萌萌", "若萌"
    ];
    var j = parseInt(givenNames.length * Math.random());
    return givenNames[j];
}

let MchatUI = (function () {
    let tpl = {
        charitem: function (char) {
            if (char.type == "left") {
                var className = "char-item message-left";
            } else {
                var className = "char-item message-right";
            }

            var message = char.message;

            function matchUrl(str) {
                if (/<a href=/gi.test(str)) {
                    return str;
                }
                
                res = str.replace(/((?:http:\/\/)(?:.[\w]+)+)/g, function () {
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
                return res;
            }

            var str = '<li class="' + className + '">';
            str += '<div class="icon-img"><img src="' + char.img + '"></div>';
            str +=
                '<div class="message"><p class="text">' +
                matchUrl(message) +
                "</p>";
            str += '<p class="timer">' + char.user + "</p>";
            return str;
        },
        chatip: function (message) {
            var str =
                '<li class="char-tip"><span class="message">' +
                message +
                "</span></li>";
            return str;
        }
    };

    function $id(s) {
        return document.getElementById(s);
    }

    //创建时间
    function createTime() {
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
    }
    
    var submint = $id("sublime");
    // var chatPage = $id("chat-page");
    var chatbodylist = $id("chatbodylist");
    // var chatInput = $id("chatInput");
    var scrollBody = document.querySelector(".chat-body");

    var userMsi = {
        name: "我",
        img: "./images/user.png"
    };

    cheatInput.addEventListener("input", function () {
        if (this.value != "") {
            submint.className = "sublime";
        } else {
            submint.className = "sublime disable";
        }
    });

    sublime.addEventListener("click", function () {
        var valueStr = cheatInput.value
            .replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        if (valueStr) {
            // 发送
            if(!socket.connected){
                socket.connect();
                socket.emit("user reconnect", {name: userName, customerName: customerName})
                return;
            }

            chat.sendMessage(valueStr);
            // submit the form to the servlet
            
            if(userName){
                socket.emit("message to customer", valueStr);
            }else{
                socket.emit("adduser", {userName: valueStr, type:"user"});
                userName = valueStr;
            }

            cheatInput.value = "";
            submint.className = "sublime disable";
        } else {
            alert("发送内容不能为空");
        }
    });

    window.addEventListener(
        "resize",
        function () {
            chat.scrollYakToEnd(scrollBody);
        },
        false
    );

    var chat = {
        cache: [],
        sendMessage: function (message) {
            var mo = {};
            mo.message = message;
            mo.type = "right";
            mo.img = userMsi.img;
            mo.user = userMsi.name + createTime();
            var html = tpl.charitem(mo);
            chatbodylist.innerHTML += html;
            chat.scrollYakToEnd(scrollBody);
        },
        getMessage: function (message, kefuName) {
            var mo = {};
            mo.message = message;
            mo.type = "left";
            mo.img = "./images/kefu.png";
            mo.user = kefuName + createTime();
            if (!kefuName) {
                chat.sendTpl(message);
            } else {
                var html = tpl.charitem(mo);
                chatbodylist.innerHTML += html;
                chat.scrollYakToEnd(scrollBody);
            }
        },
        sendTpl: function (message) {
            var html = tpl.chatip(message);
            chatbodylist.innerHTML += html;
            chat.scrollYakToEnd(scrollBody);
        },
        scrollYakToEnd: function (yakDiv) {
            yakDiv.scrollTop = yakDiv.scrollHeight;
        },
        cacheMessage: function (userMsi) {
            chat.cache.push(userMsi);
            chat.timer && clearTimeout(chat.timer);
            chat.timer = setTimeout(function () {
                var cacheObj = {
                    time: Math.floor(new Date() / 1000),
                    list: chat.cache
                };
                var str = JSON.stringify(cacheObj);
                try {
                    window.localStorage.setItem("yjg_m_chat", str);
                } catch (e) {
                    console.log("不支持localStorage");
                }
                clearTimeout(chat.timer);
            }, 1000);
        },
        init: function () {
            var cache = window.localStorage.getItem("yjg_m_chat");
            if (cache) {
                cache = JSON.parse(cache);
                chat.cache = cache.list;
                var html = "";
                var timer = Math.floor(new Date() / 1000) + 86400;
                if (cache.time < timer) {
                    for (var i in cache.list) {
                        html += tpl.charitem(cache.list[i]);
                    }
                    chatbodylist.innerHTML = html;
                    chatbodylist.innerHTML += tpl.chatip("以上是历史消息");
                    chat.scrollYakToEnd(scrollBody);
                } else {
                    window.localStorage.removeItem("yjg_m_chat");
                }
            }
            
            if(cname != ""){
                userName = cname;
            }else{
                userName = '访客-'+getName()+ '-s'+Math.floor(Math.random()*999)
            }

            socket.emit("adduser", {userName: userName, type:"user"});
        }
    };
    chat.init();
    return chat;
})();