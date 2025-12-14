import React from 'react';

import { InstallationRoutePlan } from '../../../../types/installation-schedule';

interface InstallationRoutePlanDetailProps {
  plan: InstallationRoutePlan;
  onBack: () => void;
  onEditPlan: (planId: string) => void;
}

const InstallationRoutePlanDetail: React.FC<InstallationRoutePlanDetailProps> = ({ 
  plan, 
  onBack, 
  onEditPlan 
}) => {
  return (
    <div>
      <h3>Installation Route Plan Detail</h3>
      <div>
        <button onClick={onBack}>Back</button>
        <button onClick={() => onEditPlan(plan.id)}>Edit</button>
      </div>
      <div>
        <h4>Plan Information</h4>
        <p>Installer: {plan.installerName}</p>
        <p>Date: {plan.date}</p>
        <p>Estimated Time: {plan.estimatedStartTime} - {plan.estimatedEndTime}</p>
        <p>Total Installations: {plan.installations.length}</p>
        <p>Total Travel Time: {plan.totalTravelTime} minutes</p>
        <p>Total Travel Distance: {plan.totalTravelDistance} km</p>
      </div>
      <div>
        <h4>Installations</h4>
        <ol>
          {plan.installations.map((installation) => (
            <li key={installation.id}>
              <div>Sequence: {installation.sequence}</div>
              <div>Installation No: {installation.installationNo}</div>
              <div>Customer: {installation.customerName}</div>
              <div>Address: {installation.projectAddress}</div>
              <div>Scheduled Time: {installation.scheduledTime}</div>
              <div>Estimated Travel Time: {installation.estimatedTravelTime} minutes</div>
              <div>Estimated Travel Distance: {installation.estimatedTravelDistance} km</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default InstallationRoutePlanDetail;
