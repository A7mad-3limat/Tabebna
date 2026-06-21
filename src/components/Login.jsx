import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);

      localStorage.setItem(
        'adminSession',
        JSON.stringify({
          id: result.user.uid,
          email: result.user.email,
          isAdmin: true,
          loginAt: new Date().toISOString()
        })
      );

      toast.success('تم تسجيل الدخول بنجاح ✅');
      navigate('/admin');
    } catch (error) {
      console.error('Login Error:', error.code);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('البريد الإلكتروني غير صحيح');
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>تسجيل دخول المسؤول</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div dir="rtl" className="login-field">
            <label className="login-label">البريد الإلكتروني:</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@admin.com"
              required
              disabled={isLoading}
              className="login-input"
            />
          </div>

          <div dir="rtl" className="login-field">
            <label className="login-label">كلمة المرور:</label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="login-input"
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className="login-submit"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;