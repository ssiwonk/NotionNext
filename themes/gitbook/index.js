/**
 * 글 상세 페이지 (Slug)
 */
const LayoutSlug = props => {
  const { post, prev, next, siteInfo, lock, validPassword, allNavPages } = props
  const router = useRouter()
  const gitbookGlobal = useGitBookGlobal()
  const contextPages = gitbookGlobal?.filteredNavPages

  const [currentPrev, setCurrentPrev] = useState(prev)
  const [currentNext, setCurrentNext] = useState(next)

  const index = siteConfig('GITBOOK_INDEX_PAGE', 'about', CONFIG)
  const basePath = router.asPath.split('?')[0]
  const title =
    basePath?.indexOf(index) > 0
      ? `${post?.title} | ${siteInfo?.description}`
      : `${post?.title} | ${siteInfo?.title}`

  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000

  useEffect(() => {
    if (post) {
      const isDbItem = (post.type && ['Post', 'Page', 'Menu', 'SubMenu'].includes(post.type)) ||
                       allNavPages?.some(navPage => navPage.id === post.id || navPage.short_id === post.short_id)
                       
      const isScu404Page = post.slug === 'scu404' || router.asPath.includes('scu404')

      if (typeof window !== 'undefined' && window.location.hostname.includes('scucontentspost') && !isScu404Page) {
        if (isDbItem) {
          const hasScuTag = post.tags?.includes('scu') || 
                            post.tagItems?.some(t => t === 'scu' || t?.name === 'scu')
                            
          if (!hasScuTag) {
            router.push('/scu404')
            return
          }
        }
      }
    }

    if (!post) {
      setTimeout(() => {
        if (isBrowser) {
          const article = document.querySelector('#article-wrapper #notion-article')
          if (!article) {
            router.push('/404').then(() => console.warn('페이지를 찾을 수 없음', router.asPath))
          }
        }
      }, waiting404)
    }

    // --- [사이드바 순서 재현 및 무한 순환 로직] ---
    const targetPages = (contextPages && contextPages.length > 0) ? contextPages : allNavPages

    if (targetPages && post) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''

      // 1. 메뉴 제외 및 도메인 필터링
      const postItems = targetPages.filter(item => {
        if (item.type === 'Menu' || item.type === 'SubMenu') return false
        if (currentHost.includes('scucontentspost')) {
          return item.tags?.includes('scu') || item.tagItems?.some(t => t === 'scu' || t?.name === 'scu')
        }
        return true
      })

      // 2. 날짜 내림차순 정렬
      postItems.sort((a, b) => {
        const timeA = (a.publishDate || a.date) ? new Date(a.publishDate || a.date).getTime() : 0
        const timeB = (b.publishDate || b.date) ? new Date(b.publishDate || b.date).getTime() : 0
        return timeB - timeA
      })

      // 3. 사이드바와 동일하게 '카테고리별 그룹화'
      const categoryMap = {}
      const categoryOrder = []

      postItems.forEach(item => {
        const cat = item.category || '기타'
        if (!categoryMap[cat]) {
          categoryMap[cat] = []
          categoryOrder.push(cat)
        }
        categoryMap[cat].push(item)
      })

      // 4. 사이드바 위에서 아래 순서의 1차원 배열 생성
      const sidebarOrderedPosts = categoryOrder.flatMap(cat => categoryMap[cat])

      // 5. 제목(title) 또는 ID 기반으로 현재 글 위치(Index) 찾기
      const idx = sidebarOrderedPosts.findIndex(item => {
        if (!item || !post) return false
        const itemIdClean = item.id ? item.id.replace(/-/g, '') : ''
        const postIdClean = post.id ? post.id.replace(/-/g, '') : ''

        return (
          (item.title && post.title && item.title === post.title) ||
          (itemIdClean && postIdClean && itemIdClean === postIdClean) ||
          (item.slug && post.slug && item.slug === post.slug)
        )
      })

      // 6. 🔥 무한 순환(Circular) 이전글 / 다음글 계산
      if (idx !== -1) {
        const len = sidebarOrderedPosts.length
        if (len > 1) {
          // 첫 글에서 Prev 클릭 시 맨 마지막 글, 마지막 글에서 Next 클릭 시 맨 첫 글 연결
          const prevIdx = (idx - 1 + len) % len
          const nextIdx = (idx + 1) % len

          setCurrentPrev(sidebarOrderedPosts[prevIdx])
          setCurrentNext(sidebarOrderedPosts[nextIdx])
        } else {
          setCurrentPrev(null)
          setCurrentNext(null)
        }
      }
    }
  }, [post, allNavPages, contextPages, prev, next, router.asPath])

  const formattedDateString = post ? formatKoreanDate(post.publishDate || post.date) : ''

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {lock && <ArticleLock validPassword={validPassword} />}

      {!lock && (
        <div id='container' className='w-full'>
          <h1 className='text-3xl pt-12 font-bold dark:text-gray-300'>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post?.pageIcon} />
            )}
            {post?.title}
          </h1>

          {formattedDateString && (
            <div className='text-sm text-gray-400 dark:text-gray-500 mt-3 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-1.5'>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>{formattedDateString}</span>
            </div>
          )}

          {post && (
            <section className='px-1 mt-6'>
              <div id='article-wrapper'>
                <NotionPage post={post} />
              </div>

              <ShareBar post={post} />
              
              <div className='flex justify-between mt-6'>
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
                <ArticleAround prev={currentPrev} next={currentNext} />
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
