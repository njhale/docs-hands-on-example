const mysql = require('mysql2');

// Database connection setup
const createConnection = () => {
    return mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    }).promise();
}

const db = createConnection();

const CURRENT_VERSION = 1;

// Wrap your initialization logic inside an async function
const initializeDatabase = async () => {
    try {

        await db.query(`
        CREATE TABLE IF NOT EXISTS db_version (
            version INT
        )
    `);

        // Check the current version in the database
        const [rows] = await db.query("SELECT version FROM db_version");
        const dbVersion = rows && rows[0] && rows[0].version ? rows[0].version : 0;

        if (dbVersion >= CURRENT_VERSION) {
            console.log("Database is already up-to-date.");
        } else {
            if (dbVersion === 0) {
                console.log("Initializing database...");
                // Create the table
                await db.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE,
                age INT
            )
        `);

                // Insert sample students
                const sampleStudents = [
                    { name: 'Alice', age: 20 },
                    { name: 'Bob', age: 22 },
                    { name: 'Charlie', age: 21 }
                ];

                for (let student of sampleStudents) {
                    // Here we use 'await' to pause execution until the query completes
                    await db.query("INSERT IGNORE INTO students (name, age) VALUES (?, ?)", [student.name, student.age]);
                }
            }

            // Update the database version
            if (dbVersion === 0) {
                await db.query("INSERT INTO db_version (version) VALUES (?)", [CURRENT_VERSION]);
            } else {
                await db.query("UPDATE db_version SET version = ?", [CURRENT_VERSION]);
            }


            console.log("Database initialized and sample data inserted.");
        }
    } catch (err) {
        console.error("Error initializing database:", err.message);
    } finally {
        // Regardless of whether or not the initialization was successful, close the database connection
        console.log("Closing the database connection.");
        db.end().then(() => {
            console.log("Database connection closed.");
            // Exiting the process
            process.exit();
        }).catch(err => {
            console.error("Error while closing the database connection:", err.message);
            // Exit with an error code in case there was an error closing the connection
            process.exit(1);
        });
    }
};

// Call the function to initialize the database
initializeDatabase();
