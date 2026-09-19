import { signInWithPopup } from 'firebase/auth'
import React, { useState } from 'react'
import { auth, googleProvider } from '../../utils/firebase'
import api from '../../utils/axios'
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from 'react-redux';
import { setUserdata } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
import { Loader2 } from 'lucide-react';

function Home() {
    const { userData } = useSelector(state => state.user)
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [authError, setAuthError] = useState("")
    const dispatch = useDispatch()

    const handleLogin = async (token, retries = 2) => {
        setIsAuthenticating(true)
        setAuthError("")
        try {
            const { data } = await api.post("/api/auth/login", { token })
            dispatch(setUserdata(data))
        } catch (error) {
            console.error("Login attempt error:", error)
            if (retries > 0) {
                setTimeout(() => handleLogin(token, retries - 1), 1500)
            } else {
                setAuthError("Failed to connect to authentication server. Please try again.")
            }
        } finally {
            setIsAuthenticating(false)
        }
    }

    const googleLogin = async () => {
        try {
            setAuthError("")
            const data = await signInWithPopup(auth, googleProvider)
            const token = await data.user.getIdToken()
            await handleLogin(token)
        } catch (error) {
            console.error("Google sign in error:", error)
            setAuthError(error?.message || "Google sign in failed")
            setIsAuthenticating(false)
        }
    }

    return (
        <div className='h-screen flex bg-[#0d0f14] text-white overflow-hidden'>
            <SideBar />
            <ChatArea />
            <Artifact />

            {!userData && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur'>
                    <div className='w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5'>
                        <div className='flex flex-col gap-1'>
                            <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>Welcome to CortexAI</h2>
                            <p className='text-[13px] text-slate-500'>Please login to continue using the app.</p>
                        </div>

                        {authError && (
                            <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5'>
                                {authError}
                            </div>
                        )}

                        <button 
                            disabled={isAuthenticating}
                            className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 disabled:opacity-60 transition-all duration-150 cursor-pointer' 
                            onClick={googleLogin}
                        >
                            {isAuthenticating ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <FcGoogle size={16} />
                                    <span>Continue With Google</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home
