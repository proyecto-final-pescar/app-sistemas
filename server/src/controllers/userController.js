import User from '../models/User.js';
import Mascota from '../models/Mascota.js';
import Veterinaria from '../models/Veterinaria.js';
import Turno from '../models/Turno.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { enviarEmail } from '../utils/mailer.js';
import { armarEmailSuspensionCuenta } from '../templates/emailSuspensionCuenta.js';

// Escapa caracteres especiales de regex antes de usarlos en $regex.

const escapeRegex = (texto) =>
    texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /usuarios: listado paginado de usuarios 
//  panel "Gestión de Dueños"
export const listarUsuarios = async (req, res) => {
    try {
        const {
            nombre,
            email,
            telefono,
            estado, 
            page = 1,
            limit = 10
        } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

        
        const filtro = { role: 'dueno' };

        if (nombre) {
            filtro.name = { $regex: escapeRegex(nombre.trim()), $options: 'i' };
        }
        if (email) {
            filtro.email = { $regex: escapeRegex(email.trim()), $options: 'i' };
        }
        if (telefono) {
            filtro.telefono = { $regex: escapeRegex(telefono.trim()), $options: 'i' };
        }
        if (estado === 'true' || estado === 'false') {
            filtro.active = estado === 'true';
        }

        const total = await User.countDocuments(filtro);

        const usuarios = await User.find(filtro)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const ahora = new Date();

        // Para cada usuario de la pag con mascotas y turnos.
         // con paginacion
        const data = await Promise.all(usuarios.map(async (usuario) => {
            const [cantidadMascotas, turnosProximos, turnosPasados] = await Promise.all([
                Mascota.countDocuments({ dueñoId: usuario._id }),
                Turno.countDocuments({
                    usuarioId: usuario._id,
                    fecha: { $gte: ahora },
                    estado: { $ne: 'cancelado' } // no contamos cancelados 
                }),
                Turno.countDocuments({
                    usuarioId: usuario._id,
                    fecha: { $lt: ahora },
                    estado: { $ne: 'cancelado' } 
                })
            ]);

            return {
                id: usuario._id,
                nombre: usuario.name,
                email: usuario.email,
                telefono: usuario.telefono || null,
                mascotas: cantidadMascotas,
                registro: usuario.createdAt,
                turnos: {
                    proximos: turnosProximos,
                    pasados: turnosPasados
                },
                active: usuario.active
            };
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Error en listarUsuarios:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al listar usuarios'
        });
    }
};

// GET /usuarios/:id: devuelve el perfil de un usuario junto con sus mascotas
export const obtenerPerfilUsuario = async (req, res) => {
    try {
        const { id } = req.params; // El ID del usuario que viene en la URL

        // Control de acceso: solo el propio usuario o un admin pueden ver el perfil
        const esElMismoUsuario = req.user.id === id;
        const esAdmin = req.user.role === 'administrador';

        if (!esElMismoUsuario && !esAdmin) {
            return res.status(403).json({
                message: 'No tenés permisos para realizar esta acción.'
            });
        }

        // Buscar el usuario por ID
        const usuario = await User.findById(id);

        if (!usuario) {
            return res.status(404).json({
                message: 'El recurso no existe.'
            });
        }

        // Datos adicionales según el rol: mascotas para dueños,
        // ficha de la clínica para veterinarias. Admin no tiene ninguno.
        let mascotas = [];
        let veterinaria = null;

        if (usuario.role === 'dueno') {
            mascotas = await Mascota.find({ dueñoId: id });
        } else if (usuario.role === 'veterinaria') {
            const vet = await Veterinaria.findOne({ usuarioId: id })
                .select('nombre especialidades estado');
            if (vet) {
                veterinaria = {
                    nombre: vet.nombre,
                    especialidades: vet.especialidades,
                    estado: vet.estado
                };
            }
        }

        // Armar la respuesta con los datos pedidos
        res.status(200).json({
            success: true,
            data: {
                id: usuario._id,
                nombre: usuario.name,
                email: usuario.email,
                telefono: usuario.telefono || null,
                zona: usuario.zona || null,
                fotoUrl: usuario.fotoUrl || null,
                rol: usuario.role,
                active: usuario.active, //agregado 
                fechaRegistro: usuario.createdAt,
                mascotas: mascotas,
                veterinaria: veterinaria
            }
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'El id del usuario no es válido'
            });
        }
        console.error('Error en GET /usuarios/:id:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

export const crearUsuarioAdmin = async (req, res) => {
  try {
    const { name, email, password, role, telefono } = req.body;

    // 1. Validación de datos faltantes
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos obligatorios (name, email, password, role)' 
      });
    }

    // 2. Validaciones estrictas manuales (ya que no están en el Schema)
    const validaciones = [];

    // Validar nombre (Mínimo 3 caracteres, solo letras y espacios)
    if (name.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
        validaciones.push('El nombre debe tener al menos 3 caracteres y contener solo letras.');
    }

    // Validar formato de email
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
        validaciones.push('El formato del email no es válido.');
    }

    // Validar contraseña (Min 8 caracteres, 1 mayúscula, 1 minúscula, 1 número)
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        validaciones.push('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.');
    }

    // Validar roles permitidos
    const rolesPermitidos = ['administrador', 'tutor', 'veterinaria', 'dueno'];
    if (!rolesPermitidos.includes(role)) {
        validaciones.push(`El rol debe ser uno de los siguientes: ${rolesPermitidos.join(', ')}.`);
    }

    // Validar tel opcional 
    if (telefono !== undefined && telefono !== null && telefono.trim() !== '') {
        if (!/^[\d\s()+-]{6,20}$/.test(telefono.trim())) {
            validaciones.push('El teléfono debe contener solo números, espacios, +, - o paréntesis (6 a 20 caracteres).');
        }
    }

    // Si hay errores de validación, cortamos la ejecución y respondemos (HTTP 400)
    if (validaciones.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación en los datos ingresados',
            errors: validaciones
        });
    }

    // 3. Regla de negocio: Verificar email duplicado (HTTP 409)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'El email ya se encuentra registrado en el sistema' 
      });
    }

    // 4. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Crear la instancia (aplicando trim para limpiar espacios accidentales)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      telefono: telefono ? telefono.trim() : undefined,
      active: true,
      historialSesiones: []
    });

    // 6. Guardar en la DB
    await newUser.save();

    // 7. Preparar la respuesta ocultando datos sensibles
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;

    // 8. Respuesta Exitosa
    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente por el administrador',
      data: userResponse
    });

  } catch (error) {
    console.error('Error en crearUsuarioAdmin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al intentar crear el usuario' 
    });
  }
};


// 3. BAJA LÓGICA (SOFT DELETE) POR ADMIN
export const darDeBajaUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'El ID de usuario proporcionado no es válido.'
      });
    }

    const usuario = await User.findById(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'El usuario que intentas eliminar no existe.'
      });
    }

    if (!usuario.active) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya se encuentra desactivado.'
      });
    }

    usuario.active = false;
    await usuario.save();

    // Aviso por email al usuario suspendido
    try {
      const { subject, html } = armarEmailSuspensionCuenta(usuario.name);
      await enviarEmail({ to: usuario.email, subject, html });
    } catch (emailError) {
      console.error('Error al enviar email de suspensión de cuenta:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Cuenta de usuario desactivada exitosamente.',
      data: {
        id: usuario._id,
        email: usuario.email,
        active: usuario.active,
        fechaBaja: usuario.updatedAt
      }
    });

  } catch (error) {
    console.error('Error en darDeBajaUsuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al intentar desactivar la cuenta.'
    });
  }
};

// 4. MODIFICACIÓN DE USUARIO (POR ADMIN)
export const actualizarUsuarioAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, active, telefono } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de usuario proporcionado no es válido.'
            });
        }

        // 2. Buscar el usuario en la base de datos
        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'El usuario que intentas modificar no existe.'
            });
        }

        const validaciones = [];

        if (name !== undefined) {
            if (name.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
                validaciones.push('El nombre debe tener al menos 3 caracteres y contener solo letras.');
            } else {
                usuario.name = name.trim();
            }
        }

        if (email !== undefined) {
            const emailLimpio = email.toLowerCase().trim();
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailLimpio)) {
                validaciones.push('El formato del email no es válido.');
            } else {
                const emailOcupado = await User.findOne({ email: emailLimpio, _id: { $ne: id } });
                
                if (emailOcupado) {
                    return res.status(409).json({
                        success: false,
                        message: 'El nuevo email ingresado ya se encuentra registrado por otra persona.'
                    });
                }
                usuario.email = emailLimpio;
            }
        }

        if (password !== undefined) {
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
                validaciones.push('La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.');
            } else {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(password, salt);
            }
        }

        if (role !== undefined) {
            const rolesPermitidos = ['administrador', 'tutor', 'veterinaria', 'dueno'];
            if (!rolesPermitidos.includes(role)) {
                validaciones.push(`El rol debe ser uno de los siguientes: ${rolesPermitidos.join(', ')}.`);
            } else {
                usuario.role = role;
            }
        }

        if (active !== undefined) {
            if (typeof active !== 'boolean') {
                validaciones.push('El estado activo debe ser true (activo) o false (inactivo).');
            } else {
                usuario.active = active;
            }
        }

        if (telefono !== undefined) {
            const telefonoLimpio = telefono === null ? '' : telefono.trim();
            if (telefonoLimpio === '') {
                // Permite vaciar el teléfono explícitamente
                usuario.telefono = undefined;
            } else if (!/^[\d\s()+-]{6,20}$/.test(telefonoLimpio)) {
                validaciones.push('El teléfono debe contener solo números, espacios, +, - o paréntesis (6 a 20 caracteres).');
            } else {
                usuario.telefono = telefonoLimpio;
            }
        }

        if (validaciones.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación en los datos ingresados.',
                errors: validaciones
            });
        }

        await usuario.save();

        const userResponse = usuario.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado correctamente.',
            data: userResponse
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Error en los datos proporcionados', 
                errors: messages 
            });
        }

        console.error('Error en actualizarUsuarioAdmin:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al intentar actualizar el usuario.'
        });
    }
};

// AUTO-EDICION DE PERFIL
// El id se toma del token para que
// sea imposible editar el perfil de otro usuario
export const actualizarPerfilPropio = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { name, email, telefono, zona, fotoUrl, asistenteVirtual } = req.body;

        const usuario = await User.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'El usuario no existe.'
            });
        }

        const validaciones = [];

        if (name !== undefined) {
            if (name.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
                validaciones.push('El nombre debe tener al menos 3 caracteres y contener solo letras.');
            } else {
                usuario.name = name.trim();
            }
        }

        if (email !== undefined) {
            const emailLimpio = email.toLowerCase().trim();
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailLimpio)) {
                validaciones.push('El formato del email no es válido.');
            } else {
                const emailOcupado = await User.findOne({ email: emailLimpio, _id: { $ne: usuarioId } });
                if (emailOcupado) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ese email ya está en uso por otra cuenta.'
                    });
                }
                usuario.email = emailLimpio;
            }
        }

        if (telefono !== undefined) {
            const telefonoLimpio = telefono === null ? '' : telefono.trim();
            if (telefonoLimpio === '') {
                usuario.telefono = undefined;
            } else if (!/^[\d\s()+-]{6,20}$/.test(telefonoLimpio)) {
                validaciones.push('El teléfono debe contener solo números, espacios, +, - o paréntesis (6 a 20 caracteres).');
            } else {
                usuario.telefono = telefonoLimpio;
            }
        }

        if (zona !== undefined) {
            const zonaLimpia = zona === null ? '' : zona.trim();
            if (zonaLimpia !== '' && zonaLimpia.length < 3) {
                validaciones.push('La zona debe tener al menos 3 caracteres.');
            } else {
                usuario.zona = zonaLimpia === '' ? undefined : zonaLimpia;
            }
        } 
        if (fotoUrl !== undefined) {
            
            usuario.fotoUrl = (fotoUrl === null || fotoUrl === '') ? undefined : fotoUrl.trim();
        }

        if (asistenteVirtual !== undefined) {
         
            const tiposPermitidos = ['perro', 'gato'];
            if (!tiposPermitidos.includes(asistenteVirtual)) {
                validaciones.push(`El asistente debe ser uno de los siguientes: ${tiposPermitidos.join(', ')}.`);
            } else {
                usuario.asistenteVirtual = asistenteVirtual;
            }
        }

        if (validaciones.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación en los datos ingresados.',
                errors: validaciones
            });
        }

        await usuario.save();

        const userResponse = usuario.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado correctamente.',
            data: userResponse
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Error en los datos proporcionados',
                errors: messages
            });
        }

        console.error('Error en actualizarPerfilPropio:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al intentar actualizar el perfil.'
        });
    }
};