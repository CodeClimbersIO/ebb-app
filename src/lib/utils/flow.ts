export const getFlowScoreColor = (score: number) => {
  if (score < 2.5) return '#EF4444' // red-500
  if (score < 5) return '#F97316'   // orange-500
  if (score < 7.5) return '#EAB308' // yellow-500
  return '#9333EA'                   // violet-600
}

export const getFlowScoreTailwindColor = (score: number) => {
  if (score < 2.5) return 'text-red-500 bg-red-100'
  if (score < 5) return 'text-orange-500 bg-orange-100'
  if (score < 7.5) return 'text-yellow-500 bg-yellow-100'
  return 'text-violet-600 bg-violet-100'
}

export const getFlowStatusText = (score: number) => {
  if (score < 2.5) return 'Very Distracted · High Context Switching'
  if (score < 5) return 'Distracted · High Context Switching'
  if (score < 7.5) return 'Building Flow · Moderate Context Switching'
  return 'In Flow · Great job!'
} 