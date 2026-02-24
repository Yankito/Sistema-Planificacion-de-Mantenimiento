
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useState } from 'react';

const useTest = () => {
  const [val, setVal] = useState(0);
  return { val, setVal };
};

describe('Simple Test', () => {
  it('should work', () => {
    const { result } = renderHook(() => useTest());
    expect(result.current.val).toBe(0);
  });
});
