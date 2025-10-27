const db = require('../db');

// Função de inicialização para verificar e criar a tabela se necessário
async function init() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            apikey TEXT NOT NULL,
            lastconection DATETIME NOT NULL,
            active INTEGER NOT NULL DEFAULT 1
            )
        `;

        db.run(createTableQuery, (error) => {
            if (error) {
                reject(error);
                return;
            }

            const checkUserQuery = `SELECT COUNT(*) AS count FROM users WHERE nome = 'PM2' AND active = 1`;
            db.get(checkUserQuery, (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (row.count === 0) {
                    const apikeyPM2 = [...Array(30)]
                        .map((e) => ((Math.random() * 36) | 0).toString(36))
                        .join("");
                    const insertInitialDataQueryPM2 = `
                        INSERT INTO users (nome, apikey, lastconection, active)
                        VALUES ('PM2', '${apikeyPM2}', datetime('now'), 1)
                    `;

                    const apikeyProtheus = [...Array(30)]
                        .map((e) => ((Math.random() * 36) | 0).toString(36))
                        .join("");
                    const insertInitialDataQueryProtheus = `
                        INSERT INTO users (nome, apikey, lastconection, active)
                        VALUES ('Protheus', '${apikeyProtheus}', datetime('now'), 1)
                    `;

                    db.run(insertInitialDataQueryPM2, (error) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        db.run(insertInitialDataQueryProtheus, (error) => {
                            if (error) {
                                reject(error);
                                return;
                            }
                            resolve();
                        });
                    });
                } else {
                    resolve();
                }
            });
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

    buscarApikey: async (chave) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE apikey = ?', [chave], (error, result) => {
                if (error) { reject(error); return; }
                resolve(result || false);
            });
        });
    },

    setLasConection: async (apikey) => {
        await ensureInitialized();
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            db.run('UPDATE users SET lastconection = ? WHERE apikey = ?', [now, apikey], function (error) {
                if (error) { reject(error); return; }
                resolve(this.changes); // Retorna o número de linhas afetadas
            });
        });
    },

    authenticateKey: async (req, res, next) => {
        await ensureInitialized();
        let api_key = req.header("x-api-key"); //Add API key to headers
        let account = await module.exports.buscarApikey(api_key);
        // find() returns an object or undefined
        if (account) {
            await module.exports.setLasConection(api_key);
            next();
        } else {
            //Reject request if API key doesn't match
            res.status(403).send({ error: { code: 403, message: "Você não tem permissão." } });
        }
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
