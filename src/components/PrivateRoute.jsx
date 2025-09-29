import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import auth from '../services/auth';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const [ready, setReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(auth.isAuthenticated)

  useEffect(() => {
    auth.initAuthListener((user) => {
      setIsAuthed(!!user)
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <Route
      {...rest}
      render={(props) => (
        isAuthed
          ? (localStorage.getItem('flowlink_onboarding_done') === '1'
              ? <Component {...props} />
              : <Redirect to='/onboarding' />)
          : <Redirect to='/login' />
      )}
    />
  )
}

export default PrivateRoute;
