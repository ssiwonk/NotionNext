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

const ThemeGlobalGitbook = createContext()
export const useGitBookGlobal = () => useContext(ThemeGlobalGitbook)

function getNavPagesWithLatest(allNavPages, latestPosts, post) {
  const postReadTime = JSON.parse(
    localStorage.getItem('post_read_time') || '{}'
  )
  if (post) {
    postReadTime[getShortId(post.id)] = new Date().getTime()
  }
  localStorage.setItem('post_read_time', JSON.stringify(postReadTime))

  // 🔍 [디버그 1] 노션 서버가 이 테마에 최초로 던져준 원본 날것의 데이터 검사
  console.log('⚙️ [디버그 1] 노션 원본 전송 데이터 (allNavPages):', allNavPages)

  return allNavPages?.map((item, idx) => {
    // 각 아이템이 어떤 속성들을 가진 채로 태어나는지 콘솔에 한 줄씩 나열
    console.log(` -> [원본 추출 ${idx}] 제목: "${item.title}" | 타입(type): "${item.type}" | 부모ID(parentId): "${item.parentId}"`)
    
    return {
      ...item,
      publishDate: item.publishDate || null 
    }
  })
}

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
  const [sidebarNavPages, setSidebarNavPages] = useState(allNavPages)

  const searchModal = useRef(null)

  useEffect(() => {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    let pages = getNavPagesWithLatest(allNavPages, latestPosts, post)
    
    pages = pages?.filter(item => {
      if (currentHost.includes('scucontentspost')) {
        return item.tags?.includes('scu') || item.tagItems?.some(t => t === 'scu' || t?.name === 'scu')
      }
      return true
    })

    setFilteredNavPages(pages)

    if (pages) {
      const sorted = [...pages].sort((a, b) => {
        const timeA = a.publishDate ? new Date(a.publishDate).getTime() : 0
        const timeB = b.publishDate ? new Date(b.publishDate).getTime() : 0
        return timeA - timeB 
      })
      setSidebarNavPages(sorted)
    }
  }, [router, allNavPages])

  // 🔍 [디버그 2] 최종 조율을 마치고 렌더링 직전, Header와 사이드바가 먹게 될 최종 요리 데이터 검사
  console.log('⚙️ [디버그 2] Header 주입 직전 데이터 (filteredNavPages):', filteredNavPages)
  console.log('⚙️ [디버그 3] 사이드바 주입 직전 데이터 (sidebarNavPages):', sidebarNavPages)

  const GITBOOK_LOADING_COVER = siteConfig('GITBOOK_LOADING_COVER', true, CONFIG)
  
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

      <div id='theme-gitbook' className={`${siteConfig('FONT_STYLE')} pb-16 md:pb-0 scroll-smooth bg-white dark:bg-black w-full h-full min-h-screen justify-center dark:text-gray-300`}>
        <AlgoliaSearchModal cRef={searchModal} {...props} />

        {/* 상단바 */}
        <Header {...props} allNavPages={filteredNavPages} customNavPages={filteredNavPages} />

        <main id='wrapper' className={`${siteConfig('LAYOUT_SIDEBAR_REVERSE') ? 'flex-row-reverse' : ''} relative flex justify-between w-full gap-x-6 h-full mx-auto max-w-screen-4xl`}>
          {/* 왼쪽 사이드바 */}
          {fullWidth ? null : (
            <div className={'hidden md:block relative z-10 '}>
              <div className='w-80 pt-14 pb-4 sticky top-0 h-screen flex justify-between flex-col'>
                <div className='overflow-y-scroll scroll-hidden pt-10 pl-5'>
                  {slotLeft}
                  <NavPostList filteredNavPages={sidebarNavPages} {...props} allNavPages={sidebarNavPages} />
                </div>
                <Footer {...props} />
              </div>
            </div>
          )}

          {/* 중앙 콘텐츠 */}
          <div id='center-wrapper' className='flex flex-col justify-between w-full relative z-10 pt-14 min-h-screen'>
            <div id='container-inner' className={`w-full ${fullWidth ? 'px-5' : 'max-w-3xl px-3 lg:px-0'} justify-center mx-auto`}>
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
            <div className={'w-72 hidden 2xl:block dark:border-transparent flex-shrink-0 relative z-10 '}>
              <div className='py-14 sticky top-0'>
                <ArticleInfo post={props?.post ? props?.post : props.notice} />
                <div>
                  <Catalog {...props} />
                  {slotRight}
                  {router.route === '/' && (
                    <>
                      <InfoCard {...props} />
                      {siteConfig('GITBOOK_WIDGET_REVOLVER_MAPS', null, CONFIG) === 'true' && <RevolverMaps />}
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

        <JumpToTopButton />
        <PageNavDrawer {...props} filteredNavPages={sidebarNavPages} allNavPages={sidebarNavPages} />
        <BottomMenuBar {...props} />
      </div>
    </ThemeGlobalGitbook.Provider>
  )
}

const LayoutIndex = props => {
  const router = useRouter()
  const index = siteConfig('GITBOOK_INDEX_PAGE', 'about', CONFIG)
  const [hasRedirected, setHasRedirected] = useState(false)
  useEffect(() => {
    const tryRedirect = async () => {
      if (!hasRedirected) {
        setHasRedirected(true)
        await router.push(index)
      }
    }
    if (index) tryRedirect()
  }, [index, hasRedirected])
  return null
}

const LayoutPostList = props => <></>
const LayoutSearch = props => <></>
const LayoutArchive = props => <></>
const Layout404 = props => <></>
const LayoutCategoryIndex = props => <></>
const LayoutTagIndex = props => <></>
const LayoutSignIn = props => <></>
const LayoutSignUp = props => <></>
const LayoutDashboard = props => <></>

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
