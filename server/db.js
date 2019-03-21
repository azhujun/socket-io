var MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017';

class DataBase {
	constructor() {
		this.dbname = 'im';
		this.connect();
	}

	connect() {
		MongoClient.connect(url,  (err, client) => {
			// Create a collection we want to drop later
			this.db = client.db(this.dbname);
			console.log("db连接成功")
		});
	}

	find(tablename, where){
		return new Promise((resolve, reject)=>{
			this.db.collection(tablename)
			.find(where)
			.toArray((err, res)=>{
				if (err) throw err;
				resolve(res);
			})
		})
	}

	insertOne(tablename, obj){
		return new Promise((resolve, reject)=>{
			this.db.collection(tablename)
			.insertOne(obj, (err, res)=>{
				if (err) throw err;
				resolve(res);
			})
		})
	}
}

let db = new DataBase();
module.exports = {
	db
}
