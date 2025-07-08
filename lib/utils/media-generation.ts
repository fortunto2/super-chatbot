export const parseResolution = (resolutionString: string) => {
  if (typeof resolutionString !== 'string') {
    return resolutionString
  }
    let width = 1280;
    let height = 720;
    let aspectRatio = "16:9";
    
    if (resolutionString) {
      const match = resolutionString.match(/(\d+)x(\d+)/);
      if (match) {
        width = Number.parseInt(match[1], 10);
        height = Number.parseInt(match[2], 10);
        
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        aspectRatio = `${width / divisor}:${height / divisor}`;
      }
    }
    
    return { width, height, aspectRatio };
  };
