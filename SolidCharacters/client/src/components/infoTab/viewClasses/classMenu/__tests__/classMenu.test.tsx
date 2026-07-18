import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  classes: [] as unknown[],
  subclasses: [] as unknown[],
}));

vi.mock('@solidjs/router', () => ({
  useNavigate: () => h.navigate,
}));
// The shared barrel pulls the whole customHooks tree (Dexie etc.); the menu + dialog only
// need homebrewManager from it.
vi.mock('../../../../../shared', () => ({
  homebrewManager: {
    classes: () => h.classes,
    subclasses: () => h.subclasses,
  },
}));

import { ClassMenu } from '../classMenu';
import { Class5E, Subclass } from '../../../../../models/generated';

const wizard = { id: 'w24', name: 'Wizard' } as Class5E;
const evocation = {
  id: 'sc-evocation', name: 'Evocation', parentClass: 'Wizard', parentClassId: 'w24',
  description: '', features: {},
} as Subclass;

const renderMenu = (subclasses: Subclass[]) =>
  render(() => <ClassMenu dndClass={wizard} subclasses={() => subclasses} openDialog={() => {}} />);

const openMenu = () => fireEvent.click(screen.getAllByRole('button')[0]);

beforeEach(() => {
  vi.clearAllMocks();
  h.classes = [];
  h.subclasses = [];
});

describe('ClassMenu subclass clone/edit', () => {
  it('hides the subclass item when the class has no subclasses', async () => {
    renderMenu([]);
    openMenu();
    await screen.findByText('View');
    expect(screen.queryByText('Clone/Edit Subclass')).toBeNull();
  });

  it('hides the subclass item when subclasses belong to a different class', async () => {
    renderMenu([{ ...evocation, parentClass: 'Cleric', parentClassId: 'c24' }]);
    openMenu();
    await screen.findByText('View');
    expect(screen.queryByText('Clone/Edit Subclass')).toBeNull();
  });

  it('opens the dialog and navigates with encoded params on Clone and Edit', async () => {
    renderMenu([evocation]);
    openMenu();
    fireEvent.click(await screen.findByText('Clone/Edit Subclass'));

    // SRD-only subclass → confirm reads "Clone and Edit". Role-scoped: the class
    // MenuItem (a non-button in the mock) carries the same text.
    const confirmBtn = await screen.findByRole('button', { name: 'Clone and Edit' });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith(
      '/homebrew/create/subclasses?name=Wizard&subclass=Evocation'));
  });

  it('labels the confirm button "Edit" when a matching homebrew subclass exists', async () => {
    h.subclasses = [{ name: 'Evocation', parentClass: 'Wizard' }];
    renderMenu([evocation]);
    openMenu();
    fireEvent.click(await screen.findByText('Clone/Edit Subclass'));

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clone and Edit' })).toBeNull();
  });
});
