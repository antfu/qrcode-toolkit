import Delaunator from 'delaunator'
import seedrandom from 'seedrandom'

type FlatPoint = [number, number]

// Define the crystalize effect function
export function crystalize(imageData: ImageData, radius: number, seed: number) {
  const { width, height, data } = imageData
  const outputData = new Uint8ClampedArray(data.length)

  const rng = seedrandom(String(seed))

  const triangleHeight = radius * Math.sqrt(3) / 2
  const xCount = Math.ceil(width / radius + 1)
  const yCount = Math.ceil(height / triangleHeight + 1)

  const DISTORSION = 1.2

  const points: FlatPoint[] = []
  for (let xi = 0; xi < xCount; xi++) {
    for (let yi = 0; yi < yCount; yi++) {
      let x = xi * radius + (yi % 2 ? radius / 2 : 0)
      let y = yi * triangleHeight
      x += (rng() - 0.5) * radius * DISTORSION
      y += (rng() - 0.5) * triangleHeight * DISTORSION
      points.push([x, y])
    }
  }

  const delaunay = Delaunator.from(points, p => p[0], p => p[1])

  for (let idx = 0; idx < delaunay.triangles.length; idx += 3) {
    const p1 = points[delaunay.triangles[idx]]
    const p2 = points[delaunay.triangles[idx + 1]]
    const p3 = points[delaunay.triangles[idx + 2]]

    // Calculate the bounding box of the triangle
    const minX = Math.min(p1[0], p2[0], p3[0])
    const minY = Math.min(p1[1], p2[1], p3[1])
    const maxX = Math.max(p1[0], p2[0], p3[0])
    const maxY = Math.max(p1[1], p2[1], p3[1])

    const trianglePoints = []

    // Iterate over each pixel within the bounding box
    for (let y = Math.floor(minY); y <= maxY + 1; y++) {
      for (let x = Math.floor(minX); x <= maxX + 1; x++) {
        if (x < 0 || y < 0 || x >= width || y >= height)
          continue
        // Check if the pixel is inside the triangle
        if (isPointInTriangle(x, y, p1, p2, p3))
          trianglePoints.push([x, y])
      }
    }

    if (trianglePoints.length === 0)
      continue

    const colorSum = trianglePoints.reduce((acc, [x, y]) => {
      const index = (y * width + x) * 4
      acc[0] += data[index]
      acc[1] += data[index + 1]
      acc[2] += data[index + 2]
      acc[3] += data[index + 3]
      return acc
    }, [0, 0, 0, 0])
    const colorAvg = colorSum.map(c => c / trianglePoints.length)

    trianglePoints.forEach(([x, y]) => {
      const index = (y * width + x) * 4
      outputData[index] = colorAvg[0]
      outputData[index + 1] = colorAvg[1]
      outputData[index + 2] = colorAvg[2]
      outputData[index + 3] = colorAvg[3]
    })
  }

  return new ImageData(outputData, width, height)
}

// Function to check if a point is inside a triangle
function isPointInTriangle(x: number, y: number, p1: FlatPoint, p2: FlatPoint, p3: FlatPoint) {
  const denominator = (p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1])
  const a = ((p2[1] - p3[1]) * (x - p3[0]) + (p3[0] - p2[0]) * (y - p3[1])) / denominator
  const b = ((p3[1] - p1[1]) * (x - p3[0]) + (p1[0] - p3[0]) * (y - p3[1])) / denominator
  const c = 1 - a - b
  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1
}
