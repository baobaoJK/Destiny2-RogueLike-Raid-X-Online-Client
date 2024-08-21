import { ref } from 'vue'

// 货币图片
export const lightImg = new URL('/images/light.png', import.meta.url).href
// 卡片图片
export const cardImg = new URL('/images/card.png', import.meta.url).href

// 获取突袭地图图片
export const getRaidMapImg = (mapName: string) => {
  return new URL('/images/maps/raid/' + mapName + '.jpg', import.meta.url).href
}

// 随机生成
export const shuffle = (array: any) => {
  const res: any = ref([])
  let random
  while (array.length > 0) {
    random = Math.floor(Math.random() * array.length)
    res.value.push(array[random])
    array.splice(random, 1)
  }
  return res.value
}

export * from './socket'
