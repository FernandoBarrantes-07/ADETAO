import './Sidebar.css'

function Sidebar({
  activeMenu,
  setActiveMenu,
  role,
  onLogout,
}) {
  const menuPrincipal = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: '⌂',
    },
    {
      id: 'arqueros',
      label: 'Arqueros',
      icon: '♙',
    },
  ]

  const menuAdministrador = [
    {
      id: 'clubes',
      label: 'Clubes',
      icon: '♧',
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: '▣',
    },
    {
      id: 'pagos',
      label: 'Pagos',
      icon: '$',
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: '▤',
    },
  ]

  const menuProfesor = [
    {
      id: 'inventario',
      label: 'Inventario',
      icon: '▣',
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: '▤',
    },
  ]

  const menuUsuarios = [
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: '♙',
    },
  ]

  const seleccionarMenu = (id) => {
    setActiveMenu(id)
  }

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <img
          src="src/assets/ADETAO LOGO.png"
          alt="ADETAO"
          className="sidebar-logo"
        />

        <div className="sidebar-title">
          <strong>ADETAO</strong>
          <span>Administración</span>
        </div>
      </div>

      <div className="sidebar-content">

        <div className="sidebar-section">
          <span className="sidebar-section-title">
            MENÚ PRINCIPAL
          </span>

          {menuPrincipal.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${
                activeMenu === item.id ? 'active' : ''
              }`}
              onClick={() => seleccionarMenu(item.id)}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {role === 'administrador' && (
          <div className="sidebar-section">

            <span className="sidebar-section-title">
              ADMINISTRACIÓN
            </span>

            {menuAdministrador.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${
                  activeMenu === item.id ? 'active' : ''
                }`}
                onClick={() => seleccionarMenu(item.id)}
              >
                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </button>
            ))}

            {menuUsuarios.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${
                  activeMenu === item.id ? 'active' : ''
                }`}
                onClick={() => seleccionarMenu(item.id)}
              >
                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </button>
            ))}

          </div>
        )}

        {role === 'profesor' && (
          <div className="sidebar-section">

            <span className="sidebar-section-title">
              GESTIÓN
            </span>

            {menuProfesor.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${
                  activeMenu === item.id ? 'active' : ''
                }`}
                onClick={() => seleccionarMenu(item.id)}
              >
                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </button>
            ))}

          </div>
        )}

      </div>

      <div className="sidebar-footer">

        <button
          className="logout-button"
          onClick={onLogout}
        >
          <span className="sidebar-icon">↪</span>
          <span>Cerrar sesión</span>
        </button>

      </div>

    </aside>
  )
}

export default Sidebar