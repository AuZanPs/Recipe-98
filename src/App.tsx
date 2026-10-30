import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Desktop } from './pages/Desktop';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 15 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface Props {
  initialAppOpen: boolean;
}

export const App = ({ initialAppOpen }: Props) => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Desktop initialAppOpen={initialAppOpen} />
    </QueryClientProvider>
  </ErrorBoundary>
);
