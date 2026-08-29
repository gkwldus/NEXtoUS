export type StoreType = 'food' | 'pub' | 'cafe' | 'life';

export interface AffiliateStore {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  type: StoreType;
  subType?: string;
  benefit: string;
  desc?: string;
  addr?: string;
  address?: string;
  img?: string;
  area: 'campus' | 'yeongtong' | 'suwon_haenggung' | 'other';
  areaName: string;
  tel?: string;
  openHours?: string;
  tags: string[];
  recommendedMenu?: string;
  discountScore?: number;
}

export interface CampusLandmark {
  id: string;
  name: string;
  nameEn?: string;
  lat: number;
  lng: number;
  category: 'gate' | 'building' | 'facility';
  icon: string;
}

export type FilterCategory = 'all' | 'food' | 'pub' | 'cafe' | 'life' | 'near_campus' | 'favorites';

