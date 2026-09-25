import User from '../models/User.js';
import Mascota from '../models/Mascota.js';
import Turno from '../models/Turno.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import prisma from '../../prisma/client.js'
import { enviarEmail } from '../utils/mailer.js';
import { armarEmailSuspensionCuenta } from '../templates/emailSuspensionCuenta.js';
import { armarEmailCambioEstadoCuenta } from '../templates/emailCambioEstadoCuenta.js';

const esIdInvalido = (error) =>
  error.code === 'P2023' ||
  (typeof error.message === 'string' && error.message.includes('invalid input syntax for type uuid'));


const ESTADO_TURNO_CANCELADO = 'CAN';

// GET /usuarios: listado paginado de usuarios
// "Gestion de Dueños" — MIGRADO 
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

        const filtro = { rol: { nombre: 'dueno' } };

        if (nombre?.trim()) {
            filtro.nombre = { contains: nombre.trim(), mode: 'insensitive' };
        }
        if (email?.trim()) {
            filtro.email = { contains: email.trim(), mode: 'insensitive' };
        }
        if (telefono?.trim()) {
            filtro.telefono = { contains: telefono.trim(), mode: 'insensitive' };
        }
        if (estado === 'true' || estado === 'false') {
            filtro.active = estado === 'true';
        }

        const [total, usuarios] = await Promise.all([
            prisma.usuario.count({ where: filtro }),
            prisma.usuario.findMany({
                where: filtro,
                orderBy: { created_at: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const data = await Promise.all(usuarios.map(async (usuario) => {
            const [cantidadMascotas, turnosProximos, turnosPasados] = await Promise.all([
                prisma.mascota.count({
                    where: { dueno_id: usuario.usuario_id }
                }),
                //  turno -> mascota -> dueno_id
                prisma.turno.count({
                    where: {
                        mascota: { dueno_id: usuario.usuario_id },
                        fecha: { gte: hoy },
                        estado_turno_id: { not: ESTADO_TURNO_CANCELADO }
                    }
                }),
                prisma.turno.count({
                    where: {
                        mascota: { dueno_id: usuario.usuario_id },
                        fecha: { lt: hoy },
                        estado_turno_id: { not: ESTADO_TURNO_CANCELADO }
                    }
                })
            ]);

            return {
                id: usuario.usuario_id,
                nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
                email: usuario.email,
                telefono: usuario.telefono || null,
                mascotas: cantidadMascotas,
                registro: usuario.created_at,
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


//MIGRADOOOOOO  
export const obtenerPerfilUsuario = async (req, res) => {
  try {
    const { id } = req.params

    const esElMismoUsuario = req.user.id === id
    const esAdmin = req.user.rol === 'administrador'

    if (!esElMismoUsuario && !esAdmin) {
      return res.status(403).json({
        message: 'No tenés permisos para realizar esta acción.'
      })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: id },
      include: { rol: true, zona: true }
    })

    if (!usuario) {
      return res.status(404).json({
        message: 'El recurso no existe.'
      })
    }

    let mascotas = []
    let veterinaria = null

    if (usuario.rol.nombre === 'dueno') {
      const mascotasDb = await prisma.mascota.findMany({
        where: { dueno_id: id, active: true },
        include: { raza: { include: { especie: true } } },
        orderBy: { nombre: 'asc' }
      })

      
      mascotas = mascotasDb.map((m) => ({
        _id: m.mascota_id,
        nombre: m.nombre,
        foto: m.foto,
        especie: m.raza?.especie?.nombre || null
      }))
    } else if (usuario.rol.nombre === 'veterinaria') {
      const vet = await prisma.veterinaria.findUnique({
        where: { usuario_id: id },
        include: { estado_veterinaria: true }
      })

      if (vet) {
        
        veterinaria = {
          nombre: vet.nombre,
          estado: vet.estado_veterinaria.nombre
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: usuario.usuario_id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono || null,
        zona: usuario.zona?.nombre || null,
        zonaId: usuario.zona_id,
        fotoUrl: usuario.foto_url || null,
        rol: usuario.rol.nombre,
        active: usuario.active,
        fechaRegistro: usuario.created_at,
        asistenteVirtual: usuario.asistente_virtual_id === 'GAT' ? 'gato' : 'perro',
        mascotas,
        veterinaria
      }
    })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({
        message: 'El id del usuario no es válido'
      })
    }
    console.error('Error en GET /usuarios/:id:', error)
    res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}

///MIGRADOOO
export const actualizarPerfilPropio = async (req, res) => {
  try {
    const usuarioId = req.user.id
    const { nombre, email, telefono, zonaId, fotoUrl, asistenteVirtual } = req.body

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: usuarioId }
    })

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe.'
      })
    }

    const validaciones = []
    const data = {}

    if (nombre !== undefined) {
      if (nombre.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
        validaciones.push('El nombre debe tener al menos 3 caracteres y contener solo letras.')
      } else {
        data.nombre = nombre.trim()
      }
    }

    if (email !== undefined) {
      const emailLimpio = email.toLowerCase().trim()
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(emailLimpio)) {
        validaciones.push('El formato del email no es válido.')
      } else {
        const emailOcupado = await prisma.usuario.findFirst({
          where: { email: emailLimpio, usuario_id: { not: usuarioId } }
        })
        if (emailOcupado) {
          return res.status(409).json({
            success: false,
            message: 'Ese email ya está en uso por otra cuenta.'
          })
        }
        data.email = emailLimpio
      }
    }

    if (telefono !== undefined) {
      const telefonoLimpio = telefono === null ? '' : telefono.trim()
      if (telefonoLimpio === '') {
        data.telefono = null
      } else if (!/^[\d\s()+-]{6,20}$/.test(telefonoLimpio)) {
        validaciones.push('El teléfono debe contener solo números, espacios, +, - o paréntesis (6 a 20 caracteres).')
      } else {
        data.telefono = telefonoLimpio
      }
    }

    if (zonaId !== undefined) {
      if (zonaId === null || zonaId === '') {
        data.zona_id = null
      } else {
        const zonaIdNum = Number(zonaId)
        if (!Number.isInteger(zonaIdNum)) {
          validaciones.push('La zona seleccionada no es válida.')
        } else {
          const zonaExiste = await prisma.zona.findUnique({ where: { zona_id: zonaIdNum } })
          if (!zonaExiste) {
            validaciones.push('La zona seleccionada no existe.')
          } else {
            data.zona_id = zonaIdNum
          }
        }
      }
    }

    if (fotoUrl !== undefined) {
      data.foto_url = (fotoUrl === null || fotoUrl === '') ? null : fotoUrl.trim()
    }

    if (asistenteVirtual !== undefined) {
      const idPorTipo = { perro: 'PER', gato: 'GAT' }
      const asistenteId = idPorTipo[asistenteVirtual]
      if (!asistenteId) {
        validaciones.push(`El asistente debe ser uno de los siguientes: ${Object.keys(idPorTipo).join(', ')}.`)
      } else {
        data.asistente_virtual_id = asistenteId
      }
    }

    if (validaciones.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación en los datos ingresados.',
        errors: validaciones
      })
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { usuario_id: usuarioId },
      data,
      include: { rol: true, zona: true }
    })

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente.',
      data: {
        id: usuarioActualizado.usuario_id,
        nombre: usuarioActualizado.nombre,
        apellido: usuarioActualizado.apellido,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        fotoUrl: usuarioActualizado.foto_url,
        rol: usuarioActualizado.rol.nombre,
        zonaId: usuarioActualizado.zona_id,
        zona: usuarioActualizado.zona?.nombre || null,
        asistenteVirtual: usuarioActualizado.asistente_virtual_id === 'GAT' ? 'gato' : 'perro'
      }
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Ese email ya está en uso por otra cuenta.'
      })
    }
    console.error('Error en actualizarPerfilPropio:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al intentar actualizar el perfil.'
    })
  }
}
/////

//TODO: no migrado
export const crearUsuarioAdmin = async (req, res) => {
    try {
        const { name, email, password, role, telefono } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios (name, email, password, role)'
            });
        }

        const validaciones = [];

        if (name.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
            validaciones.push('El nombre debe tener al menos 3 caracteres y contener solo letras.');
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
            validaciones.push('El formato del email no es válido.');
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
            validaciones.push('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.');
        }

        const rolesPermitidos = ['administrador', 'tutor', 'veterinaria', 'dueno'];
        if (!rolesPermitidos.includes(role)) {
            validaciones.push(`El rol debe ser uno de los siguientes: ${rolesPermitidos.join(', ')}.`);
        }

        if (telefono !== undefined && telefono !== null && telefono.trim() !== '') {
            if (!/^[\d\s()+-]{6,20}$/.test(telefono.trim())) {
                validaciones.push('El teléfono debe contener solo números, espacios, +, - o paréntesis (6 a 20 caracteres).');
            }
        }

        if (validaciones.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación en los datos ingresados',
                errors: validaciones
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'El email ya se encuentra registrado en el sistema'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role,
            telefono: telefono ? telefono.trim() : undefined,
            active: true,
            historialSesiones: []
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

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


// 3. BAJA LÓGICA (SOFT DELETE) POR ADMIN — MIGRADO 
export const darDeBajaUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await prisma.usuario.findUnique({ where: { usuario_id: id } });

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

        const usuarioActualizado = await prisma.usuario.update({
            where: { usuario_id: id },
            data: { active: false }
        });

        // Aviso por email al usuario suspendido (no debe bloquear la baja si falla)
        try {
            const nombreCompleto = `${usuarioActualizado.nombre} ${usuarioActualizado.apellido}`.trim();
            const { subject, html } = armarEmailSuspensionCuenta(nombreCompleto);
            await enviarEmail({ to: usuarioActualizado.email, subject, html });
        } catch (emailError) {
            console.error('Error al enviar email de suspensión de cuenta:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta de usuario desactivada exitosamente.',
            data: {
                id: usuarioActualizado.usuario_id,
                email: usuarioActualizado.email,
                active: usuarioActualizado.active,
                fechaBaja: usuarioActualizado.updated_at ?? new Date()
            }
        });

    } catch (error) {
        if (esIdInvalido(error)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de usuario proporcionado no es válido.'
            });
        }
        console.error('Error en darDeBajaUsuario:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al intentar desactivar la cuenta.'
        });
    }
};

// 4. MODIFICACI=N DE USUARIO (POR ADMIN) — MIGRADO
export const actualizarUsuarioAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        if (typeof active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'El campo active debe ser true o false.'
            });
        }

        const usuario = await prisma.usuario.findUnique({ where: { usuario_id: id } });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'El usuario que intentas modificar no existe.'
            });
        }

        if (usuario.active === active) {
            return res.status(400).json({
                success: false,
                message: active
                    ? 'El usuario ya se encuentra activo.'
                    : 'El usuario ya se encuentra desactivado.'
            });
        }

        const usuarioActualizado = await prisma.usuario.update({
            where: { usuario_id: id },
            data: { active }
        });

       
        try {
            const nombreCompleto = `${usuarioActualizado.nombre} ${usuarioActualizado.apellido}`.trim();
            const { subject, html } = armarEmailCambioEstadoCuenta(nombreCompleto, active);
            await enviarEmail({ to: usuarioActualizado.email, subject, html });
        } catch (emailError) {
            console.error('Error al enviar email de cambio de estado de cuenta:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: active
                ? 'Cuenta de usuario activada exitosamente.'
                : 'Cuenta de usuario desactivada exitosamente.',
            data: {
                id: usuarioActualizado.usuario_id,
                email: usuarioActualizado.email,
                active: usuarioActualizado.active
            }
        });

    } catch (error) {
        if (esIdInvalido(error)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de usuario proporcionado no es válido.'
            });
        }
        console.error('Error en actualizarUsuarioAdmin:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al intentar actualizar el usuario.'
        });
    }
};