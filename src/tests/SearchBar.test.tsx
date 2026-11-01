import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../components/SearchBar/SearchBar';

const Harness = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const [value, setValue] = useState('');
  return <SearchBar value={value} onChange={setValue} onSubmit={onSubmit} />;
};

describe('SearchBar', () => {
  it('only submits terms with at least two characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    const input = screen.getByRole('searchbox', { name: /search recipes/i });
    const submit = screen.getByRole('button', { name: /^search$/i });

    expect(submit).toBeDisabled();
    await user.type(input, 'a');
    expect(input).toHaveValue('a');
    expect(submit).toBeDisabled();

    await user.type(input, 'b');
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith('ab');
  });
});
