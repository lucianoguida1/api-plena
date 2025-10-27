const sql = require('mssql');
const ConsultaService = require('../services/ConsultaService');
const vm = require('vm');
const { count } = require('console');

const config = {
    //user: 'PLENA_SQL_MONITORIND',
    //password: 'B#BeF$@g6kGJTjdL%wi6',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 1433,
    requestTimeout: 300000, // Aumenta o tempo limite da requisição
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const databaseMapping = {
    'SQLTO': 'SATKPARAISO',
    'SQLPO': 'SATKPORANGATU',
    'SQLCO': 'SATKCONTAGEM',
    'SQLPM': 'SATKPARAMINAS'
};

const serverMapping = {
    'SQLTO': 'SQLTO.unifrigo.mg',
    'SQLPO': 'SQLPO.unifrigo.mg',
    'SQLCO': 'SQLCO.unifrigo.mg',
    'SQLPM': 'SQLPM.unifrigo.mg'
};

const descricaoBase = {
    'SQLTO': 'Paraíso do Tocantins',
    'SQLPO': 'Porangatu',
    'SQLCO': 'Contagem',
    'SQLPM': 'Para de Minas'
};

async function executeQueryOnServer(server, database, consultaSQL) {
    const dynamicConfig = {
        ...config,
        server: server,
        database: database,
        options: {
            enableArithAbort: true,
            encrypt: false,
        }
    };

    try {
        await sql.connect(dynamicConfig);
        const result = await sql.query(consultaSQL);
        return result;
    } finally {
        await sql.close();
    }
}

function substituteParams(query, params, queryParams) {
    params.forEach(param => {
        const { variavel, valor } = param;
        const queryValue = queryParams[variavel];
        query = query.replace(new RegExp(variavel, 'g'), queryValue || valor);
    });
    return query;
}

let isProcessing = false;

module.exports = {
    dados: async (req, res) => {
        if (isProcessing) {
            res.status(429).json({ error: 'Aguarde a conclusão da requisição anterior.' });
            isProcessing = false;
            return;
        }

        isProcessing = true;
        let json = { error: '', result: [] };

        try {
            let chave = req.params.chave;
            let consulta = await ConsultaService.buscarChave(chave);

            if (consulta) {
                const results = Array();

                // Parse the JSON string to an array
                const baseDeDadosList = JSON.parse(consulta.baseDeDados);

                // Parse the parameters JSON string to an array
                const parametrosList = JSON.parse(consulta.parametros);

                // Extract query parameters from the URL
                const queryParams = req.query;

                // Substitute parameters in the consulta
                const consultaSQL = substituteParams(consulta.consulta, parametrosList, queryParams);

                for (const baseDeDados of baseDeDadosList) {
                    const server = serverMapping[baseDeDados];
                    const database = databaseMapping[baseDeDados];
                    if (!server || !database) {
                        res.status(404).json({
                            statusCode: 404,
                            status: "error",
                            error: `Configuração não encontrada para a base de dados ${baseDeDados}!`
                        });
                        return;
                    }

                    try {
                        const result = await executeQueryOnServer(server, database, consultaSQL);

                        var dados = result.recordset;
                        for (const dado of dados) {
                            dado.base = descricaoBase[baseDeDados];
                            results.push(dado);
                        }
                    } catch (error) {
                        res.status(500).json({
                            statusCode: 500,
                            status: "error",
                            error: `Erro ao executar consulta na base de dados ${baseDeDados}: ${error.message}`
                        });
                    }
                }

                if (results.length === 0) {
                    isProcessing = false;
                    res.status(404).json({
                        statusCode: 404,
                        status: "error",
                        error: `nenhum dado retornado pela consulta!`
                    });
                    return;
                }

                const sandbox = {
                    data: results,
                    console: console,
                    result: null
                };

                const script = new vm.Script(consulta.tratamento);
                const context = new vm.createContext(sandbox);

                try {
                    script.runInContext(context);
                    json.result = sandbox.result;
                    isProcessing = false;

                    res.status(200).json({
                        statusCode: 200,
                        status: "success",
                        count: results.length,
                        result: json.result
                    });
                } catch (e) {
                    isProcessing = false;
                    res.status(500).json({
                        statusCode: 500,
                        status: "error",
                        error: `Erro ao executar código de tratamento: ${e.message}`
                    });
                }

            } else {
                isProcessing = false;
                res.status(404).json({
                    statusCode: 404,
                    status: "error",
                    error: `Chave da consulta não encontrada!`
                });
            }

        } catch (error) {
            isProcessing = false;

            res.status(500).json({
                statusCode: 500,
                status: "error",
                error: `Erro ao executar consulta: ${error.message}`
            });
        }
    },

    criaromaneio: async (req, res) => {
        const body = req.body;

        if (!body.chave_fato_pedido || body.chave_fato_pedido === '') {
            res.status(400).json({
                status: "error",
                errorCode: 400,
                message: 'Chave fato pedido não informada'
            });
            return;
        }
        /* foi removido a validação de volumes, pois o romaneio pode ser gerado sem volumes
        if (!body.volumes || body.volumes.length === 0) {
            res.status(400).json({
                status: "error",
                errorCode: 400,
                message: 'Volumes não informados'
            });
            return;
        }
        */
        if (!body.volumes) {
            body.volumes = [];
        }


        try {
            const server = process.env.TOTAL_SERVER || 'SPL-SQLTI\\SQLATAK';
            const database = process.env.TOTAL_DATABASE || 'SATKCONTAGEM_HML';

            const volumesString = body.volumes.join(',');
            const consultaSQL = `exec up_Gera_RomaneioVenda_TXT 'GERAR_ROMANEIO','${body.chave_fato_pedido}', '${volumesString}'`;
            const result = await executeQueryOnServer(server, database, consultaSQL);

            if (result.recordset[0].Status === 'Error') {
                res.status(400).json({
                    status: "error",
                    errorCode: 400,
                    message: 'Erro ao gerar romaneio de venda',
                    error: {
                        "Tipo": result.recordset[0].Tipo,
                        "Chave_fato_pedido": result.recordset[0].Chave_fato_pedido,
                        "Chave_fato_romaneio": result.recordset[0].Chave_fato_romaneio,
                        erros: result.recordset.map(r => ({ Retorno: r.Retorno, Codigo_volume: r.Codigo_volume }))
                    }
                });
                return;
            }

            if (!result.recordset[0].Status) {
                res.status(400).json({
                    status: "error",
                    errorCode: 400,
                    message: 'Erro ao gerar romaneio de venda',
                    error: {}
                });
                return;
            }

            res.status(201).json({
                status: "success",
                statusCode: 201,
                data: {
                    chave_fato_romaneio: result.recordset[0].Chave_fato_romaneio,
                    chave_fato_pedido: body.chave_fato_pedido,
                    num_volumes: body.volumes.length,
                    retorno: result.recordset[0].Retorno,
                    data: { volumes: result.recordset.map(r => r.Codigo_volume) }
                }
            });

            return;
        } catch (error) {
            res.status(500).json({
                status: "error",
                errorCode: 500,
                message: 'Erro ao gerar romaneio de venda',
                error: error.message,
                errorDetails: error
            });
        }
    },

    geratxtvenda: async (req, res) => {
        const body = req.body;
        if (!body.chave_fato_pedido || body.chave_fato_pedido === '') {
            res.status(400).json({
                status: "error",
                errorCode: 400,
                message: 'Chave fato pedido não informada'
            });
            return;
        }
        if (!body.volumes || body.volumes.length === 0) {
            res.status(400).json({
                status: "error",
                errorCode: 400,
                message: 'Volumes não informados'
            });
            return;
        }

        try {
            const server = process.env.TOTAL_SERVER || 'SPL-SQLTI\\SQLATAK';
            const database = process.env.TOTAL_DATABASE || 'SATKCONTAGEM_HML';


            body.volumes = body.volumes.map(String);
            const volumesString = body.volumes.join(',');
            const consultaSQL = `exec up_Gera_RomaneioVenda_TXT 'GERAR_TXT','${body.chave_fato_pedido}', '${volumesString}'`;
            const result = await executeQueryOnServer(server, database, consultaSQL);


            if (result.recordset[0].Status === 'Error') {
                res.status(400).json({
                    status: "error",
                    errorCode: 400,
                    message: 'Erro ao gerar o TXT de romaneio',
                    error: {
                        "Tipo": result.recordset[0].Tipo,
                        "Chave_fato_pedido": result.recordset[0].Chave_fato_pedido,
                        "Chave_fato_romaneio": result.recordset[0].Chave_fato_romaneio,
                        erros: result.recordset.map(r => ({ Retorno: r.Retorno, Codigo_volume: r.Codigo_volume }))
                    }
                });
                return;
            }
            const txt = result.recordset.map(r => r.Retorno).join('\r\n');

            res.status(200).json({
                status: "success",
                statusCode: 200,
                data: {
                    volumes_processados: result.recordset.length,
                    chave_fato_romaneio: result.recordset[0].Chave_fato_romaneio,
                    txt: txt,
                    //data: result.recordset
                }
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                errorCode: 500,
                message: 'Erro ao gerar o TXT de romaneio',
                error: error.message
            });
        }
    },

    deletaromaneio: async (req, res) => {
        const body = req.body;
        if (!body.chave_fato_pedido || body.chave_fato_pedido === '') {
            res.status(400).json({
                status: "error",
                errorCode: 400,
                message: 'Chave fato pedido não informada'
            });
            return;
        }

        try {
            const server = process.env.TOTAL_SERVER || 'SPL-SQLTI\\SQLATAK';
            const database = process.env.TOTAL_DATABASE || 'SATKCONTAGEM_HML';

            const consultaSQL = `exec up_Deleta_RomaneioVenda_TXT '${body.chave_fato_pedido}'`;
            const result = await executeQueryOnServer(server, database, consultaSQL);

            res.status(200).json({
                status: "success",
                statusCode: 200,
                data: {
                    data: result.recordset
                }
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                errorCode: 500,
                message: 'Erro ao gerar o TXT de romaneio',
                error: error.message
            });
        }
    },
}
