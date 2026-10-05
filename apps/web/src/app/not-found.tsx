import { Button, Logo } from '@/components/ui/basics';

export default function NotFound() {
  return (
    <main className="lqd-login" style={{ minHeight: '100vh' }}>
      <div className="lqd-login-card" style={{ gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo withText={false} size={72} />
        </div>
        <p className="lqd-eyebrow" style={{ margin: 0 }}>
          Lỗi 404
        </p>
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn tìm có thể đã được chuyển hoặc không còn tồn tại.</p>
        <div className="lqd-row" style={{ justifyContent: 'center' }}>
          <Button href="/" iconLeft="home">
            Về trang chủ
          </Button>
          <Button href="/tim-kiem" variant="secondary" iconLeft="search">
            Tìm kiếm
          </Button>
        </div>
      </div>
    </main>
  );
}
