// const socket = io('ws://127.0.0.1:8888');
// onsole.log(socket);
// socket.on("an event", (res) => {
//     console.log(res)
// })
// socket.on("a new user has joined the room", (res) => {
//     console.log(res)
//     socket.emit("news", "你们好")
// })
// socket.on("ferret", res => console.log);

(function (doc, win) {
    var docEl = doc.documentElement,
        RootFontSize = null,
        resizeEvt = 'orientationchange' in win ? 'orientationchange' : 'resize';

    function recalc() {
        var clientWidth = docEl.clientWidth;
        if (clientWidth === undefined) return;
        RootFontSize = 25 * (clientWidth / 375) + 'px';// 默认比例15份 每一份得到25px
        docEl.style.fontSize = RootFontSize;
    };
    recalc();
    win.addEventListener(resizeEvt, recalc, false);
})(document, window);
