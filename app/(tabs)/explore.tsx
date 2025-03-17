import React from 'react';
import { StyleSheet } from 'react-native';
import { ExploreProvider } from '../../components/explore/contexts/ExploreContext';
import { ExploreScreen } from '../../components/explore/screens/ExploreScreen';

export default function ExplorePage() {
  return (
    <ExploreProvider>
      <ExploreScreen />
    </ExploreProvider>
  );
}

const styles = StyleSheet.create({});
