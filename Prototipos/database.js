// ============================================
// BASE DE DATOS FIREBASE - Sistema UdeM
// Sincronización en tiempo real
// ============================================

class Database {
  constructor() {
    this.db = null;
    this.usuarios = [];
    this.lineasEnfasis = [];
    this.cursos = [];
    this.solicitudes = [];
    this.inscripciones = [];
    this.evaluaciones = [];
    this.notas = [];
    this.notificaciones = [];
    
    this.ready = false;
    this.esperarFirebase();
  }

  // Esperar a que Firebase esté listo
  esperarFirebase() {
    const checkFirebase = setInterval(() => {
      if (window.firebaseDB) {
        clearInterval(checkFirebase);
        this.db = window.firebaseDB;
        this.inicializar();
      }
    }, 100);
  }

  async inicializar() {
    console.log('🔄 Inicializando base de datos...');
    
    // Cargar datos iniciales
    await this.cargarDatos();
    
    // Escuchar cambios en tiempo real
    this.escucharCambios();
    
    // Si no hay usuarios, crear datos base
    if (this.usuarios.length === 0) {
      await this.inicializarDatosBase();
    }
    
    this.ready = true;
    window.dispatchEvent(new CustomEvent('db-ready'));
    console.log('✅ Base de datos lista');
  }

  async cargarDatos() {
    try {
      const snapshot = await this.db.ref('/').once('value');
      const data = snapshot.val() || {};
      
      this.usuarios = data.usuarios || [];
      this.lineasEnfasis = data.lineasEnfasis || [];
      this.cursos = data.cursos || [];
      this.solicitudes = data.solicitudes || [];
      this.inscripciones = data.inscripciones || [];
      this.evaluaciones = data.evaluaciones || [];
      this.notas = data.notas || [];
      this.notificaciones = data.notificaciones || [];
      
      console.log('📥 Datos cargados desde Firebase');
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  }

  escucharCambios() {
    // Sincronización en tiempo real
    this.db.ref('/').on('value', (snapshot) => {
      const data = snapshot.val() || {};
      
      this.usuarios = data.usuarios || [];
      this.lineasEnfasis = data.lineasEnfasis || [];
      this.cursos = data.cursos || [];
      this.solicitudes = data.solicitudes || [];
      this.inscripciones = data.inscripciones || [];
      this.evaluaciones = data.evaluaciones || [];
      this.notas = data.notas || [];
      this.notificaciones = data.notificaciones || [];
      
      // Notificar a la interfaz que hay cambios
      window.dispatchEvent(new CustomEvent('db-updated'));
      console.log('🔄 Datos sincronizados automáticamente');
    });
  }

  async guardar() {
    try {
      await this.db.ref('/').set({
        usuarios: this.usuarios,
        lineasEnfasis: this.lineasEnfasis,
        cursos: this.cursos,
        solicitudes: this.solicitudes,
        inscripciones: this.inscripciones,
        evaluaciones: this.evaluaciones,
        notas: this.notas,
        notificaciones: this.notificaciones
      });
      console.log('💾 Datos guardados en Firebase');
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
    }
  }

  async inicializarDatosBase() {
    this.usuarios = [
      {
        id: 1,
        codigo: 'EST001',
        nombre: 'Juan Pérez Estudiante',
        email: 'estudiante@udem.edu.co',
        password: '123',
        rol: 'estudiante',
        cedula: '1001234567',
        telefono: '3001234567',
        programa: 'Ingeniería de Sistemas',
        semestre: 7,
        promedio: 4.2,
        estado: 'activo'
      },
      {
        id: 2,
        codigo: 'PROF001',
        nombre: 'Dr. Juan Martínez Profesor',
        email: 'profesor@udem.edu.co',
        password: '123',
        rol: 'profesor',
        cedula: '8001234567',
        estado: 'activo'
      },
      {
        id: 3,
        codigo: 'COORD001',
        nombre: 'Ing. Carlos López Coordinador',
        email: 'coordinador@udem.edu.co',
        password: '123',
        rol: 'coordinador',
        cedula: '7001234567',
        estado: 'activo'
      }
    ];
    await this.guardar();
  }

  // ========== MÉTODOS DE USUARIOS ==========
  login(usuario, password) {
    return this.usuarios.find(u => 
      (u.codigo === usuario || u.email === usuario) && 
      u.password === password && 
      u.estado === 'activo'
    );
  }

  obtenerUsuario(id) {
    return this.usuarios.find(u => u.id === id);
  }

  obtenerProfesores() {
    return this.usuarios.filter(u => u.rol === 'profesor' && u.estado === 'activo');
  }

  // ========== MÉTODOS DE LÍNEAS DE ÉNFASIS ==========
  async crearLineaEnfasis(datos) {
    const id = this.lineasEnfasis.length > 0 
      ? Math.max(...this.lineasEnfasis.map(l => l.id)) + 1 
      : 1;
    
    const linea = {
      id,
      codigo: datos.codigo,
      nombre: datos.nombre,
      programa: datos.programa,
      descripcion: datos.descripcion,
      cuposTotales: parseInt(datos.cuposTotales),
      cuposDisponibles: parseInt(datos.cuposTotales),
      modalidad: datos.modalidad,
      duracion: datos.duracion || 16,
      creditos: parseInt(datos.creditos),
      prerrequisitos: datos.prerrequisitos || '',
      competencias: datos.competencias || '',
      herramientas: datos.herramientas || '',
      fechaInicio: datos.fechaInicio,
      horario: datos.horario,
      aula: datos.aula,
      profesorId: parseInt(datos.profesorId),
      estado: 'activa',
      fechaCreacion: new Date().toISOString()
    };
    
    this.lineasEnfasis.push(linea);
    
    await this.crearCurso({
      codigo: datos.codigo,
      nombre: datos.nombre,
      lineaEnfasisId: id,
      profesorId: parseInt(datos.profesorId),
      semestre: '2025-1',
      horario: datos.horario,
      aula: datos.aula,
      cuposTotales: parseInt(datos.cuposTotales),
      modalidad: datos.modalidad
    });
    
    await this.guardar();
    return linea;
  }

  obtenerLineasEnfasis(filtros = {}) {
    let lineas = this.lineasEnfasis.filter(l => l.estado === 'activa');
    
    if (filtros.programa && filtros.programa !== 'Todas') {
      lineas = lineas.filter(l => l.programa === filtros.programa);
    }
    
    return lineas.map(linea => {
      const profesor = this.obtenerUsuario(linea.profesorId);
      return {
        ...linea,
        profesorNombre: profesor ? profesor.nombre : 'Sin asignar'
      };
    });
  }

  obtenerLineaEnfasis(id) {
    return this.lineasEnfasis.find(l => l.id === id);
  }

  async actualizarLineaEnfasis(id, datos) {
    const index = this.lineasEnfasis.findIndex(l => l.id === id);
    if (index !== -1) {
      this.lineasEnfasis[index] = { ...this.lineasEnfasis[index], ...datos };
      await this.guardar();
      return this.lineasEnfasis[index];
    }
    return null;
  }

  async eliminarLineaEnfasis(id) {
    const index = this.lineasEnfasis.findIndex(l => l.id === id);
    if (index !== -1) {
      this.lineasEnfasis[index].estado = 'inactiva';
      await this.guardar();
      return true;
    }
    return false;
  }

  // ========== MÉTODOS DE CURSOS ==========
  async crearCurso(datos) {
    const id = this.cursos.length > 0 
      ? Math.max(...this.cursos.map(c => c.id)) + 1 
      : 1;
    
    const curso = {
      id,
      codigo: datos.codigo,
      nombre: datos.nombre,
      lineaEnfasisId: datos.lineaEnfasisId,
      profesorId: datos.profesorId,
      semestre: datos.semestre || '2025-1',
      horario: datos.horario,
      aula: datos.aula,
      modalidad: datos.modalidad,
      cuposTotales: datos.cuposTotales,
      cuposDisponibles: datos.cuposTotales,
      estado: 'activo',
      fechaCreacion: new Date().toISOString()
    };
    
    this.cursos.push(curso);
    await this.guardar();
    return curso;
  }

  obtenerCursosProfesor(profesorId) {
    return this.cursos
      .filter(c => c.profesorId === profesorId && c.estado === 'activo')
      .map(curso => {
        const linea = this.obtenerLineaEnfasis(curso.lineaEnfasisId);
        const inscripciones = this.inscripciones.filter(i => i.cursoId === curso.id && i.estado === 'activo');
        
        return {
          ...curso,
          lineaEnfasis: linea ? linea.nombre : 'General',
          estudiantes: inscripciones.length
        };
      });
  }

  obtenerCurso(id) {
    return this.cursos.find(c => c.id === id);
  }

  // ========== MÉTODOS DE SOLICITUDES ==========
  async crearSolicitud(datos) {
    const id = this.solicitudes.length > 0 
      ? Math.max(...this.solicitudes.map(s => s.id)) + 1 
      : 1;
    
    const solicitud = {
      id,
      estudianteId: datos.estudianteId,
      lineaEnfasisId: datos.lineaEnfasisId,
      nombre: datos.nombre,
      cedula: datos.cedula,
      email: datos.email,
      telefono: datos.telefono,
      programa: datos.programa,
      semestre: datos.semestre,
      promedio: datos.promedio,
      codigo: datos.codigo,
      archivos: datos.archivos,
      fechaSolicitud: new Date().toISOString(),
      estado: 'pendiente',
      observaciones: ''
    };
    
    this.solicitudes.push(solicitud);
    
    await this.crearNotificacion({
      usuarioId: 3,
      titulo: 'Nueva solicitud de inscripción',
      mensaje: `${datos.nombre} ha solicitado inscripción a una línea de énfasis`,
      tipo: 'info'
    });
    
    await this.guardar();
    return solicitud;
  }

  obtenerSolicitudesEstudiante(estudianteId) {
    return this.solicitudes
      .filter(s => s.estudianteId === estudianteId)
      .map(sol => {
        const linea = this.obtenerLineaEnfasis(sol.lineaEnfasisId);
        return {
          ...sol,
          lineaNombre: linea ? linea.nombre : 'Desconocida'
        };
      });
  }

  obtenerTodasSolicitudes(filtros = {}) {
    let solicitudes = [...this.solicitudes];
    
    if (filtros.estado) {
      solicitudes = solicitudes.filter(s => s.estado === filtros.estado);
    }
    
    return solicitudes.map(sol => {
      const estudiante = this.obtenerUsuario(sol.estudianteId);
      const linea = this.obtenerLineaEnfasis(sol.lineaEnfasisId);
      
      return {
        ...sol,
        estudianteNombre: estudiante ? estudiante.nombre : sol.nombre,
        lineaNombre: linea ? linea.nombre : 'Desconocida'
      };
    });
  }

  async aprobarSolicitud(solicitudId, coordinadorId) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return false;
    
    solicitud.estado = 'aprobada';
    solicitud.coordinadorId = coordinadorId;
    solicitud.fechaRespuesta = new Date().toISOString();
    
    const curso = this.cursos.find(c => c.lineaEnfasisId === solicitud.lineaEnfasisId && c.estado === 'activo');
    
    if (curso) {
      await this.inscribirEstudiante({
        estudianteId: solicitud.estudianteId,
        cursoId: curso.id
      });
      
      curso.cuposDisponibles--;
      const linea = this.obtenerLineaEnfasis(solicitud.lineaEnfasisId);
      if (linea) {
        linea.cuposDisponibles--;
      }
    }
    
    await this.crearNotificacion({
      usuarioId: solicitud.estudianteId,
      titulo: '¡Solicitud Aprobada!',
      mensaje: `Tu solicitud ha sido aprobada. Ya puedes ver el curso en tu panel.`,
      tipo: 'exito'
    });
    
    await this.guardar();
    return true;
  }

  async rechazarSolicitud(solicitudId, coordinadorId, motivo = '') {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return false;
    
    solicitud.estado = 'rechazada';
    solicitud.coordinadorId = coordinadorId;
    solicitud.observaciones = motivo;
    solicitud.fechaRespuesta = new Date().toISOString();
    
    await this.crearNotificacion({
      usuarioId: solicitud.estudianteId,
      titulo: 'Solicitud Rechazada',
      mensaje: `Tu solicitud ha sido rechazada. ${motivo}`,
      tipo: 'error'
    });
    
    await this.guardar();
    return true;
  }

  async cancelarSolicitud(solicitudId) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud || solicitud.estado !== 'pendiente') return false;
    
    solicitud.estado = 'cancelada';
    await this.guardar();
    return true;
  }

  // ========== MÉTODOS DE INSCRIPCIONES ==========
  async inscribirEstudiante(datos) {
    const id = this.inscripciones.length > 0 
      ? Math.max(...this.inscripciones.map(i => i.id)) + 1 
      : 1;
    
    const inscripcion = {
      id,
      estudianteId: datos.estudianteId,
      cursoId: datos.cursoId,
      fechaInscripcion: new Date().toISOString(),
      estado: 'activo',
      notaFinal: null
    };
    
    this.inscripciones.push(inscripcion);
    await this.guardar();
    return inscripcion;
  }

  obtenerInscripcionesEstudiante(estudianteId) {
    return this.inscripciones
      .filter(i => i.estudianteId === estudianteId && i.estado === 'activo')
      .map(insc => {
        const curso = this.obtenerCurso(insc.cursoId);
        const linea = curso ? this.obtenerLineaEnfasis(curso.lineaEnfasisId) : null;
        const profesor = curso ? this.obtenerUsuario(curso.profesorId) : null;
        
        return {
          ...insc,
          cursoNombre: curso ? curso.nombre : 'Desconocido',
          lineaNombre: linea ? linea.nombre : 'Desconocida',
          profesorNombre: profesor ? profesor.nombre : 'Sin asignar',
          horario: curso ? curso.horario : '',
          aula: curso ? curso.aula : ''
        };
      });
  }

  obtenerEstudiantesCurso(cursoId) {
    return this.inscripciones
      .filter(i => i.cursoId === cursoId && i.estado === 'activo')
      .map(insc => {
        const estudiante = this.obtenerUsuario(insc.estudianteId);
        const notas = this.notas.filter(n => n.estudianteId === insc.estudianteId && n.cursoId === cursoId);
        
        return {
          ...insc,
          nombre: estudiante ? estudiante.nombre : 'Desconocido',
          codigo: estudiante ? estudiante.codigo : '',
          email: estudiante ? estudiante.email : '',
          programa: estudiante ? estudiante.programa : '',
          notas: notas
        };
      });
  }

  // ========== MÉTODOS DE EVALUACIONES ==========
  async crearEvaluacion(datos) {
    const id = this.evaluaciones.length > 0 
      ? Math.max(...this.evaluaciones.map(e => e.id)) + 1 
      : 1;
    
    const evaluacion = {
      id,
      cursoId: datos.cursoId,
      nombre: datos.nombre,
      porcentaje: datos.porcentaje
    };
    
    this.evaluaciones.push(evaluacion);
    await this.guardar();
    return evaluacion;
  }

  obtenerEvaluacionesCurso(cursoId) {
    return this.evaluaciones.filter(e => e.cursoId === cursoId);
  }

  async actualizarEvaluacion(id, datos) {
    const index = this.evaluaciones.findIndex(e => e.id === id);
    if (index !== -1) {
      this.evaluaciones[index] = { ...this.evaluaciones[index], ...datos };
      await this.guardar();
      return this.evaluaciones[index];
    }
    return null;
  }

  async eliminarEvaluacion(id) {
    const index = this.evaluaciones.findIndex(e => e.id === id);
    if (index !== -1) {
      this.notas = this.notas.filter(n => n.evaluacionId !== id);
      this.evaluaciones.splice(index, 1);
      await this.guardar();
      return true;
    }
    return false;
  }

  // ========== MÉTODOS DE NOTAS ==========
  async guardarNota(datos) {
    const existente = this.notas.find(n => 
      n.evaluacionId === datos.evaluacionId && 
      n.estudianteId === datos.estudianteId
    );
    
    if (existente) {
      existente.nota = datos.nota;
      existente.fechaRegistro = new Date().toISOString();
    } else {
      const id = this.notas.length > 0 
        ? Math.max(...this.notas.map(n => n.id)) + 1 
        : 1;
      
      this.notas.push({
        id,
        evaluacionId: datos.evaluacionId,
        estudianteId: datos.estudianteId,
        cursoId: datos.cursoId,
        nota: datos.nota,
        fechaRegistro: new Date().toISOString()
      });
    }
    
    this.calcularNotaFinal(datos.estudianteId, datos.cursoId);
    await this.guardar();
  }

  calcularNotaFinal(estudianteId, cursoId) {
    const evaluaciones = this.obtenerEvaluacionesCurso(cursoId);
    const notas = this.notas.filter(n => n.estudianteId === estudianteId && n.cursoId === cursoId);
    
    let notaFinal = 0;
    evaluaciones.forEach(ev => {
      const nota = notas.find(n => n.evaluacionId === ev.id);
      if (nota) {
        notaFinal += (nota.nota * ev.porcentaje) / 100;
      }
    });
    
    const inscripcion = this.inscripciones.find(i => 
      i.estudianteId === estudianteId && 
      i.cursoId === cursoId
    );
    
    if (inscripcion) {
      inscripcion.notaFinal = notaFinal;
    }
    
    return notaFinal;
  }

  obtenerNotasEstudiante(estudianteId, cursoId) {
    return this.notas.filter(n => 
      n.estudianteId === estudianteId && 
      n.cursoId === cursoId
    );
  }

  // ========== MÉTODOS DE NOTIFICACIONES ==========
  async crearNotificacion(datos) {
    const id = this.notificaciones.length > 0 
      ? Math.max(...this.notificaciones.map(n => n.id)) + 1 
      : 1;
    
    const notificacion = {
      id,
      usuarioId: datos.usuarioId,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      tipo: datos.tipo || 'info',
      leida: false,
      fechaCreacion: new Date().toISOString()
    };
    
    this.notificaciones.push(notificacion);
    await this.guardar();
    return notificacion;
  }

  obtenerNotificaciones(usuarioId) {
    return this.notificaciones
      .filter(n => n.usuarioId === usuarioId)
      .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  }

  async marcarNotificacionLeida(id) {
    const notif = this.notificaciones.find(n => n.id === id);
    if (notif) {
      notif.leida = true;
      await this.guardar();
    }
  }

  // ========== RESET BASE DE DATOS ==========
  async resetear() {
    await this.db.ref('/').remove();
    await this.inicializarDatosBase();
    location.reload();
  }
}

// Crear instancia global y esperar a que esté lista
const DB = new Database();
window.DB = DB;

// Función helper para esperar que DB esté lista
window.esperarDB = () => {
  return new Promise((resolve) => {
    if (DB.ready) {
      resolve();
    } else {
      window.addEventListener('db-ready', resolve, { once: true });
    }
  });
};
