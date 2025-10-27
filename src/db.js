const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql');

// Configurações do MySQL
const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'mydatabase'
};

// Caminho para o arquivo do banco de dados SQLite
const dbPath = process.env.DB_PATH || './mydb.sqlite';

let db;

// Tenta conectar ao banco de dados SQLite
try {
    db = new sqlite3.Database(dbPath, (error) => {
        if (error) {
            console.error('Erro ao conectar ao banco de dados SQLite:', error.message);
            throw error;
        } else {
            console.log('Conectado ao banco de dados SQLite.');
        }
    });
} catch (sqliteError) {
    console.log('Falha ao conectar ao SQLite, tentando conectar ao MySQL...');

    // Conectar ao banco de dados MySQL
    db = mysql.createConnection(mysqlConfig);

    db.connect((mysqlError) => {
        if (mysqlError) {
            console.error('Erro ao conectar ao banco de dados MySQL:', mysqlError.message);
            throw mysqlError;
        } else {
            console.log('Conectado ao banco de dados MySQL.');
        }
    });
}

module.exports = db;