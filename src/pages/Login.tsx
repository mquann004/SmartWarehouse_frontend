import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import styles from './Login.module.css';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regName, setRegName] = useState('');
  // UI state
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, currentUser } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Đăng nhập thất bại');
    }
    // navigation handled by useEffect
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (regPassword !== regConfirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    const result = await register(regUsername, regPassword, regName);
    setLoading(false);

    if (result.success) {
      setSuccess('Đăng ký thành công! Hãy đăng nhập.');
      setIsRegister(false);
      setUsername(regUsername);
      setRegUsername(''); setRegPassword(''); setRegConfirm(''); setRegName('');
    } else {
      setError(result.error || 'Đăng ký thất bại');
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.loginBox}`}>
        <div className={styles.logo}>
          <div className={styles.iconWrap}>
            <Box size={40} />
          </div>
          <h1>SmartWarehouse</h1>
          <p className={styles.subtitle}>{isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập hệ thống'}</p>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}

        {!isRegister ? (
          /* === LOGIN FORM === */
          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label htmlFor="login-username">Tên đăng nhập</label>
              <input
                type="text" id="login-username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập" required autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="login-password">Mật khẩu</label>
              <div className={styles.passwordWrap}>
                <input
                  type={showPw ? 'text' : 'password'} id="login-password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu" required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <LogIn size={18} />
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>
        ) : (
          /* === REGISTER FORM === */
          <form className={styles.form} onSubmit={handleRegister}>
            <div className={styles.inputGroup}>
              <label htmlFor="reg-name">Tên hiển thị</label>
              <input
                type="text" id="reg-name" value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="VD: Nguyễn Văn A" required autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="reg-username">Tên đăng nhập</label>
              <input
                type="text" id="reg-username" value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Ít nhất 3 ký tự" required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="reg-password">Mật khẩu</label>
              <div className={styles.passwordWrap}>
                <input
                  type={showPw ? 'text' : 'password'} id="reg-password" value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Ít nhất 3 ký tự" required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
              <input
                type="password" id="reg-confirm" value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu" required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <UserPlus size={18} />
              {loading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>
        )}

        <div className={styles.switchMode}>
          <span>{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
          <button type="button" onClick={switchMode} className={styles.switchBtn}>
            {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
