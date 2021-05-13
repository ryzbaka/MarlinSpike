const crypto = require('crypto');

const user1 = crypto.createDiffieHellman(256);
const user2 = crypto.createDiffieHellman(user1.getPrime(),user1.getGenerator());

user1.generateKeys();
user2.generateKeys();

const user3 = crypto.createDiffieHellman(user1.getPrime(),user1.getGenerator())//user1 clone;
const user4 = crypto.createDiffieHellman(user1.getPrime(),user1.getGenerator())//user2 clone;

user3.setPublicKey(user1.getPublicKey());
user3.setPrivateKey(user1.getPrivateKey());

user4.setPublicKey(user2.getPublicKey());
user4.setPrivateKey(user2.getPrivateKey());


console.log(user1.computeSecret(user2.getPublicKey()));
console.log(user2.computeSecret(user1.getPublicKey()));
console.log(user3.computeSecret(user2.getPublicKey()));
console.log(user4.computeSecret(user1.getPublicKey()));
