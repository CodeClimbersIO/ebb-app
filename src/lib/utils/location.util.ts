import { Marker } from 'cobe'

export const africaBox: Marker[] = [
  {
    location: [0, 11],
    size: 0.1,
  },
  {
    location: [11, 30],
    size: 0.1,
  },
  {
    location: [30, 11],
    size: 0.1,
  },
  {
    location: [11, 0],
    size: 0.1,
  },
]

export const middleEastBox: Marker[] = [
  {
    location: [11, 40],
    size: 0.1,
  },
  {
    location: [20, 40],
    size: 0.1,
  },
  {
    location: [40, 20],
    size: 0.1,
  },
  {
    location: [40, 40],
    size: 0.1,
  },
]

export const asiaBox: Marker[] = [
  {
    location: [40, 70],
    size: 0.1,
  },
  {
    location: [65, 70],
    size: 0.1,
  },
  {
    location: [40, 100],
    size: 0.1,
  },
  {
    location: [65, 100],
    size: 0.1,
  },
]

export const americaBox: Marker[] = [
  {
    location: [34, -90],
    size: 0.1,
  },
  {
    location: [50, -120],
    size: 0.1,
  },
  {
    location: [34, -120],
    size: 0.1,
  },
  {
    location: [50, -90],
    size: 0.1,
  },
]

export const southAmericaBox: Marker[] = [
  {
    location: [-4, -70],
    size: 0.1,
  },
  {
    location: [-30, -50],
    size: 0.1,
  },
  {
    location: [-4, -50],
    size: 0.1,
  },
  {
    location: [-30, -70],
    size: 0.1,
  },
]

export const getRandomPoint = (): [number, number] => {
  const boxes = [africaBox, middleEastBox, asiaBox, americaBox, southAmericaBox]
  const randomBox = boxes[Math.floor(Math.random() * boxes.length)]
  const randomPoint = getRandomPointInBox(randomBox)
  return randomPoint
}

/**
 * get a random point. This point is guaranteed to be within the box.
 */
export const getRandomPointInBox = (box: Marker[]): [number, number] => {
  const maxX = Math.max(...box.map(marker => marker.location[0]))
  const maxY = Math.max(...box.map(marker => marker.location[1]))
  const minX = Math.min(...box.map(marker => marker.location[0]))
  const minY = Math.min(...box.map(marker => marker.location[1]))

  const randomX = Math.random() * (maxX - minX) + minX
  const randomY = Math.random() * (maxY - minY) + minY

  return [randomX, randomY]
}

