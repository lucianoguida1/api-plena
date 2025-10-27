const express = require('express');
const router = express.Router();

const ConsultaController = require('./controllers/ConsultaController');
const DataController = require('./controllers/DataController');

/**
 * @swagger
 * tags:
 *   name: Consulta
 *   description: API para gerenciar consultas
 */


router.get('/consulta', ConsultaController.buscarTodas);
router.get('/consulta/:codigo', ConsultaController.buscarUma);
router.post('/consulta', ConsultaController.inserir);
router.put('/consulta/:codigo', ConsultaController.alterar);
router.delete('/consulta/:codigo', ConsultaController.excluir);
router.get('/:chave', DataController.dados);

/**
 * @swagger
 * /criaromaneio:
 *   post:
 *     summary: Criar um romaneio
 *     tags: [Operação Total]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chave_fato_pedido:
 *                 type: string
 *                 description: Chave fato pedido
 *               volumes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de volumes
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da API
 *     responses:
 *       201:
 *         description: Romaneio criado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     chave_fato_romaneio:
 *                       type: string
 *                       example: "123456"
 *                     chave_fato_pedido:
 *                       type: string
 *                       example: "654321"
 *                     num_volumes:
 *                       type: integer
 *                       example: 10
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Retorno:
 *                             type: string
 *                             example: "Volume gerado com sucesso"
 *                           Codigo_volume:
 *                             type: string
 *                             example: "VOL123"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errorCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: 'Erro ao gerar romaneio de venda'
 *                 error:
 *                   type: object
 *                   properties:
 *                     Tipo:
 *                       type: string
 *                       example: "Erro"
 *                     Chave_fato_pedido:
 *                       type: string
 *                       example: "654321"
 *                     Chave_fato_romaneio:
 *                       type: string
 *                       example: "123456"
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Retorno:
 *                             type: string
 *                             example: "Erro ao gerar volume"
 *                           Codigo_volume:
 *                             type: string
 *                             example: "VOL123"
 *       500:
 *         description: Erro no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errorCode:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 'Erro ao gerar romaneio de venda'
 *                 error:
 *                   type: string
 *                   example: 'Detalhes do erro'
 */

router.post('/criaromaneio', DataController.criaromaneio);

/**
 * @swagger
 * /geratxtvenda:
 *   post:
 *     summary: Gerar TXT de venda
 *     tags: [Operação Total]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chave_fato_pedido:
 *                 type: string
 *                 description: Chave fato pedido
 *               volumes:
 *                 type: array
 *                 items:
 *                   type: array
 *                 description: Lista de volumes
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da API
 *     responses:
 *       200:
 *         description: TXT gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     txt:
 *                       type: string
 *                       example: "Volume gerado com sucesso\nVolume gerado com sucesso"
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Retorno:
 *                             type: string
 *                             example: "Volume gerado com sucesso"
 *                           Codigo_volume:
 *                             type: string
 *                             example: "VOL123"
 *       400:
 *         description: Erro na requisição
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errorCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: 'Erro ao gerar o TXT de romaneio'
 *                 error:
 *                   type: object
 *                   properties:
 *                     Tipo:
 *                       type: string
 *                       example: "Erro"
 *                     Chave_fato_pedido:
 *                       type: string
 *                       example: "654321"
 *                     Chave_fato_romaneio:
 *                       type: string
 *                       example: "123456"
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Retorno:
 *                             type: string
 *                             example: "Erro ao gerar volume"
 *                           Codigo_volume:
 *                             type: string
 *                             example: "VOL123"
 *       500:
 *         description: Erro no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errorCode:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 'Erro ao gerar o TXT de romaneio'
 *                 error:
 *                   type: string
 *                   example: 'Detalhes do erro'
 */

router.post('/geratxtvenda', DataController.geratxtvenda);
router.post('/deletaromaneio', DataController.deletaromaneio);

module.exports = router;
