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

    // ✨ [교정 반영] 생성일시가 아닌 'date' 기준으로 메뉴 정렬 수행
    pages?.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0
      const timeB = b.date ? new Date(b.date).getTime() : 0
      return timeA - timeB // 💡 오름차순 정렬 (내림차순을 원하시면 timeB - timeA 로 변경)
    })

    // 정렬된 결과를 메뉴 전역 바구니에 저장합니다.
    setFilteredNavPages(pages)
  }, [router, allNavPages])

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

                  {/* 왼쪽 글 목록 컴포넌트 */}
                  <NavPostList filteredNavPages={sortedNavSidebar} {...props} allNavPages={sortedNavPagesForSidebar} />
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

// ...이하 동일 코드는 지면 관계상 생략 (LayoutIndex, LayoutSlug 등 원본 유지)

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
