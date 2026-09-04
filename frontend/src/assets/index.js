import healthyLeaf from './healthy-leaf.svg'
import leafSpot from './leaf-spot.svg'
import powderyMildew from './powdery-mildew.svg'
import rustLeaf from './rust-leaf.svg'
import blightLeaf from './blight-leaf.svg'
import heroBg from './hero-bg.svg'

import healthyReal from './realistic/healthy.jpg'
import leafSpotReal from './realistic/leaf-spot.jpg'
import powderyMildewReal from './realistic/powdery-mildew.jpg'
import rustReal from './realistic/rust.jpg'
import blightReal from './realistic/blight.jpg'
import heroBgReal from './realistic/hero-bg.jpg'

export const LEAF_IMAGES = {
  healthy: healthyReal,
  leafSpot: leafSpotReal,
  powderyMildew: powderyMildewReal,
  rust: rustReal,
  blight: blightReal,
}

export const LEAF_IMAGES_SVG = {
  healthy: healthyLeaf,
  leafSpot: leafSpot,
  powderyMildew: powderyMildew,
  rust: rustLeaf,
  blight: blightLeaf,
}

export const DISEASE_IMAGES = {
  'Healthy': healthyReal,
  'Leaf Spot': leafSpotReal,
  'Powdery Mildew': powderyMildewReal,
  'Rust': rustReal,
  'Blight': blightReal,
}

export const DISEASE_IMAGES_SVG = {
  'Healthy': healthyLeaf,
  'Leaf Spot': leafSpot,
  'Powdery Mildew': powderyMildew,
  'Rust': rustLeaf,
  'Blight': blightLeaf,
}

export const SAMPLE_LEAVES = [
  { id: 1, name: 'Healthy Leaf', image: healthyReal, disease: 'Healthy', description: 'A vibrant green leaf free from any visible disease or anomaly.' },
  { id: 2, name: 'Leaf Spot', image: leafSpotReal, disease: 'Leaf Spot', description: 'Circular brown lesions caused by fungal or bacterial infection.' },
  { id: 3, name: 'Powdery Mildew', image: powderyMildewReal, disease: 'Powdery Mildew', description: 'White powdery fungal coating on the leaf surface.' },
  { id: 4, name: 'Rust Disease', image: rustReal, disease: 'Rust', description: 'Orange-red pustules from rust fungi affecting chlorophyll.' },
  { id: 5, name: 'Blight', image: blightReal, disease: 'Blight', description: 'Rapid browning and death of plant tissue from pathogens.' },
]

export { heroBgReal as heroBg }
export default LEAF_IMAGES
