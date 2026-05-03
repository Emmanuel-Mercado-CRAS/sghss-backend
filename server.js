// server.js - API SGHSS Hospital VidaPlus
// Versão SIMPLES para iniciantes

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// "Banco de dados" (só guarda enquanto o programa está rodando)
let pacientes = [];
let contadorId = 1;

// ROTA PRINCIPAL (página inicial)
app.get('/', (req, res) => {
    res.json({ 
        mensagem: `API SGHSS funcionando! ✅`
    });
});

// CADASTRAR PACIENTE (POST)
app.post('/pacientes', (req, res) => {
    const { nome, cpf, idade } = req.body;
    
    // Validação simples
    if (!nome || !cpf) {
        return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });
    }
    
    const novoPaciente = {
        id: contadorId++,
        nome: nome,
        cpf: cpf,
        idade: idade || null
    };
    
    pacientes.push(novoPaciente);
    
    res.status(201).json({
        mensagem: 'Paciente cadastrado com sucesso',
        paciente: novoPaciente
    });
});

// LISTAR TODOS OS PACIENTES (GET)
app.get('/pacientes', (req, res) => {
    if (pacientes.length === 0) {
        return res.json({ mensagem: 'Nenhum paciente cadastrado', pacientes: [] });
    }
    res.json({ total: pacientes.length, pacientes: pacientes });
});

// BUSCAR PACIENTE POR ID (GET)
app.get('/pacientes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const paciente = pacientes.find(p => p.id === id);
    
    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }
    res.json({ paciente: paciente });
});

// ATUALIZAR PACIENTE (PUT)
app.put('/pacientes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, idade } = req.body;
    
    const paciente = pacientes.find(p => p.id === id);
    
    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }
    
    if (nome) paciente.nome = nome;
    if (idade) paciente.idade = idade;
    
    res.json({ mensagem: 'Paciente atualizado', paciente: paciente });
});

// EXCLUIR PACIENTE (DELETE)
app.delete('/pacientes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = pacientes.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }
    
    const removido = pacientes[index];
    pacientes.splice(index, 1);
    
    res.json({ mensagem: 'Paciente removido', paciente: removido });
});

// INICIAR O SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});