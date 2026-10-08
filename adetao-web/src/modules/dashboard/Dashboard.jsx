import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

import Sidebar from '../../modules/Sidebar/Sidebar'
import Topbar from '../../modules/Topbar/Topbar'
import Arqueros from '../../modules/Arqueros/Arqueros'

import './Dashboard.css'

function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [arqueros, setArqueros] = useState([])
  const [activeMenu, setActiveMenu] = useState('inicio')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [session])

  const cargarDatos = async () => {
    setLoading(true)

    const { data: perfilData, error: perfilError } =
      await supabase
        .from('perfiles')
        .select('id, nombre, correo, rol')
        .eq('id', session.user.id)
        .single()

    if (!perfilError) {
      setProfile(perfilData)
    }

    const { data: arquerosData } =
      await supabase
        .from('arqueros')
        .select(`
          id,
          nombre,
          identificacion,
          estado_pago,
          tipos_arco(nombre),
          clubes(nombre)
        `)
        .order('nombre')

    setArqueros(arquerosData || [])

    setLoading(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
  }

  const renderContenido = () => {
    if (activeMenu === 'inicio') {
      return (
        <Inicio
          arqueros={arqueros}
          profile={profile}
        />
      )
    }

    if (activeMenu === 'arqueros') {
  return (
    <Arqueros
      onDataChange={cargarDatos}
    />
  )
}

    return (
      <div className="module-placeholder">
        <h2>
          {obtenerTituloModulo(activeMenu)}
        </h2>

        <p>
          Este módulo será desarrollado próximamente.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        Cargando sistema...
      </div>
    )
  }

  return (
    <div className="dashboard">

      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        role={profile?.rol}
        onLogout={cerrarSesion}
      />

      <main className="dashboard-main">

        <Topbar profile={profile} />

        <section className="dashboard-content">
          {renderContenido()}
        </section>

      </main>

    </div>
  )
}

function obtenerTituloModulo(menu) {
  const titulos = {
    arqueros: 'Arqueros',
    clubes: 'Clubes',
    inventario: 'Inventario',
    pagos: 'Pagos',
    reportes: 'Reportes',
    usuarios: 'Usuarios',
  }

  return titulos[menu] || 'Módulo'
}

function Inicio({ arqueros, profile }) {
  return (
    <div>

      <div className="welcome-section">
        <div>
          <h2>
            Bienvenido, {profile?.nombre || 'Usuario'}
          </h2>

          <p>
            Resumen general del sistema ADETAO.
          </p>
        </div>
      </div>

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            ♙
          </div>

          <div>
            <span>Arqueros</span>
            <strong>{arqueros.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ♧
          </div>

          <div>
            <span>Clubes</span>
            <strong>0</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ▣
          </div>

          <div>
            <span>Inventario</span>
            <strong>0</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            $
          </div>

          <div>
            <span>Pagos pendientes</span>
            <strong>0</strong>
          </div>
        </div>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h3>Arqueros registrados</h3>
              <p>Últimos registros del sistema</p>
            </div>
          </div>

          {arqueros.length === 0 ? (
            <div className="empty-state">
              <span>♙</span>
              <p>
                Todavía no hay arqueros registrados.
              </p>
            </div>
          ) : (
            <div className="archer-list">

              {arqueros.slice(0, 5).map((arquero) => (
                <div
                  className="archer-item"
                  key={arquero.id}
                >
                  <div className="archer-avatar">
                    {arquero.nombre
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {arquero.nombre}
                    </strong>

                    <span>
                      {arquero.identificacion}
                    </span>
                  </div>

                  <span
                    className={`payment-status ${
                      arquero.estado_pago
                    }`}
                  >
                    {arquero.estado_pago || 'Sin estado'}
                  </span>
                </div>
              ))}

            </div>
          )}

        </div>

        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h3>Acciones rápidas</h3>
              <p>Accesos frecuentes</p>
            </div>
          </div>

          <div className="quick-actions">

            <button>
              + Registrar arquero
            </button>

            <button>
              + Registrar club
            </button>

            <button>
              + Agregar inventario
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Dashboard