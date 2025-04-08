const mongoose = require('mongoose');
const createAdminIfNotExists = require('./adminSetup');
const dbConnection = () => {
    // connect to database
    mongoose.connect(process.env.DB_URI)
        .then(async (conn) => {
            console.log(`Database Connected : ${conn.connection.host}`);
            await createAdminIfNotExists();
        })
        .catch((err) => {
            console.error(`Error connecting to database : ${err.message}`);
            process.exit(1);
        });
};
module.exports = dbConnection; 