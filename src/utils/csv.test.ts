import { toCsv } from './csv';

test('joins headers and rows with CRLF', () => {
  expect(toCsv(['a', 'b'], [[1, true], ['x', 2]])).toBe('a,b\r\n1,true\r\nx,2');
});

test('quotes cells containing commas, quotes, or newlines', () => {
  expect(toCsv(['v'], [['Red, Circle'], ['say "hi"'], ['two\nlines']])).toBe(
    'v\r\n"Red, Circle"\r\n"say ""hi"""\r\n"two\nlines"'
  );
});
