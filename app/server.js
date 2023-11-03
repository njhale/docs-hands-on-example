const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Initialize app
const app = express();

app.use(express.static('public'));

const logToFile = (message) => {
    fs.appendFile('logs/api_logs.txt', message + '\n', (err) => {
        if (err) console.error('Failed to write to the log file:', err);
    });
};

// Ensure the logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const logRequestResponse = (req, res, next) => {
    const oldWrite = res.write;
    const oldEnd = res.end;

    const chunks = [];

    res.write = (...restArgs) => {
        chunks.push(Buffer.from(restArgs[0]));
        oldWrite.apply(res, restArgs);
    };

    res.end = (...restArgs) => {
        if (restArgs[0]) {
            chunks.push(Buffer.from(restArgs[0]));
        }
        const body = Buffer.concat(chunks).toString('utf8');

        const logFilename = path.join(logsDir, `${new Date().toISOString()}.log`);
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            response: body
        };

        console.log(logData);
        fs.writeFileSync(logFilename, JSON.stringify(logData, null, 2));

        oldEnd.apply(res, restArgs);
    };

    next();
};


// Middleware to log each API request
const logAPIRequest = (req, res, next) => {
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`;

    console.log(logMessage);
    logToFile(logMessage);

    next();
};

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

// Middlewares
app.use(bodyParser.json());
app.use(logRequestResponse);
//app.use(logAPIRequest);  // Logging middleware

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes
app.get('/students', async (req, res) => {
    try {
        const [students] = await db.query("SELECT * FROM students");
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/students', async (req, res) => {
    try {
        const { name, age } = req.body;
        const [result] = await db.query("INSERT INTO students (name, age) VALUES (?, ?)", [name, age]);
        res.json({ id: result.insertId, name, age });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/students/:id', async (req, res) => {
    try {
        const [students] = await db.query("SELECT * FROM students WHERE id=?", [req.params.id]);
        if (students.length) {
            res.json(students[0]);
        } else {
            res.status(404).json({ error: "Student not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/students/:id', async (req, res) => {
    try {
        const { name, age } = req.body;
        await db.query("UPDATE students SET name=?, age=? WHERE id=?", [name, age, req.params.id]);
        res.json({ id: req.params.id, name, age });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/students/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM students WHERE id=?", [req.params.id]);
        res.json({ message: "Student deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Server setup
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
