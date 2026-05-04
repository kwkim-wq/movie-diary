// Sample movie data used across the three scenes
const SAMPLE_MOVIES = [
  {
    id: 1, title: '화양연화', titleEn: 'In the Mood for Love',
    director: '왕가위 · Wong Kar-wai', year: 2000, runtime: 98,
    poster: 'wong', watched: '2026-04-22', rating: 5,
    genres: ['로맨스', '드라마'],
    note: '복도와 계단, 빨간 벽지의 호텔. 첼로의 한 음이 끝없이 늘어진다. 두 사람은 서로의 삶을 거울처럼 비추다, 결국 비밀 하나를 나무 구멍에 묻고 떠난다. 절제된 슬픔이 이렇게 사치스러울 수 있나.'
  },
  {
    id: 2, title: '2001 스페이스 오디세이', titleEn: '2001: A Space Odyssey',
    director: '스탠리 큐브릭 · Stanley Kubrick', year: 1968, runtime: 149,
    poster: 'kubrick', watched: '2026-04-15', rating: 4.5,
    genres: ['SF', '아트'],
    note: '뼛조각이 우주선이 되는 순간, 백만 년이 컷 한 번에 사라진다. HAL의 빨간 눈이 자꾸 따라온다.'
  },
  {
    id: 3, title: '제3의 사나이', titleEn: 'The Third Man',
    director: '캐롤 리드 · Carol Reed', year: 1949, runtime: 104,
    poster: 'noir', watched: '2026-04-08', rating: 4,
    genres: ['느와르', '미스터리'],
    note: '비엔나의 젖은 자갈길과 치터 음악. 해리 라임이 회전목마에서 던진 한 마디가 오래 남는다.'
  },
  {
    id: 4, title: '그랜드 부다페스트 호텔', titleEn: 'The Grand Budapest Hotel',
    director: '웨스 앤더슨 · Wes Anderson', year: 2014, runtime: 99,
    poster: 'wes', watched: '2026-03-30', rating: 4.5,
    genres: ['코미디', '어드벤처'],
    note: '핑크 케이크 같은 호텔. 구스타브의 향수와 시(詩)가 만든 작은 우주.'
  },
  {
    id: 5, title: '스토커', titleEn: 'Stalker',
    director: '안드레이 타르코프스키 · Andrei Tarkovsky', year: 1979, runtime: 162,
    poster: 'tarkovsky', watched: '2026-03-20', rating: 5,
    genres: ['SF', '철학'],
    note: '비 오는 방, 세 남자의 침묵. 〈존〉에 들어선 이후 시간이 다르게 흐른다.'
  },
  {
    id: 6, title: '미치광이 피에로', titleEn: 'Pierrot le Fou',
    director: '장 뤽 고다르 · Jean-Luc Godard', year: 1965, runtime: 110,
    poster: 'godard', watched: '2026-03-12', rating: 4,
    genres: ['뉴웨이브'],
    note: '지중해의 파랑, 다이너마이트의 노랑. 시(詩)와 총성이 같은 문장에 들어간다.'
  },
  {
    id: 7, title: '올드보이', titleEn: 'Oldboy',
    director: '박찬욱 · Park Chan-wook', year: 2003, runtime: 120,
    poster: 'kim', watched: '2026-02-28', rating: 5,
    genres: ['스릴러', '드라마'],
    note: '복수는 식어야 맛있다고 했던가. 복도 격투신은 오래 잊히지 않는다.'
  },
  {
    id: 8, title: '8½', titleEn: 'Otto e mezzo',
    director: '페데리코 펠리니 · Federico Fellini', year: 1963, runtime: 138,
    poster: 'fellini', watched: '2026-02-14', rating: 4.5,
    genres: ['아트', '드라마'],
    note: '꿈과 현실의 카니발. 마르첼로의 검은 모자 아래 모든 여자가 동시에 존재한다.'
  },
  {
    id: 9, title: '기생충', titleEn: 'Parasite',
    director: '봉준호 · Bong Joon-ho', year: 2019, runtime: 132,
    poster: 'bong', watched: '2026-02-02', rating: 5,
    genres: ['스릴러', '블랙코미디'],
    note: '계단의 영화. 위에서 아래로, 아래에서 더 아래로. 비 오는 밤 반지하로 흐르는 물의 색.'
  },
];

window.SAMPLE_MOVIES = SAMPLE_MOVIES;
