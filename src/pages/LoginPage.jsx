import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/index.js'
import { authAPI } from '../utils/api.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const login    = useAuthStore(s => s.login)
  const [tab,      setTab]      = useState('login')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [form,     setForm]     = useState({ name:'', email:'', password:'' })

  const handleGoogle = async (credentialResponse) => {
    try {
      const data = await authAPI.googleLogin(credentialResponse.credential)
      login(data.user, data.token)
      toast.success('Welcome!')
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch {
      toast.error('Google sign-in failed. Please try again.')
    }
  }

  const handle = async () => {
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return }
    setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const { data } = await axios.post(endpoint, form)
      login(data.user, data.token)
      toast.success(tab === 'login' ? 'Welcome back!' : 'Account created!')
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      // Handle specific HTTP error status codes
      if (error.response) {
        const { status, data } = error.response
        
        if (status === 401) {
          toast.error('Invalid email or password. Please try again.')
        } else if (status === 400) {
          toast.error(data.message || 'Please check your input and try again.')
        } else if (status === 409) {
          toast.error('This email is already registered. Try logging in instead.')
        } else if (status >= 500) {
          toast.error('Server error. Please try again later.')
        } else {
          toast.error(data.message || 'Something went wrong')
        }
      } else if (error.request) {
        // Request made but no response received
        toast.error('No response from server. Check your connection.')
      } else {
        // Other errors
        toast.error(error.message || 'An unexpected error occurred')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 bg-amber rounded-full flex items-center justify-center">
                <span className="font-display text-white text-2xl font-semibold">V</span>
              </div>
              <div className="absolute top-1.5 left-3.5 w-4 h-3 bg-vuka-green rounded-[50%_10%_50%_10%] -rotate-12"/>
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-vuka-green">Vuka Technologies</h1>
          <p className="text-sm text-gray-400 mt-1">Wholesale & Retail Cereals</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Tabs */}
          <div className="flex border-2 border-gray-100 rounded-lg overflow-hidden">
            {['login','register'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${tab===t?'bg-vuka-green text-white':'text-gray-500 hover:text-vuka-green'}`}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-field" placeholder="Jane Wanjiku"/>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input-field" placeholder="you@example.com"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Password</label>
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  className="input-field pr-10" placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handle()}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handle} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin"/>}
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => toast.error('Google sign-in failed. Please try again.')}
              text={tab === 'login' ? 'signin_with' : 'signup_with'}
              shape="rectangular"
              logo_alignment="center"
              width={320}
              locale="en"
              use_fedcm_for_prompt={false}
            />
          </div>

          {tab === 'login' && (
            <p className="text-center text-xs text-gray-400">
              Admin? Use your Admin credentials<br/>
              <span className="text-vuka-green font-medium">Default: admin@vuka.co.ke</span>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to="/" className="text-vuka-green hover:underline">← Back to catalog</Link>
        </p>
      </div>
    </div>
  )
}