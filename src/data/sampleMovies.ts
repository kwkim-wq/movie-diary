// Sample seed data for dev. Mirrors design-handoff/data.jsx (9 entries) but
// reshaped to the MovieEntry schema (handoff.html §7).
//
// Notes:
//   - posterPath is null because we lean on the CSS posters (posterKind) until
//     the user adds a TMDB key.
//   - createdAt / updatedAt fall back to the watched datetime (with a
//     reasonable HH:MM:SS suffix so sorts are deterministic).
//   - tmdbId is filled with the real TMDB ids where known so that the detail
//     page's "previous viewings" group-by works once Phase 4 lights it up.

import { entryId } from '../lib/id';
import type { MovieEntry, PosterKind } from '../types';

interface RawSample {
  title: string;
  originalTitle: string;
  director: string;
  year: number;
  runtime: number;
  posterKind: PosterKind;
  watchedDate: string; // YYYY-MM-DD
  watchedTime: string; // HH:MM:SS
  rating: number;
  genres: string[];
  note: string;
  tmdbId: number;
}

const RAW: RawSample[] = [
  {
    title: '화양연화',
    originalTitle: 'In the Mood for Love',
    director: '왕가위',
    year: 2000,
    runtime: 98,
    posterKind: 'wong',
    watchedDate: '2026-04-22',
    watchedTime: '23:14:00',
    rating: 5,
    genres: ['로맨스', '드라마'],
    note: '복도와 계단, 빨간 벽지의 호텔. 첼로의 한 음이 끝없이 늘어진다. 두 사람은 서로의 삶을 거울처럼 비추다, 결국 비밀 하나를 나무 구멍에 묻고 떠난다. 절제된 슬픔이 이렇게 사치스러울 수 있나.',
    tmdbId: 843,
  },
  {
    title: '2001 스페이스 오디세이',
    originalTitle: '2001: A Space Odyssey',
    director: '스탠리 큐브릭',
    year: 1968,
    runtime: 149,
    posterKind: 'kubrick',
    watchedDate: '2026-04-15',
    watchedTime: '21:30:00',
    rating: 4.5,
    genres: ['SF', '아트'],
    note: '뼛조각이 우주선이 되는 순간, 백만 년이 컷 한 번에 사라진다. HAL의 빨간 눈이 자꾸 따라온다.',
    tmdbId: 62,
  },
  {
    title: '제3의 사나이',
    originalTitle: 'The Third Man',
    director: '캐롤 리드',
    year: 1949,
    runtime: 104,
    posterKind: 'noir',
    watchedDate: '2026-04-08',
    watchedTime: '20:00:00',
    rating: 4,
    genres: ['느와르', '미스터리'],
    note: '비엔나의 젖은 자갈길과 치터 음악. 해리 라임이 회전목마에서 던진 한 마디가 오래 남는다.',
    tmdbId: 1092,
  },
  {
    title: '그랜드 부다페스트 호텔',
    originalTitle: 'The Grand Budapest Hotel',
    director: '웨스 앤더슨',
    year: 2014,
    runtime: 99,
    posterKind: 'wes',
    watchedDate: '2026-03-30',
    watchedTime: '19:45:00',
    rating: 4.5,
    genres: ['코미디', '어드벤처'],
    note: '핑크 케이크 같은 호텔. 구스타브의 향수와 시(詩)가 만든 작은 우주.',
    tmdbId: 120467,
  },
  {
    title: '스토커',
    originalTitle: 'Stalker',
    director: '안드레이 타르코프스키',
    year: 1979,
    runtime: 162,
    posterKind: 'tarkovsky',
    watchedDate: '2026-03-20',
    watchedTime: '22:10:00',
    rating: 5,
    genres: ['SF', '철학'],
    note: '비 오는 방, 세 남자의 침묵. 〈존〉에 들어선 이후 시간이 다르게 흐른다.',
    tmdbId: 1398,
  },
  {
    title: '미치광이 피에로',
    originalTitle: 'Pierrot le Fou',
    director: '장 뤽 고다르',
    year: 1965,
    runtime: 110,
    posterKind: 'godard',
    watchedDate: '2026-03-12',
    watchedTime: '23:00:00',
    rating: 4,
    genres: ['뉴웨이브'],
    note: '지중해의 파랑, 다이너마이트의 노랑. 시(詩)와 총성이 같은 문장에 들어간다.',
    tmdbId: 269,
  },
  {
    title: '올드보이',
    originalTitle: 'Oldboy',
    director: '박찬욱',
    year: 2003,
    runtime: 120,
    posterKind: 'kim',
    watchedDate: '2026-02-28',
    watchedTime: '21:00:00',
    rating: 5,
    genres: ['스릴러', '드라마'],
    note: '복수는 식어야 맛있다고 했던가. 복도 격투신은 오래 잊히지 않는다.',
    tmdbId: 670,
  },
  {
    title: '8½',
    originalTitle: 'Otto e mezzo',
    director: '페데리코 펠리니',
    year: 1963,
    runtime: 138,
    posterKind: 'fellini',
    watchedDate: '2026-02-14',
    watchedTime: '22:30:00',
    rating: 4.5,
    genres: ['아트', '드라마'],
    note: '꿈과 현실의 카니발. 마르첼로의 검은 모자 아래 모든 여자가 동시에 존재한다.',
    tmdbId: 956,
  },
  {
    title: '기생충',
    originalTitle: 'Parasite',
    director: '봉준호',
    year: 2019,
    runtime: 132,
    posterKind: 'bong',
    watchedDate: '2026-02-02',
    watchedTime: '19:30:00',
    rating: 5,
    genres: ['스릴러', '블랙코미디'],
    note: '계단의 영화. 위에서 아래로, 아래에서 더 아래로. 비 오는 밤 반지하로 흐르는 물의 색.',
    tmdbId: 496243,
  },
];

function buildEntry(raw: RawSample): MovieEntry {
  const watchedISO = `${raw.watchedDate}T${raw.watchedTime}+09:00`;
  return {
    id: entryId(watchedISO, raw.title, 1),
    tmdbId: raw.tmdbId,
    title: raw.title,
    originalTitle: raw.originalTitle,
    year: raw.year,
    runtime: raw.runtime,
    director: raw.director,
    posterPath: null,
    posterKind: raw.posterKind,
    genres: raw.genres,
    watched: watchedISO,
    rating: raw.rating,
    note: raw.note,
    tags: [],
    liked: false,
    createdAt: watchedISO,
    updatedAt: watchedISO,
  };
}

export const SAMPLE_MOVIES: MovieEntry[] = RAW.map(buildEntry);
