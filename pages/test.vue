<script setup lang="ts">
const canvas = ref<HTMLCanvasElement>()

interface Point {
  x: number
  y: number
}

interface Line {
  p1: Point
  p2: Point
}

onMounted(() => {
  const c = canvas.value!
  const ctx = canvas.value?.getContext('2d')
  if (!ctx)
    return
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, c.width, c.height)

  const radius = 50
  const height = radius * Math.sqrt(3) / 2

  const xCount = Math.ceil(c.width / radius + 1)
  const yCount = Math.ceil(c.height / height + 1)

  const points: Point[] = []

  const DISTORSION = 0.45

  const xy: Point[][] = []
  const lines: Line[] = []

  for (let xi = 0; xi < xCount; xi++) {
    const row: Point[] = []
    const prevRow = xy[xi - 1]
    xy.push(row)
    for (let yi = 0; yi < yCount; yi++) {
      let x = xi * radius + (yi % 2 ? radius / 2 : 0)
      let y = yi * height
      x += (Math.random() - 0.5) * radius * DISTORSION
      y += (Math.random() - 0.5) * height * DISTORSION
      const point = { x, y }
      points.push(point)
      row.push(point)
      const pp1 = row[yi - 1]
      if (pp1)
        lines.push({ p1: point, p2: pp1 })
      if (prevRow) {
        const pp2 = prevRow[yi + (yi % 2 ? 0 : -1)]
        if (pp2) {
          lines.push({ p1: point, p2: pp2 })
          if (pp1)
            lines.push({ p1: pp1, p2: pp2 })
        }
      }
    }
  }

  points.forEach(({ x, y }) => {
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, 2 * Math.PI)
    ctx.fill()
  })

  lines.forEach(({ p1, p2 }) => {
    ctx.strokeStyle = '#0005'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  })
})
</script>

<template>
  <canvas ref="canvas" width="1000" height="1000" />
</template>
