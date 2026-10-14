import { AlbumCard, AnnouncementList, DocumentList, legalToDoc, NewsCard, ProgramCard, QuickLinks, SearchPanel, SectionHeader, Ticker } from '@/components/site/blocks';
import { HeroSlider } from '@/components/site/hero-slider';
import { PromoBanner } from '@/components/site/interactive';
import { Empty } from '@/components/ui/basics';
import { apiSafe } from '@/lib/api';
import { getI18n } from '@/lib/i18n-server';
import { departments } from '@/lib/site';
import type { HomeData } from '@/lib/types';

const EMPTY: HomeData = { tickers: [], slides: [], featured: null, news: [], announcements: [], documents: [], albums: [], banner: null, links: [] };

/**
 * Trang chủ: Chữ chạy → Slider → Khối tìm kiếm nổi → Tin nổi bật → Thông báo + Văn bản mới →
 * Banner tuyển sinh → Tổ chuyên môn → Thư viện ảnh → Liên kết hữu ích.
 */
export default async function HomePage() {
  const [{ lang, t }, home] = await Promise.all([getI18n(), apiSafe<HomeData>('/home', undefined, EMPTY)]);
  const h = t.home;
  const news = home.news.slice(0, 3);

  return (
    <>
      <Ticker items={home.tickers} lang={lang} />
      <HeroSlider slides={home.slides} />
      <SearchPanel lang={lang} overlap={false} />

      <section className="lqd-section">
        <div className="lqd-container">
          <SectionHeader eyebrow={h.newsEyebrow} title={h.newsTitle} description={h.newsDesc} actionLabel={h.newsAll} actionHref="/tin-tuc" />
          {home.featured || news.length ? (
            <div className="lqd-stack" style={{ gap: 24 }}>
              {home.featured && <NewsCard post={home.featured} featured lang={lang} />}
              {news.length > 0 && (
                <div className="lqd-grid-3">
                  {news.map((n) => (
                    <NewsCard key={n.id} post={n} lang={lang} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Empty icon="fileText" title={h.noNews} />
          )}
        </div>
      </section>

      <section className="lqd-section lqd-section-alt">
        <div className="lqd-container lqd-split">
          <div>
            <SectionHeader eyebrow={h.annEyebrow} title={h.annTitle} actionLabel={h.annAll} actionHref="/tin-tuc?chuyen-muc=thong-bao" />
            {home.announcements.length ? <AnnouncementList items={home.announcements} lang={lang} /> : <Empty icon="bell" title={h.noAnn} />}
          </div>
          <div>
            <SectionHeader eyebrow={h.docEyebrow} title={h.docTitle} actionLabel={t.common.more} actionHref="/van-ban" />
            {home.documents.length ? <DocumentList items={home.documents.map((d) => legalToDoc(d, lang, false))} lang={lang} /> : <Empty icon="scale" title={h.noDocs} />}
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
          <SectionHeader eyebrow={h.deptEyebrow} title={h.deptTitle} description={h.deptDesc} actionLabel={t.common.viewAll} actionHref="/gioi-thieu" />
          <div className="lqd-grid-4">
            {departments(lang).map((d) => (
              <ProgramCard key={d.title} icon={d.icon} label={h.deptLabel} title={d.title} description={d.description} meta={d.meta} actionLabel={t.common.learnMore} href={d.href} />
            ))}
          </div>
        </div>
      </section>

      <section className="lqd-section lqd-section-alt">
        <div className="lqd-container">
          <SectionHeader eyebrow={h.galleryEyebrow} title={h.galleryTitle} actionLabel={h.galleryAll} actionHref="/thu-vien" />
          {home.albums.length ? (
            <div className="lqd-grid-3">
              {home.albums.map((a) => (
                <AlbumCard key={a.id} album={a} lang={lang} />
              ))}
            </div>
          ) : (
            <Empty icon="images" title={h.noAlbums} />
          )}
        </div>
      </section>

      {home.links.length > 0 && (
        <section className="lqd-section" id="lien-ket">
          <div className="lqd-container">
            <SectionHeader eyebrow={h.linksEyebrow} title={h.linksTitle} />
            <QuickLinks items={home.links} lang={lang} />
          </div>
        </section>
      )}
    </>
  );
}
