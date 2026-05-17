import React from 'react'
import { useFamilyStore } from '../../stores/familyData'
import { SpaceList }      from './SpaceList'
import { SpaceDashboard } from './SpaceDashboard'

export function FamilyIndex() {
  const activeSpaceId = useFamilyStore(s => s.activeSpaceId)
  return activeSpaceId ? <SpaceDashboard /> : <SpaceList />
}
