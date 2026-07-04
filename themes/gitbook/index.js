'use client'

import Comment from '@/components/Comment'
import { AdSlot } from '@/components/GoogleAdsense'
import Live2D from '@/components/Live2D'
import LoadingCover from '@/components/LoadingCover'
import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import DashboardBody from '@/components/ui/dashboard/DashboardBody'
import DashboardHeader from '@/components/ui/dashboard/DashboardHeader'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import { getShortId } from '@/lib/utils/pageId'
import { SignIn, SignUp } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Announcement from './components/Announcement'
import ArticleAround from './components/ArticleAround'
import ArticleInfo from './components/ArticleInfo'
import { ArticleLock } from './components/ArticleLock'
import BlogArchiveItem from './components/BlogArchiveItem'
import BottomMenuBar from './components/BottomMenuBar'
import Catalog from './components/Catalog'
import CatalogDrawerWrapper from './components/CatalogDrawerWrapper'
import CategoryItem from './components/CategoryItem'
import Footer from './components/Footer'
import Header from './components/Header'
import InfoCard from './components/InfoCard'
import JumpToTopButton = './components/JumpToTopButton'
import NavPostList from './components/NavPostList'
import PageNavDrawer from './components/PageNavDrawer'
import RevolverMaps from './components/RevolverMaps'
import TagItemMini from './components/TagItemMini'
import CONFIG from './config'
import { Style } from './style'

const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  { ssr: false }
)
const WWAds = dynamic(() => import('@/components/WWAds'), { ssr: false })

// 테마 전역 변수
const ThemeGlobalGitbook = createContext()
export const useGitBookGlobal = () => useContext(ThemeGlobalGitbook)

/**
 * 최신 글에 빨간 점 표시
 */
function getNavPagesWithLatest(allNavPages, latestPosts, post) {
  const postReadTime = JSON.parse(
    localStorage.getItem('post_read_time') || '{}'
  )
  if (post) {
    postReadTime[getShortId(post.id)] = new Date().getTime()
  }
  localStorage.setItem('post_read_time', JSON.stringify(postReadTime))

  return allNavPages?.map(item => {
    const res = {
      ...item,
      publishDate: item.publishDate || item.date || null 
    }
    if (
      latestPosts && latestPosts.some(post => post?.id.indexOf(item?.short_id) === 14) &&
      (!postReadTime[item.short_id] ||
        postReadTime[item.short_id] < new Date(item.lastEditedDate).getTime())
    ) {
      return { ...res, isLatest: true }
    } else {
      return res
    }
  })
}

/**
 * 기본 레이아웃
 * 좌우 측면 레이아웃 채택, 모바일 기기는 상단 네비게이션 바 사용
 * @returns {JSX.Element}
 * @constructor
 */
const LayoutBase = props => {
  const {
    children,
    post,
    allNavPages,
    latestPosts,
    slotLeft,
    slotRight,
    slotTop
  } = props
  const { fullWidth } = useGlobal()
  const router = useRouter()
  const [tocVisible, changeTocVisible] = useState(false)
  const [pageNavVisible, changePageNavVisible] = useState(false)
  const [filteredNavPages, setFilteredNavPages] = useState(allNavPages)

  const searchModal = useRef(null)

  useEffect(() => {
    // 1. 현재 사용자가 브라우저 주소창에 치고 들어온 도메인을 실시간 감지
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    
    // 2. 기본 최신글 마킹 데이터 생성
    let pages = getNavPagesWithLatest(allNavPages, latestPosts, post)
    
    // 3. 주소에 따라 메뉴판 강제 필터링
    pages = pages?.filter(item => {
      if (currentHost.includes('scucontentspost')) {
        const hasScuTag = item.tags?.includes('scu') || 
                           item.tagItems?.some(t => t === 'scu' || t?.name === 'scu')
        return hasScuTag
      }
      
      if (currentHost.includes('ssiwonkdocs')) {
        return true 
      }
      
      return true
    })

    // ✨ [교정 반영] 안전한 블록 구조화 정렬: 기차칸(부모-자식 관계)을 유지하면서 date 기준 오름차순 정렬
    if (pages && pages.length > 0) {
      const blocks = [];
      let currentMenu = null;

      pages.forEach(item => {
        if (item.type === 'Menu') {
          if (currentMenu) blocks.push(currentMenu);
          currentMenu = { main: item, sub: [] };
        } else if (item.type === 'SubMenu') {
          if (currentMenu) {
            currentMenu.sub.push(item);
          } else {
            blocks.push({ main: item, sub: [] });
          }
        } else {
          if (currentMenu) {
            blocks.push(currentMenu);
            currentMenu = null;
          }
          blocks.push({ main: item, sub: [] });
        }
      });
      if (currentMenu) blocks.push(currentMenu);

      // 블록(대메뉴 혹은 독립 포스트)들을 사용자가 노션에 지정한 date 기준 오름차순 정렬
      blocks.sort((a, b) => {
        const timeA = a.main.date ? new Date(a.main.date).getTime() : 0;
        const timeB = b.main.date ? new Date(b.main.date).getTime() : 0;
        return timeA - timeB;
      });

      // 대메뉴 내부의 서브메뉴들도 각자 date 기준 오름차순 2차 정렬
      blocks.forEach(b => {
        b.sub.sort((sa, sb) => {
          const timeA = sa.date ? new Date(sa.date).getTime() : 0;
          const timeB = sb.date ? new Date(sb.date).getTime() : 0;
          return timeA - timeB;
        });
      });

      // 정렬된 블록들을 다시 하나의 평탄한 배열로 재조립
      const finalPages = [];
      blocks.forEach(b => {
        finalPages.push(b.main);
        finalPages.push(...b.sub);
      });
      pages = finalPages;
    }

    // 정렬된 결과를 메뉴 전역 바구니에 저장합니다.
    setFilteredNavPages(pages)
  }, [router, allNavPages, latestPosts, post])

  // 오직 왼쪽 사이드바(글 목록)만을 위한 독립된 날짜순 정렬 복사본을 생성합니다.
  const sortedNavPagesForSidebar = filteredNavPages ? [...filteredNavPages].sort((a, b) => {
    const timeA = a.publishDate ? new Date(a.publishDate).getTime() : 0
    const timeB = b.publishDate ? new Date(b.publishDate).getTime() : 0
    return timeA - timeB 
  }) : []

  const GITBOOK_LOADING_COVER = siteConfig(
    'GITBOOK_LOADING_COVER',
    true,
    CONFIG
  )
  return (
    <ThemeGlobalGitbook.Provider
      value={{
        searchModal,
        tocVisible,
        changeTocVisible,
        filteredNavPages,
        setFilteredNavPages,
        allNavPages: filteredNavPages, 
        pageNavVisible,
        changePageNavVisible
      }}>
      <Style />

      <div
        id='theme-gitbook'
        className={`${siteConfig('FONT_STYLE')} pb-16 md:pb-0 scroll-smooth bg-white dark:bg-black w-full h-full min-h-screen justify-center dark:text-gray-300`}>
        <AlgoliaSearchModal cRef={searchModal} {...props} />

        {/* 💡 상단 네비게이션 바 컴포넌트에도 정렬 및 필터링이 완료된 배열을 명시적으로 주입합니다. */}
        <Header {...props} allNavPages={filteredNavPages} />

        <main
          id='wrapper'
          className={`${siteConfig('LAYOUT_SIDEBAR_REVERSE') ? 'flex-row-reverse' : ''} relative flex justify-between w-full gap-x-6 h-full mx-auto max-w-screen-4xl`}>
          {/* 왼쪽 사이드바 메뉴판 */}
          {fullWidth ? null : (
            <div className={'hidden md:block relative z-10 '}>
              <div className='w-80 pt-14 pb-4 sticky top-0 h-screen flex justify-between flex-col'>
                {/* 네비게이션 */}
                <div className='overflow-y-scroll scroll-hidden pt-10 pl-5'>
                  {/* 임베드 구역 */}
                  {slotLeft}

                  {/* 💡 [오타 교정] 정의되지 않았던 sortedNavSidebar 대신 가공 완료된 filteredNavPages를 주입합니다. */}
                  <NavPostList filteredNavPages={filteredNavPages} {...props} allNavPages={sortedNavPagesForSidebar} />
                </div>
                {/* 푸터 */}
                <Footer {...props} />
              </div>
            </div>
          )}

          {/* 중앙 콘텐츠 영역 */}
          <div
            id='center-wrapper'
            className='flex flex-col justify-between w-full relative z-10 pt-14 min-h-screen'>
            <div
              id='container-inner'
              className={`w-full ${fullWidth ? 'px-5' : 'max-w-3xl px-3 lg:px-0'} justify-center mx-auto`}>
              {slotTop}
              <WWAds className='w-full' orientation='horizontal' />

              {children}

              {/* 구글 광고 */}
              <AdSlot type='in-article' />
              <WWAds className='w-full' orientation='horizontal' />
            </div>

            {/* 하단 (모바일 전용) */}
            <div className='md:hidden'>
              <Footer {...props} />
            </div>
          </div>

          {/* 우측 사이드바 */}
          {fullWidth ? null : (
            <div
              className={
                'w-72 hidden 2xl:block dark:border-transparent flex-shrink-0 relative z-10 '
              }>
              <div className='py-14 sticky top-0'>
                <ArticleInfo post={props?.post ? props?.post : props.notice} />

                <div>
                  {/* 데스크톱 본문 목차 (TOC) */}
                  <Catalog {...props} />
                  {slotRight}
                  {router.route === '/' && (
                    <>
                      <InfoCard {...props} />
                      {siteConfig(
                        'GITBOOK_WIDGET_REVOLVER_MAPS',
                        null,
                        CONFIG
                      ) === 'true' && <RevolverMaps />}
                      <Live2D />
                    </>
                  )}
                  {/* 깃북 테마 메인 화면에는 공지사항만 표시 */}
                  <Announcement {...props} />
                </div>

                <AdSlot type='in-article' />
                <Live2D />
              </div>
            </div>
          )}
        </main>

        {GITBOOK_LOADING_COVER && <LoadingCover />}

        {/* 상단 이동 버튼 */}
        <JumpToTopButton />

        {/* 모바일 네비게이션 드로어 서랍 */}
        <PageNavDrawer {...props} filteredNavPages={sortedNavPagesForSidebar} allNavPages={sortedNavPagesForSidebar} />

        {/* 모바일 하단 메뉴 바 */}
        <BottomMenuBar {...props} />
      </div>
    </ThemeGlobalGitbook.Provider>
  )
}

/**
 * 메인 인덱스 레이아웃
 */
const LayoutIndex = props => {
  return (
    <LayoutBase {...props}>
      <LayoutPostList {...props} />
    </LayoutBase>
  )
}

/**
 * 일반 포스트 및 위키 문서 레이아웃
 */
const LayoutSlug = props => {
  const { post, lock, validLock } = props
  return (
    <LayoutBase {...props}>
      {lock && !validLock ? (
        <ArticleLock {...props} />
      ) : (
        <article itemScope itemType='https://schema.org/Article' className='subpixel-antialiased overflow-y-hidden'>
          {post && <NotionPage post={post} />}
          <ArticleAround prev={props.prev} next={props.next} />
          <ShareBar post={post} />
          <Comment frontMatter={post} />
        </article>
      )}
    </LayoutBase>
  )
}

/**
 * 글 목록 컴포넌트
 */
const LayoutPostList = props => {
  const { posts } = props
  return (
    <LayoutBase {...props}>
      <div className='mt-4 angular-custom-posts'>
        {posts?.map(p => (
          <BlogArchiveItem key={p.id} post={p} />
        ))}
      </div>
    </LayoutBase>
  )
}

/**
 * 타임라인 아카이브 레이아웃
 */
const LayoutArchive = props => {
  const { archivePosts } = props
  return (
    <LayoutBase {...props}>
      <div className='mb-10 pb-20 bg-white md:p-12 dark:bg-zinc-900 rounded-xl mt-4'>
        {Object.keys(archivePosts || {}).map(archiveTitle => (
          <div key={archiveTitle}>
            <div className='pt-5 pb-4 text-2xl font-bold dark:text-gray-300'>{archiveTitle}</div>
            <ul>
              {archivePosts[archiveTitle]?.map(post => (
                <li key={post.id} className='my-2'>
                  <BlogArchiveItem post={post} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </LayoutBase>
  )
}

/**
 * 카테고리 레이아웃
 */
const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  return (
    <LayoutBase {...props}>
      <div className='mt-4 dark:text-gray-300 flex flex-wrap gap-4'>
        {categoryOptions?.map(c => (
          <CategoryItem key={c.name} category={c.name} />
        ))}
      </div>
    </LayoutBase>
  )
}

/**
 * 태그 레이아웃
 */
const LayoutTagIndex = props => {
  const { tagOptions } = props
  return (
    <LayoutBase {...props}>
      <div className='mt-4 dark:text-gray-300 flex flex-wrap gap-2'>
        {tagOptions?.map(t => (
          <TagItemMini key={t.name} tag={t} />
        ))}
      </div>
    </LayoutBase>
  )
}

/**
 * 대시보드 레이아웃
 */
const LayoutDashboard = props => {
  return (
    <LayoutBase {...props}>
      <DashboardHeader />
      <DashboardBody />
    </LayoutBase>
  )
}

const LayoutSearch = props => <LayoutBase {...props} />
const Layout404 = props => <LayoutBase {...props}><div className='text-center py-20 text-xl font-bold'>404 Not Found</div></LayoutBase>
const LayoutSignIn = props => <LayoutBase {...props}><div className='flex justify-center items-center py-10'><SignIn /></div></LayoutBase>
const LayoutSignUp = props => <LayoutBase {...props}><div className='flex justify-center items-center py-10'><SignUp /></div></LayoutBase>

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutDashboard,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSignIn,
  LayoutSignUp,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
