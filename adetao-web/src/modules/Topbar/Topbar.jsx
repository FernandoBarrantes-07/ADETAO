import './Topbar.css'

function Topbar({ profile }) {
  const nombre = profile?.nombre || 'Usuario'
  const rol = profile?.rol || 'usuario'

  const rolTexto = {
    administrador: 'Administrador',
    profesor: 'Profesor',
    usuario: 'Usuario',
  }

  return (
    <header className="topbar">

      <div className="topbar-title">
        <h1>Sistema de Administración</h1>
        <p>Asociación de Arqueros de Alajuela</p>
      </div>

      <div className="topbar-user">

        <div className="topbar-avatar">
          {nombre.charAt(0).toUpperCase()}
        </div>

        <div className="topbar-user-info">
          <strong>{nombre}</strong>
          <span>{rolTexto[rol] || rol}</span>
        </div>

      </div>

    </header>
  )
}

export default Topbar