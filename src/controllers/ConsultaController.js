const ConsultaService = require('../services/ConsultaService');

module.exports = {
    buscarTodas: async (req, res) => {
        let json = {error:'', result:[]};

        let consulta = await ConsultaService.buscarTodos();

        for (let i in consulta) {
            json.result.push({
                chave: consulta[i].chave,
                consulta: consulta[i].consulta,
                tratamento: consulta[i].tratamento,
                baseDeDados: consulta[i].baseDeDados,  
                parametros: consulta[i].parametros
            });
        }

        res.json(json);
    },

    buscarUma: async (req, res) => {
        let json = {error:'', result:{}};

        let chave = req.params.codigo;
        let consulta = await ConsultaService.buscarUm(chave);
        
        if (consulta) {
            json.result = consulta;
        } else {
            json.error = 'Consulta não encontrada!';
        }

        res.json(json);
    },

    inserir: async (req, res) => {
        let json = {error:'', result:{}};

        let chave = req.body.chave;
        let consulta = req.body.consulta;
        let tratamento = req.body.tratamento;
        let baseDeDados = req.body.baseDeDados;  // Adicionado campo baseDeDados
        let parametros = req.body.parametros;

        let verifica = await ConsultaService.buscarChave(chave);

        if (!verifica) {
            if (chave && consulta && tratamento && baseDeDados && parametros) {  // Verificação do campo baseDeDados
                let CarroCodigo = await ConsultaService.inserir(chave, consulta, tratamento, baseDeDados, parametros);  // Adicionado campo baseDeDados
                json.result = {
                    codigo: CarroCodigo,
                    chave,
                    consulta,
                    tratamento,
                    baseDeDados,
                    parametros
                };
            } else {
                json.error = 'Campos não enviados';
            }
        } else {
            json.error = "Chave já existente no banco! chave: " + chave;
        }
        res.json(json);
    },

    alterar: async (req, res) => {
        let json = {error:'', result:{}};

        let id = req.params.id;
        let chave = req.body.chave;
        let consulta = req.body.consulta;
        let tratamento = req.body.tratamento;
        let baseDeDados = req.body.baseDeDados;  // Adicionado campo baseDeDados
        let parametros = req.body.parametros;


        if (chave && consulta && tratamento && baseDeDados && parametros) {  // Verificação do campo baseDeDados
            await ConsultaService.alterar(chave, consulta, tratamento, baseDeDados, parametros);  // Adicionado campo baseDeDados
            json.result = {
                chave,
                consulta,
                tratamento,
                baseDeDados,
                parametros
            };
        } else {
            json.error = 'Campos não enviados';
        }
        res.json(json);
    },

    excluir: async (req, res) => {
        let json = {error:'', result:{}};

        await ConsultaService.excluir(req.params.codigo);

        res.json(json);
    }
}
