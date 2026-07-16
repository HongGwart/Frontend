import React from 'react';
import { NaverMapView } from '@mj-studio/react-native-naver-map';

export default function MapScreen() {
  return (
    <NaverMapView
      style={{ flex: 1 }}
      initialCamera={{
        latitude: 37.5504,
        longitude: 126.9251,
        zoom: 16,
      }}
    />
  );
}