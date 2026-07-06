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
 * 🔥 [추가] 상위 페이지의 태그 권한을 재귀적으로 상속받았는지 확인하는 함수
 */
function checkScuTagInherited(page, allPagesMap) {
  if (!page) return false

  // 1. 현재 페이지 자체에 scu 태그가 있는지 확인
  const hasScuTag = page.tags?.includes('scu') || 
                    page.tagItems?.some(t => t === 'scu' || t?.name === 'scu')
  if (hasScuTag) return true

  // 2. 자체 태그가 없다면, 상위 페이지(parentId)를 찾아서 재귀적으로 확인
  const parentId = page.parentId || page.parent_id
  if (parentId) {
    const parentPage = allPagesMap.get(parentId)
    return checkScuTagInherited(parentPage, allPagesMap)
  }

  return false
}

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
    
    // 1. 기본 마킹 데이터 확보
    let pages = getNavPagesWithLatest(allNavPages, latestPosts, post)
    
    // 🔥 [수정] 빠른 상위 조회를 위해 ID 기반의 Map 객체 생성
    const allPagesMap = new Map(pages?.map(p => [p.id, p]) || [])
    
    // 2. 도메인별 필터링
    pages = pages?.filter(item => {
      if (currentHost.includes('scucontentspost')) {
        // 🔥 상속 관계를 고려하여 scu 권한 체크
        return checkScuTagInherited(item, allPagesMap)
      }
      return true
    })

    if (pages) {
      // 3. 메뉴 데이터와 일반 포스트 분리
      const menuItems = pages.filter(item => item.type === 'Menu' || item.type === 'SubMenu')
      const postItems = pages.filter(item => item.type !== 'Menu' && item.type !== 'SubMenu')

      // 메뉴 아이템 정렬
      menuItems.sort((a, b) => {
        const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0
        const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0
        return timeB - timeA
      })

      // 일반 포스트 정렬
      postItems.sort((a, b) => {
        const timeA = a.publishDate ? new Date(a.publishDate).getTime() : 0
        const timeB = b.publishDate ? new Date(b.publishDate).getTime() : 0
        return timeB - timeA
      })

      // 5. 정렬 완료된 메뉴와 포스트 결합
      const finalPages = [...menuItems, ...postItems]
      setFilteredNavPages(finalPages)
    } else {
      setFilteredNavPages(pages)
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
        allNavPages: filteredNavPages, 
        pageNavVisible,
        changePageNavVisible
      }}>
      <Style />

      <div
        id='theme-gitbook'
        className={`${siteConfig('FONT_STYLE')} pb-16 md:pb-0 scroll-smooth bg-white dark:bg-black w-full h-full min-h-screen justify-center dark:text-gray-300`}>
        <AlgoliaSearchModal cRef={searchModal} {...props} />

        <Header 
          {...props} 
          allNavPages={filteredNavPages}
          customNav={filteredNavPages?.filter(item => item.type === 'Menu' || item.type === 'SubMenu')} 
        />

        <main
          id='wrapper'
          className={`${siteConfig('LAYOUT_SIDEBAR_REVERSE') ? 'flex-row-reverse' : ''} relative flex justify-between w-full gap-x-6 h-full mx-auto max-w-screen-4xl`}>
          {fullWidth ? null : (
            <div className={'hidden md:block relative z-10 '}>
              <div className='w-80 pt-14 pb-4 sticky top-0 h-screen flex justify-between flex-col'>
                <div className='overflow-y-scroll scroll-hidden pt-10 pl-5'>
                  {slotLeft}

                  <NavPostList 
                    {...props} 
                    allNavPages={filteredNavPages?.filter(item => item.type !== 'Menu' && item.type !== 'SubMenu')} 
                    filteredNavPages={filteredNavPages?.filter(item => item.type !== 'Menu' && item.type !== 'SubMenu')} 
                  />
                </div>
                <Footer {...props} />
              </div>
            </div>
          )}

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

        <PageNavDrawer 
          {...props} 
          filteredNavPages={filteredNavPages} 
          allNavPages={filteredNavPages} 
        />

        <BottomMenuBar {...props} />
      </div>
    </ThemeGlobalGitbook.Provider>
  )
}

/**
 * 메인 화면 (Index)
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
      tryRedirect()
    }
  }, [index, hasRedirected])

  return null
}

const LayoutPostList = props => {
  return <></>
}

/**
 * 글 상세 페이지 (Slug)
 */
const LayoutSlug = props => {
  // 🔥 [수정] props에서 전체 페이지 목록인 allNavPages를 함께 구조분해 할당합니다.
  const { post, prev, next, siteInfo, lock, validPassword, allNavPages } = props
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
      // 🔥 [수정] 전체 페이지 맵을 생성하여 상속 권한을 체크합니다.
      const allPagesMap = new Map(allNavPages?.map(p => [p.id, p]) || [])
      const hasScuTag = checkScuTagInherited(post, allPagesMap)
                        
      // 🔥 [안전장치] 현재 보고 있는 페이지가 무한 안내 페이지('scu404')라면 리다이렉션을 건너뜁니다.
      const isScu404Page = post.slug === 'scu404' || router.asPath.includes('scu404')

      if (currentHost.includes('scucontentspost') && !hasScuTag && !isScu404Page) {
        // 🔥 무조건 404로 가는 대신, 노션에 생성한 'scu404' 페이지로 이동시킵니다.
        router.push('/scu404')
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
  }, [post, allNavPages]) // 🔥 의존성 배열에 allNavPages 추가
  
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {lock && <ArticleLock validPassword={validPassword} />}

      {!lock && (
        <div id='container'>
          <h1 className='text-3xl pt-12  dark:text-gray-300'>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post?.pageIcon} />
            )}
            {post?.title}
          </h1>

          {post && (
            <section className='px-1'>
              <div id='article-wrapper'>
                <NotionPage post={post} />
              </div>

              <ShareBar post={post} />
              
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

          <CatalogDrawerWrapper {...props} />
        </div>
      )}
    </>
  )
}

const LayoutSearch = props => {
  return <></>
}

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

const Layout404 = props => {
  const router = useRouter()
  const { locale } = useGlobal()
  useEffect(() => {
    setTimeout(() => {
      const article = isBrowser && document.getElementById('article-wrapper')
      if (!article) {
        router.push('/')
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

const LayoutSignIn = props => {
  const { post } = props
  return (
    <>
      <div className='grow mt-20'>
        <div id='article-wrapper'>
          <NotionPage post={post} />
        </div>
      </div>
    </>
  )
}

const LayoutSignUp = props => {
  const { post } = props
  return (
    <>
      <div className='grow mt-20'>
        <div id='article-wrapper'>
          <NotionPage post={post} />
        </div>
      </div>
    </>
  )
}

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
