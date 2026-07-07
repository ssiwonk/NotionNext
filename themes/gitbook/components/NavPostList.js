import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import CONFIG from '../config'
import BlogPostCard from './BlogPostCard'
import NavPostItem from './NavPostItem'

/**
 * 블로그 목록 스크롤 페이지네이션 컴포넌트
 * @param posts 모든 글
 * @param tags 모든 태그
 * @returns {JSX.Element}
 * @constructor
 */
const NavPostList = props => {
  const { filteredNavPages } = props
  const { locale, currentSearch } = useGlobal()
  const router = useRouter()

  // 카테고리별로 글을 폴더 형태로 그룹화합니다.
  const categoryFolders = groupArticles(filteredNavPages)

  // 펼쳐진 그룹(카테고리)들의 인덱스를 저장하는 상태입니다.
  const [expandedGroups, setExpandedGroups] = useState([])

  useEffect(() => {
    // 페이지 로드 시 해당 페이지가 속한 폴더를 자동으로 열어줍니다.
    setTimeout(() => {
      const currentPath = decodeURIComponent(router.asPath.split('?')[0])
      const defaultOpenIndex = getDefaultOpenIndexByPath(
        categoryFolders,
        currentPath
      )
      
      // 🔥 [수정] 페이지 이동 시 기존에 열려있던 메뉴들을 닫지 않고, 현재 카테고리만 누적해서 열어줍니다.
      setExpandedGroups(prev => {
        if (prev.includes(defaultOpenIndex)) return prev
        return [...prev, defaultOpenIndex]
      })
    }, 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, filteredNavPages])

  // 폴더 접기/펼치기 토글 함수 (카테고리 클릭 시 호출됨)
  const toggleItem = index => {
    let newExpandedGroups = [...expandedGroups] // 새로운 펼침 그룹 배열 생성

    // 이미 열려있는 상태라면 닫고(제거), 닫혀있는 상태라면 엽니다(추가).
    if (expandedGroups.includes(index)) {
      newExpandedGroups = newExpandedGroups.filter(
        expandedIndex => expandedIndex !== index
      )
    } else {
      newExpandedGroups.push(index)
    }

    // 🔥 [수정] 배타적 접기(하나만 열기) 기능을 강제로 비활성화하여 여러 개가 동시에 열릴 수 있도록 합니다.
    // const GITBOOK_EXCLUSIVE_COLLAPSE = siteConfig('GITBOOK_EXCLUSIVE_COLLAPSE', null, CONFIG)
    // if (GITBOOK_EXCLUSIVE_COLLAPSE) {
    //   newExpandedGroups = newExpandedGroups.filter(
    //     expandedIndex => expandedIndex === index
    //   )
    // }

    // 변경된 펼침 상태를 업데이트합니다.
    setExpandedGroups(newExpandedGroups)
  }

  // 데이터가 없을 때 예외 처리
  if (!categoryFolders || categoryFolders.length === 0) {
    return (
      <div className='flex w-full items-center justify-center min-h-screen mx-auto md:-mt-20'>
        <p className='text-gray-500 dark:text-gray-300'>
          {locale.COMMON.NO_RESULTS_FOUND}{' '}
          {currentSearch && <div>{currentSearch}</div>}
        </p>
      </div>
    )
  }

  // 홈(메인) 페이지 링크 설정
  const href = siteConfig('GITBOOK_INDEX_PAGE') + ''
  const homePost = {
    id: '-1',
    title: siteConfig('DESCRIPTION'),
    href: href.indexOf('/') !== 0 ? '/' + href : href
  }

  return (
    <div
      id='posts-wrapper'
      className='w-full flex-grow space-y-0.5 pr-4 tracking-wider'>
      {/* 소개/홈 링크 카드 */}
      <BlogPostCard className='mb-4' post={homePost} />

      {/* 카테고리별 글 목록 렌더링 */}
      {categoryFolders?.map((group, index) => (
        <NavPostItem
          key={index}
          group={group}
          onHeightChange={props.onHeightChange}
          expanded={expandedGroups.includes(index)} // 펼침 상태를 자식 컴포넌트에 전달
          toggleItem={() => toggleItem(index)} // 토글 함수를 자식 컴포넌트에 전달
        />
      ))}
    </div>
  )
}

// 카테고리별로 글을 폴더 형태로 그룹화하는 함수
function groupArticles(filteredNavPages) {
  if (!filteredNavPages) {
    return []
  }
  const groups = []
  const AUTO_SORT = siteConfig('GITBOOK_AUTO_SORT', true, CONFIG)

  for (let i = 0; i < filteredNavPages.length; i++) {
    const item = filteredNavPages[i]
    const categoryName = item?.category ? item?.category : '' // 카테고리를 문자열로 변환

    let existingGroup = null
    // 자동 그룹 정렬 활성화 시: 동일한 카테고리는 자동으로 같은 폴더로 묶음 (노션의 정렬 순서 무시)
    if (AUTO_SORT) {
      existingGroup = groups.find(group => group.category === categoryName)
    } else {
      existingGroup = groups[groups.length - 1] // 마지막 그룹 가져오기
    }

    // 그룹 리스트에 데이터 추가
    if (existingGroup && existingGroup.category === categoryName) {
      existingGroup.items.push(item)
    } else {
      groups.push({ category: categoryName, items: [item] })
    }
  }
  return groups
}

/**
 * 현재 URL 경로(path)를 기준으로 어떤 카테고리 메뉴를 펼쳐야 하는지 인덱스를 반환합니다.
 * 일치하는 항목이 없으면 0(첫 번째 폴더)을 기본값으로 반환합니다.
 * @param {*} categoryFolders 
 * @param {*} path 
 * @returns {number} 펼쳐야 할 메뉴의 인덱스 번호
 */
function getDefaultOpenIndexByPath(categoryFolders, path) {
  // 현재 주소와 포스트의 href가 일치하는 카테고리 찾기
  const index = categoryFolders.findIndex(group => {
    return group.items.some(post => path === post.href)
  })

  if (index !== -1) {
    return index
  }

  return 0
}

export default NavPostList
