const bcrypt = require('bcrypt');

const password = 'admin123';  // Change this to your password
//Hashed Password: $2b$10$gvRoWyPvbhwcoSLaIbIc0e7j/moJnSJ.dHpL63tn2N65p.yAlvKX2

bcrypt.hash(password, 10).then(hash => {
    console.log('Original Password:', password);
    console.log('Hashed Password:', hash);
}).catch(err => {
    console.error('Error:', err);
});