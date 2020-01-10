/**
 * Return diode CSS class name based on recency of input ping time
 */
export const getDiodeClass = (lastPing: number | null): string => {
  if (!lastPing) {
    return 'nosignal'
  }
  const timeDiff = new Date().getTime() - lastPing
  if (timeDiff < 10000) {
    const activeNum = Math.floor(timeDiff / 1000)
    return `active${activeNum}`
  }
  return 'inactive'
}
