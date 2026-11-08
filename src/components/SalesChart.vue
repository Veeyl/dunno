<script setup>
import { computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrency } from '@/composables/useCurrency'

// Register only the Chart.js pieces we use (keeps bundle small)
ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

/** Sales chart that adapts its colors to light/dark mode. */
const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  type: { type: String, default: 'bar' }, // 'bar' | 'line'
  label: { type: String, default: 'Sales' },
})

const settings = useSettingsStore()
const { formatCurrency } = useCurrency()

// Tailwind indigo-500 / indigo-400
const accent = computed(() => (settings.darkMode ? '#818cf8' : '#6366f1'))

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.values,
      backgroundColor: props.type === 'bar' ? accent.value : `${accent.value}33`,
      hoverBackgroundColor: settings.darkMode ? '#a5b4fc' : '#4f46e5',
      borderColor: accent.value,
      borderWidth: props.type === 'line' ? 3 : 0,
      borderRadius: 8,
      maxBarThickness: 48,
      fill: props.type === 'line',
      tension: 0.35,
      pointRadius: props.type === 'line' ? 3 : 0,
      pointHoverRadius: 6,
      pointBackgroundColor: accent.value,
    },
  ],
}))

const chartOptions = computed(() => {
  const text = settings.darkMode ? '#94a3b8' : '#64748b'
  const grid = settings.darkMode ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.12)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: { label: (ctx) => `${props.label}: ${formatCurrency(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: text }, border: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        border: { display: false },
        ticks: { color: text, callback: (v) => `${settings.currencySymbol}${v}` },
      },
    },
  }
})

// Text alternative for screen readers
const summary = computed(() =>
  props.labels.map((l, i) => `${l}: ${formatCurrency(props.values[i])}`).join(', '),
)
</script>

<template>
  <div class="relative h-72 w-full" role="img" :aria-label="`${label} chart. ${summary}`">
    <component :is="type === 'line' ? Line : Bar" :data="chartData" :options="chartOptions" />
  </div>
</template>

