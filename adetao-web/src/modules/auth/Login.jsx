import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Login.css'

function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const iniciarSesion = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    })

    if (error) {
      setError('Correo o contraseña incorrectos.')
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-logo-container">
          <img
            src="src/assets/ADETAO LOGO.png"
            alt="ADETAO"
            className="login-logo"
          />
        </div>

        <h1>Bienvenido</h1>

        <p className="login-subtitle">
          Sistema de Administración ADETAO
        </p>

        <form onSubmit={iniciarSesion}>

          <div className="form-group">
            <label>Correo electrónico</label>

            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingrese su correo"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

        </form>

      </div>
    </div>
  )
}

export default Login