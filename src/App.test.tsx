import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders launch screen with a Launch Tools button', () => {
  render(<App />);
  const launchButton = screen.getByText(/launch tools/i);
  expect(launchButton).toBeInTheDocument();
});
