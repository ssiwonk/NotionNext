import { isIterable } from '../../utils'

/**
 * 모든 글의 태그 가져오기
 * @param allPosts
 * @param sliceCount 기본 반환 개수는 12개, 0일 경우 전체 반환
 * @param categoryOptions categories의 드롭다운 옵션
 * @returns {Promise<{}|*[]>}
 */

/**
 * 모든 글의 카테고리 가져오기
 * @param allPosts
 * @returns {Promise<{}|*[]>}
 */
export function getAllCategories({
  allPages,
  categoryOptions,
  sliceCount = 0
}) {
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  if (!allPosts || !categoryOptions) {
    return []
  }

  // 개수 계산
  let categories = allPosts?.map(p => p.category)
  categories = [...categories.flat()]
  const categoryObj = {}
  categories.forEach(category => {
    if (category in categoryObj) {
      categoryObj[category]++
    } else {
      categoryObj[category] = 1
    }
  })

  const list = []
  if (isIterable(categoryOptions)) {
    for (const c of categoryOptions) {
      const count = categoryObj[c.value]
      if (count) {
        list.push({ id: c.id, name: c.value, color: c.color, count })
      }
    }
  }

  // =================================================================
  // [💡 SCU 도움말 센터 전용] 왼쪽 사이드바 카테고리 순서 강제 고정 정렬
  // =================================================================
  // 왼쪽 메뉴판에 보여주고 싶은 순서 그대로 한글 이름을 배열에 적어줍니다.
  const customCategoryOrder = ['콘텐츠 정책', '콘텐츠 FAQ', '콘텐츠 개발', '테스트']

  list.sort((a, b) => {
    let indexA = customCategoryOrder.indexOf(a.name)
    let indexB = customCategoryOrder.indexOf(b.name)

    // 만약 나중에 배열을 수정하지 않고 노션에 새로운 카테고리를 추가한다면, 
    // 정렬이 꼬이지 않도록 무조건 메뉴판 맨 뒤(999번 순위)로 보냅니다.
    if (indexA === -1) indexA = 999
    if (indexB === -1) indexB = 999

    return indexA - indexB
  })
  // =================================================================

  if (sliceCount && sliceCount > 0) {
    return list.slice(0, sliceCount)
  } else {
    return list
  }
}
