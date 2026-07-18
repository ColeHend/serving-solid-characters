import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks (must come before importing the target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  setParams: vi.fn(),
  navigate: vi.fn(),
  snackbar: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
}));

vi.mock('@solidjs/router', () => ({
  useSearchParams: () => [h.params, h.setParams],
  useNavigate: () => h.navigate,
}));
// Spy on snackbar calls; everything else stays the (test-mock) library.
vi.mock('coles-solid-library', async (importOriginal) => {
  const actual = await importOriginal<typeof import('coles-solid-library')>();
  return { ...actual, addSnackbar: h.snackbar };
});
// The shared FeaturesPopup is heavy (mads editors, SRD catalogs) — the wizard shell
// mounts it closed; stub it out for these tests.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: () => null,
}));
// itemsStore reaches homebrewManager through the shared barrel.
vi.mock('../../../../../../shared', async (orig) => {
  const actual = await orig<typeof import('../../../../../../shared')>();
  return {
    ...actual,
    homebrewManager: { items: () => [], addItem: h.addItem, updateItem: h.updateItem },
  };
});

import Items from '../items';
import { itemsStore } from '../itemsStore';

beforeEach(() => {
  vi.clearAllMocks();
  h.params = {};
  itemsStore._testReset();
  // Seeded SRD map makes loadSrdOnce a no-op (no polling timers in tests).
  itemsStore._testSetSrd({ Dagger: { name: 'Dagger' } });
});

describe('Items wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Items />);
    expect(screen.getByText('What are you forging?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Details →'));
    await waitFor(() => expect(screen.getByText('What are its stats?')).toBeTruthy());
    fireEvent.click(screen.getByText('Continue to Features →'));
    await waitFor(() => expect(screen.getByText('Does it do anything special?')).toBeTruthy());
    fireEvent.click(screen.getByText('Review →'));
    await waitFor(() => expect(screen.getByText('Ready to forge it?')).toBeTruthy());
  });

  it('switches the Details panel when a kind card is picked', async () => {
    render(() => <Items />);
    fireEvent.click(screen.getByText('Weapon'));
    fireEvent.click(screen.getByText('Continue to Details →'));
    await waitFor(() => expect(screen.getByText('Weapon statistics')).toBeTruthy());

    fireEvent.click(screen.getByText('← Back'));
    fireEvent.click(screen.getByText('Armor'));
    fireEvent.click(screen.getByText('Continue to Details →'));
    await waitFor(() => expect(screen.getByText('Armor statistics')).toBeTruthy());
    expect(screen.getByText('Base AC')).toBeTruthy();
  });

  it('publishes a new item through addItem and navigates home', async () => {
    render(() => <Items />);
    fireEvent.input(screen.getByPlaceholderText('Enter item name...'), { target: { value: 'Sun Blade' } });
    fireEvent.click(screen.getByText('Review')); // stepper jump
    const saveBtn = await screen.findByText('Save Homebrew');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(h.addItem).toHaveBeenCalledTimes(1));
    expect(h.updateItem).not.toHaveBeenCalled();
    expect(h.addItem.mock.calls[0][0].name).toBe('Sun Blade');
    expect(h.navigate).toHaveBeenCalledWith('/homebrew');
  });

  it('blocks publishing an invalid item and returns to the offending step', async () => {
    render(() => <Items />);
    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText('Save Homebrew'));

    await waitFor(() => expect(h.snackbar).toHaveBeenCalled());
    expect(h.addItem).not.toHaveBeenCalled();
    expect(h.navigate).not.toHaveBeenCalled();
    // name: required → jumped back to Identity
    await waitFor(() => expect(screen.getByText('What are you forging?')).toBeTruthy());
  });

  it('edits a homebrew item from ?name= and saves through updateItem', async () => {
    itemsStore._testSetHomebrew({
      'Old Blade': { id: 1, name: 'Old Blade', desc: 'dull', type: 3, weight: 1, cost: '5 GP', properties: {} },
    });
    h.params = { name: 'Old Blade' };
    render(() => <Items />);
    const nameInput = await screen.findByPlaceholderText('Enter item name...') as HTMLInputElement;
    await waitFor(() => expect(nameInput.value).toBe('Old Blade'));

    fireEvent.input(nameInput, { target: { value: 'Old Blade +1' } });
    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText('Update Homebrew'));

    await waitFor(() => expect(h.updateItem).toHaveBeenCalledTimes(1));
    expect(h.addItem).not.toHaveBeenCalled();
    expect(h.updateItem.mock.calls[0][0].name).toBe('Old Blade +1');
  });

  it('loading a different item resets the wizard to the Identity step', async () => {
    render(() => <Items />);
    fireEvent.click(screen.getByText('Continue to Details →'));
    await waitFor(() => expect(screen.getByText('What are its stats?')).toBeTruthy());

    itemsStore.select('Dagger'); // deep-link / loader path
    await waitFor(() => expect(screen.getByText('What are you forging?')).toBeTruthy());
    const nameInput = screen.getByPlaceholderText('Enter item name...') as HTMLInputElement;
    expect(nameInput.value).toBe('Dagger');
  });

  // getByText(label) matches only the stepper label span (the footer buttons are longer
  // full strings); the enclosing button's textContent includes the circle glyph.
  const stepButtonText = (label: string) =>
    screen.getByText(label).closest('button')!.textContent ?? '';

  it('does not pre-check Details or Features on a fresh new item', () => {
    render(() => <Items />);
    expect(stepButtonText('Details')).not.toContain('✓');
    expect(stepButtonText('Features')).not.toContain('✓');
    expect(stepButtonText('Details')).toContain('2'); // shows the step number instead
    expect(stepButtonText('Features')).toContain('3');
  });

  it('checks Details once the user has visited it', async () => {
    render(() => <Items />);
    fireEvent.click(screen.getByText('Continue to Details →'));
    await waitFor(() => expect(screen.getByText('What are its stats?')).toBeTruthy());
    fireEvent.click(screen.getByText('Continue to Features →'));
    await waitFor(() => expect(screen.getByText('Does it do anything special?')).toBeTruthy());
    // Details is now visited and no longer current → shows a check.
    expect(stepButtonText('Details')).toContain('✓');
  });

  it('shows Details and Features checked when editing an existing item via ?name=', async () => {
    itemsStore._testSetHomebrew({
      'Old Blade': { id: 1, name: 'Old Blade', desc: 'dull', type: 3, weight: 1, cost: '5 GP', properties: {} },
    });
    h.params = { name: 'Old Blade' };
    render(() => <Items />);
    const nameInput = await screen.findByPlaceholderText('Enter item name...') as HTMLInputElement;
    await waitFor(() => expect(nameInput.value).toBe('Old Blade'));
    await waitFor(() => {
      expect(stepButtonText('Details')).toContain('✓');
      expect(stepButtonText('Features')).toContain('✓');
    });
  });
});
