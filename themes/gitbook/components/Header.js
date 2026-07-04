import Collapse from '@/components/Collapse'
import DarkModeButton from '@/components/DarkModeButton'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { SignInButton, SignedOut, UserButton } from '@clerk/nextjs'
import { useRef, useState } from 'react'
import CONFIG from '../config'
import LogoBar from './LogoBar'
import { MenuBarMobile } from './MenuBarMobile'
import { MenuItemDrop } from './MenuItemDrop'
import SearchInput from './SearchInput'

/**
 * 헤더: 상단 네비게이션 바 + 메뉴
 * @param {} props
 * @returns
 */
export default function Header(props) {
  const { className, customNav, customMenu } = props
  const [isOpen, changeShow] = useState(false)
  const collapseRef = useRef(null)

  const { locale } = useGlobal()

  const defaultLinks = [
    {
      icon: 'fas fa-th',
      name: locale.COMMON.CATEGORY,
      href: '/category',
      show: siteConfig('GITBOOK_MENU_CATEGORY', null, CONFIG)
    },
    {
      icon: 'fas fa-tag',
      name: locale.COMMON.TAGS,
      href: '/tag',
      show: siteConfig('GITBOOK_BOOK_MENU_TAG', null, CONFIG)
    },
    {
      icon: 'fas fa-archive',
      name: locale.NAV.ARCHIVE,
      href: '/archive',
      show: siteConfig('GITBOOK_MENU_ARCHIVE', null, CONFIG)
    },
    {
      icon: 'fas fa-search',
      name: locale.NAV.SEARCH,
      href: '/search',
      show: siteConfig('GITBOOK_MENU_SEARCH', null, CONFIG)
    }
  ]

  let links = defaultLinks.concat(customNav)

  const toggleMenuOpen = () => {
    changeShow(!isOpen)
  }

  // 만약 커스텀 메뉴를 활성화했다면, 페이지에서 생성된 메뉴를 덮어씁니다.
  if (siteConfig('CUSTOM_MENU')) {
    links = customMenu
  }

  // ---------------------------------------------------------------------------
  // 🔥 [철벽 방어선] date 대신 '생성 일시' 고유 필드를 추적하여 무조건 오름차순 정렬
  // ---------------------------------------------------------------------------
  const getMenuTimestamp = (item) => {
    if (!item) return 0
    // NotionNext 엔진의 모든 생성일시 프로퍼티 루트 추적 (raw 데이터 포함)
    const val = item.createdTime || 
                item.created_time || 
                (item.raw && (item.raw.created_time || item.raw.createdTime)) || 
                item.date || 
                item.publishDate
                
    if (!val) return 0
    const t = new Date(val).getTime()
    return isNaN(t) ? 0 : t
  }

  if (links && Array.isArray(links)) {
    // 1. 상단 대메뉴 정렬 (과거 ➡️ 최신 오름차순)
    links = [...links].sort((a, b) => {
      const timeA = getMenuTimestamp(a)
      const timeB = getMenuTimestamp(b)
      
      // 고정 메뉴(카테고리, 태그 등 생성일이 없는 링크)는 항상 맨 앞으로 고정
      if (timeA === 0 && timeB !== 0) return -1
      if (timeA !== 0 && timeB === 0) return 1
      
      return timeA - timeB // 생성일 오름차순
    })

    // 2. 대메뉴 하위에 묶인 서브메뉴(자식들) 내부 정렬도 오름차순으로 통일
    links.forEach(link => {
      if (link.subMenus && Array.isArray(link.subMenus)) {
        link.subMenus = [...link.subMenus].sort((a, b) => getMenuTimestamp(a) - getMenuTimestamp(b))
      }
      if (link.children && Array.isArray(link.children)) {
        link.children = [...link.children].sort((a, b) => getMenuTimestamp(a) - getMenuTimestamp(b))
      }
    })
  }
  // ---------------------------------------------------------------------------

  const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <div id='top-nav' className={'fixed top-0 w-full z-20 ' + className}>
      {/* PC 버전 메뉴 */}
      <div className='flex justify-center border-b dark:border-black items-center w-full h-16 bg-white dark:bg-hexo-black-gray'>
        <div className='px-5 max-w-screen-4xl w-full flex gap-x-3 justify-between items-center'>
          {/* 좌측 */}
          <div className='flex'>
            <LogoBar {...props} />

            {/* 데스크톱 상단 메뉴 */}
            <div className='hidden md:flex'>
              {links &&
                links?.map((link, index) => (
                  <MenuItemDrop key={index} link={link} />
                ))}
            </div>
          </div>

          {/* 우측 */}
          <div className='flex items-center gap-4'>
            {/* 로그인 관련 */}
            {enableClerk && (
              <>
                <SignedOut>
                  <SignInButton mode='modal'>
                    <button className='bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2'>
                      {locale.COMMON.SIGN_IN}
                    </button>
                  </SignInButton>
                </SignedOut>
                <UserButton />
              </>
            )}
            <DarkModeButton className='text-sm items-center h-full hidden md:flex' />
            <SearchInput className='hidden md:flex md:w-52 lg:w-72' />
            {/* 접기 버튼, 모바일 기기에서만 표시 */}
            <div className='mr-1 flex md:hidden justify-end items-center space-x-4  dark:text-gray-200'>
              <DarkModeButton className='flex text-md items-center h-full' />
              <div
                onClick={toggleMenuOpen}
                className='cursor-pointer text-lg hover:scale-110 duration-150'>
                {isOpen ? (
                  <i className='fas fa-times' />
                ) : (
                  <i className='fa-solid fa-bars' />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 접이식 메뉴 */}
      <Collapse
        type='vertical'
        collapseRef={collapseRef}
        isOpen={isOpen}
        className='md:hidden'>
        <div className='bg-white dark:bg-hexo-black-gray pt-1 py-2 lg:hidden '>
          <MenuBarMobile
            {...props}
            customNav={links}
            onHeightChange={param =>
              collapseRef.current?.updateCollapseHeight(param)
            }
          />
        </div>
      </Collapse>
    </div>
  )
}
