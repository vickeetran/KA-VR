// import React, { PropTypes } from 'react';
import React from 'react';
import QuotesContainer from '../quotes/QuotesContainer';
import TodoApp from '../todo/App';

// Import calendar, settings components
const RightDashboard = () => (
  <div className="rightdashboard hide-on-small-only col m4">
    <TodoApp />
    <div>
      <QuotesContainer />
    </div>
  </div>
);

export default RightDashboard;
