import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

import Sidebar from '../../modules/Sidebar/Sidebar'
import Topbar from '../../modules/Topbar/Topbar'
import Inventario from '../../modules/inventario/Inventario'
import MisPrestamos from '../../modules/inventario/MisPrestamos'
import Arqueros, { ESTADOS_PAGO } from '../../modules/Arqueros/Arqueros'
import Clubes from '../../modules/clubes/Clubes'

import './Dashboard.css'

function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [arqueros, setArqueros] = useState([])
  const [totalClubes, setTotalClubes] = useState(0)
  const [totalArqueros, setTotalArqueros] = useState(0)
  const [totalInventario, setTotalInventario] = useState(0)
  const [activeMenu, setActiveMenu] = useState('inicio')
  const [loading, setLoading] = useState(true)

  const actualizarTotales = async () => {
    const [clubesRes, arquerosRes, inventarioRes] = await Promise.all([
      supabase
        .from('clubes')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo'),
      supabase
        .from('arqueros')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo'),
      supabase
        .from('inventario')
        .select('id', { count: 'exact', head: true })
        .neq('estado', 'perdido'),
    ])

    setTotalClubes(clubesRes.error ? 0 : clubesRes.count ?? 0)
    setTotalArqueros(arquerosRes.error ? 0 : arquerosRes.count ?? 0)
    setTotalInventario(inventarioRes.error ? 0 : inventarioRes.count ?? 0)
  }

  const abrirMenu = (menu) => {
    setActiveMenu(menu)
    if (menu === 'inicio') actualizarTotales()
  }

  useEffect(() => {
    cargarDatos()
  }, [session])

  const cargarDatos = async () => {
    setLoading(true)

    const { data: perfilData, error: perfilError } =
      await supabase
        .from('perfiles')
        .select('id, nombre, correo, rol, arquero_id')
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
    await actualizarTotales()

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
          totalClubes={totalClubes}
          totalArqueros={totalArqueros}
          totalInventario={totalInventario}
          esAdmin={profile?.rol === 'administrador'}
          esStaff={profile?.rol === 'administrador' || profile?.rol === 'profesor'}
          esUsuario={profile?.rol === 'usuario'}
          onIr={abrirMenu}
        />
      )
    }

    if (activeMenu === 'inventario') {
      return <Inventario profile={profile} />
    }

    if (activeMenu === 'clubes') {
      return (
        <Clubes
          profile={profile}
          onCambio={actualizarTotales}
        />
      )
    }
    if (activeMenu === 'arqueros') {
  return (
    <Arqueros
      profile={profile}
      onDataChange={cargarDatos}
    />
  )
}

    if (activeMenu === 'mis_prestamos') {
      return <MisPrestamos profile={profile} />
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
        setActiveMenu={abrirMenu}
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
    mis_prestamos: 'Mis préstamos',
  }

  return titulos[menu] || 'Módulo'
}

function Inicio({
  arqueros,
  profile,
  totalClubes,
  totalArqueros,
  totalInventario,
  esAdmin,
  esStaff,
  esUsuario,
  onIr,
}) {
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

        {!esUsuario && (
          <div className="stat-card">
            <div className="stat-icon">
              ♙
            </div>

            <div>
              <span>Arqueros</span>
              <strong>{totalArqueros}</strong>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon">
            ♧
          </div>

          <div>
            <span>Clubes</span>
            <strong>{totalClubes}</strong>
          </div>
        </div>

        {esStaff && (
          <div className="stat-card">
            <div className="stat-icon">
              ▣
            </div>

            <div>
              <span>Inventario</span>
              <strong>{totalInventario}</strong>
            </div>
          </div>
        )}

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

      {!esUsuario && (
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
                    {ESTADOS_PAGO[arquero.estado_pago] || 'Sin estado'}
                  </span>
                </div>
              ))}

            </div>
          )}

        </div>

        {esAdmin && (
        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h3>Acciones rápidas</h3>
              <p>Accesos frecuentes</p>
            </div>
          </div>

          <div className="quick-actions">

            <button onClick={() => onIr('arqueros')}>
              + Registrar arquero
            </button>

            <button onClick={() => onIr('clubes')}>
              + Registrar club
            </button>

            <button onClick={() => onIr('inventario')}>
              + Agregar inventario
            </button>

          </div>

        </div>
        )}

      </div>
      )}

    </div>
  )
}

export default Dashboard