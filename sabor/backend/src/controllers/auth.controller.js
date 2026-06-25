const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../prisma');

const signToken = (usuario) => jwt.sign(
  { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre, clienteId: usuario.cliente?.id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

exports.register = async (req, res, next) => {
  try {
    const { nombre, apellido='', email, password, telefono, cedula, direccion } = req.body;

    const existe = await prisma.usuario.findUnique({ where:{ email } });
    if (existe) return res.status(409).json({ error: 'El email ya está registrado' });

    const rolCliente = await prisma.role.findUnique({ where:{ nombre:'cliente' } });
    const hash       = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data:{
        nombre, email, passwordHash:hash, rolId:rolCliente.id,
        cliente:{ create:{ nombre, apellido, telefono, cedula, direccion } }
      },
      include:{ rol:true, cliente:true }
    });

    const token = signToken(usuario);
    res.status(201).json({ token, usuario:{ id:usuario.id, nombre:usuario.nombre, email:usuario.email, rol:usuario.rol.nombre } });
  } catch(e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where:{ email },
      include:{ rol:true, cliente:true }
    });

    if (!usuario || !usuario.activo)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const valido = await bcrypt.compare(password, usuario.passwordHash);
    if (!valido)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(usuario);
    res.json({ token, usuario:{ id:usuario.id, nombre:usuario.nombre, email:usuario.email, rol:usuario.rol.nombre } });
  } catch(e) { next(e); }
};
