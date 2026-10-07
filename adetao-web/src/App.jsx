import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import Login from './modules/auth/Login'
import Dashboard from './modules/dashboard/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const obtenerSesion = async () => {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setLoading(false)
    }

    obtenerSesion()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        Cargando...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return <Dashboard session={session} />
}

export default App