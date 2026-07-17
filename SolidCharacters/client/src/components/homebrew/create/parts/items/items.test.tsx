import { expect, test } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { Route, Router } from '@solidjs/router';
import Items from './items';
import { itemsStore } from './itemsStore';

test('renders the wizard on the Identity step', async () => {
  itemsStore._testReset();
  // Seeded SRD map makes loadSrdOnce a no-op (no polling timers in tests).
  itemsStore._testSetSrd({ Dagger: { name: 'Dagger' } });

  render(() => <Router>
    <Route path='/' component={Items} />
  </Router>);

  expect(await screen.findByText('What are you forging?')).toBeTruthy();
  expect(screen.getByRole('navigation', { name: 'Wizard steps' })).toBeTruthy();
});
