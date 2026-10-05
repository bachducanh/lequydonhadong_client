import { AlbumCard, AnnouncementList, DocumentList, legalToDoc, NewsCard, ProgramCard, QuickLinks, SearchPanel, SectionHeader, Ticker } from '@/components/site/blocks';
import { HeroSlider } from '@/components/site/hero-slider';
import { PromoBanner } from '@/components/site/interactive';
import { Empty } from '@/components/ui/basics';
import { apiSafe } from '@/lib/api';
import { DEPARTMENTS } from '@/lib/site';
import type { HomeData } from '@/lib/types';

const EMPTY: HomeData = { tickers: [], slides: [], featured: null, news: [], announcements: [], documents: [], albums: [], banner: null, links: [] };

/**
 * Trang chủ: Chữ chạy → Slider → Khối tìm kiếm nổi → Tin nổi bật → Thông báo + Văn bản mới →
 * Banner tuyển sinh → Tổ chuyên môn → Thư viện ảnh → Liên kết hữu ích.
 */
export default async function HomePage() {
  const home = await apiSafe<HomeData>('/home', undefined, EMPTY);
  const news = home.news.slice(0, 3);

  return (
    <>
      <Ticker items={home.tickers} />
      <HeroSlider slides={home.slides} />
      <SearchPanel />

      <section className="lqd-section">
        <div className="lqd-container">
          <SectionHeader eyebrow="Tin tức" title="Hoạt động nổi bật" description="Những câu chuyện mới nhất từ học sinh, thầy cô và các câu lạc bộ." actionLabel="Xem tất cả tin tức" actionHref="/tin-tuc" />
          {home.featured || news.length ? (
            <div className="lqd-stack" style={{ gap: 24 }}>
              {home.featured && <NewsCard post={home.featured} featured />}
              <div className="lqd-grid-3">
                {news.map((n) => (
                  <NewsCard key={n.id} post={n} />
                ))}
              </div>
            </div>
          ) : (
            <Empty icon="fileText" title="Chưa có tin bài" />
          )}
        </div>
      </section>

      <section className="lqd-section lqd-section-alt">
        <div className="lqd-container lqd-split">
          <div>
            <SectionHeader eyebrow="Thông báo" title="Thông báo mới" actionLabel="Tất cả thông báo" actionHref="/tin-tuc?chuyen-muc=thong-bao" />
            {home.announcements.length ? <AnnouncementList items={home.announcements} /> : <Empty icon="bell" title="Chưa có thông báo" />}
          </div>
          <div>
            <SectionHeader eyebrow="Văn bản" title="Văn bản mới" actionLabel="Xem thêm" actionHref="/van-ban" />
            {home.documents.length ? <DocumentList items={home.documents.map((d) => legalToDoc(d, false))} /> : <Empty icon="scale" title="Chưa có văn bản" />}
          </div>
        </div>
      </section>

      {home.banner && (
        <section className="lqd-section">
          <div className="lqd-container">
            <PromoBanner banner={home.banner} />
          </div>
        </section>
      )}

      <section className="lqd-section" style={home.banner ? { paddingTop: 0 } : undefined} id="to-chuyen-mon">
        <div className="lqd-container">
          <SectionHeader eyebrow="Tổ chức nhà trường" title="Tổ chuyên môn" description="Đội ngũ giáo viên theo từng lĩnh vực, cùng các câu lạc bộ học thuật." actionLabel="Xem tất cả" actionHref="/gioi-thieu" />
          <div className="lqd-grid-4">
            {DEPARTMENTS.map((d) => (
              <ProgramCard key={d.title} icon={d.icon} label="Tổ" title={d.title} description={d.description} meta={d.meta} actionLabel="Tìm hiểu" href={d.href} />
            ))}
          </div>
        </div>
      </section>

      <section className="lqd-section lqd-section-alt">
        <div className="lqd-container">
          <SectionHeader eyebrow="Thư viện ảnh" title="Khoảnh khắc Lê Quý Đôn" actionLabel="Xem tất cả album" actionHref="/thu-vien" />
          {home.albums.length ? (
            <div className="lqd-grid-3">
              {home.albums.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          ) : (
            <Empty icon="images" title="Chưa có album" />
          )}
        </div>
      </section>

      {home.links.length > 0 && (
        <section className="lqd-section" id="lien-ket">
          <div className="lqd-container">
            <SectionHeader eyebrow="Liên kết" title="Liên kết hữu ích" />
            <QuickLinks items={home.links} />
          </div>
        </section>
      )}
    </>
  );
}
