export function incrementString(str: string) {
  // If the string is empty, start at 'A'
  if (!str) return 'A';

  const arr = str.split('');
  
  // Loop backwards through the string
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === 'Z') {
      arr[i] = 'A'; // Carry over
      if (i === 0) {
        arr.unshift('A'); // If we are at the very front, prepend an 'A'
        break;
      }
    } else if (arr[i] === 'z') {
      arr[i] = 'a'; // Carry over for lowercase
      if (i === 0) {
        arr.unshift('a');
        break;
      }
    } else {
      // Just increment the current character and we're done
      arr[i] = String.fromCharCode(arr[i].charCodeAt(0) + 1);
      break;
    }
  }
  
  return arr.join('');
}