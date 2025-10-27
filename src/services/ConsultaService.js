const db = require('../db');

// Função de inicialização para verificar e criar a tabela se necessário
async function init() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS consultas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT NOT NULL,
                consulta TEXT NOT NULL,
                tratamento TEXT NOT NULL,
                baseDeDados VARCHAR(255) NOT NULL,
                parametros VARCHAR(255) NOT NULL
            )
        `;

        db.run(createTableQuery, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}

// Chama a função de inicialização antes de qualquer operação de banco de dados
async function ensureInitialized() {
    try {
        await init();
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
    }
}

module.exports = {
    buscarTodos: async () => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM consultas', (error, results) => {
                if (error) { reject(error); return; }
                results.forEach(row => {
                    row.baseDeDados = JSON.parse(row.baseDeDados); // Converte JSON string para objeto
                });
                resolve(results);
            });
        });
    },

    buscarUm: async (id) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM consultas WHERE chave = ?', [id], (error, result) => {
                if (error) { reject(error); return; }
                result.parametros = result.parametros || [];
                resolve(result || false);
            });
        });
    },

    buscarChave: async (chave) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM consultas WHERE chave = ?', [chave], (error, result) => {
                if (error) { reject(error); return; }
                resolve(result || false);
            });
        });
    },

    inserir: async (chave, consultas, tratamento, baseDeDados, parametros) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            const baseDeDadosJson = JSON.stringify(baseDeDados);
            const parametro = JSON.stringify(parametros);
            db.run('INSERT INTO consultas (chave, consulta, tratamento, baseDeDados, parametros) VALUES (?, ?, ?, ?, ?)',
                [chave, consultas, tratamento, baseDeDadosJson, parametro],
                function (error) {
                    if (error) { reject(error); return; }
                    resolve(this.lastID); // Retorna o ID do último registro inserido
                }
            );
        });
    },

    alterar: async (chave, consultas,tratamento, baseDeDados, parametros) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            const baseDeDadosJson = JSON.stringify(baseDeDados);
            const parametro = JSON.stringify(parametros);
            db.run('UPDATE consultas SET consulta = ?, tratamento = ?, baseDeDados = ?, parametros = ? WHERE chave = ?',
                [consultas, tratamento, baseDeDadosJson, parametro, chave],
                function (error) {
                    if (error) { reject(error); return; }
                    resolve(this.changes); // Retorna o número de linhas afetadas
                }
            );
        });
    },

    excluir: async (id) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM consultas WHERE chave = ?', [id], function (error) {
                if (error) { reject(error); return; }
                resolve(this.changes); // Retorna o número de linhas afetadas
            });
        });
    }
};
