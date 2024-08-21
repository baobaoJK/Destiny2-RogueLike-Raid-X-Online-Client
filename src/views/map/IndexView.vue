<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getRaidMapImg, getSocket } from '@/utils'
import InfoBoard from '@/components/infoboard/IndexView.vue'

// 父组件信息
const props = defineProps<{
  roomConfig: any
  infoBoard: any
  setWebLoading: (status: boolean) => void
}>()

const roomConfig: any = computed(() => props.roomConfig)
const infoBoard: any = computed(() => props.infoBoard)
const setWebLoading = (status: boolean) => props.setWebLoading(status)

// 判断数据是否已收到
// 房间信息阶段
// const roomConfigStage = computed(() => {
//   return (props.roomConfig?.raidConfig === undefined || props.roomConfig?.raidConfig === null) ? true : false
// })

const mapListRef = ref<HTMLStyleElement>()
const mapNameRef = ref<HTMLStyleElement>()

const buttonDisabled = ref(false)
const opacityValue = ref(0)
const mapList: any = ref([])

// socket
let socket: any

// 抽取地图事件
const rollMap = () => {
  setWebLoading(true)
  socket.emit('rollMap', {
    roomId: roomConfig.value.roomId
  })
  buttonDisabled.value = true
}

const initMap = () => {
  socket = getSocket()

  socket.off('rollMap')
  socket.on('rollMap', (data: any) => {
    if (data.type === 'success') {
      // console.log(data)
      mapList.value = data.mapList
      // const rollMapTime = ref(11000)
      const rollMapTime = ref(3000)
      ElMessage({
        message: data.message,
        grouping: true
      })

      if (mapListRef.value) {
        mapListRef.value.style.transform = 'translateX(-2507.875rem)'
        mapListRef.value.style.transition = 'all 10s cubic-bezier(0.1, 0.4, 0.25, 1)'
      }

      const rollMapTimeout = setTimeout(function () {
        if (mapNameRef.value) {
          opacityValue.value = 1

          const map = mapList.value[43]
          mapNameRef.value.innerText = String(map.raidName)

          // 发送改变地图信息
          setWebLoading(true)
          socket.emit('changeMap', {
            roomId: roomConfig.value.roomId
          })

          clearTimeout(rollMapTimeout)
        }
      }, rollMapTime.value)
      setWebLoading(false)
    } else {
      ElMessage({
        message: data.message,
        type: 'error',
        grouping: true
      })
    }
  })
}
const isInitialized = ref(false)
watch(
  () => [props.roomConfig],
  () => {
    if (props.roomConfig !== undefined) {
      if (!isInitialized.value) {
        initMap()
        isInitialized.value = true
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
)
</script>

<template>
  <div id="map">
    <h1 class="map-title">抽取游玩地图</h1>
    <div class="map-roll-list">
      <div class="map-list" ref="mapListRef">
        <div class="map-img">
          <img :src="getRaidMapImg('请选择地图')" alt="请选择地图.jpg" />
        </div>
        <div class="map-img" v-for="(map, index) in mapList" :key="index">
          <img :src="getRaidMapImg(map.raidName)" :alt="map.raidName + '.jpg'" />
        </div>
      </div>
    </div>
    <div class="map-text">
      <h1 ref="mapNameRef" :style="{ opacity: opacityValue, transition: 'opacity 1s' }"></h1>
    </div>
    <button class="button" @click="rollMap()" :disabled="buttonDisabled">抽取地图</button>

    <!-- 地图信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gameMap">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameMap = !infoBoard.gameMap">{{
            infoBoard.gameMap ? '关闭' : '查看地图说明'
          }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">地图信息</h1>
      </template>
      <template #content>
        <div>
          <h2>突袭地图列表</h2>
          <p>
            最后一愿、救赎花园、深岩墓室、玻璃拱顶、门徒誓约、国王的陨落、梦魇根源、克洛塔的末日、救赎的边缘（后续可能加入）
          </p>
          <hr />
          <h2>地牢地图列表</h2>
          <p>破碎王座，异端深渊，预言，贪婪之握，二象性，守望者尖塔，全面爆发，冥冥低语</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/map';
</style>
