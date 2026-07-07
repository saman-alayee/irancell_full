<template>
  <div class="card p-6">
    <h3 class="font-bold mb-4">{{ title }}</h3>
    <div v-if="!data.length" class="text-sm text-muted text-center py-16">داده‌ای برای نمایش نیست</div>
    <div v-else class="relative" :style="{ height: `${height}px` }">
      <canvas ref="canvasRef" />
    </div>
    <div v-if="data.length && (xLabel || yLabel)" class="flex justify-between text-xs text-muted mt-2 px-1">
      <span>{{ yLabel }}</span>
      <span>{{ xLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  labels: string[]
  data: number[]
  color?: string
  height?: number
  yFormat?: 'number' | 'money'
  xLabel?: string
  yLabel?: string
}>(), {
  color: '#FFCC00',
  height: 280,
  yFormat: 'number',
  xLabel: 'تاریخ',
  yLabel: 'تعداد',
})

const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement>()

const barColor = computed(() => {
  if (props.color === '#1A1A1A' && themeStore.dark) return '#9ca3af'
  return props.color
})

const labelColor = computed(() => (themeStore.dark ? '#9ca3af' : '#666'))
const gridColor = computed(() => (themeStore.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'))
const axisColor = computed(() => (themeStore.dark ? '#6b7280' : '#999'))

const formatY = (value: number) => {
  if (props.yFormat === 'money') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${Math.round(value / 1000)}K`
    return value.toLocaleString('fa-IR')
  }
  return value.toLocaleString('fa-IR')
}

const formatX = (label: string) => {
  if (!label) return ''
  if (label.length >= 10) return label.slice(5).replace('-', '/')
  return label
}

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || !props.data.length) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = canvas.parentElement?.clientWidth || 400
  const h = props.height
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, w, h)

  const maxRaw = Math.max(...props.data, 1)
  const max = maxRaw <= 5 ? 5 : Math.ceil(maxRaw * 1.15)
  const pad = { t: 12, r: 12, b: 44, l: 56 }
  const chartW = w - pad.l - pad.r
  const chartH = h - pad.t - pad.b
  const tickCount = 5
  const barW = (chartW / props.data.length) * 0.55
  const gap = chartW / props.data.length
  const xLabelStep = props.data.length > 20 ? 5 : props.data.length > 10 ? 3 : 1

  ctx.strokeStyle = axisColor.value
  ctx.lineWidth = 1

  // Y axis
  ctx.beginPath()
  ctx.moveTo(pad.l, pad.t)
  ctx.lineTo(pad.l, pad.t + chartH)
  ctx.stroke()

  // X axis
  ctx.beginPath()
  ctx.moveTo(pad.l, pad.t + chartH)
  ctx.lineTo(w - pad.r, pad.t + chartH)
  ctx.stroke()

  // Grid + Y ticks
  for (let i = 0; i < tickCount; i += 1) {
    const ratio = i / (tickCount - 1)
    const y = pad.t + chartH - ratio * chartH
    const tickValue = Math.round(max * ratio)

    ctx.strokeStyle = gridColor.value
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(w - pad.r, y)
    ctx.stroke()

    ctx.fillStyle = labelColor.value
    ctx.font = '11px Vazirmatn, sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(formatY(tickValue), pad.l - 8, y)
  }

  // Bars + X labels
  props.data.forEach((val, i) => {
    const barH = (val / max) * chartH
    const x = pad.l + i * gap + (gap - barW) / 2
    const y = pad.t + chartH - barH

    ctx.fillStyle = barColor.value
    ctx.beginPath()
    ctx.roundRect(x, y, barW, Math.max(barH, val > 0 ? 2 : 0), 4)
    ctx.fill()

    if (i % xLabelStep === 0 || i === props.data.length - 1) {
      ctx.fillStyle = labelColor.value
      ctx.font = '10px Vazirmatn, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const label = formatX(props.labels[i] || '')
      ctx.fillText(label, x + barW / 2, pad.t + chartH + 8)
    }
  })
}

watch(() => [props.data, props.labels, props.yFormat, themeStore.dark], draw, { deep: true })
onMounted(() => {
  themeStore.init()
  draw()
  window.addEventListener('resize', draw)
})
onUnmounted(() => window.removeEventListener('resize', draw))
</script>
