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
 * 기본 레이아웃 Shell (중추 프레임워크)
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
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    let pages = getNavPagesWithLatest(allNavPages, latestPosts, post)
    
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

    // ✨ [하이브리드 블록 구조화 그룹 정렬 알고리즘 + 예외 안전장치]
    if (pages && pages.length > 0) {
      const menuBlocks = []
      const purePosts = []
      let currentMenuBlock = null

      pages.forEach(item => {
        if (item.type === 'Menu') {
          if (currentMenuBlock) menuBlocks.push(currentMenuBlock)
          currentMenuBlock = { parent: item, children: [] }
        } else if (item.type === 'SubMenu') {
          if (currentMenuBlock) {
            currentMenuBlock.children.push(item)
          } else {
            purePosts.push(item)
          }
        } else {
          purePosts.push(item)
        }
      })
      if (currentMenuBlock) menuBlocks.push(currentMenuBlock)

      // 날짜 데이터가 비어있거나 깨졌을 때 NaN 빌드 에러 방어 함수
      const getSafeTime = (dateStr) => {
        if (!dateStr) return 0
        const t = new Date(dateStr).getTime()
        return isNaN(t) ? 0 : t
      }

      // 대메뉴 정렬
      menuBlocks.sort((a, b) => getSafeTime(a.parent?.date) - getSafeTime(b.parent?.date))

      // 서브메뉴 정렬
      menuBlocks.forEach(block => {
        block.children.sort((a, b) => getSafeTime(a.date) - getSafeTime(b.date))
      })

      // 일반 포스트 정렬
      purePosts.sort((a, b) => getSafeTime(a.date) - getSafeTime(b.date))

      const sortedMenus = []
      menuBlocks.forEach(block => {
        sortedMenus.push(block.parent)
        sortedMenus.push(...block.children)
      })

      pages = [...sortedMenus, ...purePosts]
    }

    setFilteredNavPages(pages)
  }, [router, allNavPages, latestPosts, post])

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
        <Header {...props} allNavPages={filteredNavPages} />

        <main id='wrapper' className={`${siteConfig('LAYOUT_SIDEBAR_REVERSE') ? 'flex-row-reverse' : ''} relative flex justify-between w-full gap-x-6 h-full mx-auto max-w-screen-4xl`}>
          {fullWidth ? null : (
            <div className={'hidden md:block relative z-10 '}>
              <div className='w-80 pt-14 pb-4 sticky top-0 h-screen flex justify-between flex-col'>
                <div className='overflow-y-scroll scroll-hidden pt-10 pl-5'>
                  {slotLeft}
                  <NavPostList filteredNavPages={filteredNavPages} {...props} allNavPages={filteredNavPages} />
                </div>
                <Footer {...props} />
              </div>
            </div>
          )}

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

        {GITBOOK_LOADING_COVER && <LoadingCover />}
        <JumpToTopButton />
        <PageNavDrawer {...props} filteredNavPages={filteredNavPages} allNavPages={filteredNavPages} />
        <BottomMenuBar {...props} />
      </div>
    </ThemeGlobalGitbook.Provider>
  )
}

/**
 * 💡 [구조 교정] 글 목록 상위 레이아웃들은 더이상 중첩해서 LayoutBase를 부르지 않고 
 * 오직 LayoutPostList 하나만 상속받거나 단일 처리하여 연쇄 충돌을 방지합니다.
 */
const LayoutIndex = props => {
  return <LayoutPostList {...props} />
}

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

const LayoutCategoryIndex = props => {
  return <LayoutPostList {...props} />
}

const LayoutTagIndex = props => {
  return <LayoutPostList {...props} />
}

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
