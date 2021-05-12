const crypto = require("crypto");
const level = require("level");
const db = level("./v2_marlinspike-secrets.db",{valueEncoding:'json'});

function fetchSecret(username1,username2){
	//username1 is our username 
	//username2 is our contact's username
	const test_secret = crypto.randomBytes(16).toString("hex");
	return test_secret
}

const contactname = "moxie";

db.get(`secret-${contactname}`,(err,value)=>{
	if(err){
		const secret = fetchSecret()
		db.put(`secret-${contactname}`,secret,err=>{
			if(err){
				console.error(err);
			}else{
				console.log(secret);
			}
		})
	}else{
		console.log(value)
	}
});
