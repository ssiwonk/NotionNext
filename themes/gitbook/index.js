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
import JumpToTopButton from './components/JumpToTopButton'
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

    // ✨ [하이브리드 블록 구조화 그룹 정렬 알고리즘 적용]
    if (pages && pages.length > 0) {
      const menuBlocks = []
      const purePosts = []
      let currentMenuBlock = null

      // [Step 1] 부모(Menu)와 자식(SubMenu)을 하나의 자물쇠 뭉치로 결속시키고 일반 글 분리
      pages.forEach(item => {
        if (item.type === 'Menu') {
          if (currentMenuBlock) {
            menuBlocks.push(currentMenuBlock)
          }
          currentMenuBlock = { parent: item, children: [] }
        } else if (item.type === 'SubMenu') {
          if (currentMenuBlock) {
            currentMenuBlock.children.push(item)
          } else {
            purePosts.push(item) // 부모 없는 서브메뉴 예외 방어
          }
        } else {
          purePosts.push(item) // 일반 포스트/페이지 격리
        }
      })
      if (currentMenuBlock) {
        menuBlocks.push(currentMenuBlock)
      }

      // [Step 2] 대메뉴 뭉치들끼리 사용자가 노션에 지정한 date 기준 오름차순 정렬
      menuBlocks.sort((a, b) => {
        const timeA = a.parent.date ? new Date(a.parent.date).getTime() : 0
        const timeB = b.parent.date ? new Date(b.parent.date).getTime() : 0
        return timeA - timeB
      })

      // [Step 3] 대메뉴 내부의 서브메뉴들끼리도 내부 date 기준 오름차순 2차 정렬
      menuBlocks.forEach(block => {
        block.children.sort((a, b) => {
          const timeA = a.date ? new Date(a.date).getTime() : 0
          const timeB = b.date ? new Date(b.date).getTime() : 0
          return timeA - timeB
        })
      })

      // [Step 4] 격리방에 있던 일반 포스트들도 date 기준 오름차순 정렬
      purePosts.sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0
        const timeB = b.date ? new Date(b.date).getTime() : 0
        return timeA - timeB
      })

      // [Step 5] 안전하게 보호된 메뉴 뭉치들을 다시 평탄한 기차 칸 배열로 재조립
      const sortedMenus = []
      menuBlocks.forEach(block => {
        sortedMenus.push(block.parent)
        sortedMenus.push(...block.children)
      })

      // [Step 6] 최종 평화적 결합: [정렬된 메뉴 군단] + [정렬된 포스트 군단]
      pages = [...sortedMenus, ...purePosts]
    }

    // 최종 연산 결과를 싱크로 바구니에 저장
    setFilteredNavPages(pages)
  }, [router, allNavPages, latestPosts, post])

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

        {/* 상단바에 완벽히 정렬된 결합 배열 전달 */}
        <Header {...props} allNavPages={filteredNavPages} />

        <main
          id='wrapper'
          className={`${siteConfig('LAYOUT_SIDEBAR_REVERSE') ? 'flex-row-reverse' : ''} relative flex justify-between w-full gap-x-6 h-full mx-auto max-w-screen-4xl`}>
          {/* 왼쪽 사이드바 메뉴판 */}
          {fullWidth ? null : (
            <div className={'hidden md:block relative z-10 '}>
              <div className='w-80 pt-14 pb-4 sticky top-0 h-screen flex justify-between flex-col'>
                <div className='overflow-y-scroll scroll-hidden pt-10 pl-5'>
                  {slotLeft}

                  {/* 💡 상단바와 동일하게 정렬 구조가 완성된 filteredNavPages를 좌측 사이드바에 완벽 동기화 주입 */}
                  <NavPostList filteredNavPages={filteredNavPages} {...props} allNavPages={filteredNavPages} />
                </div>
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

              <AdSlot type='in-article' />
              <WWAds className='w-full' orientation='horizontal' />
            </div>

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
                  <Announcement {...props} />
                </div>

                <AdSlot type='in-article' />
                <Live2D />
              </div>
            </div>
          )}
        </main>

        {GITBOOK_LOADING_COVER && <LoadingCover />}

        <JumpToTopButton />

        {/* 모바일 서랍장 메뉴판에도 동일한 안전 정렬 데이터 주입 */}
        <PageNavDrawer {...props} filteredNavPages={filteredNavPages} allNavPages={filteredNavPages} />

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
