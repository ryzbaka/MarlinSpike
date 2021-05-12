const level = require("level");
const db = level("./v1.db",{valueEncoding:"json"});

db.get("count",(err,value)=>{
	let n = (value||0) + 1;
	db.put('count',n,err=>{
		if(err){
			console.error(err);
		}else{
			console.log(`count: ${n}`);
		}
	});
});
