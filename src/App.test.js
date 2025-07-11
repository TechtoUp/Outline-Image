import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main application header', () => {
  render(<App />);
  const headerElement = screen.getByText(/AI Background Remover & Outliner/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders ImageUploader component initially', () => {
  render(<App />);
  // Check for text that is unique to ImageUploader
  const uploaderElement = screen.getByText(/Drag & drop an image here, or click to select a file./i);
  expect(uploaderElement).toBeInTheDocument();
});
