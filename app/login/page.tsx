async function handleLogin(e: React.FormEvent) {
  e.preventDefault(); // Rất quan trọng: chặn form reload trang
  setLoading(true);
  setError(null);
  
  try {
    console.log('Đang gọi signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log('Kết quả trả về:', { data, error });
    
    if (error) {
      throw error;
    }
    
    if (data.session) {
      console.log('Đăng nhập thành công, có session. Chuẩn bị chuyển trang...');
      // Dùng window.location.href để đảm bảo trang được tải lại hoàn toàn
      // và middleware đọc được cookie mới
      window.location.href = '/';
    } else {
      throw new Error('Không nhận được session sau khi đăng nhập');
    }
  } catch (err: any) {
    console.error('Lỗi đăng nhập:', err);
    setError(err?.message || 'Đăng nhập thất bại');
  } finally {
    setLoading(false);
  }
}
