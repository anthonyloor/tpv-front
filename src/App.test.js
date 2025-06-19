import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import AuthProvider from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ClientProvider } from './contexts/ClientContext';
import { CartProvider } from './contexts/CartContext';
import PinProvider from './contexts/PinContext';
import { PrimeReactProvider } from 'primereact/api';

test('shows license modal on first load', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ version: '1' }) })
  );

  render(
    <PrimeReactProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/penaprieta8']}>
          <ConfigProvider>
            <ClientProvider>
              <CartProvider>
                <PinProvider>
                  <App />
                </PinProvider>
              </CartProvider>
            </ClientProvider>
          </ConfigProvider>
        </MemoryRouter>
      </AuthProvider>
    </PrimeReactProvider>
  );

  expect(await screen.findByText(/Ingrese su Licencia/i)).toBeInTheDocument();
});
