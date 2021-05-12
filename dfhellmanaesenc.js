const crypto = require("crypto");

const hamza = crypto.createDiffieHellman(256);
const nikhil = crypto.createDiffieHellman(hamza.getPrime(), hamza.getGenerator());

hamza.generateKeys();
nikhil.generateKeys();

const shared_secret_1 = hamza.computeSecret(nikhil.getPublicKey());
const shared_secret_2 = nikhil.computeSecret(hamza.getPublicKey());

if(shared_secret_1.toString("hex")==shared_secret_2.toString("hex")){
	console.log("yay");
}else{
	console.log("nay");
}


const algorithm = "aes-256-cbc"
const IV = crypto.randomBytes(16);

const encrypt = ((val) => {
  let cipher = crypto.createCipheriv(algorithm, shared_secret_1, IV);
  let encrypted = cipher.update(val, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
});

const decrypt = ((encrypted) => {
  let decipher = crypto.createDecipheriv(algorithm, shared_secret_2, IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  return (decrypted + decipher.final('utf8'));
});

const encrypted_text = encrypt("lmao");
const decrypted_text = decrypt(encrypted_text);

console.log(`Encrypted ${encrypted_text}`);
console.log(`Decrypted ${decrypted_text}`);


const hacker = crypto.createDiffieHellman(hamza.getPrime(), hamza.getGenerator());
hacker.generateKeys();
const hacker_secret = hacker.computeSecret(hamza.getPublicKey());

const hdecrypt = (value)=>{
	let decipher = crypto.createDecipheriv(algorithm, hacker_secret, IV);
	let decrypted = decipher.update(value, 'base64', 'utf8');
	return (decrypted+decipher.final('utf8'))
}

console.log(hamza.getPrivateKey());
console.log(nikhil.getPrivateKey());
console.log(hacker.getPrivateKey());
console.log("***");
console.log(hamza.getPublicKey());
console.log(nikhil.getPublicKey());
console.log(hacker.getPublicKey());
console.log("***");
console.log(shared_secret_1);
console.log(shared_secret_2);
console.log(hacker_secret);
const hdecrypted = hdecrypt(encrypted_text);
console.log(hdecrypted)
