import Delaunator from 'delaunator'

export function crystalizeEffect(imageData: ImageData, blockSize: number) {
  const { width, height, data } = imageData
  const outputData = new Uint8ClampedArray(data.length)

  const wCount = Math.ceil(width / blockSize)
  const hCount = Math.ceil(height / blockSize)

  const points = []
  for (let xi = 0; xi < xCount; xi++) {
    for (let yi = 0; yi < yCount; yi++) {
      let x = xi * radius + (yi % 2 ? radius / 2 : 0)
      let y = yi * height
      x += (Math.random() - 0.5) * radius * DISTORSION
      y += (Math.random() - 0.5) * height * DISTORSION
      points.push([x, y])
    }
  }
  const delaunay = Delaunator.from(points, p => p[0], p => p[1])

  // Iterate over each triangle
  for (let triangleIndex = 0; triangleIndex < delaunay.triangles.length; triangleIndex += 3) {
    const p1 = delaunay.triangles[triangleIndex]
    const p2 = delaunay.triangles[triangleIndex + 1]
    const p3 = delaunay.triangles[triangleIndex + 2]

    const r = (points[p1][2] + points[p2][2] + points[p3][2]) / 3
    const g = (points[p1][3] + points[p2][3] + points[p3][3]) / 3
    const b = (points[p1][4] + points[p2][4] + points[p3][4]) / 3

    // Iterate over each pixel within the triangle
    for (let y = Math.min(points[p1][1], points[p2][1], points[p3][1]); y <= Math.max(points[p1][1], points[p2][1], points[p3][1]); y++) {
      for (let x = Math.min(points[p1][0], points[p2][0], points[p3][0]); x <= Math.max(points[p1][0], points[p2][0], points[p3][0]); x++) {
        if (isPointInTriangle(x, y, points[p1], points[p2], points[p3])) {
          const index = (y * width + x) * 4
          outputData[index] = r
          outputData[index + 1] = g
          outputData[index + 2] = b
          outputData[index + 3] = 255 // Set alpha channel to 255 (opaque)
        }
      }
    }
  }

  return new ImageData(outputData, width, height)
}

// Function to check if a point is inside a triangle
function isPointInTriangle(x: number, y: number, p0: [number, number], p1: [number, number], p2: [number, number]) {
  const s = p0[1] * p2[0] - p0[0] * p2[1] + (p2[1] - p0[1]) * x + (p0[0] - p2[0]) * y
  const t = p0[0] * p1[1] - p0[1] * p1[0] + (p0[1] - p1[1]) * x + (p1[0] - p0[0]) * y
  if ((s < 0) !== (t < 0))
    return false

  const A = -p1[1] * p2[0] + p0[1] * (p2[0] - p1[0]) + p0[0] * (p1[1] - p2[1]) + p1[0] * p2[1]
  return A < 0
    ? (s <= 0 && s + t >= A)
    : (s >= 0 && s + t <= A)
}
