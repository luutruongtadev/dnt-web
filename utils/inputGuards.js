export const preventInvalidNumberKeys = (e) => {
  if (["-", ".", "e", "E", "+"].includes(e.key)) e.preventDefault()
}