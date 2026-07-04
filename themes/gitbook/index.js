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
    // 💡 [🔥 진짜 해결책 1] 기존 item 오브젝트의 모든 숨겨진 속성(...item)을 완벽 보존하면서 복사합니다!
    const res = {
      ...item,
      publishDate: item.publishDate || null 
    }
    if (
      latestPosts.some(post => post?.id.indexOf(item?.short_id) === 14) &&
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
  
  // 데이터 분리를 위한 두 개의 독립적인 상태 분할
  const [filteredNavPages, setFilteredNavPages] = useState(allNavPages)
  const [sidebarNavPages, setSidebarNavPages] = useState(allNavPages)

  const searchModal = useRef(null)

  useEffect(() => {
    // 1. 현재 사용자가 브라우저 주소창에 치고 들어온 도메인을 실시간 감지
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    
    // 2. 기본 최신글 및 날짜 데이터 생성
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

    // 💡 [🔥 진짜 해결책 2] 상단 메뉴 전용 바구니에는 노션 원래 정렬 구조 그대로 주입합니다.
    setFilteredNavPages(pages)

    // 💡 [🔥 진짜 해결책 3] 왼쪽 사이드바용 바구니만 복사본을 만들어 따로 날짜 정렬을 수행합니다.
    if (pages) {
      const sorted = [...pages].sort((a, b) => {
        const timeA = a.publishDate ? new Date(a.publishDate).getTime() : 0
        const timeB = b.publishDate ? new Date(b.publishDate).getTime() : 0
        return timeA - timeB 
      })
      setSidebarNavPages(sorted)
    }
  }, [router, allNavPages])

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
        allNavPages: filteredNavPages, // 상단 바 공유 데이터 세팅
        pageNavVisible,
        changePageNavVisible
      }}>
      <Style />

      <div
        id='theme-gitbook'
        className={`${siteConfig('FONT_STYLE')} pb-16 md:pb-0 scroll-smooth bg-white dark:bg-black w-full h-full min-h-screen justify-center dark:text-gray-300`}>
        <AlgoliaSearchModal cRef={searchModal} {...props} />

        {/* 💡 [🔥 진짜 해결책 4] Header 컴포넌트에 파괴되지 않은 온전한 원본 구조 데이터를 강제 전달합니다. */}
        <Header {...props} allNavPages={filteredNavPages} customNavPages={filteredNavPages} />

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

                  {/* 전체 글 목록 사이드바에는 완벽하게 정렬된 전용 배열을 공급합니다. */}
                  <NavPostList filteredNavPages={sidebarNavPages} {...props} allNavPages={sidebarNavPages} />
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

        {GITBOOK_LOADING_COVER && <></>}

        {/* 상단 이동 버튼 */}
        <JumpToTopButton />

        {/* 모바일 메뉴 드로어에도 날짜순 정렬된 전용 배열을 전달합니다. */}
        <PageNavDrawer {...props} filteredNavPages={sidebarNavPages} allNavPages={sidebarNavPages} />

        {/* 모바일 하단 메뉴 바 */}
        <BottomMenuBar {...props} />
      </div>
    </ThemeGlobalGitbook.Provider>
  )
}

/**
 * 메인 화면 (Index)
 * 특정 문서 상세 페이지로 리다이렉트 처리
 * @param {*} props
 * @returns
 */
const LayoutIndex = props => {
  const router = useRouter()
  const index = siteConfig('GITBOOK_INDEX_PAGE', 'about', CONFIG)
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    const tryRedirect = async () => {
      if (!hasRedirected) {
        setHasRedirected(true)

        await router.push(index)

        setTimeout(() => {
          const article = document.querySelector(
            '#article-wrapper #notion-article'
          )
          if (!article) {
            console.log('노션 데이터베이스에 해당 slug 페이지가 있는지 확인해 주세요: ', index)

            const containerInner = document.querySelector(
              '#theme-gitbook #container-inner'
            )
            const newHTML = `<h1 class="text-3xl pt-12 dark:text-gray-300">설정 오류</h1><blockquote class="notion-quote notion-block-ce76391f3f2842d386468ff1eb705b92"><div>노션(Notion) 데이터베이스에 slug가 ${index}인 문서를 추가해 주세요.</div></blockquote>`
            containerInner?.insertAdjacentHTML('afterbegin', newHTML)
          }
        }, 2000)
      }
    }

    if (index) {
      console.log('리다이렉트', index)
      tryRedirect()
    } else {
      console.log('리다이렉트 없음', index)
    }
  }, [index, hasRedirected])

  return null
}

/**
 * 글 목록 (사용 안 함)
 * 페이지 네비게이션으로 대체 처리
 * @param {*} props
 * @returns
 */
const LayoutPostList = props => {
  return <></>
}

/**
 * 글 상세 페이지 (Slug)
 * @param {*} props
 * @returns
 */
const LayoutSlug = props => {
  const { post, prev, next, siteInfo, lock, validPassword } = props
  const router = useRouter()
  const index = siteConfig('GITBOOK_INDEX_PAGE', 'about', CONFIG)
  const basePath = router.asPath.split('?')[0]
  const title =
    basePath?.indexOf(index) > 0
      ? `${post?.title} | ${siteInfo?.description}`
      : `${post?.title} | ${siteInfo?.title}`

  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000
  
  useEffect(() => {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    
    if (post) {
      const hasScuTag = post.tags?.includes('scu') || 
                        post.tagItems?.some(t => t === 'scu' || t?.name === 'scu')
                        
      if (currentHost.includes('scucontentspost') && !hasScuTag) {
        router.push('/404')
        return
      }
    }

    if (!post) {
      setTimeout(() => {
        if (isBrowser) {
          const article = document.querySelector(
            '#article-wrapper #notion-article'
          )
          if (!article) {
            router.push('/404').then(() => {
              console.warn('페이지를 찾을 수 없음', router.asPath)
            })
          }
        }
      }, waiting404)
    }
  }, [post])
  
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {/* 글 잠금 (비밀번호) */}
      {lock && <ArticleLock validPassword={validPassword} />}

      {!lock && (
        <div id='container'>
          {/* 제목 */}
          <h1 className='text-3xl pt-12  dark:text-gray-300'>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post?.pageIcon} />
            )}
            {post?.title}
          </h1>

          {/* 노션 본문 */}
          {post && (
            <section className='px-1'>
              <div id='article-wrapper'>
                <NotionPage post={post} />
              </div>

              {/* 공유 */}
              <ShareBar post={post} />
              
              {/* 글 카테고리 및 태그 정보 */}
              <div className='flex justify-between'>
                {siteConfig('POST_DETAIL_CATEGORY') && post?.category && (
                  <CategoryItem category={post.category} />
                )}
                <div>
                  {siteConfig('POST_DETAIL_TAG') &&
                    post?.tagItems?.map(tag => (
                      <TagItemMini key={tag.name} tag={tag} />
                    ))}
                </div>
              </div>

              {post?.type === 'Post' && (
                <ArticleAround prev={prev} next={next} />
              )}

              <Comment frontMatter={post} />
            </section>
          )}

          {/* 글 목차 */}
          <CatalogDrawerWrapper {...props} />
        </div>
      )}
    </>
  )
}

/**
 * 검색 화면 (사용 안 함)
 * 페이지 네비게이션으로 대체 처리
 * @param {*} props
 * @returns
 */
const LayoutSearch = props => {
  return <></>
}

/**
 * 아카이브(모아보기) 화면 (기본적으로 사용 안 함)
 * 페이지 네비게이션으로 대체 처리
 * @param {*} props
 * @returns
 */
const LayoutArchive = props => {
  const { archivePosts } = props

  return (
    <>
      <div className='mb-10 pb-20 md:py-12 py-3  min-h-full'>
        {Object.keys(archivePosts)?.map(archiveTitle => (
          <BlogArchiveItem
            key={archiveTitle}
            archiveTitle={archiveTitle}
            archivePosts={archivePosts}
          />
        ))}
      </div>
    </>
  )
}

/**
 * 404 페이지
 * @param {*} props
 * @returns
 */
const Layout404 = props => {
  const router = useRouter()
  const { locale } = useGlobal()
  useEffect(() => {
    setTimeout(() => {
      const article = isBrowser && document.getElementById('article-wrapper')
      if (!article) {
        router.push('/').then(() => {
          // console.log('找不到页面', router.asPath)
        })
      }
    }, 3000)
  }, [])

  return (
    <>
      <div className='md:-mt-20 text-black w-full h-screen text-center justify-center content-center items-center flex flex-col'>
        <div className='dark:text-gray-200'>
          <h2 className='inline-block border-r-2 border-gray-600 mr-2 px-3 py-2 align-top'>
            <i className='mr-2 fas fa-spinner animate-spin' />
            404
          </h2>
          <div className='inline-block text-left h-32 leading-10 items-center'>
            <h2 className='m-0 p-0'>{locale.NAV.PAGE_NOT_FOUND_REDIRECT}</h2>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * 카테고리 목록
 */
const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  const { locale } = useGlobal()
  return (
    <>
      <div className='bg-white dark:bg-gray-700 py-10'>
        <div className='dark:text-gray-200 mb-5'>
          <i className='mr-4 fas fa-th' />
          {locale.COMMON.CATEGORY}:
        </div>
        <div id='category-list' className='duration-200 flex flex-wrap'>
          {categoryOptions?.map(category => {
            return (
              <SmartLink
                key={category.name}
                href={`/category/${category.name}`}
                passHref
                legacyBehavior>
                <div
                  className={
                    'hover:text-black dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-600 px-5 cursor-pointer py-2 hover:bg-gray-100'
                  }>
                  <i className='mr-4 fas fa-folder' />
                  {category.name}({category.count})
                </div>
              </SmartLink>
            )
          })}
        </div>
      </div>
    </>
  )
}

/**
 * 태그 목록
 */
const LayoutTagIndex = props => {
  const { tagOptions } = props
  const { locale } = useGlobal()

  return (
    <>
      <div className='bg-white dark:bg-gray-700 py-10'>
        <div className='dark:text-gray-200 mb-5'>
          <i className='mr-4 fas fa-tag' />
          {locale.COMMON.TAGS}:
        </div>
        <div id='tags-list' className='duration-200 flex flex-wrap'>
          {tagOptions?.map(tag => {
            return (
              <div key={tag.name} className='p-2'>
                <TagItemMini key={tag.name} tag={tag} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

/**
 * 로그인 페이지
 * @param {*} props
 * @returns
 */
const LayoutSignIn = props => {
  const { post } = props
  const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <>
      <div className='grow mt-20'>
        {enableClerk && (
          <div className='flex justify-center py-6'>
            <SignIn />
          </div>
        )}
        <div id='article-wrapper'>
          <NotionPage post={post} />
        </div>
      </div>
    </>
  )
}

/**
 * 회원가입 페이지
 * @param {*} props
 * @returns
 */
const LayoutSignUp = props => {
  const { post } = props
  const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <>
      <div className='grow mt-20'>
        {enableClerk && (
          <div className='flex justify-center py-6'>
            <SignUp />
          </div>
        )}
        <div id='article-wrapper'>
          <NotionPage post={post} />
        </div>
      </div>
    </>
  )
}

/**
 * 대시보드
 * @param {*} props
 * @returns
 */
const LayoutDashboard = props => {
  const { post } = props

  return (
    <>
      <div className='container grow'>
        <div className='flex flex-wrap justify-center -mx-4'>
          <div id='container-inner' className='w-full p-4'>
            {post && (
              <div id='article-wrapper' className='mx-auto'>
                <NotionPage {...props} />
              </div>
            )}
          </div>
        </div>
      </div>
      <DashboardHeader />
      <DashboardBody />
    </>
  )
}

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
