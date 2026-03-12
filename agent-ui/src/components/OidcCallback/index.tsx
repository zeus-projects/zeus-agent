import { useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { userManager } from '../../context/AuthContext'

export function OidcCallback() {
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    userManager.signinRedirectCallback()
      .then(() => {
        window.location.replace('/')
      })
      .catch((err) => {
        console.error('OIDC callback error:', err)
        window.location.replace('/')
      })
  }, [])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Spin size="large" tip="正在登录..." />
    </div>
  )
}
