import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@solidjs/testing-library';
import EquipmentSection from '../EquipmentSection';

// Basic integ test to ensure clicking item adds it to pending list and commit works.
describe('EquipmentSection interaction', () => {
  function setup() {
    const committed: any[] = [];
    render(() => <EquipmentSection
      collapsed={false}
      toggle={()=>{}}
      groups={[]}
      activeKey={undefined}
      optionKeys={['A']}
      selectedItems={[]}
      onSelectKey={()=>{}}
      onCommitGroup={(keys, items)=> committed.push({ keys, items })}
      candidateItems={['Backpack','Rope (50 feet)']}
      // no external pending props -> internal state path
    />);
    return { committed };
  }

  it('adds pending item when clicked and allows commit', () => {
    const { committed } = setup();
    // open edit modal
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Pick / Add Items'));
    // click an item button in list
    fireEvent.click(screen.getByText('Backpack'));
  // now Backpack should appear; commit button should become enabled after key entry
  expect(screen.getByText('Backpack')).toBeTruthy();
  // enter option key(s)
  // first input inside the edit modal (option keys field)
  const inputs = screen.getAllByRole('textbox');
  fireEvent.input(inputs[0], { target: { value: 'A' } });
    // commit group
    fireEvent.click(screen.getByText('Commit Group'));
    expect(committed.length).toBe(1);
    expect(committed[0].items).toContain('Backpack');
  });
});
