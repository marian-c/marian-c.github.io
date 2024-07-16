export type MapEntry<T> = {
  value: T;
  key: number;
  index: number;
  next: MapEntry<T> | null;
  prev: MapEntry<T> | null;
};

export type LinkedMap<T> = Record<number, MapEntry<T>>;
