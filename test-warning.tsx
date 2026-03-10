const React = require('react');
const { render } = require('@testing-library/react');
require('@testing-library/jest-dom');

const consoleErrorInit = console.error;
let warningCaptured = null;
console.error = function (...args) {
    if (args[0] && args[0].includes('React does not recognize the')) {
        warningCaptured = args.join(' ');
        // print stack trace to know where it came from
        console.log("WARNING STACK:", new Error().stack);
    }
    consoleErrorInit(...args);
};

// require the component, use testing environment
import { ApprovalSettingsContent } from './src/features/approval/components/approval-settings-content';

const mockFlows = [
    {
        id: '1',
        name: 'test',
        code: 'test',
        description: 'test',
        isActive: true,
        updatedAt: new Date(),
        definition: {
            nodes: [
                { id: '1', type: 'input', data: { label: 'start' }, position: { x: 0, y: 0 } },
                { id: '2', type: 'approver', data: { label: 'approver' }, position: { x: 0, y: 100 } }
            ],
            edges: []
        }
    }
];

function Test() {
    return React.createElement(ApprovalSettingsContent, { initialFlows: mockFlows });
}

const { container, queryByText } = render(React.createElement(Test));
const card = queryByText('test');
if (card) {
    card.click();
}

console.log('Render complete');
