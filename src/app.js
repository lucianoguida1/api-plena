require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const path = require('path');
const auth = require('./services/UserService');
const ConsultaService = require('./services/ConsultaService');
const routes = require('./routes');

const corsOptions = {
    origin: '*', // Permitir apenas este domínio
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Permitir apenas esses métodos
    allowedHeaders: ['Content-Type', 'Authorization'], // Permitir apenas esses cabeçalhos
    credentials: false // Se você precisar permitir credenciais (cookies, autorização)
};

const server = express();
server.use(cors(corsOptions));
server.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
server.use(bodyParser.json({ limit: '10mb' }));

// Servir arquivos estáticos da pasta 'public'
server.use(express.static(path.join(__dirname, '../public')));

// Roteamento das APIs
server.use('/api', routes);
//server.use('/api', auth.authenticateKey, routes);

// Rota para a página de consultas
server.use('/rotas', async (req, res) => {
    let json = { error: '', result: [] };
    let consultas = await ConsultaService.buscarTodos();
    for (let i in consultas) {
        json.result.push({
            chave: consultas[i].chave,
            parametros: consultas[i].parametros
        });
    }
    res.json(json);
});

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API documentation with Swagger',
        },
    },
    apis: ['./src/routes.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

server.use('/pgconsultas', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/consulta.html'));
    console.log('t')
});

server.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/public.html'));
});

const PORT = process.env.PORT || 8070;
server.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});