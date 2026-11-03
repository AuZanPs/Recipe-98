import type { FormEvent } from 'react';
import { Search } from 'pixelarticons/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export const SearchBar = ({ value, onChange, onSubmit }: Props) => {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <form className="search-form" role="search" onSubmit={submit}>
      <div className="field-row">
        <label className="sr-only" htmlFor="recipe-search">Search recipes</label>
        <input
          id="recipe-search"
          name="search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search recipes…"
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
        />
        <button type="submit" className="with-icon" disabled={value.trim().length < 2}>
          <Search width={16} height={16} aria-hidden="true" />
          Search
        </button>
      </div>
    </form>
  );
};
