import React from 'react';

import { RecentActivity } from '@/shared/types/dashboard';

import { ActivityItem } from './activity-item';

interface ActivityListProps {
  activities: RecentActivity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <ul className="space-y-1">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </ul>
  );
}
