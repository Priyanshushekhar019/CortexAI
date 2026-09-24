import { signInWithPopup } from 'firebase/auth'
import React, { useEffect } from 'react'
import { auth, googleProvider } from '../utils/firebase'
import api from '../utils/axios'
import Home from './pages/Home'
import getCurrentUser from './features/getCurrentUser'
import { useDispatch } from 'react-redux'
import { setUserdata } from './redux/userSlice'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    // 1. Silent non-blocking server wake-up ping (wakes sleeping Render containers immediately)
    api.get("/").catch(() => {})

    // 2. Background session validation
    const checkSession = async () => {
      try {
        const data = await getCurrentUser()
        if (data) {
          dispatch(setUserdata(data))
        }
      } catch (err) {
        console.debug("Session check notice:", err?.message)
      }
    }
    checkSession()
  }, [dispatch])

  return (
    <>
      <Home />
    </>
  )
}

export default App
