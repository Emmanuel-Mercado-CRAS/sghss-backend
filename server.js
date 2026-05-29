// server.js - API SGHSS Hospital VidaPlus
// Versão COM AUTENTICAÇÃO

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// CHAVE SECRETA PARA O TOKEN (guarde isso!)
const SECRET_KEY = 'minha-chave-secreta-hospital-2026';

// "BANCO DE DADOS"
let pacientes = [];
let contadorId = 1;

// USUÁRIOS CADASTRADOS (para login)
let usuarios = [];
let contadorUsuario = 1;

// ============================================
// FUNÇÃO PARA GERAR TOKEN
// ============================================
function gerarToken(usuarioId, email) {
    return jwt.sign(
        { id: usuarioId, email: email },
        SECRET_KEY,
        { expiresIn: '8h' }
    );
}

// ============================================
// FUNÇÃO PARA VERIFICAR TOKEN (MIDDLEWARE)
// ============================================
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const verificado = jwt.verify(token, SECRET_KEY);
        req.usuario = verificado;
        next();
    } catch (error) {
        return res.status(403).json({ erro: 'Token inválido ou expirado' });
    }
}

// ============================================
// 1. ROTA DE TESTE (pública)
// ============================================
app.get('/', (req, res) => {
    res.json({ mensagem: 'API SGHSS funcionando! ✅' });
});

// ============================================
// 2. CADASTRAR USUÁRIO (Sign-up)
// ============================================
app.post('/cadastrar', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
        }

        // Verificar se usuário já existe
        const usuarioExiste = usuarios.find(u => u.email === email);
        if (usuarioExiste) {
            return res.status(400).json({ erro: 'Este e-mail já está cadastrado' });
        }

        // Criptografar a senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const novoUsuario = {
            id: contadorUsuario++,
            email: email,
            senha: senhaCriptografada
        };

        usuarios.push(novoUsuario);

        const token = gerarToken(novoUsuario.id, novoUsuario.email);

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso',
            token: token,
            usuario: { id: novoUsuario.id, email: novoUsuario.email }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
});

// ============================================
// 3. LOGIN
// ============================================
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
        }

        // Buscar usuário
        const usuario = usuarios.find(u => u.email === email);
        if (!usuario) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
        }

        const token = gerarToken(usuario.id, usuario.email);

        res.json({
            mensagem: 'Login realizado com sucesso',
            token: token,
            usuario: { id: usuario.id, email: usuario.email }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

// ============================================
// 4. CADASTRAR PACIENTE (requer autenticação)
// ============================================
app.post('/pacientes', autenticarToken, (req, res) => {
    const { nome, cpf, idade } = req.body;

    if (!nome || !cpf) {
        return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });
    }

    const novoPaciente = {
        id: contadorId++,
        nome: nome,
        cpf: cpf,
        idade: idade || null,
        dataCadastro: new Date().toISOString()
    };

    pacientes.push(novoPaciente);

    res.status(201).json({
        mensagem: 'Paciente cadastrado com sucesso',
        paciente: novoPaciente
    });
});

// ============================================
// 5. LISTAR PACIENTES (requer autenticação)
// ============================================
app.get('/pacientes', autenticarToken, (req, res) => {
    if (pacientes.length === 0) {
        return res.json({ mensagem: 'Nenhum paciente cadastrado', pacientes: [] });
    }
    res.json({ total: pacientes.length, pacientes: pacientes });
});

// ============================================
// 6. BUSCAR PACIENTE POR ID (requer autenticação)
// ============================================
app.get('/pacientes/:id', autenticarToken, (req, res) => {
    const id = parseInt(req.params.id);
    const paciente = pacientes.find(p => p.id === id);

    if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }
    res.json({ paciente: paciente });
});

// ============================================
// 7. ATUALIZAR PACIENTE (requer autenticação)
// ============================================
app.put('/pacientes/:id', autenticarToken, (req, res) => {
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

// ============================================
// 8. EXCLUIR PACIENTE (requer autenticação)
// ============================================
app.delete('/pacientes/:id', autenticarToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = pacientes.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    const removido = pacientes[index];
    pacientes.splice(index, 1);

    res.json({ mensagem: 'Paciente removido', paciente: removido });
});

// ============================================
// INICIAR O SERVIDOR
// ============================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   POST /cadastrar - Criar novo usuário`);
    console.log(`   POST /login - Fazer login`);
    console.log(`   GET  /pacientes - Listar pacientes (requer token)`);
    console.log(`   POST /pacientes - Cadastrar paciente (requer token)`);
    console.log(`   PUT  /pacientes/:id - Atualizar paciente (requer token)`);
    console.log(`   DELETE /pacientes/:id - Excluir paciente (requer token)`);
});