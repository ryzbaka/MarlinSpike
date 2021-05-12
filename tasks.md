# Encryption Implementation Tasks:
	* The encryption algorithms being used are Diffie-Hellman for shared secret key which is then used for AES-256 encryption of messages
	*  Add key pair generation and storage to /addContact					[]
		* Public keys and IV stored in MongoDB in User object contacts field.			[]
		* Private Keys stored in a separate Keys document temporaily.			[]
	*  Implement frontend storage for private keys.
	*  Users can only talk to their contacts from the browser from which they added them.	[]
	*  Encryption and decryption will take place entirely on user front-end. 		[]
		
