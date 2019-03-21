const db = require("./db").db;

function find(name, callback){
    db.find("messages",{name})
    .then((res)=>{
        callback && callback(res)
    }).catch(e=>{console.log(e)})
}


function insertOne(obj){
    db.insertOne("messages",obj)
    .then((res)=>{
      console.log("插入成功")
    }).catch(e=>{console.log(e)})
}

module.exports = {
    find,
    insertOne
}