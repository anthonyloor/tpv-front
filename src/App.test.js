import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import LoginPage from './components/pages/LoginPage';

beforeEach(() => {
  localStorage.setItem(
    'licenseData',
    JSON.stringify({ licenseKey: 'abc', id_shop: 11, url: 'penaprieta8' })
  );
  global.fetch = jest.fn((url) => {
    if (url.includes('license_check')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ status: 'OK', message: 'License actived' }),
      });
    }
    if (url.includes('employees')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});

afterEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

test('renders login heading for shop', async () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage shopRoute="penaprieta8" />
      </AuthProvider>
    </MemoryRouter>
  );

  const heading = await screen.findByRole('heading', {
    name: /Iniciar Sesión/i,
  });
  expect(heading).toBeInTheDocument();
});
