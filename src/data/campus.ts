import { CampusLandmark } from '../types';

export const CAMPUS_CENTER = {
  lat: 37.2480,
  lng: 127.0780,
  zoom: 15
};

export const CAMPUS_LANDMARKS: CampusLandmark[] = [
  {
    id: 'khu-main-gate',
    name: '경희대 국제캠퍼스 정문',
    nameEn: 'KHU Main Gate',
    lat: 37.2480,
    lng: 127.0780,
    category: 'gate',
    icon: '🏛️'
  },
  {
    id: 'khu-woojeongwon',
    name: '우정원 (기숙사/식당/뚜레쥬르)',
    nameEn: 'Woojeongwon Dormitory',
    lat: 37.2405,
    lng: 127.0799,
    category: 'building',
    icon: '🏢'
  },
  {
    id: 'khu-eng-building',
    name: '공과대학/전자정보대학',
    nameEn: 'College of Engineering',
    lat: 37.2435,
    lng: 127.0805,
    category: 'building',
    icon: '🔬'
  },
  {
    id: 'khu-library',
    name: '중앙도서관',
    nameEn: 'Central Library',
    lat: 37.2422,
    lng: 127.0818,
    category: 'facility',
    icon: '📚'
  },
  {
    id: 'khu-art-design',
    name: '예술디자인대학',
    nameEn: 'Art & Design College',
    lat: 37.2458,
    lng: 127.0762,
    category: 'building',
    icon: '🎨'
  },
  {
    id: 'khu-foreign-lang',
    name: '외국어대학/학생회관',
    nameEn: 'College of Foreign Languages',
    lat: 37.2415,
    lng: 127.0832,
    category: 'building',
    icon: '🌐'
  },
  {
    id: 'yeongtong-station',
    name: '영통역 (수인분당선)',
    nameEn: 'Yeongtong Station',
    lat: 37.2516,
    lng: 127.0714,
    category: 'gate',
    icon: '🚇'
  }
];

// Helper to calculate distance in meters/kilometers (Haversine formula)
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
