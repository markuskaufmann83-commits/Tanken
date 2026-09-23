export type FuelType = 'diesel' | 'e5' | 'e10';

export type SortOrder = 'price' | 'dist';

export interface Station {
  id: string;
  name: string;
  brand: string;
  street: string;
  place: string;
  lat: number;
  lng: number;
  dist: number;
  diesel: number | false | null;
  e5: number | false | null;
  e10: number | false | null;
  isOpen: boolean;
  houseNumber?: string;
  postCode?: number | string;
}

export interface TankerkoenigListResponse {
  ok: boolean;
  license?: string;
  data?: string;
  status: string;
  message?: string;
  stations?: Station[];
}

export interface OpeningTime {
  text: string;
  from: string;
  to: string;
}

export interface StationDetail {
  id: string;
  name: string;
  brand: string;
  street: string;
  houseNumber?: string;
  postCode?: number | string;
  place: string;
  openingTimes?: OpeningTime[];
  overrides?: string[];
  wholeDay?: boolean;
  isOpen: boolean;
  e5: number | false | null;
  e10: number | false | null;
  diesel: number | false | null;
  lat: number;
  lng: number;
  state?: string;
}

export interface TankerkoenigDetailResponse {
  ok: boolean;
  license?: string;
  data?: string;
  status: string;
  message?: string;
  station?: StationDetail;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  postcode?: string;
}

export interface FilterState {
  fuelType: FuelType;
  radius: number;
  onlyOpen: boolean;
  brand: string;
  sortBy: SortOrder;
}
